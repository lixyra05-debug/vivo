import { supabase } from './supabase';
import type { Product, ScoringInput } from './types';
import { fetchCosmeticByBarcode, type OBFProduct } from './openbeautyfacts';
import { fetchWithTimeout, FetchTimeoutError } from './fetch-with-timeout';
import { normalizeOFFProduct, type OFFProduct } from './off-normalize';
import { CLIENT_CLOCK_SKEW_MS, isCacheFresh } from './cache-refresh-rules';
import { requestCacheRefresh, type CacheReadOptions } from './cache-refresh';
import {
  normalizePackagings,
  type PackagingComponent,
} from '@/src/data/packaging-risks';

const OFF_BASE = 'https://fr.openfoodfacts.org/api/v2';
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';

// La normalisation vit dans `off-normalize.ts`, que l'Edge Function
// `cache-product` importe aussi (lot C) ; réexportée pour les appelants.
export { normalizeOFFProduct, type OFFProduct };

/**
 * Résultat d'une recherche multi-source : tape OFF puis fallback OBF.
 * Permet au scanner de router vers la fiche food ou cosmetic.
 */
export type MultiSourceProduct =
  | { type: 'food'; product: OFFProduct }
  | { type: 'cosmetic'; product: OBFProduct };

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

async function readProductFromCache(barcode: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle();
  if (error || !data) return null;
  return data as Product;
}

/**
 * Taille d'un lot de codes-barres pour `fetchCachedProducts`. Les codes
 * voyagent dans l'URL (`barcode=in.(…)`) : 100 codes de 14 chiffres tiennent
 * sous 2 Ko, loin des limites des passerelles.
 */
export const PRODUCT_LOOKUP_CHUNK = 100;

/**
 * Fiches du cache alimentaire (`products`), lues par code-barres — `columns`
 * doit inclure `barcode`, clé de la table rendue.
 *
 * Remplace la jointure PostgREST `product:products(…)` depuis `scan_history` :
 * elle exigeait une clé étrangère que la migration 012 a supprimée (les
 * cosmétiques n'ont pas de ligne dans `products`, elle ne peut pas revenir),
 * et PostgREST la refusait (PGRST200). Lire en deux temps n'a besoin d'aucune
 * clé ; la RLS de `products` (lecture publique, migration 012) s'applique
 * telle quelle. Un lot en erreur fait échouer toute la lecture : un résultat
 * partiel passerait pour des produits absents du cache.
 */
export async function fetchCachedProducts<T extends { barcode: string }>(
  barcodes: readonly string[],
  columns: string,
): Promise<Map<string, T>> {
  const unique = [...new Set(barcodes)];
  const lots: string[][] = [];
  for (let i = 0; i < unique.length; i += PRODUCT_LOOKUP_CHUNK) {
    lots.push(unique.slice(i, i + PRODUCT_LOOKUP_CHUNK));
  }
  const responses = await Promise.all(
    lots.map((lot) => supabase.from('products').select(columns).in('barcode', lot)),
  );
  const byBarcode = new Map<string, T>();
  for (const { data, error } of responses) {
    if (error) throw error;
    for (const row of (data ?? []) as unknown as T[]) byBarcode.set(row.barcode, row);
  }
  return byBarcode;
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

/**
 * La fiche d'un aliment : le cache s'il est frais, sinon une relecture d'OFF.
 *
 * Seul le serveur écrit le cache (lot C) : l'Edge Function `cache-product`
 * relit OFF elle-même et écrit. Injoignable — ou non sollicitée par une liste
 * (`refresh: false`) —, elle laisse le client lire OFF directement : la fiche
 * s'affiche, rien n'est écrit.
 */
export async function getOrFetchProduct(
  barcode: string,
  options: CacheReadOptions = {},
): Promise<Product | null> {
  const cached = await readProductFromCache(barcode);
  if (cached && isCacheFresh(cached.updated_at, Date.now(), CLIENT_CLOCK_SKEW_MS)) return cached;

  if (options.refresh !== false) {
    const refreshed = await requestCacheRefresh<Product>(barcode, 'food');
    if (refreshed.kind === 'product') return refreshed.product;
  }

  const off = await fetchProductByBarcode(barcode);
  if (!off) return cached ?? null;
  return normalizeOFFProduct(off);
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
    // DÉCISION voie (i) — bloquant 4, face 2. Une macro ABSENTE (null) est
    // lue 0 par le moteur : la note n'invente ni risque (pénaliser
    // l'inconnu) ni innocence (c'était le bug — l'absence absoute en
    // silence). Elle reste calculée sur ce que la source fournit, et
    // l'absence est DÉCLARÉE au même niveau que la note par
    // `MissingNutritionBanner` (via `getMissingNutritionFields`). Changer la
    // note elle-même — pénalité d'incertitude, plancher — est du CALIBRAGE :
    // lot 3, jamais ici. Verrouillé par missing-nutrition.test.ts (« les
    // deux moitiés ensemble »).
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
