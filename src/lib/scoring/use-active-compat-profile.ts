/**
 * Hook : renvoie le `CompatibilityProfile` actif courant.
 *
 * Priorité de résolution :
 *  1) Profil familial actif (Mode Famille, Premium tier) — ses allergies +
 *     conditions priment sur le profil santé global de l'utilisateur.
 *  2) Sinon, fallback `userProfileToCompatibilityProfile(profile)` — peut
 *     renvoyer `null` si l'utilisateur n'a déclaré ni allergie ni condition.
 *
 * Permet à un parent (ex. `app/product/[barcode].tsx`) d'avoir une seule
 * source de vérité pour la compatibilité, sans dupliquer la logique
 * « Mode Famille actif ? » dans chaque consumer.
 */
import { useMemo } from 'react';

import type { CompatibilityProfile } from '../api/types';
import { useAuthStore } from '../stores/useAuthStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useActiveFamilyProfile } from '../family/family-store';
import { userProfileToCompatibilityProfile } from './profile-adapter';

/**
 * Convertit un `FamilyProfile` actif en `CompatibilityProfile`.
 * Renvoie `null` si ni allergie ni condition (rien à filtrer).
 */
function familyProfileToCompatibility(
  allergies: string[],
  conditions: string[],
): CompatibilityProfile | null {
  if (allergies.length === 0 && conditions.length === 0) return null;
  return {
    allergies,
    dietary: [],
    conditions,
    avoid: [],
    minScore: 50,
  };
}

export function useActiveCompatProfile(): CompatibilityProfile | null {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const userProfile = useProfileStore((s) => s.profile);
  const activeFamilyProfile = useActiveFamilyProfile(userId);

  return useMemo(() => {
    // 1) Famille active prime
    if (activeFamilyProfile) {
      const fromFamily = familyProfileToCompatibility(
        activeFamilyProfile.allergies,
        activeFamilyProfile.conditions,
      );
      if (fromFamily) return fromFamily;
    }
    // 2) Fallback profil santé global
    return userProfileToCompatibilityProfile(userProfile);
  }, [activeFamilyProfile, userProfile]);
}
