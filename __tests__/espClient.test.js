import { EspClient } from '../src/services/espClient';
import { fakeWebSocketClass } from '../test-utils/helpers';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

function connected() {
  const WS = fakeWebSocketClass();
  const onStatus = jest.fn();
  const onConfig = jest.fn();
  const client = new EspClient({ url: 'ws://192.168.4.1/ws', WebSocketImpl: WS, onStatus, onConfig });
  client.connect();
  WS.instances[0].open();
  return { WS, ws: WS.instances[0], client, onStatus, onConfig };
}

describe('Cliente WebSocket do ESP32', () => {
  test('conecta, avisa o status e pede a configuração', () => {
    const { ws, onStatus } = connected();
    expect(onStatus.mock.calls.map((c) => c[0])).toEqual(['connecting', 'connected']);
    expect(ws.sent[0]).toEqual({ cmd: 'getcfg' });
  });

  test('repassa a configuração recebida do ESP32', () => {
    const { ws, onConfig } = connected();
    ws.receive({ type: 'cfg', speed: 40, pos: [1, 2, 3, 4] });
    expect(onConfig).toHaveBeenCalledWith(expect.objectContaining({ speed: 40, pos: [1, 2, 3, 4] }));
  });

  test('joystick pressionado reenvia o vetor a cada 70 ms (watchdog de 500 ms)', () => {
    const { ws, client } = connected();
    ws.sent = [];
    client.setVector(30, 80);
    client.beginHold();
    jest.advanceTimersByTime(700);
    const moves = ws.sent.filter((m) => m.cmd === 'move');
    expect(moves.length).toBeGreaterThanOrEqual(10);
    expect(moves.every((m) => m.x === 30 && m.y === 80)).toBe(true);
  });

  test('ao soltar o joystick envia 0,0 e para de repetir', () => {
    const { ws, client } = connected();
    client.setVector(50, 50);
    client.beginHold();
    client.endHold();
    const last = ws.sent[ws.sent.length - 1];
    expect(last).toEqual({ cmd: 'move', x: 0, y: 0 });
    const count = ws.sent.length;
    jest.advanceTimersByTime(1000);
    expect(ws.sent.length).toBe(count);
  });

  test('PARAR TUDO envia stop', () => {
    const { ws, client } = connected();
    client.stopAll();
    expect(ws.sent[ws.sent.length - 1]).toEqual({ cmd: 'stop' });
  });

  test('não envia nada quando está desconectado', () => {
    const WS = fakeWebSocketClass();
    const client = new EspClient({ url: 'ws://x/ws', WebSocketImpl: WS });
    expect(client.send({ cmd: 'stop' })).toBe(false);
  });

  test('reconecta automaticamente quando a conexão cai', () => {
    const { WS, ws, onStatus } = connected();
    ws.close();
    expect(onStatus).toHaveBeenLastCalledWith('disconnected');
    jest.advanceTimersByTime(1600);
    expect(WS.instances.length).toBe(2);
  });

  test('disconnect() encerra sem tentar reconectar', () => {
    const { WS, client } = connected();
    client.disconnect();
    jest.advanceTimersByTime(5000);
    expect(WS.instances.length).toBe(1);
    expect(client.status).toBe('idle');
  });
});
