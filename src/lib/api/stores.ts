import type { SearchResult, StoreDef } from './types';

const OFF_SEARCH_BASE = 'https://fr.openfoodfacts.org/api/v2/search';
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';

const PAGE_SIZE = 24;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 30;

// === Référentiel des 10 enseignes françaises (source de vérité TS) ===
export const STORES: StoreDef[] = [
  { slug: 'carrefour', nameFr: 'Carrefour', emoji: '🟥', country: 'FR', offStoreTag: 'carrefour', displayOrder: 0 },
  { slug: 'leclerc', nameFr: 'E.Leclerc', emoji: '🔵', country: 'FR', offStoreTag: 'leclerc', displayOrder: 1 },
  { slug: 'auchan', nameFr: 'Auchan', emoji: '🟢', country: 'FR', offStoreTag: 'auchan', displayOrder: 2 },
  { slug: 'intermarche', nameFr: 'Intermarché', emoji: '🟡', country: 'FR', offStoreTag: 'intermarche', displayOrder: 3 },
  { slug: 'picard', nameFr: 'Picard', emoji: '❄️', country: 'FR', offStoreTag: 'picard', displayOrder: 4 },
  { slug: 'monoprix', nameFr: 'Monoprix', emoji: '🟤', country: 'FR', offStoreTag: 'monoprix', displayOrder: 5 },
  { slug: 'lidl', nameFr: 'Lidl', emoji: '🔶', country: 'FR', offStoreTag: 'lidl', displayOrder: 6 },
  { slug: 'aldi', nameFr: 'Aldi', emoji: '🔷', country: 'FR', offStoreTag: 'aldi', displayOrder: 7 },
  { slug: 'casino', nameFr: 'Casino', emoji: '🎰', country: 'FR', offStoreTag: 'casino', displayOrder: 8 },
  { slug: 'franprix', nameFr: 'Franprix', emoji: '🟠', country: 'FR', offStoreTag: 'franprix', displayOrder: 9 },
];

export function getStoreBySlug(slug: string): StoreDef | null {
  return STORES.find((s) => s.slug === slug) ?? null;
}

export function getAllStores(): StoreDef[] {
  return STORES;
}

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

export function clearStoreCache(): void {
  cache.clear();
}

interface RawItem {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutrition_grades?: string;
}

function itemToResult(item: RawItem): SearchResult | null {
  if (!item.code) return null;
  return {
    barcode: item.code,
    name: item.product_name ?? null,
    brand: item.brands ?? null,
    image_url: item.image_url ?? null,
    type: 'food',
  };
}

function buildStoreUrl(offStoreTag: string, page: number): string {
  const params = new URLSearchParams({
    stores_tags: offStoreTag,
    countries_tags: 'france',
    fields: 'code,product_name,brands,image_url,nutrition_grades',
    page_size: String(PAGE_SIZE),
    page: String(page),
  });
  return `${OFF_SEARCH_BASE}?${params.toString()}`;
}

export async function fetchStoreTopProducts(
  storeSlug: string,
  page: number = 1
): Promise<SearchResult[]> {
  const store = getStoreBySlug(storeSlug);
  if (!store) return [];

  const cacheKey = `${storeSlug}:${page}`;
  const hit = cacheGet(cacheKey);
  if (hit) return hit;

  try {
    const url = buildStoreUrl(store.offStoreTag, page);
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      console.warn('[stores] fetch non OK', res.status);
      return [];
    }
    const data = await res.json();
    const products: RawItem[] = Array.isArray(data?.products) ? data.products : [];
    const results: SearchResult[] = [];
    for (const p of products) {
      const r = itemToResult(p);
      if (r) results.push(r);
    }
    cacheSet(cacheKey, results);
    return results;
  } catch (err) {
    console.warn('[stores] fetch failed', err);
    return [];
  }
}
