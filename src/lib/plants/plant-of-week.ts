/**
 * plant-of-week — Sélection déterministe de la plante mise en avant chaque semaine.
 *
 * Tier Expert (R7) — surfaceé via le PlantOfWeekCard sur la home.
 *
 * Algo : index = floor(jourDeLAnnée / 7) % PLANT_ENCYCLOPEDIA.length
 *   • Tous les jours d'une même tranche de 7 (à partir du 1er janvier UTC)
 *     renvoient la même plante (déterminisme weekly).
 *   • Le paramètre `now` est injectable pour les tests.
 */

import { PLANT_ENCYCLOPEDIA, type PlantEntry } from '@/src/data/plant-encyclopedia';

const MS_PER_DAY = 86_400_000;

/**
 * Retourne la plante de la semaine, déterministe selon le jour passé en argument.
 */
export function getPlantOfWeek(now: Date = new Date()): PlantEntry {
  const utcMidnightToday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const utcJan1 = Date.UTC(now.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((utcMidnightToday - utcJan1) / MS_PER_DAY);
  const weekIndex = Math.floor(dayOfYear / 7);
  const len = PLANT_ENCYCLOPEDIA.length;
  const idx = ((weekIndex % len) + len) % len;
  return PLANT_ENCYCLOPEDIA[idx];
}
