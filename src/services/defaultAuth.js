import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { createAuthService } from './authService';

// No celular: Keychain (iOS) / Keystore (Android) via expo-secure-store.
// No navegador (apenas para visualizar durante o desenvolvimento) o SecureStore
// não existe, então usamos o localStorage.
const memory = new Map();
const ls = () => {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
};
const webStore = {
  getItemAsync: async (k) => {
    try {
      return ls() ? ls().getItem(k) : memory.get(k) ?? null;
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItemAsync: async (k, v) => {
    memory.set(k, v);
    try {
      ls()?.setItem(k, v);
    } catch {
      /* navegador sem localStorage: fica só na memória */
    }
  },
  deleteItemAsync: async (k) => {
    memory.delete(k);
    try {
      ls()?.removeItem(k);
    } catch {
      /* idem */
    }
  },
};

/** Instância do serviço de autenticação usando os módulos nativos do Expo. */
export const authService = createAuthService({
  store: Platform.OS === 'web' ? webStore : SecureStore,
  digest: (text) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text),
  randomBytes: (n) => Crypto.getRandomBytes(n),
});
