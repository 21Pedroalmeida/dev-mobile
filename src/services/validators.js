/**
 * Validações com REGEX (aula de Regex).
 *
 *  \d      → um dígito
 *  [0-4]   → um caractere entre 0 e 4
 *  ?       → o item anterior é opcional
 *  {3}     → repete 3 vezes
 *  |       → "ou"
 *  ( )     → agrupa
 *  ^ e $   → início e fim do texto
 */

// Um número de 0 a 255: 250-255 | 200-249 | 100-199 | 0-99
const OCTETO = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';

// IPv4: quatro octetos separados por ponto. Ex.: 192.168.4.1
export const IP_REGEX = new RegExp(`^(${OCTETO}\\.){3}${OCTETO}$`);

// Usuário: 3 a 20 letras minúsculas, números, ponto, _ ou -
export const USERNAME_REGEX = /^[a-z0-9._-]{3,20}$/;

// Nome de pose: letras (com acento), números e espaços, de 1 a 30 caracteres
export const POSE_NAME_REGEX = /^[\p{L}\d ]{1,30}$/u;

export function isValidIp(text) {
  return IP_REGEX.test(String(text || '').trim());
}

export function isValidPoseName(text) {
  return POSE_NAME_REGEX.test(String(text || '').trim());
}
