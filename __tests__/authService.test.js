import { createAuthService, validateCredentials } from '../src/services/authService';
import { memoryStore, nodeDigest, nodeRandomBytes } from '../test-utils/helpers';

function setup() {
  const store = memoryStore();
  const auth = createAuthService({ store, digest: nodeDigest, randomBytes: nodeRandomBytes, iterations: 50 });
  return { store, auth };
}

describe('Login com criptografia (authService)', () => {
  test('cadastra usuário salvando apenas salt + hash (nunca a senha)', async () => {
    const { store, auth } = setup();
    await auth.register('Maria', 'senha123', 'senha123');
    const saved = JSON.parse(store.data.get('bmp_user_maria'));
    expect(saved.username).toBe('maria');
    expect(saved.salt).toMatch(/^[0-9a-f]{32}$/);
    expect(saved.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(saved)).not.toContain('senha123');
  });

  test('login com a senha correta funciona e cria sessão', async () => {
    const { store, auth } = setup();
    await auth.register('joao', 'abc12345');
    await auth.logout();
    await expect(auth.login('JOAO', 'abc12345')).resolves.toEqual({ username: 'joao' });
    expect(store.data.get('bmp_session')).toBe('joao');
  });

  test('login com senha errada é recusado', async () => {
    const { auth } = setup();
    await auth.register('joao', 'abc12345');
    await expect(auth.login('joao', 'errada99')).rejects.toMatchObject({ code: 'credentials' });
  });

  test('usuário inexistente recebe a mesma mensagem (não revela usuários)', async () => {
    const { auth } = setup();
    await expect(auth.login('fantasma', 'qualquer1')).rejects.toThrow('Usuário ou senha inválidos.');
  });

  test('não permite cadastrar o mesmo usuário duas vezes', async () => {
    const { auth } = setup();
    await auth.register('ana', 'senha123');
    await expect(auth.register('ANA', 'outra123')).rejects.toMatchObject({ code: 'exists' });
  });

  test('confirmação de senha diferente é recusada', async () => {
    const { auth } = setup();
    await expect(auth.register('ana', 'senha123', 'senha124')).rejects.toMatchObject({ code: 'mismatch' });
  });

  test('restaura a sessão salva e encerra no logout', async () => {
    const { auth } = setup();
    await auth.register('pedro', 'senha123');
    expect(await auth.restoreSession()).toEqual({ username: 'pedro' });
    await auth.logout();
    expect(await auth.restoreSession()).toBeNull();
  });

  test.each([
    ['', 'senha123', 'Preencha usuário e senha.'],
    ['ab', 'senha123', 'Usuário deve ter'],
    ['nome com espaço', 'senha123', 'Usuário deve ter'],
    ['valido', '123', 'pelo menos 6'],
  ])('valida credenciais (%s / %s)', (u, p, msg) => {
    expect(validateCredentials(u, p)).toContain(msg);
  });

  test('credenciais válidas não retornam erro', () => {
    expect(validateCredentials('user.ok', 'senha123')).toBeNull();
  });
});
