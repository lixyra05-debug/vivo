/**
 * Normalisation d'une fiche Open Food Facts en ligne du cache `products`.
 *
 * Module pur : ni client Supabase, ni React Native. L'Edge Function
 * `cache-product` (Deno) l'importe tel quel, comme l'app — d'où des imports
 * relatifs avec leur extension `.ts` : Deno ne résout ni l'alias `@/` ni les
 * chemins sans extension (lot C).
 */
import type { Product } from './types.ts';
import { normalizePackagings } from '../../data/packaging-risks.ts';

export interface OFFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  /** Langue PRINCIPALE de la fiche — pas forcément le français. */
  ingredients_text?: string;
  /** Texte français, quand la fiche en a un. Déjà dans la charge utile. */
  ingredients_text_fr?: string;
  /**
   * Allergènes déclarés par la fiche (`en:milk`…). Déjà dans la charge utile.
   * Saisie communautaire : on y trouve aussi des traces recopiées, des
   * châtaignes déclarées « fruits à coque » (hors annexe II du règlement
   * 1169/2011) et des tags sans appui sur la fiche.
   */
  allergens_tags?: string[];
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

/** Garde les tags tels quels ; écarte seulement ce qui n'est pas une chaîne. */
function normalizeAllergenTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === 'string');
}

/** Un texte vide ou blanc n'est pas un texte : OFF sert `""` aux fiches sans français. */
function nonBlankOrNull(text: string | undefined): string | null {
  return typeof text === 'string' && text.trim().length > 0 ? text : null;
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
    // La note lit la langue principale, comme avant. La compatibilité reçoit
    // ses propres sources : le texte français et les allergènes déclarés.
    ingredients_raw: off.ingredients_text ?? null,
    ingredients_text_fr: nonBlankOrNull(off.ingredients_text_fr),
    allergens_tags: normalizeAllergenTags(off.allergens_tags),
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
