import type { CosmeticProfile } from '../api/types';
import type { CosmeticIngredientEntry } from './cosmetic-ingredients-db';

export interface CosmeticProfileEffect {
  blocked: boolean;
  multiplier: number;
  label: string | null;
}

export const COSMETIC_PROFILE_LABELS: Record<CosmeticProfile, string> = {
  standard: 'Standard',
  peau_sensible: 'Peau sensible',
  enceinte: 'Femme enceinte',
  bebe: 'Bébé (<3 ans)',
};

export function evaluateCosmeticIngredientForProfile(
  entry: CosmeticIngredientEntry,
  profile: CosmeticProfile
): CosmeticProfileEffect {
  const override = entry.profilesExtraPenalty[profile];
  if (override === 'blocker') {
    return {
      blocked: true,
      multiplier: 1,
      label: `Profil ${COSMETIC_PROFILE_LABELS[profile]} : ${entry.nameFr} interdit`,
    };
  }
  if (override === 'double') {
    return {
      blocked: false,
      multiplier: 2,
      label: `Profil ${COSMETIC_PROFILE_LABELS[profile]} : pénalité ${entry.nameFr} doublée`,
    };
  }
  return { blocked: false, multiplier: 1, label: null };
}

export function getCosmeticProfileLabel(profile: CosmeticProfile): string {
  return COSMETIC_PROFILE_LABELS[profile];
}
