import { generateSalt, hashPassword, verifyPassword, ITERATIONS } from './passwordHasher';
import { USERNAME_REGEX } from './validators';

export { USERNAME_REGEX };

/**
 * Serviço de autenticação local.
 * Usuários ficam no armazenamento seguro do aparelho (expo-secure-store:
 * Keychain no iOS, Keystore/EncryptedSharedPreferences no Android),
 * guardando somente salt + hash da senha.
 */

const USER_PREFIX = 'bmp_user_';
const SESSION_KEY = 'bmp_session';

export const MIN_PASSWORD = 6;

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

export function validateCredentials(username, password) {
  const u = normalizeUsername(username);
  if (!u || !password) return 'Preencha usuário e senha.';
  if (!USERNAME_REGEX.test(u)) return 'Usuário deve ter 3 a 20 caracteres (letras, números, ponto, _ ou -).';
  if (password.length < MIN_PASSWORD) return `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`;
  return null;
}

/**
 * @param {{ store: {getItemAsync, setItemAsync, deleteItemAsync},
 *           digest: (t: string) => Promise<string>,
 *           randomBytes: (n: number) => Uint8Array,
 *           iterations?: number }} deps
 */
export function createAuthService({ store, digest, randomBytes, iterations = ITERATIONS }) {
  async function readUser(username) {
    const raw = await store.getItemAsync(USER_PREFIX + username);
    return raw ? JSON.parse(raw) : null;
  }

  return {
    async register(username, password, confirm) {
      const error = validateCredentials(username, password);
      if (error) throw new AuthError('invalid', error);
      if (confirm !== undefined && confirm !== password) {
        throw new AuthError('mismatch', 'As senhas não conferem.');
      }
      const u = normalizeUsername(username);
      if (await readUser(u)) throw new AuthError('exists', 'Este usuário já existe.');

      const salt = generateSalt(randomBytes);
      const hash = await hashPassword(password, salt, digest, iterations);
      const record = { username: u, salt, hash, iterations, createdAt: new Date().toISOString() };
      await store.setItemAsync(USER_PREFIX + u, JSON.stringify(record));
      await store.setItemAsync(SESSION_KEY, u);
      return { username: u };
    },

    async login(username, password) {
      const u = normalizeUsername(username);
      if (!u || !password) throw new AuthError('invalid', 'Preencha usuário e senha.');
      const record = await readUser(u);
      // Mesma mensagem para usuário inexistente e senha errada (não revela quais usuários existem).
      if (!record || !(await verifyPassword(password, record, digest))) {
        throw new AuthError('credentials', 'Usuário ou senha inválidos.');
      }
      await store.setItemAsync(SESSION_KEY, u);
      return { username: u };
    },

    async logout() {
      await store.deleteItemAsync(SESSION_KEY);
    },

    async restoreSession() {
      const u = await store.getItemAsync(SESSION_KEY);
      if (!u) return null;
      return (await readUser(u)) ? { username: u } : null;
    },
  };
}
