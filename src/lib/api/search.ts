import type { SearchFilters, SearchResult } from './types';
import { fetchWithTimeout, FetchTimeoutError } from './fetch-with-timeout';

const OFF_SEARCH_BASE = 'https://fr.openfoodfacts.org/api/v2/search';
const OBF_SEARCH_BASE = 'https://world.openbeautyfacts.org/api/v2/search';
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';

const PAGE_SIZE = 24;
const CATEGORY_PAGE_SIZE = 50;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 50;

interface CacheEntry {
  ts: number;
  data: SearchResult[];
}

const cache: Map<string, CacheEntry> = new Map();

function cacheGet(key: string): SearchResult[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: SearchResult[]): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { ts: Date.now(), data });
}

export function clearSearchCache(): void {
  cache.clear();
}

interface RawItem {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
}

function itemToResult(item: RawItem, type: 'food' | 'cosmetic'): SearchResult | null {
  if (!item.code) return null;
  return {
    barcode: item.code,
    name: item.product_name ?? null,
    brand: item.brands ?? null,
    image_url: item.image_url ?? null,
    type,
  };
}

async function queryEndpoint(
  url: string,
  type: 'food' | 'cosmetic'
): Promise<SearchResult[]> {
  try {
    const res = await fetchWithTimeout(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const products: RawItem[] = Array.isArray(data?.products) ? data.products : [];
    const results: SearchResult[] = [];
    for (const p of products) {
      const r = itemToResult(p, type);
      if (r) results.push(r);
    }
    return results;
  } catch (err) {
    if (err instanceof FetchTimeoutError) return [];
    return [];
  }
}

function dedupeByBarcode(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of results) {
    if (seen.has(r.barcode)) continue;
    seen.add(r.barcode);
    out.push(r);
  }
  return out;
}

function buildSearchUrl(base: string, query: string): string {
  const params = new URLSearchParams({
    search_terms: query,
    fields: 'code,product_name,brands,image_url',
    page_size: String(PAGE_SIZE),
    page: '1',
  });
  return `${base}?${params.toString()}`;
}

export async function searchProducts(filters: SearchFilters): Promise<SearchResult[]> {
  const query = filters.query.trim();
  if (!query) return [];

  const cacheKey = `search:${filters.type}:${query.toLowerCase()}`;
  const hit = cacheGet(cacheKey);
  if (hit) return hit;

  const promises: Array<Promise<SearchResult[]>> = [];
  if (filters.type === 'food' || filters.type === 'all') {
    promises.push(queryEndpoint(buildSearchUrl(OFF_SEARCH_BASE, query), 'food'));
  }
  if (filters.type === 'cosmetic' || filters.type === 'all') {
    promises.push(queryEndpoint(buildSearchUrl(OBF_SEARCH_BASE, query), 'cosmetic'));
  }

  const chunks = await Promise.all(promises);
  const merged = dedupeByBarcode(chunks.flat());
  cacheSet(cacheKey, merged);
  return merged;
}

function buildCategoryUrl(base: string, tag: string): string {
  const params = new URLSearchParams({
    categories_tags: tag,
    fields: 'code,product_name,brands,image_url',
    page_size: String(CATEGORY_PAGE_SIZE),
    page: '1',
  });
  return `${base}?${params.toString()}`;
}

export async function searchByCategory(
  slug: string,
  type: 'food' | 'cosmetic'
): Promise<SearchResult[]> {
  const cacheKey = `cat:${type}:${slug}`;
  const hit = cacheGet(cacheKey);
  if (hit) return hit;

  const base = type === 'food' ? OFF_SEARCH_BASE : OBF_SEARCH_BASE;
  const results = await queryEndpoint(buildCategoryUrl(base, slug), type);
  const deduped = dedupeByBarcode(results);
  cacheSet(cacheKey, deduped);
  return deduped;
}
