import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { createAuthService } from './authService';

// No celular: Keychain (iOS) / Keystore (Android) via expo-secure-store.
// No navegador (apenas para visualizar durante o desenvolvimento) o SecureStore
// não existe, então usamos o localStorage.
const webStore = {
  getItemAsync: async (k) => globalThis.localStorage?.getItem(k) ?? null,
  setItemAsync: async (k, v) => globalThis.localStorage?.setItem(k, v),
  deleteItemAsync: async (k) => globalThis.localStorage?.removeItem(k),
};

/** Instância do serviço de autenticação usando os módulos nativos do Expo. */
export const authService = createAuthService({
  store: Platform.OS === 'web' ? webStore : SecureStore,
  digest: (text) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text),
  randomBytes: (n) => Crypto.getRandomBytes(n),
});
