/**
 * Premium gate — système 2 tiers : Premium (8 features) + Expert (9 features).
 *
 * Source de vérité : table `subscriptions` (D1 validée).
 * Trialing compte comme actif (D2 validée).
 *
 * Hiérarchie : free (0) < premium (1) < expert (2).
 * Un utilisateur Expert accède à TOUTES les features Premium (héritage hiérarchique).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Flag de développement pour tester l'app en mode Expert (top tier) sans abonnement actif.
 * Mettre à `true` UNIQUEMENT en local pour QA TestFlight.
 * NE JAMAIS commit à `true`.
 */
export const __DEV_UNLOCK_PREMIUM__ = false;

export type SubscriptionTier = 'free' | 'premium' | 'expert';

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  premium: 1,
  expert: 2,
};

export type PremiumFeatureKey =
  // Premium tier (8)
  | 'store_full_ranking'
  | 'store_comparison'
  | 'smart_alternatives'
  | 'unlimited_history'
  | 'food_journal'
  | 'advanced_stats'
  | 'export_data'
  | 'priority_support'
  // Expert tier (9)
  | 'plant_database'
  | 'herbal_remedies'
  | 'plant_alternatives'
  | 'cosmetic_actives'
  | 'pregnancy_safety'
  | 'children_safety'
  | 'interaction_warnings'
  | 'expert_articles'
  | 'expert_consultation';

export const FEATURE_TIER: Record<PremiumFeatureKey, SubscriptionTier> = {
  // Premium (8)
  store_full_ranking: 'premium',
  store_comparison: 'premium',
  smart_alternatives: 'premium',
  unlimited_history: 'premium',
  food_journal: 'premium',
  advanced_stats: 'premium',
  export_data: 'premium',
  priority_support: 'premium',
  // Expert (9)
  plant_database: 'expert',
  herbal_remedies: 'expert',
  plant_alternatives: 'expert',
  cosmetic_actives: 'expert',
  pregnancy_safety: 'expert',
  children_safety: 'expert',
  interaction_warnings: 'expert',
  expert_articles: 'expert',
  expert_consultation: 'expert',
};

export interface PremiumFeatureDef {
  labelFr: string;
  descriptionFr: string;
  freeLimit: number;
}

export const PREMIUM_FEATURES: Record<PremiumFeatureKey, PremiumFeatureDef> = {
  // Premium (8)
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
  unlimited_history: {
    labelFr: 'Historique illimité',
    descriptionFr:
      "Conservez l'intégralité de votre historique de scans sans limite de durée.",
    freeLimit: 0,
  },
  food_journal: {
    labelFr: 'Journal alimentaire',
    descriptionFr:
      'Suivez vos repas et analysez votre nutrition au fil du temps.',
    freeLimit: 0,
  },
  advanced_stats: {
    labelFr: 'Statistiques avancées',
    descriptionFr:
      'Tableaux de bord détaillés sur votre consommation et vos progrès.',
    freeLimit: 0,
  },
  export_data: {
    labelFr: 'Export de données',
    descriptionFr:
      'Exportez votre historique et vos statistiques en CSV ou PDF.',
    freeLimit: 0,
  },
  priority_support: {
    labelFr: 'Support prioritaire',
    descriptionFr: 'Réponse sous 24h par email pour toute question.',
    freeLimit: 0,
  },

  // Expert (9)
  plant_database: {
    labelFr: 'Base de données plantes médicinales',
    descriptionFr:
      'Accès à plus de 200 plantes avec usages, dosages et précautions sourcés EFSA/EMA/ANSM.',
    freeLimit: 0,
  },
  herbal_remedies: {
    labelFr: 'Remèdes naturels par symptôme',
    descriptionFr:
      'Suggestions de remèdes traditionnels validés par les agences de santé européennes.',
    freeLimit: 0,
  },
  plant_alternatives: {
    labelFr: 'Alternatives plantes aux médicaments',
    descriptionFr:
      "Suggestions d'alternatives naturelles avec niveau de preuve scientifique.",
    freeLimit: 0,
  },
  cosmetic_actives: {
    labelFr: 'Analyse des actifs cosmétiques',
    descriptionFr:
      'Décryptage des INCI et des actifs réellement efficaces vs marketing.',
    freeLimit: 0,
  },
  pregnancy_safety: {
    labelFr: 'Sécurité grossesse renforcée',
    descriptionFr:
      'Alertes spécifiques grossesse sur additifs, plantes et cosmétiques contre-indiqués.',
    freeLimit: 0,
  },
  children_safety: {
    labelFr: 'Sécurité enfants & nourrissons',
    descriptionFr: 'Filtrage adapté aux moins de 3 ans avec sources ANSES.',
    freeLimit: 0,
  },
  interaction_warnings: {
    labelFr: 'Interactions plantes-médicaments',
    descriptionFr:
      'Détection des interactions à risque (millepertuis, pamplemousse, etc.) sourcée ANSM.',
    freeLimit: 0,
  },
  expert_articles: {
    labelFr: 'Articles experts mensuels',
    descriptionFr:
      'Dossiers approfondis rédigés par des pharmaciens et nutritionnistes.',
    freeLimit: 0,
  },
  expert_consultation: {
    labelFr: 'Consultation expert (1/an)',
    descriptionFr:
      'Une consultation visio par an avec un pharmacien spécialisé phytothérapie.',
    freeLimit: 0,
  },
};

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

