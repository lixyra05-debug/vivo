/**
 * Hooks React Query pour la gestion des badges utilisateur.
 *
 * - useUserBadges : SELECT * FROM user_badges WHERE user_id = userId
 * - useGrantBadges : INSERT (upsert avec onConflict pour silencer le UNIQUE constraint)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/src/lib/api/supabase';

export interface UserBadgeRow {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

const ONE_MINUTE_MS = 60 * 1000;

export function useUserBadges(
  userId: string | undefined,
): UseQueryResult<UserBadgeRow[]> {
  return useQuery({
    queryKey: ['user_badges', userId] as const,
    queryFn: async (): Promise<UserBadgeRow[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return (data ?? []) as UserBadgeRow[];
    },
    enabled: Boolean(userId),
    staleTime: ONE_MINUTE_MS,
  });
}

export function useGrantBadges(
  userId: string | undefined,
): UseMutationResult<void, Error, string[]> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string[]>({
    mutationFn: async (badgeIds: string[]) => {
      if (!userId || badgeIds.length === 0) return;
      const rows = badgeIds.map((badge_id) => ({
        user_id: userId,
        badge_id,
      }));
      // upsert avec onConflict pour silencer le UNIQUE (user_id, badge_id)
      const { error } = await supabase
        .from('user_badges')
        .upsert(rows, { onConflict: 'user_id,badge_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user_badges', userId] });
    },
  });
}

/**
 * Hook minimal pour le nombre de signalements envoyés par l'utilisateur.
 * Sert au calcul des badges (engagement → detective).
 */
export function useUserReportCount(
  userId: string | undefined,
): UseQueryResult<number> {
  return useQuery({
    queryKey: ['user_report_count', userId] as const,
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('product_reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) return 0;
      return typeof count === 'number' ? count : 0;
    },
    enabled: Boolean(userId),
    staleTime: ONE_MINUTE_MS,
  });
}
