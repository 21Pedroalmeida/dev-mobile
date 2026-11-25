/**
 * TESTE UNITÁRIO com MOCK do AsyncStorage (aula 6): o "banco" do celular é trocado
 * por um falso na memória (jest.setup.js). Confere salvar, excluir e separar dados por usuário.
 * Rodar só este arquivo: npx jest __tests__/storage.test.js
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as storage from '../src/services/storage';

beforeEach(() => AsyncStorage.clear());

describe('Persistência de dados (AsyncStorage)', () => {
  test('primeiro acesso começa com as poses padrão', async () => {
    const poses = await storage.loadPoses('ana');
    expect(poses.map((p) => p.name)).toEqual(['Repouso', 'Pegar']);
  });

  test('salva uma pose e ela continua lá ao recarregar', async () => {
    await storage.addPose('ana', '  Pegar copo ', [10, 20, 30, 40.4]);
    const poses = await storage.loadPoses('ana');
    expect(poses[0]).toMatchObject({ name: 'Pegar copo', angles: [10, 20, 30, 40] });
    expect(poses).toHaveLength(3);
  });

  test('pose sem nome é recusada', async () => {
    await expect(storage.addPose('ana', '   ', [1, 2, 3, 4])).rejects.toThrow('Dê um nome');
  });

  test('exclui uma pose', async () => {
    const [first] = await storage.addPose('ana', 'Temp', [1, 2, 3, 4]);
    const after = await storage.deletePose('ana', first.id);
    expect(after.find((p) => p.id === first.id)).toBeUndefined();
  });

  test('dados são separados por usuário', async () => {
    await storage.addPose('ana', 'Só da Ana', [1, 2, 3, 4]);
    const bob = await storage.loadPoses('bob');
    expect(bob.some((p) => p.name === 'Só da Ana')).toBe(false);
  });

  test('configurações: defaults + valores salvos', async () => {
    expect(await storage.loadSettings('ana')).toEqual(storage.DEFAULT_SETTINGS);
    await storage.saveSettings('ana', { ...storage.DEFAULT_SETTINGS, host: '10.0.0.9', demo: false });
    expect(await storage.loadSettings('ana')).toMatchObject({ host: '10.0.0.9', demo: false, vibration: true });
  });

  test('histórico: mais recente primeiro, limitado e limpável', async () => {
    await storage.addHistory('ana', 'comando', 'primeiro');
    const h = await storage.addHistory('ana', 'comando', 'segundo');
    expect(h.map((e) => e.message)).toEqual(['segundo', 'primeiro']);
    for (let i = 0; i < storage.MAX_HISTORY + 5; i++) await storage.addHistory('ana', 'x', `e${i}`);
    expect(await storage.loadHistory('ana')).toHaveLength(storage.MAX_HISTORY);
    expect(await storage.clearHistory('ana')).toEqual([]);
  });

  test('dado corrompido não derruba o app', async () => {
    await AsyncStorage.setItem('@bmptech/ana/history', '{quebrado');
    expect(await storage.loadHistory('ana')).toEqual([]);
  });
});
