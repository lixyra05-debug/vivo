import type {
  CompatibilityProfile,
  UserProfileRow,
} from '../api/types';

/**
 * Convertit un profil utilisateur (issu de Supabase via useProfileStore) en
 * `CompatibilityProfile` exploitable par `compatibility-engine.ts`.
 *
 * Mapping appliqué :
 * - `health_profile === 'diabetic'`  → conditions += 'diabete'
 * - `health_profile === 'pregnant'`  → conditions += 'enceinte'
 * - `health_profile === 'child'`     → conditions += 'bebe'
 * - `allergies` → reportées telles quelles
 * - intolerances ne sont pas mappées ici (à étendre si besoin)
 *
 * Retourne `null` si l'utilisateur n'a aucune donnée exploitable
 * (pas de profil santé spécifique ET pas d'allergie déclarée).
 */
export function userProfileToCompatibilityProfile(
  profile: UserProfileRow | null,
): CompatibilityProfile | null {
  if (!profile) return null;

  const conditions: string[] = [];
  if (profile.health_profile === 'diabetic') conditions.push('diabete');
  if (profile.health_profile === 'pregnant') conditions.push('enceinte');
  if (profile.health_profile === 'child') conditions.push('bebe');

  const allergies = Array.isArray(profile.allergies) ? profile.allergies : [];

  // Si rien à vérifier (pas de condition + pas d'allergie), inutile d'activer
  // le filtrage compatibilité.
  if (conditions.length === 0 && allergies.length === 0) {
    return null;
  }

  return {
    allergies,
    dietary: [],
    conditions,
    avoid: [],
    minScore: 50,
  };
}
