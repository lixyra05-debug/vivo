import { useQuery } from '@tanstack/react-query';
import {
  getUserTier,
  canAccessFeature,
  type SubscriptionTier,
  type PremiumFeatureKey,
} from '../premium/premium-gate';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export interface UsePremiumResult {
  tier: SubscriptionTier;
  isPremium: boolean;
  isExpert: boolean;
  isLoading: boolean;
  canAccess: (key: PremiumFeatureKey) => boolean;
}

export function usePremium(userId: string | null | undefined): UsePremiumResult {
  const enabled = Boolean(userId);
  const query = useQuery({
    queryKey: ['premium_status', userId] as const,
    queryFn: () => getUserTier(userId),
    enabled,
    staleTime: FIVE_MINUTES_MS,
  });

  if (!enabled) {
    return {
      tier: 'free',
      isPremium: false,
      isExpert: false,
      isLoading: false,
      canAccess: () => false,
    };
  }

  const tier: SubscriptionTier = query.data ?? 'free';
  return {
    tier,
    isPremium: tier !== 'free',
    isExpert: tier === 'expert',
    isLoading: query.isLoading,
    canAccess: (key: PremiumFeatureKey) => canAccessFeature(tier, key),
  };
}
