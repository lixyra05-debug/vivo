/**
 * Normalisation d'une fiche Open Beauty Facts en ligne du cache
 * `cosmetic_products`.
 *
 * Module pur : ni client Supabase, ni React Native. L'Edge Function
 * `cache-product` (Deno) l'importe tel quel, comme l'app — d'où un import
 * relatif avec son extension `.ts` : Deno ne résout ni l'alias `@/` ni les
 * chemins sans extension (lot C).
 */
import type { CosmeticProduct } from './types.ts';

export interface OBFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  image_ingredients_url?: string;
  ingredients_text?: string;
  categories_tags?: string[];
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
