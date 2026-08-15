import { supabase } from './supabase';
import type { Product, ScoringInput } from './types';
import { fetchCosmeticByBarcode, type OBFProduct } from './openbeautyfacts';
import { fetchWithTimeout, FetchTimeoutError } from './fetch-with-timeout';
import {
  normalizePackagings,
  type PackagingComponent,
} from '@/src/data/packaging-risks';

const OFF_BASE = 'https://fr.openfoodfacts.org/api/v2';
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Résultat d'une recherche multi-source : tape OFF puis fallback OBF.
 * Permet au scanner de router vers la fiche food ou cosmetic.
 */
export type MultiSourceProduct =
  | { type: 'food'; product: OFFProduct }
  | { type: 'cosmetic'; product: OBFProduct };

export interface OFFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  ingredients_text?: string;
  additives_tags?: string[];
  nova_group?: number;
  nutriscore_grade?: string;
  nutriments?: Record<string, number>;
  serving_size?: string;
  packaging?: string;
  /**
   * Composants d'emballage structurés. Déjà présent dans la charge utile :
   * `fetchProductByBarcode` télécharge la fiche sans filtre `fields=`.
   */
  packagings?: unknown[];
  labels_tags?: string[];
  categories_tags?: string[];
  ingredients?: Array<{ id?: string; text?: string; percent?: number }>;
}

export async function fetchProductByBarcode(barcode: string): Promise<OFFProduct | null> {
  try {
    const res = await fetchWithTimeout(`${OFF_BASE}/product/${barcode}.json`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1) return null;
    return data.product as OFFProduct;
  } catch (err) {
    if (err instanceof FetchTimeoutError) return null;
    throw err;
  }
}

/**
 * Récupère le tag de catégorie principal d'un produit (le plus précis disponible).
 * Utilisé par smart-alternatives pour limiter la recherche à la même catégorie.
 */
export async function fetchProductCategoryTag(
  barcode: string,
): Promise<string | null> {
  try {
    const url = `${OFF_BASE}/product/${barcode}.json?fields=categories_tags`;
    const res = await fetchWithTimeout(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1) return null;
    const tags: string[] = Array.isArray(data.product?.categories_tags)
      ? data.product.categories_tags
      : [];
    if (tags.length === 0) return null;
    // Le dernier tag est généralement le plus spécifique chez OFF.
    return tags[tags.length - 1];
  } catch {
    return null;
  }
}

/**
 * Récupère le chemin complet de catégories OFF (ordre racine → spécifique).
 * Utilisé par la cascade hiérarchique de `findAlternatives` qui peut remonter
 * vers un parent quand le tag le plus spécifique livre trop peu de résultats.
 *
 * Retourne `[]` si le produit est introuvable, si `categories_tags` est absent,
 * ou si la requête échoue (timeout / réseau).
 */
export async function fetchProductCategoriesTags(
  barcode: string,
): Promise<string[]> {
  try {
    const url = `${OFF_BASE}/product/${barcode}.json?fields=categories_tags`;
    const res = await fetchWithTimeout(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 1) return [];
    const tags: string[] = Array.isArray(data.product?.categories_tags)
      ? data.product.categories_tags
      : [];
    return tags;
  } catch {
    return [];
  }
}

/**
 * Récupère les composants d'emballage OFF (`packagings[]`) : un objet par
 * élément physique, avec son matériau, sa forme et son contact alimentaire.
 * Consommé par `detectPackagingRisk` côté UI.
 *
 * Remplace la lecture de `packaging_tags`, un champ hérité qui aplatit
 * matériaux, formes et mentions de recyclage sans lien entre eux et se révèle
 * fréquemment erroné — c'est lui qui faisait afficher « Aluminium » sur une
 * bouteille d'eau en PET.
 *
 * Retourne `[]` si le produit est introuvable, si `packagings` est absent, ou
 * si la requête échoue. Aucun repli sur `packaging_tags` : la section
 * emballage disparaît plutôt que d'afficher une donnée non fiable.
 */
