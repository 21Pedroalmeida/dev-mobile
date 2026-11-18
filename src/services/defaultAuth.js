import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { createAuthService } from './authService';

/** Instância do serviço de autenticação usando os módulos nativos do Expo. */
export const authService = createAuthService({
  store: SecureStore,
  digest: (text) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text),
  randomBytes: (n) => Crypto.getRandomBytes(n),
});
