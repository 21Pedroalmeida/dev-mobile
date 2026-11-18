/**
 * Protocolo WebSocket do firmware BMPTECH_Car_Controller (ESP32-S3).
 * Endpoint: ws://<ip>/ws  — mensagens JSON.
 * Os construtores abaixo garantem que os valores enviados ficam dentro das faixas
 * aceitas pelo firmware.
 */

export const DEFAULT_HOST = '192.168.4.1';
export const JOINT_NAMES = ['Base', 'Ombro', 'Cotovelo', 'Garra'];
export const KEEPALIVE_MS = 70; // firmware para os motores após 500 ms sem comando
export const DEFAULT_CFG = {
  speed: 70,
  min: [0, 0, 0, 0],
  max: [180, 180, 180, 180],
  pos: [90, 90, 90, 20],
  home: [90, 90, 90, 20],
  span: [180, 180, 180, 180],
  invL: false,
  invR: false,
  swap: false,
};

export const PRESET_POSES = [
  { id: 'preset-rest', name: 'Repouso', angles: [90, 90, 90, 20] },
  { id: 'preset-grab', name: 'Pegar', angles: [90, 60, 120, 160] },
];

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const toInt = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : fallback);

export function wsUrl(host) {
  const h = String(host || DEFAULT_HOST).trim().replace(/^(https?|wss?):\/\//, '').replace(/\/.*$/, '');
  return `ws://${h}/ws`;
}

export function infoUrl(host) {
  return wsUrl(host).replace(/^ws:/, 'http:').replace(/\/ws$/, '/api/info');
}

export const cmd = {
  move: (x, y) => ({ cmd: 'move', x: clamp(toInt(x), -100, 100), y: clamp(toInt(y), -100, 100) }),
  servo: (i, a) => ({ cmd: 'servo', i: clamp(toInt(i), 0, 3), a: clamp(toInt(a), 0, 300) }),
  speed: (v) => ({ cmd: 'speed', v: clamp(toInt(v, 70), 0, 100) }),
  stop: () => ({ cmd: 'stop' }),
  goHome: () => ({ cmd: 'gohome' }),
  getCfg: () => ({ cmd: 'getcfg' }),
  diag: () => ({ cmd: 'diag' }),
  setInvert: (l, r, s) => ({ cmd: 'setinvert', l: !!l, r: !!r, s: !!s }),
};

/**
 * Converte o deslocamento do dedo (px) no vetor do joystick (-100..100).
 * Y é invertido: arrastar para cima = frente (positivo).
 */
export function joystickVector(dx, dy, radius) {
  if (!radius) return { x: 0, y: 0, dx: 0, dy: 0 };
  const dist = Math.hypot(dx, dy);
  if (dist > radius) {
    dx = (dx / dist) * radius;
    dy = (dy / dist) * radius;
  }
  return { x: Math.round((dx / radius) * 100) || 0, y: Math.round((-dy / radius) * 100) || 0, dx, dy };
}

/** Mesmo cálculo do firmware (drive()) — usado para exibir a potência de cada lado. */
export function mixDrive(x, y, speedLimit = 100, deadzone = 8) {
  if (Math.abs(x) < deadzone) x = 0;
  if (Math.abs(y) < deadzone) y = 0;
  const left = clamp(y + x, -100, 100);
  const right = clamp(y - x, -100, 100);
  return { left: Math.round((left * speedLimit) / 100), right: Math.round((right * speedLimit) / 100) };
}

/** Converte a mensagem "cfg" do ESP32 em um objeto seguro (com defaults). */
export function parseMessage(raw) {
  let d;
  try {
    d = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!d || d.type !== 'cfg') return null;
  const arr = (a, def) => (Array.isArray(a) && a.length === 4 ? a.map((n, i) => toInt(n, def[i])) : def.slice());
  return {
    speed: clamp(toInt(d.speed, 70), 0, 100),
    min: arr(d.min, DEFAULT_CFG.min),
    max: arr(d.max, DEFAULT_CFG.max),
    pos: arr(d.pos, DEFAULT_CFG.pos),
    home: arr(d.home, DEFAULT_CFG.home),
    span: arr(d.span, DEFAULT_CFG.span),
    invL: !!d.invL,
    invR: !!d.invR,
    swap: !!d.swap,
  };
}
