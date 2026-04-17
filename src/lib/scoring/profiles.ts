import type { HealthProfile } from '../api/types';
import type { AdditiveEntry } from './additives-db';

export interface ProfileEffect {
  blocked: boolean;
  multiplier: number;
  label: string | null;
}

const PROFILE_LABELS: Record<HealthProfile, string> = {
  standard: 'Standard',
  diabetic: 'Diabète / Perte de poids',
  athlete: 'Sportif',
  child: 'Enfant',
  pregnant: 'Femme enceinte',
  intolerant: 'Intolérances',
};

export function evaluateAdditiveForProfile(
  additive: AdditiveEntry,
  profile: HealthProfile
): ProfileEffect {
  const override = additive.profilesExtraPenalty[profile];
  if (override === 'blocker') {
    return {
      blocked: true,
      multiplier: 1,
      label: `Profil ${PROFILE_LABELS[profile]} : ${additive.nameFr} interdit`,
    };
  }
  if (override === 'double') {
    return {
      blocked: false,
      multiplier: 2,
      label: `Profil ${PROFILE_LABELS[profile]} : pénalité ${additive.nameFr} doublée`,
    };
  }
  return { blocked: false, multiplier: 1, label: null };
}

export function getProfileLabel(profile: HealthProfile): string {
  return PROFILE_LABELS[profile];
}
