/**
 * top-by-category — Top N produits par catégorie featured pour la home Vivo.
 *
 * Objectif : remplir la home dès le premier lancement (avant tout scan) avec
 * des tuiles curées des meilleurs produits notés par notre moteur. Catégories
 * featured = 3 slugs universels (boissons, chocolats, céréales p.-déj).
 *
 * Pipeline (par catégorie, en parallèle bornée à 2) :
 *   searchByCategory(slug, 'food')
 *     → getOrFetchProduct(barcode) en parallèle (Promise.allSettled, on filtre les nulls)
 *     → calculateScore(productToScoringInput(product), userProfile)
 *     → tri desc score, slice topN
 *
 * Dégradation : chaque bloc est indépendant. Si une catégorie échoue,
 * `items: []` (la home masque silencieusement les blocs vides). Si toutes
 * échouent, on retourne 3 blocs avec items vides — le composant skip tout.
 *
 * Choix : on réutilise `promiseAllWithConcurrency` exporté depuis
 * `store-ranking.ts` (DRY, helper générique déjà testé).
 */

import { searchByCategory } from './search';
import { getOrFetchProduct, productToScoringInput } from './openfoodfacts';
import { getCategoryBySlug } from './categories';
import { calculateScore } from '@/src/lib/scoring/engine';
import { composeScore } from '@/src/lib/scoring/composite-score';
import { promiseAllWithConcurrency } from './store-ranking';
import type {
  CategoryDef,
  Product,
  ScoringResult,
  SearchResult,
  UserProfile,
} from './types';

export const FEATURED_HOME_CATEGORIES = [
  'boissons',
  'chocolats',
  'cereales-petit-dej',
] as const;

export interface TopCategoryItem {
  result: SearchResult;
  product: Product;
  scoring: ScoringResult;
  score: number;
}

export interface TopCategoryBlock {
  category: CategoryDef;
  items: TopCategoryItem[];
}

const SEARCH_CONCURRENCY = 2;
const DEFAULT_TOP_N = 3;

async function rankCategoryItems(
  results: SearchResult[],
  userProfile: UserProfile,
  topN: number,
): Promise<TopCategoryItem[]> {
  // Promise.allSettled : on tolère les rejets côté Supabase / OFF par produit.
  const settled = await Promise.allSettled(
    results.map(async (result): Promise<TopCategoryItem | null> => {
      const product = await getOrFetchProduct(result.barcode);
      if (!product) return null;
      const scoring = composeScore(
        calculateScore(productToScoringInput(product), userProfile),
        product.packaging_components,
      );
      return {
        result,
        product,
        scoring,
        score: scoring.score_final,
      };
    }),
  );

  const items: TopCategoryItem[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled' && s.value !== null) {
      items.push(s.value);
    }
  }
  items.sort((a, b) => b.score - a.score);
  return items.slice(0, topN);
}

async function buildBlock(
  category: CategoryDef,
  userProfile: UserProfile,
  topN: number,
): Promise<TopCategoryBlock> {
  try {
    const results = await searchByCategory(category.slug, 'food');
    if (results.length === 0) {
      return { category, items: [] };
    }
    const items = await rankCategoryItems(results, userProfile, topN);
    return { category, items };
  } catch {
    // Échec catégorie : on dégrade silencieusement.
    return { category, items: [] };
  }
}

/**
 * Récupère les blocs Top N pour les catégories featured de la home.
 * Préserve l'ordre de `FEATURED_HOME_CATEGORIES`. Filtre les slugs introuvables.
 *
 * @param userProfile profil utilisé pour personnaliser le scoring
 * @param topN        nb max d'items par bloc (défaut 3)
 */
export async function fetchTopByCategoryHome(
  userProfile: UserProfile,
  topN: number = DEFAULT_TOP_N,
): Promise<TopCategoryBlock[]> {
  const categories: CategoryDef[] = [];
  for (const slug of FEATURED_HOME_CATEGORIES) {
    const cat = getCategoryBySlug(slug);
    if (cat) categories.push(cat);
  }

  const blocks = await promiseAllWithConcurrency<CategoryDef, TopCategoryBlock>(
    SEARCH_CONCURRENCY,
    categories,
    (cat) => buildBlock(cat, userProfile, topN),
    // Fallback : bloc vide si la promise interne reject (ne devrait pas arriver
    // car buildBlock catch déjà). On donne une catégorie placeholder qui sera
    // de toute façon écrasée par le retour fulfilled.
    { category: categories[0] ?? ({} as CategoryDef), items: [] },
  );

  return blocks;
}
