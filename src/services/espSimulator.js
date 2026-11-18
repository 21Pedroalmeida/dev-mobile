import { DEFAULT_CFG, clamp } from './protocol';

/**
 * "ESP32 simulado" para o MODO DEMONSTRAÇÃO.
 * Imita o WebSocket do firmware (mesma interface do WebSocket do React Native),
 * permitindo apresentar o app sem o carrinho ligado.
 */
export function createSimulatedWebSocket(delay = 300) {
  const state = JSON.parse(JSON.stringify({ ...DEFAULT_CFG, type: 'cfg' }));

  return class SimulatedWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 0;
      this.sent = [];
      setTimeout(() => {
        if (this.readyState === 3) return;
        this.readyState = 1;
        this.onopen && this.onopen();
      }, delay);
    }

    reply() {
      setTimeout(() => this.readyState === 1 && this.onmessage && this.onmessage({ data: JSON.stringify(state) }), 30);
    }

    send(text) {
      const m = JSON.parse(text);
      this.sent.push(m);
      switch (m.cmd) {
        case 'servo':
          state.pos[m.i] = clamp(m.a, state.min[m.i], state.max[m.i]);
          break;
        case 'gohome':
          state.pos = state.home.slice();
          break;
        case 'speed':
          state.speed = m.v;
          break;
        case 'setinvert':
          state.invL = m.l; state.invR = m.r; state.swap = m.s;
          this.reply();
          break;
        case 'getcfg':
          this.reply();
          break;
        default:
          break;
      }
    }

    close() {
      if (this.readyState === 3) return;
      this.readyState = 3;
      // Simulador fechado pelo app: não dispara onclose (evita reconexão).
    }
  };
}

export const SIMULATED_INFO = {
  firmware: 'v1.2 (simulado)',
  build: 'modo demonstração',
  ssid: 'BMPTECH-Car',
  ip: '192.168.4.1',
  mac: 'AA:BB:CC:DD:EE:FF',
  clients: 1,
  uptime: 0,
  heap: 210000,
};
