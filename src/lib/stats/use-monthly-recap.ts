/**
 * Hook React Query pour le récap mensuel.
 *
 * Charge les scans du mois cible depuis `scan_history`, puis le nom et la
 * marque des aliments par une seconde lecture de `products` (la jointure
 * PostgREST n'a plus de clé étrangère depuis la migration 012), et calcule le
 * récap via `calculateMonthlyRecap`.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/api/supabase';
import { fetchCachedProducts } from '@/src/lib/api/openfoodfacts';
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
}

interface ProductNameRow {
  barcode: string;
  name: string | null;
  brand: string | null;
}

export interface UseMonthlyRecapResult {
  recap: MonthlyRecap | null;
  isLoading: boolean;
  /** Lecture en échec, rien en cache : à ne pas confondre avec un mois sans scan (lot H). */
  isError: boolean;
  refetch: () => void;
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
        .select('barcode, score_at_scan, scanned_at, product_type, is_favorite')
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

      const products = await fetchCachedProducts<ProductNameRow>(
        rows.filter((row) => row.product_type !== 'cosmetic').map((row) => row.barcode),
        'barcode, name, brand',
      );
      const lookup: Record<string, ProductLookupEntry> = {};
      for (const [barcode, product] of products) {
        lookup[barcode] = { name: product.name ?? null, brand: product.brand ?? null };
      }

      return { scans, lookup };
    },
    enabled: Boolean(userId),
    staleTime: FIVE_MINUTES_MS,
  });

  const refetch = (): void => {
    void query.refetch();
  };

  if (!userId) {
    return { recap: null, isLoading: false, isError: false, refetch };
  }

  if (!query.data) {
    return { recap: null, isLoading: query.isLoading, isError: query.isError, refetch };
  }

  const recap = calculateMonthlyRecap(query.data.scans, year, month, {
    productLookup: query.data.lookup,
  });

  return { recap, isLoading: query.isLoading, isError: false, refetch };
}
