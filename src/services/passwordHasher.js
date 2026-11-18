/**
 * Criptografia de senha (hash com salt + key stretching).
 *
 * A senha NUNCA é salva em texto puro. Para cada usuário:
 *   1. Gera-se um SALT aleatório de 16 bytes (impede ataques com tabelas pré-computadas
 *      e faz duas senhas iguais terem hashes diferentes).
 *   2. Calcula-se SHA-256(salt + senha) e repete-se o SHA-256 sobre o resultado
 *      ITERATIONS vezes ("key stretching"), tornando ataques de força bruta mais lentos.
 *   3. Salva-se apenas { salt, hash, iterations } no armazenamento seguro do aparelho.
 *
 * As funções recebem `digest` e `randomBytes` por parâmetro (injeção de dependência):
 * no app usamos o expo-crypto; nos testes automatizados, o módulo crypto do Node.
 */

export const ITERATIONS = 1000;
export const SALT_BYTES = 16;

export function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(randomBytes) {
  return bytesToHex(randomBytes(SALT_BYTES));
}

/**
 * @param {string} password senha em texto puro
 * @param {string} salt salt em hexadecimal
 * @param {(text: string) => Promise<string>} digest função SHA-256 que devolve hex
 * @param {number} iterations quantidade de rodadas
 */
export async function hashPassword(password, salt, digest, iterations = ITERATIONS) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Senha vazia');
  }
  let hash = await digest(`${salt}:${password}`);
  for (let i = 1; i < iterations; i++) {
    hash = await digest(`${salt}:${hash}`);
  }
  return hash;
}

/** Comparação em tempo constante (evita ataque de temporização). */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password, record, digest) {
  if (!record || !record.salt || !record.hash) return false;
  const hash = await hashPassword(password, record.salt, digest, record.iterations || ITERATIONS);
  return safeEqual(hash, record.hash);
}
