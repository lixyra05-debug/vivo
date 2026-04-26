/**
 * Premium gate — détermine l'accès aux 3 fonctionnalités premium :
 *   • store_full_ranking   — classement complet des supermarchés
 *   • store_comparison     — top produits par enseigne sans coupure
 *   • smart_alternatives   — alternatives intelligentes au scan
 *
 * Source de vérité : table `subscriptions` (D1 validée).
 * Trialing compte comme premium (D2 validée).
 */

import { supabase } from '../api/supabase';

export type PremiumFeatureKey =
  | 'store_full_ranking'
  | 'store_comparison'
  | 'smart_alternatives';

export interface PremiumFeatureDef {
  labelFr: string;
  descriptionFr: string;
  freeLimit: number;
}

export const PREMIUM_FEATURES: Record<PremiumFeatureKey, PremiumFeatureDef> = {
  store_full_ranking: {
    labelFr: 'Classement complet des supermarchés',
    descriptionFr:
      'Voir le classement intégral des 10 enseignes françaises selon la qualité moyenne de leurs produits.',
    freeLimit: 3,
  },
  store_comparison: {
    labelFr: 'Top produits par enseigne',
    descriptionFr:
      "Comparer tous les produits populaires d'une enseigne sans limite.",
    freeLimit: 3,
  },
  smart_alternatives: {
    labelFr: 'Alternatives intelligentes au scan',
    descriptionFr:
      'Suggestions automatiques de meilleures alternatives quand un produit scanné est mal noté.',
    freeLimit: 0,
  },
};

const PREMIUM_STATUSES = ['active', 'trialing'] as const;

export async function isPremiumUser(
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .eq('plan', 'premium')
      .in('status', PREMIUM_STATUSES as unknown as string[])
      .limit(1)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  } catch {
    return false;
  }
}

export function canAccessFeature(
  isPremium: boolean,
  _key: PremiumFeatureKey,
): boolean {
  return isPremium;
}

export function getFeatureLimit(
  isPremium: boolean,
  key: PremiumFeatureKey,
): number {
  if (isPremium) return Infinity;
  return PREMIUM_FEATURES[key].freeLimit;
}