export async function fetchProductPackagings(
  barcode: string,
): Promise<PackagingComponent[]> {
  try {
    const url = `${OFF_BASE}/product/${barcode}.json?fields=packagings`;
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

function parsePortionGrams(servingSize?: string): number {
  if (!servingSize) return 100;
  const match = servingSize.match(/(\d+(?:[.,]\d+)?)\s*(g|ml)/i);
  if (!match) return 100;
  const value = parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : 100;
}

function extractOilTypes(off: OFFProduct): string[] {
  const oils = new Set<string>();
  const text = (off.ingredients_text ?? '').toLowerCase();
  const mapping: Array<[RegExp, string]> = [
    [/huile\s+de\s+tournesol|sunflower/, 'sunflower'],
    [/huile\s+de\s+colza|rapeseed|canola/, 'rapeseed'],
    [/huile\s+de\s+soja|soybean/, 'soy'],
    [/huile\s+de\s+ma[ïi]s|corn\s+oil/, 'corn'],
    [/huile\s+de\s+palme|palm\s+oil|palmiste/, 'palm'],
    [/huile\s+de\s+coton/, 'cottonseed'],
    [/p[ée]pins?\s+de\s+raisin|grapeseed/, 'grapeseed'],
  ];
  for (const [re, key] of mapping) {
    if (re.test(text)) oils.add(key);
  }
  return [...oils];
}

export function normalizeOFFProduct(off: OFFProduct): Product {
  const n = off.nutriments ?? {};
  const labels = off.labels_tags ?? [];
  const now = new Date().toISOString();
  return {
    barcode: off.code,
    name: off.product_name ?? null,
    brand: off.brands ?? null,
    image_url: off.image_url ?? null,
    ingredients_raw: off.ingredients_text ?? null,
    additives_tags: off.additives_tags ?? [],
    nova_group: typeof off.nova_group === 'number' ? off.nova_group : null,
    nutriscore_grade: off.nutriscore_grade ?? null,
    energy_kcal_100g: n['energy-kcal_100g'] ?? null,
    sugars_100g: n['sugars_100g'] ?? null,
    saturated_fat_100g: n['saturated-fat_100g'] ?? null,
    salt_100g: n['salt_100g'] ?? null,
    proteins_100g: n['proteins_100g'] ?? null,
    fiber_100g: n['fiber_100g'] ?? null,
    oil_types: extractOilTypes(off),
    portion_grams: parsePortionGrams(off.serving_size),
    packaging_material: off.packaging ?? null,
    packaging_components: normalizePackagings(off.packagings),
    is_organic: labels.some((l) => l === 'en:organic' || l === 'fr:bio'),
    off_last_updated: now,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: now,
    updated_at: now,
  };
}

async function readProductFromCache(barcode: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle();
  if (error || !data) return null;
  const updated = data.updated_at ? new Date(data.updated_at).getTime() : 0;
  if (Date.now() - updated > CACHE_TTL_MS) return data as Product;
  return data as Product;
}

function isCacheStale(product: Product): boolean {
  const updated = product.updated_at ? new Date(product.updated_at).getTime() : 0;
  return Date.now() - updated > CACHE_TTL_MS;
}

async function writeProductToCache(product: Product): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .upsert(product, { onConflict: 'barcode' })
    .select()
    .maybeSingle();
  if (error) return product;
  return (data as Product) ?? product;
}

/**
 * Recherche un produit en cascade : Open Food Facts (alimentaire) puis
 * Open Beauty Facts (cosmétique) en fallback. Retourne null si aucune source
 * ne trouve le code-barres. Utilisé par le scanner pour router automatiquement
 * vers la bonne fiche produit.
 */
export async function fetchProductMultiSource(
  barcode: string,
): Promise<MultiSourceProduct | null> {
  const off = await fetchProductByBarcode(barcode);
  if (off) return { type: 'food', product: off };

  const obf = await fetchCosmeticByBarcode(barcode);
  if (obf) return { type: 'cosmetic', product: obf };

  return null;
}

export async function getOrFetchProduct(barcode: string): Promise<Product | null> {
  const cached = await readProductFromCache(barcode);
  if (cached && !isCacheStale(cached)) return cached;

  const off = await fetchProductByBarcode(barcode);
  if (!off) return cached ?? null;

  const normalized = normalizeOFFProduct(off);
  if (cached) {
    normalized.scan_count = cached.scan_count;
    normalized.created_at = cached.created_at;
  }
  return writeProductToCache(normalized);
}

export function productToScoringInput(product: Product): ScoringInput {
  // Absence (null) ET valeur aberrante (hors [1,4], non entière — bruit OFF)
  // → null : le moteur classifie lui-même via `classifyNova` (engine.ts:80).
  // Ne JAMAIS coalescer à 4 (l'absence punirait : bloquant 4, 28/299 produits
  // dont 14 eaux minérales « à éviter ») ni à 1 (l'absence absoudrait).
  // Une aberrante n'est pas une absence — le traitement est identique, le
  // signalement est distinct (audit, racine C).
  const novaRaw = product.nova_group;
  const nova: ScoringInput['nova_group'] =
    novaRaw != null && Number.isInteger(novaRaw) && novaRaw >= 1 && novaRaw <= 4
      ? (novaRaw as 1 | 2 | 3 | 4)
      : null;
  return {
    barcode: product.barcode,
    ingredients_raw: product.ingredients_raw ?? '',
    additives_tags: product.additives_tags ?? [],
    nova_group: nova,
    macros_100g: {
      sugars: product.sugars_100g ?? 0,
      saturated_fat: product.saturated_fat_100g ?? 0,
      salt: product.salt_100g ?? 0,
      proteins: product.proteins_100g ?? 0,
      fiber: product.fiber_100g ?? 0,
    },
    portion_grams: product.portion_grams ?? 100,
    oil_types: product.oil_types ?? [],
    is_organic: product.is_organic,
  };
}
