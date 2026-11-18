import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_HOST, PRESET_POSES } from './protocol';

/**
 * PERSISTÊNCIA DE DADOS (AsyncStorage) — separada por usuário logado.
 *  - poses salvas do braço
 *  - histórico de eventos/comandos
 *  - configurações do app (IP do ESP32, modo demonstração, vibração, notificações)
 */

export const MAX_HISTORY = 200;
const key = (user, name) => `@bmptech/${user}/${name}`;

async function readJson(k, fallback) {
  try {
    const raw = await AsyncStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
const writeJson = (k, value) => AsyncStorage.setItem(k, JSON.stringify(value));

/* ---------- Configurações ---------- */
export const DEFAULT_SETTINGS = { host: DEFAULT_HOST, demo: true, vibration: true, notifications: true };

export async function loadSettings(user) {
  return { ...DEFAULT_SETTINGS, ...(await readJson(key(user, 'settings'), {})) };
}
export async function saveSettings(user, settings) {
  await writeJson(key(user, 'settings'), settings);
  return settings;
}

/* ---------- Poses ---------- */
export async function loadPoses(user) {
  const poses = await readJson(key(user, 'poses'), null);
  if (poses === null) {
    // Primeiro acesso: começa com as poses padrão do firmware.
    const seeded = PRESET_POSES.map((p) => ({ ...p, createdAt: new Date().toISOString() }));
    await writeJson(key(user, 'poses'), seeded);
    return seeded;
  }
  return poses;
}

export async function addPose(user, name, angles) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Dê um nome para a pose.');
  if (!Array.isArray(angles) || angles.length !== 4) throw new Error('Pose inválida.');
  const poses = await loadPoses(user);
  const pose = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmed.slice(0, 30),
    angles: angles.map((a) => Math.round(a)),
    createdAt: new Date().toISOString(),
  };
  const next = [pose, ...poses];
  await writeJson(key(user, 'poses'), next);
  return next;
}

export async function deletePose(user, id) {
  const next = (await loadPoses(user)).filter((p) => p.id !== id);
  await writeJson(key(user, 'poses'), next);
  return next;
}

/* ---------- Histórico ---------- */
export async function loadHistory(user) {
  return readJson(key(user, 'history'), []);
}

export async function addHistory(user, type, message) {
  const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, message, at: new Date().toISOString() };
  const next = [entry, ...(await loadHistory(user))].slice(0, MAX_HISTORY);
  await writeJson(key(user, 'history'), next);
  return next;
}

export async function clearHistory(user) {
  await writeJson(key(user, 'history'), []);
  return [];
}
