/**
 * Store ranking — Premium feature : classement complet des supermarchés FR
 * via un proxy Nutri-Score (A=90, B=70, C=50, D=30, E=10).
 *
 * Source : Open Food Facts API v2.
 * Cache : 1h (TTL global, le ranking change peu).
 */

import { STORES } from './stores';
import type { ScoreColor } from './types';

const OFF_SEARCH_BASE = 'https://world.openfoodfacts.org/api/v2/search';
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';
const PAGE_SIZE = 50;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface StoreRanking {
  slug: string;
  nameFr: string;
  emoji: string;
  avgScore: number;
  productCount: number;
  color: ScoreColor;
}

const NUTRI_PROXY: Record<string, number> = {
  a: 90,
  b: 70,
  c: 50,
  d: 30,
  e: 10,
};

export function nutriScoreToProxy(
  grade: string | null | undefined,
): number | null {
  if (!grade) return null;
  const key = grade.toLowerCase();
  if (!(key in NUTRI_PROXY)) return null;
  return NUTRI_PROXY[key];
}

function scoreToColor(score: number): ScoreColor {
  if (score >= 75) return 'green';
  if (score >= 50) return 'yellow';
  if (score >= 25) return 'orange';
  return 'red';
}

interface CacheEntry {
  ts: number;
  data: StoreRanking[];
}
let rankingCache: CacheEntry | null = null;

export function clearStoreRankingCache(): void {
  rankingCache = null;
}

interface RawProduct {
  code?: string;
  nutrition_grades?: string;
}

async function fetchStoreGrades(offStoreTag: string): Promise<string[]> {
  const params = new URLSearchParams({
    stores_tags: offStoreTag,
    countries_tags: 'france',
    fields: 'code,nutrition_grades',
    page_size: String(PAGE_SIZE),
    page: '1',
  });
  const url = `${OFF_SEARCH_BASE}?${params.toString()}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return [];
    const data = await res.json();
    const products: RawProduct[] = Array.isArray(data?.products)
      ? data.products
      : [];
    return products.map((p) => p.nutrition_grades ?? '');
  } catch {
    return [];
  }
}

function aggregate(grades: string[]): { avgScore: number; productCount: number } {
  const proxies: number[] = [];
  for (const g of grades) {
    const v = nutriScoreToProxy(g);
    if (v !== null) proxies.push(v);
  }
  if (proxies.length === 0) return { avgScore: 0, productCount: 0 };
  const sum = proxies.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / proxies.length);
  return { avgScore: avg, productCount: proxies.length };
}

export async function calculateStoreRanking(): Promise<StoreRanking[]> {
  if (rankingCache && Date.now() - rankingCache.ts < CACHE_TTL_MS) {
    return rankingCache.data;
  }

  const rows: StoreRanking[] = [];
  for (const store of STORES) {
    const grades = await fetchStoreGrades(store.offStoreTag);
    const { avgScore, productCount } = aggregate(grades);
    rows.push({
      slug: store.slug,
      nameFr: store.nameFr,
      emoji: store.emoji,
      avgScore,
      productCount,
      color: scoreToColor(avgScore),
    });
  }

  rows.sort((a, b) => b.avgScore - a.avgScore);
  rankingCache = { ts: Date.now(), data: rows };
  return rows;
}
