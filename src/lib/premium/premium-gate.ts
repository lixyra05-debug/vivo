/**
 * Premium gate — détermine l'accès aux 3 fonctionnalités premium :
 *   • store_full_ranking   — classement complet des supermarchés
 *   • store_comparison     — top produits par enseigne sans coupure
 *   • smart_alternatives   — alternatives intelligentes au scan
 *
 * Source de vérité : table `subscriptions` (D1 validée).
 * Trialing compte comme premium (D2 validée).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Flag de développement pour tester l'app en mode Premium sans abonnement actif.
 * Mettre à `true` UNIQUEMENT en local pour QA TestFlight.
 * NE JAMAIS commit à `true`.
 */
export const __DEV_UNLOCK_PREMIUM__ = false;

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

interface SubscriptionRow {
  plan: string;
  status: string;
}

/**
 * Hook React qui détermine si l'utilisateur courant est Premium.
 * Lit la session depuis useAuthStore et interroge la table `subscriptions`.
 *
 * - `__DEV_UNLOCK_PREMIUM__ = true` court-circuite tout (QA / TestFlight local).
 * - Sinon : isPremium = ligne existante avec plan='premium' AND status IN ('active','trialing').
 */
export function usePremium(): { isPremium: boolean; isLoading: boolean } {
  const userId = useAuthStore((s) => s.session?.user?.id ?? null);

  const query = useQuery({
    queryKey: ['subscription', userId],
    queryFn: async (): Promise<SubscriptionRow | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) return null;
      return data as SubscriptionRow | null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  if (__DEV_UNLOCK_PREMIUM__) return { isPremium: true, isLoading: false };

  const sub = query.data;
  const isPremium =
    !!sub &&
    sub.plan === 'premium' &&
    (sub.status === 'active' || sub.status === 'trialing');
  return { isPremium, isLoading: query.isLoading };
}
