/**
 * herbarium-store — Herbier personnel persisté en AsyncStorage (R10).
 *
 * Chaque entrée associe une plante (`plantId`) à une note libre courte
 * (max 200 caractères). Les opérations sont idempotentes : ré-ajouter
 * une plante déjà présente met simplement la note à jour, en préservant
 * la date d'ajout originale.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HerbariumEntry {
  plantId: string;
  /** Note libre, tronquée à 200 caractères avant stockage */
  note: string;
  /** ISO timestamp (préservé entre updates) */
  addedAt: string;
}

const HERBARIUM_KEY = '@vivo_herbarium';
const MAX_NOTE_LEN = 200;

// ─── Helpers ────────────────────────────────────────────────────────────

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function truncate(note: string): string {
  return note.length > MAX_NOTE_LEN ? note.slice(0, MAX_NOTE_LEN) : note;
}

async function readAll(): Promise<HerbariumEntry[]> {
  const raw = await AsyncStorage.getItem(HERBARIUM_KEY);
  return safeParse<HerbariumEntry[]>(raw, []);
}

async function writeAll(entries: HerbariumEntry[]): Promise<void> {
  await AsyncStorage.setItem(HERBARIUM_KEY, JSON.stringify(entries));
}

// ─── API publique ──────────────────────────────────────────────────────

/**
 * Retourne toutes les entrées de l'herbier dans l'ordre d'insertion.
 */
export async function getHerbarium(): Promise<HerbariumEntry[]> {
  return readAll();
}

/**
 * Ajoute une plante à l'herbier (ou met à jour la note si déjà présente).
 * Idempotent : `addedAt` est préservé sur les updates.
 */
export async function addToHerbarium(
  plantId: string,
  note: string = '',
): Promise<HerbariumEntry[]> {
  const entries = await readAll();
  const truncated = truncate(note);
  const existingIdx = entries.findIndex((e) => e.plantId === plantId);

  if (existingIdx >= 0) {
    entries[existingIdx] = {
      ...entries[existingIdx],
      note: truncated,
    };
  } else {
    entries.push({
      plantId,
      note: truncated,
      addedAt: new Date().toISOString(),
    });
  }

  await writeAll(entries);
  return entries;
}

/**
 * Supprime une plante de l'herbier. No-op si absente.
 */
export async function removeFromHerbarium(
  plantId: string,
): Promise<HerbariumEntry[]> {
  const entries = await readAll();
  const filtered = entries.filter((e) => e.plantId !== plantId);
  await writeAll(filtered);
  return filtered;
}

/**
 * Met à jour la note d'une plante. No-op (renvoie liste actuelle) si la
 * plante n'est pas dans l'herbier.
 */
export async function updateNote(
  plantId: string,
  note: string,
): Promise<HerbariumEntry[]> {
  const entries = await readAll();
  const idx = entries.findIndex((e) => e.plantId === plantId);
  if (idx < 0) return entries;

  entries[idx] = { ...entries[idx], note: truncate(note) };
  await writeAll(entries);
  return entries;
}

/**
 * Indique si une plante est présente dans l'herbier.
 */
export async function isInHerbarium(plantId: string): Promise<boolean> {
  const entries = await readAll();
  return entries.some((e) => e.plantId === plantId);
}
