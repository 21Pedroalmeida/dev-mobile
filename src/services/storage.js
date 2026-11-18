import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_HOST, PRESET_POSES } from './protocol';
import { isValidPoseName } from './validators';

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
  if (!isValidPoseName(trimmed)) throw new Error('Use só letras, números e espaços (até 30 caracteres).');
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

/* ---------- Todos os dados do usuário (getAllKeys + multiGet — aula 4) ---------- */
export async function listUserData(user) {
  const prefix = key(user, '');
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(prefix));
  const pairs = await AsyncStorage.multiGet(keys); // [[chave, valor], ...]
  return pairs.map(([k, value]) => {
    let itens = 1;
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) itens = parsed.length;
    } catch {
      /* valor não é JSON */
    }
    return { key: k, nome: k.slice(prefix.length), itens, bytes: (value || '').length };
  });
}

export async function clearUserData(user) {
  const prefix = key(user, '');
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(prefix));
  await AsyncStorage.multiRemove(keys);
  return keys.length;
}

/* ---------- Histórico agrupado por dia (para a SectionList) ---------- */
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function groupHistoryByDay(history, now = new Date()) {
  const ontem = new Date(now);
  ontem.setDate(now.getDate() - 1);
  const p = (n) => String(n).padStart(2, '0');
  const sections = [];
  const index = {};
  for (const item of history) {
    const d = new Date(item.at);
    const k = dayKey(d);
    if (!(k in index)) {
      const title =
        k === dayKey(now) ? 'Hoje' : k === dayKey(ontem) ? 'Ontem' : `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
      index[k] = sections.length;
      sections.push({ title, data: [] });
    }
    sections[index[k]].data.push(item);
  }
  return sections;
}
