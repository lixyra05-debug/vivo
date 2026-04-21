import { supabase } from './supabase';
import type { CosmeticProduct, CosmeticScoringInput } from './types';

const OBF_BASE = 'https://world.openbeautyfacts.org/api/v2';
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface OBFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  image_ingredients_url?: string;
  ingredients_text?: string;
  categories_tags?: string[];
}

export async function fetchCosmeticByBarcode(barcode: string): Promise<OBFProduct | null> {
  const res = await fetch(`${OBF_BASE}/product/${barcode}.json`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1) return null;
  return data.product as OBFProduct;
}

function parseIngredientsList(inci: string): string[] {
  if (!inci) return [];
  const tokens = inci
    .split(/[,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const token of tokens) {
    if (!seen.has(token)) {
      seen.add(token);
      result.push(token);
    }
  }
  return result;
}

function extractPrimaryCategory(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  const first = tags[0];
  const idx = first.indexOf(':');
  return idx >= 0 ? first.slice(idx + 1) : first;
}

export function normalizeOBFProduct(obf: OBFProduct): CosmeticProduct {
  const now = new Date().toISOString();
  const inci = obf.ingredients_text ?? '';
  return {
    barcode: obf.code,
    name: obf.product_name ?? null,
    brand: obf.brands ?? null,
    image_url: obf.image_url ?? null,
    ingredients_inci: inci,
    ingredients_list: parseIngredientsList(inci),
    category: extractPrimaryCategory(obf.categories_tags),
    image_ingredients_url: obf.image_ingredients_url ?? null,
    obf_last_updated: now,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: now,
    updated_at: now,
  };
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
