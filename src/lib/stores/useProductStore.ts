import { create } from 'zustand';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { fetchCachedProducts, getOrFetchProduct } from '../api/openfoodfacts';
import type { Product } from '../api/types';
import { error as logError } from '../utils/logger';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

export interface ScanHistoryRow {
  id: string;
  user_id: string;
  barcode: string;
  score_at_scan: number;
  profile_used: string;
  penalties_snapshot: unknown;
  is_favorite: boolean;
  scanned_at: string;
  product_type: 'food' | 'cosmetic';
  product: Product | null;
}

export interface UserStats {
  total: number;
  unique: number;
  avg: number;
  bad: number;
}

interface ProductState {
  lastScanned: Product | null;
  setLastScanned: (product: Product | null) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  lastScanned: null,
  setLastScanned: (lastScanned) => set({ lastScanned }),
}));

export function useProduct(barcode: string | null | undefined) {
  return useQuery({
    queryKey: ['product', barcode] as const,
    queryFn: () => (barcode ? getOrFetchProduct(barcode) : Promise.resolve(null)),
    enabled: Boolean(barcode),
    staleTime: SEVEN_DAYS_MS,
    gcTime: SEVEN_DAYS_MS,
  });
}

export interface UseScanHistoryOptions {
  userId: string | undefined;
  limit?: number;
  onlyFavorites?: boolean;
}

export function useScanHistory({ userId, limit, onlyFavorites = false }: UseScanHistoryOptions) {
  return useQuery({
    queryKey: ['scan_history', userId, limit ?? null, onlyFavorites] as const,
    queryFn: async (): Promise<ScanHistoryRow[]> => {
      if (!userId) return [];
      // Lecture en deux temps (lot H) : la jointure `product:products(*)`
      // exigeait une clé étrangère que la migration 012 a supprimée — PostgREST
      // la refusait, et l'historique s'affichait vide.
      let query = supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false });
      if (onlyFavorites) query = query.eq('is_favorite', true);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<Omit<ScanHistoryRow, 'product'>>;
      // Seuls les aliments ont une fiche dans `products` : un cosmétique garde
      // `product: null`, comme un aliment absent du cache.
      const products = await fetchCachedProducts<Product>(
        rows.filter((r) => r.product_type !== 'cosmetic').map((r) => r.barcode),
        '*',
      );
      return rows.map((r) => ({
        ...r,
        product: r.product_type === 'cosmetic' ? null : (products.get(r.barcode) ?? null),
      }));
    },
    enabled: Boolean(userId),
    staleTime: ONE_MINUTE_MS,
  });
}

export function useToggleFavorite(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { barcode: string; next: boolean }) => {
      if (!userId) throw new Error('Non authentifié');
      const { error } = await supabase
        .from('scan_history')
        .update({ is_favorite: vars.next })
        .eq('user_id', userId)
        .eq('barcode', vars.barcode);
      if (error) throw error;
      return vars;
    },
    onMutate: async ({ barcode, next }) => {
      await queryClient.cancelQueries({ queryKey: ['scan_history'] });
      const snapshots = queryClient.getQueriesData<ScanHistoryRow[]>({
        queryKey: ['scan_history'],
      });
      snapshots.forEach(([key, rows]) => {
        if (!rows) return;
        const mutated = rows
          .map((r) => (r.barcode === barcode ? { ...r, is_favorite: next } : r))
          .filter((r) => {
            const keyOnlyFavorites = Array.isArray(key) && key[3] === true;
            if (!keyOnlyFavorites) return true;
            return r.is_favorite;
          });
        queryClient.setQueryData(key, mutated);
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, rows]) => queryClient.setQueryData(key, rows));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['scan_history'] });
    },
  });
}

export type ScanProductType = 'food' | 'cosmetic';

export interface RecordScanInput {
  barcode: string;
  score: number;
  profile: string;
  penalties: unknown;
  /** Type de produit scanné. Défaut 'food' pour rétrocompatibilité. */
  productType?: ScanProductType;
}

