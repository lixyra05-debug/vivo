/**
 * Smart alternatives — Premium feature : suggère 3 produits mieux notés
 * dans la même catégorie OFF que le produit scanné.
 *
 * Source : Open Food Facts API v2 (categories_tags + nutrition_grades_tags).
 * Tri : proxy Nutri-Score, popularity_key en secondaire.
 * Cache : LRU 10 min, max 100 entrées.
 */

import { nutriScoreToProxy } from './store-ranking';

const OFF_SEARCH_BASE = 'https://world.openfoodfacts.org/api/v2/search';
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';
const PAGE_SIZE = 20;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const CACHE_MAX_ENTRIES = 100;
const MAX_ALTERNATIVES = 3;

export interface AlternativeProduct {
  barcode: string;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  grade: string;
  proxyScore: number;
  scoreDelta: number;
}

interface CacheEntry {
  ts: number;
  data: AlternativeProduct[];
}

const cache: Map<string, CacheEntry> = new Map();

export function clearAlternativesCache(): void {
  cache.clear();
}

function cacheGet(key: string): AlternativeProduct[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: AlternativeProduct[]): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { ts: Date.now(), data });
}

interface RawProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutrition_grades?: string;
}

function buildUrl(categoryTag: string): string {
  const params = new URLSearchParams({
    categories_tags: categoryTag,
    countries_tags: 'france',
    nutrition_grades_tags: 'a,b,c',
    fields: 'code,product_name,brands,image_url,nutrition_grades',
    page_size: String(PAGE_SIZE),
    page: '1',
    sort_by: 'popularity_key',
  });
  return `${OFF_SEARCH_BASE}?${params.toString()}`;
}

export async function findAlternatives(
  scannedBarcode: string,
  categoryTag: string | null | undefined,
  currentScore: number,
): Promise<AlternativeProduct[]> {
  if (!categoryTag) return [];

  const cacheKey = `${scannedBarcode}::${categoryTag}::${currentScore}`;
  const hit = cacheGet(cacheKey);
  if (hit) return hit;

  let products: RawProduct[] = [];
  try {
    const res = await fetch(buildUrl(categoryTag), {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return [];
    const data = await res.json();
    products = Array.isArray(data?.products) ? data.products : [];
  } catch {
    return [];
  }

  const alternatives: AlternativeProduct[] = [];
  for (const p of products) {
    if (!p.code || p.code === scannedBarcode) continue;
    const proxy = nutriScoreToProxy(p.nutrition_grades);
    if (proxy === null) continue;
    if (proxy <= currentScore) continue;
    alternatives.push({
      barcode: p.code,
      name: p.product_name ?? null,
      brand: p.brands ?? null,
      imageUrl: p.image_url ?? null,
      grade: (p.nutrition_grades ?? '').toLowerCase(),
      proxyScore: proxy,
      scoreDelta: proxy - currentScore,
    });
  }

  alternatives.sort((a, b) => b.scoreDelta - a.scoreDelta);
  const top = alternatives.slice(0, MAX_ALTERNATIVES);
  cacheSet(cacheKey, top);
  return top;
}
