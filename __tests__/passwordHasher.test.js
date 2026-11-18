import { hashPassword, verifyPassword, generateSalt, safeEqual, bytesToHex } from '../src/services/passwordHasher';
import { nodeDigest, nodeRandomBytes } from '../test-utils/helpers';

describe('Criptografia de senha', () => {
  test('gera salt aleatório de 16 bytes (32 caracteres hex)', () => {
    const a = generateSalt(nodeRandomBytes);
    const b = generateSalt(nodeRandomBytes);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(b);
  });

  test('o mesmo salt + senha produz sempre o mesmo hash SHA-256', async () => {
    const h1 = await hashPassword('segredo123', 'abc', nodeDigest, 10);
    const h2 = await hashPassword('segredo123', 'abc', nodeDigest, 10);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  test('salts diferentes geram hashes diferentes para a mesma senha', async () => {
    const h1 = await hashPassword('segredo123', 'salt-a', nodeDigest, 10);
    const h2 = await hashPassword('segredo123', 'salt-b', nodeDigest, 10);
    expect(h1).not.toBe(h2);
  });

  test('o hash não contém a senha em texto puro', async () => {
    const h = await hashPassword('minhasenha', 'x', nodeDigest, 5);
    expect(h).not.toContain('minhasenha');
  });

  test('aplica várias rodadas de SHA-256 (key stretching)', async () => {
    const digest = jest.fn(nodeDigest);
    await hashPassword('abcdef', 's', digest, 25);
    expect(digest).toHaveBeenCalledTimes(25);
  });

  test('senha vazia é rejeitada', async () => {
    await expect(hashPassword('', 's', nodeDigest)).rejects.toThrow('Senha vazia');
  });

  test('verifyPassword aceita a senha certa e recusa a errada', async () => {
    const salt = generateSalt(nodeRandomBytes);
    const record = { salt, hash: await hashPassword('certa123', salt, nodeDigest, 20), iterations: 20 };
    expect(await verifyPassword('certa123', record, nodeDigest)).toBe(true);
    expect(await verifyPassword('errada123', record, nodeDigest)).toBe(false);
    expect(await verifyPassword('certa123', null, nodeDigest)).toBe(false);
  });

  test('safeEqual e bytesToHex', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(bytesToHex(new Uint8Array([0, 15, 255]))).toBe('000fff');
  });
});
