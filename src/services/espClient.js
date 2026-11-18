import { cmd, parseMessage, KEEPALIVE_MS } from './protocol';

/**
 * Cliente WebSocket do ESP32.
 * - Reconecta automaticamente quando a conexão cai.
 * - Enquanto o joystick está pressionado, reenvia o vetor a cada 70 ms
 *   (o firmware tem um "watchdog" que para os motores após 500 ms sem comando).
 *
 * Status possíveis: 'idle' | 'connecting' | 'connected' | 'disconnected'
 */
export class EspClient {
  constructor({ url, WebSocketImpl, onStatus, onConfig, reconnectMs = 1500, timers } = {}) {
    this.url = url;
    this.WebSocketImpl = WebSocketImpl || globalThis.WebSocket;
    this.onStatus = onStatus || (() => {});
    this.onConfig = onConfig || (() => {});
    this.reconnectMs = reconnectMs;
    this.t = timers || { setTimeout, clearTimeout, setInterval, clearInterval };
    this.ws = null;
    this.status = 'idle';
    this.vector = { x: 0, y: 0 };
    this.holdTimer = null;
    this.reconnectTimer = null;
    this.shouldRun = false;
  }

  setStatus(s) {
    if (this.status === s) return;
    this.status = s;
    this.onStatus(s);
  }

  connect() {
    this.shouldRun = true;
    this.open();
  }

  open() {
    this.t.clearTimeout(this.reconnectTimer);
    this.setStatus('connecting');
    let ws;
    try {
      ws = new this.WebSocketImpl(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.setStatus('connected');
      this.send(cmd.getCfg());
    };
    ws.onmessage = (e) => {
      const cfg = parseMessage(e.data);
      if (cfg) this.onConfig(cfg);
    };
    ws.onerror = () => {
      try { ws.close(); } catch { /* ignora */ }
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.stopHoldTimer();
      this.setStatus('disconnected');
      this.scheduleReconnect();
    };
  }

  scheduleReconnect() {
    if (!this.shouldRun) return;
    this.t.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = this.t.setTimeout(() => this.open(), this.reconnectMs);
  }

  disconnect() {
    this.shouldRun = false;
    this.stopHoldTimer();
    this.t.clearTimeout(this.reconnectTimer);
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      try { ws.close(); } catch { /* ignora */ }
    }
    this.setStatus('idle');
  }

  isConnected() {
    return this.status === 'connected' && !!this.ws;
  }

  send(obj) {
    if (!this.isConnected()) return false;
    try {
      this.ws.send(JSON.stringify(obj));
      return true;
    } catch {
      return false;
    }
  }

  /* ---------- Joystick ---------- */
  beginHold() {
    if (this.holdTimer) return;
    this.send(cmd.move(this.vector.x, this.vector.y));
    this.holdTimer = this.t.setInterval(() => this.send(cmd.move(this.vector.x, this.vector.y)), KEEPALIVE_MS);
  }

  setVector(x, y) {
    this.vector = { x, y };
  }

  endHold() {
    this.stopHoldTimer();
    this.vector = { x: 0, y: 0 };
    this.send(cmd.move(0, 0)); // manda 0,0 uma vez ao soltar
  }

  stopHoldTimer() {
    if (this.holdTimer) {
      this.t.clearInterval(this.holdTimer);
      this.holdTimer = null;
    }
  }

  stopAll() {
    this.stopHoldTimer();
    this.vector = { x: 0, y: 0 };
    this.send(cmd.stop());
  }
}
