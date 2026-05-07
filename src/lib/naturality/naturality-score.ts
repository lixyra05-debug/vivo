/**
 * naturality-score — Détection des plantes (PLANT_ENCYCLOPEDIA) mentionnées
 * dans une chaîne d'ingrédients (e.g. liste OFF / OBF d'un produit).
 *
 * Comparaison case-insensitive avec lookarounds Unicode (\p{L}) pour gérer
 * les caractères accentués comme word boundary. Pas de side effect, pas de
 * cache : la fonction est pure.
 */

import {
  PLANT_ENCYCLOPEDIA,
  type PlantEntry,
} from '@/src/data/plant-encyclopedia';

export interface NaturalityMatch {
  plantId: string;
  nameFr: string;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Détecte les plantes de PLANT_ENCYCLOPEDIA mentionnées dans une chaîne
 * d'ingrédients.
 *
 * - Compare `nameFr` ET `nameLatin` exact strings de l'encyclopédie
 * - Match case-insensitive avec lookarounds Unicode (\p{L}) — protège
 *   contre les sous-chaînes (ex: "thymol" ne matchera pas "thym")
 * - Déduplique par plantId
 * - Renvoie [] sur chaîne nulle, undefined ou vide
 */
export function detectNaturalIngredients(
  ingredientsList: string | null | undefined,
): NaturalityMatch[] {
  if (!ingredientsList) return [];
  const lower = ingredientsList.toLowerCase();
  const seen = new Set<string>();
  const matches: NaturalityMatch[] = [];

  for (const plant of PLANT_ENCYCLOPEDIA as PlantEntry[]) {
    if (seen.has(plant.id)) continue;
    const candidates = [plant.nameFr, plant.nameLatin].filter(
      (n): n is string => Boolean(n),
    );
    for (const name of candidates) {
      const pattern = escapeRegExp(name.toLowerCase());
      const regex = new RegExp(`(?<!\\p{L})${pattern}(?!\\p{L})`, 'iu');
      if (regex.test(lower)) {
        matches.push({ plantId: plant.id, nameFr: plant.nameFr });
        seen.add(plant.id);
        break;
      }
    }
  }

  return matches;
}
