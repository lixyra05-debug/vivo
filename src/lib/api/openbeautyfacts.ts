import { supabase } from './supabase';
import type { CosmeticProduct, CosmeticScoringInput } from './types';
import { fetchWithTimeout, FetchTimeoutError } from './fetch-with-timeout';
import { normalizeOBFProduct, type OBFProduct } from './obf-normalize';
import {
  normalizePackagings,
  type PackagingComponent,
} from '@/src/data/packaging-risks';

const OBF_BASE = 'https://world.openbeautyfacts.org/api/v2';
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

function isCacheStale(product: CosmeticProduct): boolean {
  const updated = product.updated_at ? new Date(product.updated_at).getTime() : 0;
  return Date.now() - updated > CACHE_TTL_MS;
}

async function writeCosmeticToCache(product: CosmeticProduct): Promise<CosmeticProduct> {
  const { data, error } = await supabase
    .from('cosmetic_products')
    .upsert(product, { onConflict: 'barcode' })
    .select()
    .maybeSingle();
  if (error) return product;
  return (data as CosmeticProduct) ?? product;
}

export async function getOrFetchCosmetic(barcode: string): Promise<CosmeticProduct | null> {
  const cached = await readCosmeticFromCache(barcode);
  if (cached && !isCacheStale(cached)) return cached;

  const obf = await fetchCosmeticByBarcode(barcode);
  if (!obf) return cached ?? null;

  const normalized = normalizeOBFProduct(obf);
  if (cached) {
    normalized.scan_count = cached.scan_count;
    normalized.created_at = cached.created_at;
  }
  return writeCosmeticToCache(normalized);
}

export function cosmeticToScoringInput(product: CosmeticProduct): CosmeticScoringInput {
  return {
    barcode: product.barcode,
    ingredients_inci: product.ingredients_inci ?? '',
    ingredients_list: product.ingredients_list ?? [],
    category: product.category ?? null,
  };
}