export interface ScanInsertPayload {
  user_id: string;
  barcode: string;
  score_at_scan: number;
  profile_used: string;
  penalties_snapshot: unknown;
  product_type: ScanProductType;
}

/**
 * Construit le payload d'insertion scan_history.
 * Extrait pour testabilité — la colonne `product_type` est NOT NULL côté DB
 * (migration 010_gamification.sql), donc défaut 'food' obligatoire.
 */
export function buildScanInsertPayload(
  userId: string,
  input: RecordScanInput,
): ScanInsertPayload {
  return {
    user_id: userId,
    barcode: input.barcode,
    score_at_scan: input.score,
    profile_used: input.profile,
    penalties_snapshot: input.penalties,
    product_type: input.productType ?? 'food',
  };
}

/**
 * Code d'erreur de la base (PostgreSQL ou PostgREST : `23503`, `42501`,
 * `PGRST204`…). `null` quand postgrest-js n'en rend pas — panne réseau, requête
 * abandonnée, réponse illisible : il les rend en erreur à `code: ''` au lieu de
 * les lever.
 */
function databaseErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const { code } = error as { code?: unknown };
  return typeof code === 'string' && code.length > 0 ? code : null;
}

export function useRecordScan(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecordScanInput) => {
      if (!userId) return null;
      const { error } = await supabase
        .from('scan_history')
        .insert(buildScanInsertPayload(userId, input));
      if (error) throw error;
      return true;
    },
    // Aucun nouvel essai : l'insertion n'est pas idempotente — si la réponse se
    // perd après l'écriture, un second essai doublerait le scan.
    retry: false,
    // Un enregistrement refusé ne passe plus inaperçu (lot H) : il est journalisé
    // (Sentry hors dev), sans le code-barres ni le message de la base — son détail
    // peut citer la valeur (« Key (barcode)=(…) »), et le filtre R8 de
    // `beforeSend` ne lit que `message` et l'URL, pas une exception.
    onError: (error, input) => {
      logError(new Error('Enregistrement du scan refusé'), {
        code: databaseErrorCode(error) ?? 'sans_code',
        productType: input.productType ?? 'food',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['scan_history'] });
      void queryClient.invalidateQueries({ queryKey: ['user_stats', userId] });
    },
  });
}

export function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['user_stats', userId] as const,
    queryFn: async (): Promise<UserStats> => {
      if (!userId) return { total: 0, unique: 0, avg: 0, bad: 0 };
      const { data, error } = await supabase
        .from('scan_history')
        .select('barcode, score_at_scan')
        .eq('user_id', userId);
      if (error) throw error;
      const rows = (data ?? []) as Array<{ barcode: string; score_at_scan: number }>;
      const total = rows.length;
      if (total === 0) return { total: 0, unique: 0, avg: 0, bad: 0 };
      const unique = new Set(rows.map((r) => r.barcode)).size;
      const avg = Math.round(rows.reduce((acc, r) => acc + r.score_at_scan, 0) / total);
      const bad = rows.filter((r) => r.score_at_scan < 50).length;
      return { total, unique, avg, bad };
    },
    enabled: Boolean(userId),
    staleTime: ONE_MINUTE_MS,
  });
}

/**
 * Route de la fiche d'une ligne d'historique : un cosmétique ouvre la fiche
 * cosmétique. Sans `type`, la route ouvrait la fiche alimentaire.
 */
export function scanProductRoute(
  row: Pick<ScanHistoryRow, 'barcode' | 'product_type'>,
): `/product/${string}?type=${ScanProductType}` {
  return `/product/${row.barcode}?type=${row.product_type === 'cosmetic' ? 'cosmetic' : 'food'}`;
}

export function dedupeByBarcode(rows: ScanHistoryRow[]): ScanHistoryRow[] {
  const seen = new Set<string>();
  const out: ScanHistoryRow[] = [];
  for (const row of rows) {
    if (seen.has(row.barcode)) continue;
    seen.add(row.barcode);
    out.push(row);
  }
  return out;
}
