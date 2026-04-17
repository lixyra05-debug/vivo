import { supabase } from './supabase';
import type { Product } from './types';

export interface SwapAlternative {
  emoji?: string;
  name: string;
  why: string;
}

export interface SwapCategory {
  id: string;
  category_name_fr: string;
  swap_type: 'brut' | 'product';
  brut_alternatives: SwapAlternative[] | null;
  product_barcodes: string[];
  display_order: number;
}

export interface SwapRule {
  id: string;
  trigger_keywords: string[];
  trigger_nova_min: number;
  swap_category_id: string;
}

export async function fetchSwapCategories(): Promise<SwapCategory[]> {
  const { data, error } = await supabase
    .from('swap_categories')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return ((data ?? []) as unknown) as SwapCategory[];
}

export async function fetchSwapRules(): Promise<SwapRule[]> {
  const { data, error } = await supabase.from('swap_rules').select('*');
  if (error) throw error;
  return ((data ?? []) as unknown) as SwapRule[];
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchCategoriesForProduct(
  product: Pick<Product, 'name' | 'brand' | 'ingredients_raw' | 'nova_group'> | null,
  categories: SwapCategory[],
  rules: SwapRule[]
): SwapCategory[] {
  if (!product) return [];
  const haystack = normalize(
    [product.name ?? '', product.brand ?? '', product.ingredients_raw ?? ''].join(' ')
  );
  if (!haystack.trim()) return [];
  const novaOk = (product.nova_group ?? 4) >= 1;
  const matchedIds = new Set<string>();
  for (const rule of rules) {
    if (!novaOk) continue;
    if ((product.nova_group ?? 0) < rule.trigger_nova_min) continue;
    const hit = rule.trigger_keywords.some((k) => haystack.includes(normalize(k)));
    if (hit) matchedIds.add(rule.swap_category_id);
  }
  return categories
    .filter((c) => matchedIds.has(c.id) && c.swap_type === 'brut')
    .sort((a, b) => a.display_order - b.display_order);
}
