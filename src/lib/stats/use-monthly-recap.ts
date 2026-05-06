/**
 * Hook React Query pour le récap mensuel.
 *
 * Charge les scans du mois cible depuis `scan_history` (jointure produits pour
 * récupérer name/brand) puis calcule le récap via `calculateMonthlyRecap`.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/api/supabase';
import {
  calculateMonthlyRecap,
  type MonthlyRecap,
  type ProductLookupEntry,
} from './monthly-recap';
import type { ScanRecord } from '../gamification/types';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

interface ScanHistoryRowMin {
  barcode: string;
  score_at_scan: number;
  scanned_at: string;
  product_type?: 'food' | 'cosmetic' | null;
  is_favorite?: boolean | null;
  product?: {
    name?: string | null;
    brand?: string | null;
  } | null;
}

export interface UseMonthlyRecapResult {
  recap: MonthlyRecap | null;
  isLoading: boolean;
}

/**
 * Charge tous les scans du mois cible (Europe/Paris ≈ UTC bounds) puis calcule
 * le récap. Renvoie `null` tant qu'il n'y a pas d'utilisateur connecté.
 */
export function useMonthlyRecap(
  userId: string | null,
  year: number,
  month: number,
): UseMonthlyRecapResult {
  const query = useQuery({
    queryKey: ['monthly-recap', userId, year, month] as const,
    queryFn: async (): Promise<{
      scans: ScanRecord[];
      lookup: Record<string, ProductLookupEntry>;
    }> => {
      if (!userId) return { scans: [], lookup: {} };

      // Bornes UTC : approximation Europe/Paris (suffisante car le calculateur
      // refiltrera scan-par-scan en fuseau Paris).
      const startUtc = new Date(Date.UTC(year, month, 1));
      const endUtc = new Date(Date.UTC(year, month + 1, 1));

      const { data, error } = await supabase
        .from('scan_history')
        .select('barcode, score_at_scan, scanned_at, product_type, is_favorite, product:products(name, brand)')
        .eq('user_id', userId)
        .gte('scanned_at', startUtc.toISOString())
        .lt('scanned_at', endUtc.toISOString());

      if (error) throw error;

      const rows = (data ?? []) as unknown as ScanHistoryRowMin[];
      const scans: ScanRecord[] = rows.map((row) => ({
        barcode: row.barcode,
        score_at_scan: row.score_at_scan,
        scanned_at: row.scanned_at,
        product_type: row.product_type ?? 'food',
        is_favorite: Boolean(row.is_favorite),
        category_slug: null,
      }));

      const lookup: Record<string, ProductLookupEntry> = {};
      for (const row of rows) {
        if (row.product) {
          lookup[row.barcode] = {
            name: row.product.name ?? null,
            brand: row.product.brand ?? null,
          };
        }
      }

      return { scans, lookup };
    },
    enabled: Boolean(userId),
    staleTime: FIVE_MINUTES_MS,
  });

  if (!userId) {
    return { recap: null, isLoading: false };
  }

  if (!query.data) {
    return { recap: null, isLoading: query.isLoading };
  }

  const recap = calculateMonthlyRecap(query.data.scans, year, month, {
    productLookup: query.data.lookup,
  });

  return { recap, isLoading: query.isLoading };
}
