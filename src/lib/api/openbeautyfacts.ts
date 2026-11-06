import { supabase } from './supabase';
import type { CosmeticProduct, CosmeticScoringInput } from './types';
import { fetchWithTimeout, FetchTimeoutError } from './fetch-with-timeout';
import { normalizeOBFProduct, type OBFProduct } from './obf-normalize';
import { CLIENT_CLOCK_SKEW_MS, isCacheFresh } from './cache-refresh-rules';
import { requestCacheRefresh, type CacheReadOptions } from './cache-refresh';
import {
  normalizePackagings,
  type PackagingComponent,
} from '@/src/data/packaging-risks';

const OBF_BASE = 'https://world.openbeautyfacts.org/api/v2';
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';

// La normalisation vit dans `obf-normalize.ts`, que l'Edge Function
// `cache-product` importe aussi (lot C) ; réexportée pour les appelants.
export { normalizeOBFProduct, type OBFProduct };

export async function fetchCosmeticByBarcode(barcode: string): Promise<OBFProduct | null> {
  try {
    const res = await fetchWithTimeout(`${OBF_BASE}/product/${barcode}.json`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1) return null;
    return data.product as OBFProduct;
  } catch (err) {
    if (err instanceof FetchTimeoutError) return null;
    throw err;
  }
}

/**
 * Récupère les composants d'emballage OBF (`packagings[]`). Même contrat que
 * `fetchProductPackagings` côté OFF : aucun repli sur `packaging_tags`, la
 * section disparaît si la donnée structurée est absente.
 */
export async function fetchCosmeticPackagings(
  barcode: string,
): Promise<PackagingComponent[]> {
  try {
    const url = `${OBF_BASE}/product/${barcode}.json?fields=packagings`;
    const res = await fetchWithTimeout(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 1) return [];
    return normalizePackagings(data.product?.packagings);
  } catch {
    return [];
  }
}

async function readCosmeticFromCache(barcode: string): Promise<CosmeticProduct | null> {
  const { data, error } = await supabase
    .from('cosmetic_products')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle();
  if (error || !data) return null;
  return data as CosmeticProduct;
}

/**
 * La fiche d'un cosmétique : le cache s'il est frais, sinon une relecture d'OBF.
 * Même règle que `getOrFetchProduct` : seul le serveur écrit (lot C).
 */
export async function getOrFetchCosmetic(
  barcode: string,
  options: CacheReadOptions = {},
): Promise<CosmeticProduct | null> {
  const cached = await readCosmeticFromCache(barcode);
  if (cached && isCacheFresh(cached.updated_at, Date.now(), CLIENT_CLOCK_SKEW_MS)) return cached;

  if (options.refresh !== false) {
    const refreshed = await requestCacheRefresh<CosmeticProduct>(barcode, 'cosmetic');
    if (refreshed.kind === 'product') return refreshed.product;
  }

  const obf = await fetchCosmeticByBarcode(barcode);
  if (!obf) return cached ?? null;
  return normalizeOBFProduct(obf);
}

export function cosmeticToScoringInput(product: CosmeticProduct): CosmeticScoringInput {
  return {
    barcode: product.barcode,
    ingredients_inci: product.ingredients_inci ?? '',
    ingredients_list: product.ingredients_list ?? [],
    category: product.category ?? null,
  };
}
