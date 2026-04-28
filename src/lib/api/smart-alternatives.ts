/**
 * Smart alternatives — Premium feature : suggère jusqu'à 5 alternatives
 * mieux notées (proxy Nutri-Score) dans la même catégorie OFF que le produit
 * scanné.
 *
 * Cascade hiérarchique : on essaie le tag le plus spécifique, et on remonte
 * vers les parents si la tentative ne livre pas ≥5 résultats valides.
 * Maximum 3 tentatives. Pas d'agrégation cross-tag (les univers peuvent
 * différer entre racine et feuille → on préserve la cohérence sémantique
 * en retenant la meilleure tentative isolée).
 *
 * Source : Open Food Facts API v2 (categories_tags, sort=popularity_key).
 * Filtres client : produit !== scanné, name + image non vides, grade ∈ {a..e},
 * score > currentScore.
 * Tri final : score desc, puis additivesCount asc en cas d'égalité.
 * Cache : LRU 10 min, max 100 entrées (clé = barcode + chemin + score).
 */

import { nutriScoreToProxy } from './store-ranking';
import { fetchWithTimeout, FetchTimeoutError } from './fetch-with-timeout';

const OFF_SEARCH_BASE = 'https://fr.openfoodfacts.org/api/v2/search';
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';
const PAGE_SIZE = 30;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const CACHE_MAX_ENTRIES = 100;
const MAX_ATTEMPTS = 3;
const TARGET_VALID = 5;
const MAX_RESULTS = 5;

export interface Alternative {
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string;
  score: number;
  scoreDelta: number;
  category: string;
  novaGroup: number | null;
  additivesCount: number;
}

interface CacheEntry {
  ts: number;
  data: Alternative[];
}

const cache: Map<string, CacheEntry> = new Map();

export function clearAlternativesCache(): void {
  cache.clear();
}

function cacheGet(key: string): Alternative[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: Alternative[]): void {
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
  nova_group?: number | string;
  additives_n?: number | string;
}

function buildUrl(categoryTag: string): string {
  const params = new URLSearchParams({
    categories_tags: categoryTag,
    countries_tags: 'france',
    fields:
      'code,product_name,brands,image_url,nutrition_grades,nova_group,additives_n',
    page_size: String(PAGE_SIZE),
    page: '1',
    sort_by: 'popularity_key',
  });
  return `${OFF_SEARCH_BASE}?${params.toString()}`;
}

function coerceNova(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function coerceAdditivesCount(raw: unknown): number {
  if (raw === null || raw === undefined) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function fetchTagPage(categoryTag: string): Promise<RawProduct[]> {
  try {
    const res = await fetchWithTimeout(buildUrl(categoryTag), {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.products) ? (data.products as RawProduct[]) : [];
  } catch (err) {
    if (err instanceof FetchTimeoutError) return [];
    return [];
  }
}

function toAlternative(
  p: RawProduct,
  categoryTag: string,
  scannedBarcode: string,
  currentScore: number,
): Alternative | null {
  if (!p.code || p.code === scannedBarcode) return null;

  const name = p.product_name?.trim();
  if (!name) return null;

  const imageUrl = p.image_url?.trim();
  if (!imageUrl) return null;

  const grade = (p.nutrition_grades ?? '').toLowerCase();
  const score = nutriScoreToProxy(grade);
  if (score === null) return null;

  if (score <= currentScore) return null;

  return {
    barcode: p.code,
    name,
    brand: p.brands?.trim() || null,
    imageUrl,
    score,
    scoreDelta: score - currentScore,
    category: categoryTag,
    novaGroup: coerceNova(p.nova_group),
    additivesCount: coerceAdditivesCount(p.additives_n),
  };
}

function sortAndCap(items: Alternative[]): Alternative[] {
  const sorted = [...items].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.additivesCount - b.additivesCount;
  });
  return sorted.slice(0, MAX_RESULTS);
}

/**
 * Recherche jusqu'à 5 alternatives mieux notées dans la cascade
 * `categoriesTags` (ordre racine → spécifique côté OFF).
 *
 * @param scannedBarcode  code-barres du produit en cours d'examen (exclu)
 * @param categoriesTags  chemin de catégories OFF (`categories_tags`)
 * @param currentScore    score Vivo courant — toute alternative doit le dépasser
 */
export async function findAlternatives(
  scannedBarcode: string,
  categoriesTags: string[],
  currentScore: number,
): Promise<Alternative[]> {
  if (!Array.isArray(categoriesTags) || categoriesTags.length === 0) return [];

  const cacheKey = `${scannedBarcode}::${categoriesTags.join(',')}::${currentScore}`;
  const hit = cacheGet(cacheKey);
  if (hit) return hit;

  let best: Alternative[] = [];
  let attempted = 0;

  for (
    let i = categoriesTags.length - 1;
    i >= 0 && attempted < MAX_ATTEMPTS;
    i--
  ) {
    const tag = categoriesTags[i];
    attempted++;

    const raw = await fetchTagPage(tag);
    const valid: Alternative[] = [];
    for (const p of raw) {
      const alt = toAlternative(p, tag, scannedBarcode, currentScore);
      if (alt) valid.push(alt);
    }

    if (valid.length >= TARGET_VALID) {
      const top = sortAndCap(valid);
      cacheSet(cacheKey, top);
      return top;
    }

    if (valid.length > best.length) {
      best = valid;
    }
  }

  const top = sortAndCap(best);
  cacheSet(cacheKey, top);
  return top;
}

/**
 * Titre dynamique de la section selon le score courant :
 *   < 50  → "bien meilleures"
 *   < 80  → "plus saines"
 *   ≥ 80  → "dans cette catégorie"
 */
export function getAlternativesTitle(currentScore: number): string {
  if (currentScore < 50) return '🔄 Des alternatives bien meilleures existent';
  if (currentScore < 80) return '🔄 Des alternatives plus saines existent';
  return '🔄 Alternatives dans cette catégorie';
}
