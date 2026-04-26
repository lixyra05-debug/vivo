import { useQuery } from '@tanstack/react-query';
import { isPremiumUser } from '../premium/premium-gate';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export interface UsePremiumResult {
  isPremium: boolean;
  isLoading: boolean;
}

export function usePremium(userId: string | null | undefined): UsePremiumResult {
  const enabled = Boolean(userId);
  const query = useQuery({
    queryKey: ['premium_status', userId] as const,
    queryFn: () => isPremiumUser(userId),
    enabled,
    staleTime: FIVE_MINUTES_MS,
  });

  return {
    isPremium: enabled ? query.data === true : false,
    isLoading: enabled ? query.isLoading : false,
  };
}
