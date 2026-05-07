/**
 * protocol-progress — CRUD AsyncStorage pour la progression des protocoles 21j.
 *
 * 1 seul protocole actif à la fois. Quand un nouveau démarre alors qu'un
 * actif existe : ancien push dans l'historique avec status='abandoned'.
 *
 * R10 — Stockage local AsyncStorage uniquement, aucun appel Supabase.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProtocolProgress {
  protocolId: string;
  /** ISO toString de la date de démarrage */
  startDate: string;
  /** Calculé à la lecture (Math.floor((now - start)/86400000)+1, capé 21) */
  currentDay: number;
  /** Tri ascendant, sans doublons */
  completedDays: number[];
  /** Map jour → score 1..5 */
  feelings: Record<number, number>;
  status: 'active' | 'completed' | 'abandoned';
}

const ACTIVE_KEY = '@vivo_protocol_active';
const HISTORY_KEY = '@vivo_protocol_history';

const MS_PER_DAY = 86_400_000;

// ─── Helpers internes ────────────────────────────────────────────────────

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function computeCurrentDay(startDate: string): number {
  const startMs = new Date(startDate).getTime();
  if (!Number.isFinite(startMs)) return 1;
  const elapsedDays = Math.floor((Date.now() - startMs) / MS_PER_DAY);
  const day = elapsedDays + 1;
  if (day < 1) return 1;
  if (day > 21) return 21;
  return day;
}

async function readActiveRaw(): Promise<ProtocolProgress | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_KEY);
  return safeParse<ProtocolProgress | null>(raw, null);
}

async function writeActive(progress: ProtocolProgress): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(progress));
}

async function clearActive(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_KEY);
}

async function readHistory(): Promise<ProtocolProgress[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return safeParse<ProtocolProgress[]>(raw, []);
}

async function pushHistory(progress: ProtocolProgress): Promise<void> {
  const history = await readHistory();
  history.push(progress);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ─── API publique ────────────────────────────────────────────────────────

/**
 * Retourne le protocole actif, ou null. Le `currentDay` est recalculé
 * à chaque lecture (pas stocké).
 */
export async function getActiveProtocol(): Promise<ProtocolProgress | null> {
  const stored = await readActiveRaw();
  if (!stored) return null;
  return {
    ...stored,
    currentDay: computeCurrentDay(stored.startDate),
  };
}

/**
 * Démarre un nouveau protocole. Si un protocole est déjà actif :
 * il est marqué 'abandoned' et poussé dans l'historique avant remplacement.
 */
export async function startProtocol(
  protocolId: string,
): Promise<ProtocolProgress> {
  const existing = await readActiveRaw();
  if (existing && existing.status === 'active') {
    await pushHistory({ ...existing, status: 'abandoned' });
  }
  const now = new Date().toISOString();
  const fresh: ProtocolProgress = {
    protocolId,
    startDate: now,
    currentDay: 1,
    completedDays: [],
    feelings: {},
    status: 'active',
  };
  await writeActive(fresh);
  return fresh;
}

/**
 * Marque le jour `day` comme complété avec un feeling 1..5.
 * Si le jour est déjà complété : ne duplique pas dans `completedDays`,
 * mais met à jour `feelings[day]`.
 *
 * Quand `completedDays.length === 21` : status='completed', push history,
 * et clear ACTIVE_KEY.
 */
export async function completeDay(
  day: number,
  feeling: number,
): Promise<ProtocolProgress> {
  const active = await readActiveRaw();
  if (!active) {
    throw new Error('No active protocol — call startProtocol first');
  }

  const completedDays = active.completedDays.includes(day)
    ? active.completedDays
    : [...active.completedDays, day].sort((a, b) => a - b);

  const feelings = { ...active.feelings, [day]: feeling };

  const updated: ProtocolProgress = {
    ...active,
    completedDays,
    feelings,
    currentDay: computeCurrentDay(active.startDate),
  };

  if (completedDays.length === 21) {
    const completed: ProtocolProgress = { ...updated, status: 'completed' };
    await pushHistory(completed);
    await clearActive();
    return completed;
  }

  await writeActive(updated);
  return updated;
}

/**
 * Abandonne le protocole actif (s'il existe). Push en history avec
 * status='abandoned' puis clear ACTIVE_KEY.
 */
export async function abandonProtocol(): Promise<void> {
  const active = await readActiveRaw();
  if (!active) return;
  await pushHistory({ ...active, status: 'abandoned' });
  await clearActive();
}

/**
 * Retourne l'historique trié par date d'insertion (ordre push).
 */
export async function getProtocolHistory(): Promise<ProtocolProgress[]> {
  return readHistory();
}
