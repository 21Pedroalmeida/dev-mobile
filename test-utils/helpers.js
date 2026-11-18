import { createHash, randomBytes } from 'crypto';

/** SHA-256 real (módulo crypto do Node) — mesmo algoritmo do expo-crypto. */
export const nodeDigest = async (text) => createHash('sha256').update(text).digest('hex');
export const nodeRandomBytes = (n) => new Uint8Array(randomBytes(n));

/** Substituto em memória do expo-secure-store. */
export function memoryStore() {
  const data = new Map();
  return {
    data,
    getItemAsync: jest.fn(async (k) => (data.has(k) ? data.get(k) : null)),
    setItemAsync: jest.fn(async (k, v) => void data.set(k, v)),
    deleteItemAsync: jest.fn(async (k) => void data.delete(k)),
  };
}

/** WebSocket falso controlado pelo teste. */
export function fakeWebSocketClass() {
  const instances = [];
  class FakeWS {
    constructor(url) {
      this.url = url;
      this.sent = [];
      instances.push(this);
    }
    send(t) {
      this.sent.push(JSON.parse(t));
    }
    close() {
      this.onclose && this.onclose();
    }
    // helpers do teste
    open() {
      this.onopen && this.onopen();
    }
    receive(obj) {
      this.onmessage && this.onmessage({ data: JSON.stringify(obj) });
    }
  }
  FakeWS.instances = instances;
  return FakeWS;
}
