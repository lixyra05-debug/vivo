/**
 * Streak engine — calcule la série de jours consécutifs avec au moins un scan,
 * en fuseau Europe/Paris (la journée commence et finit à minuit local).
 */

import type { ScanRecord } from './types';

/**
 * Convertit une date (ou string ISO) en clé "YYYY-MM-DD" dans le fuseau Europe/Paris.
 */
function toParisDateKey(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  // fr-CA produit YYYY-MM-DD, on force le fuseau Paris.
  const fmt = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(d);
}

/**
 * Renvoie YYYY-MM-DD du jour précédent (Europe/Paris) à partir d'une clé YYYY-MM-DD.
 */
function previousDayKey(dateKey: string): string {
  // On ancre à midi UTC pour éviter les bordures de fuseau / DST.
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return toParisDateKey(d);
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastScanDate: string | null; // ISO date YYYY-MM-DD (Paris) ou null
}

/**
 * Calcule streak courant et plus long streak.
 * @param scans  liste de scans (ordre quelconque)
 * @param now    date de référence (par défaut Date.now()) — utile pour les tests déterministes
 */
export function calculateStreak(
  scans: ScanRecord[],
  now: Date = new Date()
): StreakResult {
  if (scans.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastScanDate: null };
  }

  // 1. Set des jours uniques (Paris) où l'utilisateur a scanné.
  const dayKeys = new Set<string>();
  for (const s of scans) {
    dayKeys.add(toParisDateKey(s.scanned_at));
  }
  const uniqueDays = Array.from(dayKeys).sort(); // ordre croissant

  // 2. Plus longue série historique
  let longestStreak = 1;
  let runLength = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const expectedPrev = previousDayKey(uniqueDays[i]);
    if (uniqueDays[i - 1] === expectedPrev) {
      runLength += 1;
      if (runLength > longestStreak) longestStreak = runLength;
    } else {
      runLength = 1;
    }
  }

  // 3. Streak courant : on remonte depuis aujourd'hui.
  const todayKey = toParisDateKey(now);
  const yesterdayKey = previousDayKey(todayKey);
  const lastDay = uniqueDays[uniqueDays.length - 1];

  let currentStreak = 0;
  if (lastDay === todayKey || lastDay === yesterdayKey) {
    currentStreak = 1;
    let cursor = lastDay;
    for (let i = uniqueDays.length - 2; i >= 0; i--) {
      const expectedPrev = previousDayKey(cursor);
      if (uniqueDays[i] === expectedPrev) {
        currentStreak += 1;
        cursor = uniqueDays[i];
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastScanDate: lastDay,
  };
}

/**
 * Le streak est considéré actif si le dernier scan date d'aujourd'hui ou d'hier (Paris).
 */
export function isStreakActive(
  lastScanDate: string | null,
  now: Date = new Date()
): boolean {
  if (!lastScanDate) return false;
  const todayKey = toParisDateKey(now);
  const yesterdayKey = previousDayKey(todayKey);
  return lastScanDate === todayKey || lastScanDate === yesterdayKey;
}

/**
 * Message d'encouragement adapté à la longueur du streak.
 */
export function getStreakMessage(streak: number): string {
  if (streak <= 0) return 'Scanne un produit pour lancer ton streak !';
  if (streak === 1) return 'Premier pas !';
  if (streak === 2) return '2 jours, ça commence bien !';
  if (streak < 7) return `${streak} jours de suite, beau début !`;
  if (streak < 14) return '1 semaine, impressionnant !';
  if (streak < 30) return `${Math.floor(streak / 7)} semaines, tu es régulier !`;
  if (streak < 60) return `${Math.floor(streak / 30)} mois ! Tu es un expert !`;
  return `Incroyable, ${streak} jours !`;
}
