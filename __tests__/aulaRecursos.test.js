/**
 * TESTE com MOCK DE API (igual ao exemplo da aula 6: jest.mock('axios')) + regex,
 * WhatsApp (Linking), getAllKeys/multiGet e histórico por dia (SectionList).
 * Rodar só este arquivo: npx jest __tests__/aulaRecursos.test.js
 */
import axios from 'axios';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceInfo, formatUptime } from '../src/services/espInfo';
import { isValidIp, isValidPoseName, IP_REGEX } from '../src/services/validators';
import { poseMessage, whatsappUrl, sharePoseOnWhatsApp } from '../src/services/whatsapp';
import * as storage from '../src/services/storage';

// Mock do axios: imita a API sem precisar do ESP32 ligado (aula 6)
jest.mock('axios');

describe('API com axios (mock)', () => {
  test('busca /api/info no IP configurado', async () => {
    const resposta = { data: { firmware: 'v1.2', ip: '192.168.4.1', clients: 1 } };
    axios.get.mockImplementation((url) =>
      url === 'http://192.168.4.1/api/info' ? Promise.resolve(resposta) : Promise.reject(new Error('url errada')),
    );
    await expect(getDeviceInfo('192.168.4.1')).resolves.toEqual(resposta.data);
    expect(axios.get).toHaveBeenCalledWith('http://192.168.4.1/api/info', { timeout: 4000 });
  });

  test('propaga o erro quando o ESP32 não responde', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));
    await expect(getDeviceInfo('192.168.4.1')).rejects.toThrow('Network Error');
  });

  test('no modo demonstração não chama a API', async () => {
    axios.get.mockClear();
    const info = await getDeviceInfo('192.168.4.1', true);
    expect(info.firmware).toContain('simulado');
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('formata o tempo ligado', () => {
    expect(formatUptime(75)).toBe('1min 15s');
    expect(formatUptime(3725)).toBe('1h 2min');
  });
});

describe('Regex', () => {
  test.each(['192.168.4.1', '10.0.0.255', '0.0.0.0', '255.255.255.255'])('IP válido: %s', (ip) => {
    expect(isValidIp(ip)).toBe(true);
  });

  test.each(['256.1.1.1', '192.168.4', '192.168.4.1.5', 'abc.def.ghi.jkl', '', '192.168.04.1x'])('IP inválido: "%s"', (ip) => {
    expect(isValidIp(ip)).toBe(false);
  });

  test('o regex do IP é ancorado (^ e $)', () => {
    expect(IP_REGEX.test('ip=192.168.4.1')).toBe(false);
  });

  test('nome de pose aceita acentos e recusa símbolos', () => {
    expect(isValidPoseName('Pegar copo 2')).toBe(true);
    expect(isValidPoseName('Posição inicial')).toBe(true);
    expect(isValidPoseName('<script>')).toBe(false);
    expect(isValidPoseName('x'.repeat(31))).toBe(false);
  });
});

describe('WhatsApp (Linking)', () => {
  const pose = { id: '1', name: 'Pegar', angles: [90, 60, 120, 160] };

  test('monta a mensagem com os ângulos', () => {
    const msg = poseMessage(pose);
    expect(msg).toContain('Pegar');
    expect(msg).toContain('Garra: 160°');
  });

  test('gera link wa.me com o texto codificado', () => {
    expect(whatsappUrl('olá mundo')).toBe('https://wa.me/?text=ol%C3%A1%20mundo');
  });

  test('abre o WhatsApp pelo Linking', async () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const url = await sharePoseOnWhatsApp(pose);
    expect(spy).toHaveBeenCalledWith(url);
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
  });
});

describe('AsyncStorage: getAllKeys / multiGet e SectionList', () => {
  beforeEach(() => AsyncStorage.clear());

  test('lista só os dados do usuário logado', async () => {
    await storage.addPose('ana', 'Teste', [1, 2, 3, 4]);
    await storage.addHistory('ana', 'comando', 'oi');
    await storage.addPose('bob', 'Do Bob', [1, 2, 3, 4]);
    const dados = await storage.listUserData('ana');
    const nomes = dados.map((d) => d.nome).sort();
    expect(nomes).toEqual(['history', 'poses']);
    expect(dados.find((d) => d.nome === 'poses').itens).toBe(3); // 2 padrão + 1
  });

  test('apaga só os dados do usuário', async () => {
    await storage.addPose('ana', 'Teste', [1, 2, 3, 4]);
    await storage.addPose('bob', 'Do Bob', [1, 2, 3, 4]);
    expect(await storage.clearUserData('ana')).toBe(1);
    expect(await storage.listUserData('ana')).toEqual([]);
    expect((await storage.listUserData('bob')).length).toBe(1);
  });

  test('agrupa o histórico em Hoje / Ontem / data', () => {
    const now = new Date(2026, 10, 18, 12, 0);
    const h = [
      { id: 'a', at: new Date(2026, 10, 18, 9).toISOString() },
      { id: 'b', at: new Date(2026, 10, 18, 8).toISOString() },
      { id: 'c', at: new Date(2026, 10, 17, 20).toISOString() },
      { id: 'd', at: new Date(2026, 10, 2, 10).toISOString() },
    ];
    const sections = storage.groupHistoryByDay(h, now);
    expect(sections.map((s) => s.title)).toEqual(['Hoje', 'Ontem', '02/11/2026']);
    expect(sections[0].data.map((i) => i.id)).toEqual(['a', 'b']);
  });

  test('nome de pose com símbolos é recusado ao salvar', async () => {
    await expect(storage.addPose('ana', 'pose<>', [1, 2, 3, 4])).rejects.toThrow('Use só letras');
  });
});
