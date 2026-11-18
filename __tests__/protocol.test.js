import { cmd, joystickVector, mixDrive, parseMessage, wsUrl, infoUrl } from '../src/services/protocol';

describe('Protocolo do ESP32', () => {
  test('monta URLs a partir do IP', () => {
    expect(wsUrl('192.168.4.1')).toBe('ws://192.168.4.1/ws');
    expect(wsUrl('http://10.0.0.5/')).toBe('ws://10.0.0.5/ws');
    expect(wsUrl('')).toBe('ws://192.168.4.1/ws');
    expect(infoUrl('192.168.4.1')).toBe('http://192.168.4.1/api/info');
  });

  test('comandos ficam dentro das faixas aceitas pelo firmware', () => {
    expect(cmd.move(150, -300)).toEqual({ cmd: 'move', x: 100, y: -100 });
    expect(cmd.move(12.6, 'x')).toEqual({ cmd: 'move', x: 13, y: 0 });
    expect(cmd.servo(7, 90)).toEqual({ cmd: 'servo', i: 3, a: 90 });
    expect(cmd.speed(140)).toEqual({ cmd: 'speed', v: 100 });
    expect(cmd.setInvert(1, 0, 'sim')).toEqual({ cmd: 'setinvert', l: true, r: false, s: true });
    expect(cmd.stop()).toEqual({ cmd: 'stop' });
  });

  test('joystick: para cima = frente (+Y), direita = +X', () => {
    expect(joystickVector(0, -100, 100)).toMatchObject({ x: 0, y: 100 });
    expect(joystickVector(50, 0, 100)).toMatchObject({ x: 50, y: 0 });
  });

  test('joystick: vetor é limitado ao raio', () => {
    const v = joystickVector(300, 400, 100); // distância 500 → reduzida para 100
    expect(v).toMatchObject({ x: 60, y: -80 });
    expect(Math.hypot(v.dx, v.dy)).toBeCloseTo(100);
  });

  test('mistura das rodas igual ao firmware (com zona morta)', () => {
    expect(mixDrive(0, 100)).toEqual({ left: 100, right: 100 });
    expect(mixDrive(100, 0)).toEqual({ left: 100, right: -100 });
    expect(mixDrive(5, 5)).toEqual({ left: 0, right: 0 });
    expect(mixDrive(0, 100, 50)).toEqual({ left: 50, right: 50 });
  });

  test('interpreta a mensagem cfg e ignora mensagens inválidas', () => {
    const cfg = parseMessage(JSON.stringify({ type: 'cfg', speed: 55, pos: [10, 20, 30, 40], invL: true }));
    expect(cfg.speed).toBe(55);
    expect(cfg.pos).toEqual([10, 20, 30, 40]);
    expect(cfg.max).toEqual([180, 180, 180, 180]);
    expect(cfg.invL).toBe(true);
    expect(parseMessage('não é json')).toBeNull();
    expect(parseMessage('{"type":"outra"}')).toBeNull();
  });
});