interface SubscriptionRow {
  plan: string;
  status: string;
}

/**
 * Mappe une ligne `subscriptions` brute → tier effectif.
 * - status non-actif (canceled, past_due, expired, etc.) → 'free'
 * - plan non reconnu → 'free'
 */
function subscriptionRowToTier(
  row: SubscriptionRow | null | undefined,
): SubscriptionTier {
  if (!row) return 'free';
  if (!ACTIVE_STATUSES.has(row.status)) return 'free';
  if (row.plan === 'expert') return 'expert';
  if (row.plan === 'premium') return 'premium';
  return 'free';
}

/**
 * Source de vérité tier — async lookup côté serveur.
 * Si `__DEV_UNLOCK_PREMIUM__ = true` → renvoie 'expert' (top tier) pour tout débloquer.
 * Si pas d'userId → 'free'.
 */
export async function getUserTier(
  userId: string | null | undefined,
): Promise<SubscriptionTier> {
  if (__DEV_UNLOCK_PREMIUM__) return 'expert';
  if (!userId) return 'free';

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return 'free';
    return subscriptionRowToTier(data as SubscriptionRow);
  } catch {
    return 'free';
  }
}

/**
 * Backward-compat alias : `true` pour Premium ET Expert.
 */
export async function isPremiumUser(
  userId: string | null | undefined,
): Promise<boolean> {
  return (await getUserTier(userId)) !== 'free';
}

/**
 * Vérifie l'accès à une feature compte tenu du tier de l'utilisateur.
 * Hiérarchie : Expert (2) > Premium (1) > Free (0).
 * Un Expert accède à toutes les features Premium.
 */
export function canAccessFeature(
  tier: SubscriptionTier,
  key: PremiumFeatureKey,
): boolean {
  return TIER_HIERARCHY[tier] >= TIER_HIERARCHY[FEATURE_TIER[key]];
}

/**
 * Limite gratuite pour une feature donnée.
 * Tout tier payant (premium, expert) → Infinity.
 * Free → valeur du catalogue.
 */
export function getFeatureLimit(
  tier: SubscriptionTier,
  key: PremiumFeatureKey,
): number {
  if (tier !== 'free') return Infinity;
  return PREMIUM_FEATURES[key].freeLimit;
}

export interface UsePremiumResult {
  tier: SubscriptionTier;
  isPremium: boolean;
  isExpert: boolean;
  isLoading: boolean;
  canAccess: (key: PremiumFeatureKey) => boolean;
}

/**
 * Hook React qui détermine le tier de l'utilisateur courant.
 * Lit la session depuis useAuthStore et interroge la table `subscriptions`.
 *
 * - `__DEV_UNLOCK_PREMIUM__ = true` court-circuite (tier = 'expert').
 * - Sinon : tier dérivé de {plan, status} via subscriptionRowToTier.
 *
 * Backward-compat : `isPremium` reste exposé (true pour premium ET expert).
 */
export function usePremium(): UsePremiumResult {
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

  if (__DEV_UNLOCK_PREMIUM__) {
    return {
      tier: 'expert',
      isPremium: true,
      isExpert: true,
      isLoading: false,
      canAccess: () => true,
    };
  }

  const tier = subscriptionRowToTier(query.data);
  return {
    tier,
    isPremium: tier !== 'free',
    isExpert: tier === 'expert',
    isLoading: query.isLoading,
    canAccess: (key: PremiumFeatureKey) => canAccessFeature(tier, key),
  };
}
