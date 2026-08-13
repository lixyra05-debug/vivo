/**
 * top-by-category — fetchTopByCategoryHome : agrégation Top N par catégorie
 * featured pour la home. Mocke `searchByCategory` et `getOrFetchProduct` pour
 * simuler OFF + Supabase. Teste l'ordre, la dégradation gracieuse et la
 * concurrence bornée à 2.
 */

import {
  fetchTopByCategoryHome,
  FEATURED_HOME_CATEGORIES,
} from '../top-by-category';
import { getCategoryBySlug } from '../categories';
import * as searchModule from '../search';
import * as offModule from '../openfoodfacts';
import type { Product, SearchResult, UserProfile } from '../types';

const userProfile: UserProfile = {
  type: 'standard',
  allergies: [],
  intolerances: [],
};

function makeResult(barcode: string, name: string): SearchResult {
  return {
    barcode,
    name,
    brand: null,
    image_url: null,
    type: 'food',
  };
}

// Construit un produit minimal — le scoring tirera ses propres pénalités.
// On ajuste les macros pour produire des scores variables et vérifier le tri.
function makeProduct(barcode: string, sugars: number): Product {
  const now = new Date().toISOString();
  return {
    barcode,
    name: `Produit ${barcode}`,
    brand: null,
    image_url: null,
    ingredients_raw: 'eau',
    additives_tags: [],
    nova_group: 1,
    nutriscore_grade: null,
    energy_kcal_100g: null,
    sugars_100g: sugars,
    saturated_fat_100g: 0,
    salt_100g: 0,
    proteins_100g: 0,
    fiber_100g: 0,
    oil_types: [],
    portion_grams: 100,
    packaging_material: null,
    is_organic: false,
    off_last_updated: now,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: now,
    updated_at: now,
  };
}

describe('top-by-category', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("1. retourne 3 blocs dans l'ordre FEATURED_HOME_CATEGORIES, items triés par score décroissant", async () => {
    const searchSpy = jest
      .spyOn(searchModule, 'searchByCategory')
      .mockImplementation(async (slug: string) => [
        makeResult(`${slug}-a`, `${slug} A`),
        makeResult(`${slug}-b`, `${slug} B`),
        makeResult(`${slug}-c`, `${slug} C`),
      ]);

    // Sucre élevé = pénalité macro élevée → score plus bas
    const sugarsByBarcode: Record<string, number> = {
      'boissons-a': 5, // peu de sucre → meilleur score
      'boissons-b': 25, // plus de sucre → score plus bas
      'boissons-c': 15,
      'chocolats-a': 5,
      'chocolats-b': 25,
      'chocolats-c': 15,
      'cereales-petit-dej-a': 5,
      'cereales-petit-dej-b': 25,
      'cereales-petit-dej-c': 15,
    };
    const productSpy = jest
      .spyOn(offModule, 'getOrFetchProduct')
      .mockImplementation(async (barcode: string) =>
        makeProduct(barcode, sugarsByBarcode[barcode] ?? 0),
      );

    const blocks = await fetchTopByCategoryHome(userProfile);

    expect(blocks).toHaveLength(3);
    expect(blocks.map((b) => b.category.slug)).toEqual([
      'boissons',
      'chocolats',
      'cereales-petit-dej',
    ]);
    // Tri décroissant par score sur chaque bloc
    for (const block of blocks) {
      expect(block.items.length).toBeGreaterThan(0);
      for (let i = 1; i < block.items.length; i++) {
        expect(block.items[i - 1].score).toBeGreaterThanOrEqual(block.items[i].score);
      }
      // Le premier item doit être celui avec le moins de sucre (score le plus haut)
      expect(block.items[0].result.barcode).toMatch(/-a$/);
    }
    expect(searchSpy).toHaveBeenCalledTimes(3);
    expect(productSpy).toHaveBeenCalled();
  });

  it("2. dégradation indépendante : si une catégorie échoue, les autres restent peuplées", async () => {
    jest
      .spyOn(searchModule, 'searchByCategory')
      .mockImplementation(async (slug: string) => {
        if (slug === 'chocolats') {
          throw new Error('OFF down');
        }
        return [
          makeResult(`${slug}-a`, `${slug} A`),
          makeResult(`${slug}-b`, `${slug} B`),
        ];
      });
    jest
      .spyOn(offModule, 'getOrFetchProduct')
      .mockImplementation(async (barcode: string) => makeProduct(barcode, 5));

    const blocks = await fetchTopByCategoryHome(userProfile);

    expect(blocks).toHaveLength(3);
    const chocolatsBlock = blocks.find((b) => b.category.slug === 'chocolats');
    expect(chocolatsBlock).toBeDefined();
    expect(chocolatsBlock?.items).toHaveLength(0);

    const boissonsBlock = blocks.find((b) => b.category.slug === 'boissons');
    expect(boissonsBlock?.items.length).toBeGreaterThan(0);
    const cerealesBlock = blocks.find((b) => b.category.slug === 'cereales-petit-dej');
    expect(cerealesBlock?.items.length).toBeGreaterThan(0);
  });

  it('3. paramètre topN limite le nombre d\'items par bloc', async () => {
    jest
      .spyOn(searchModule, 'searchByCategory')
      .mockImplementation(async (slug: string) => [
        makeResult(`${slug}-a`, `${slug} A`),
        makeResult(`${slug}-b`, `${slug} B`),
        makeResult(`${slug}-c`, `${slug} C`),
        makeResult(`${slug}-d`, `${slug} D`),
        makeResult(`${slug}-e`, `${slug} E`),
      ]);
    jest
      .spyOn(offModule, 'getOrFetchProduct')
      .mockImplementation(async (barcode: string) => makeProduct(barcode, 5));

    const blocks = await fetchTopByCategoryHome(userProfile, 2);

    expect(blocks).toHaveLength(3);
    for (const block of blocks) {
      expect(block.items.length).toBeLessThanOrEqual(2);
    }
  });

  it('4. concurrence bornée à 2 : pas plus de 2 searchByCategory simultanés', async () => {
    let inFlight = 0;
    let maxConcurrent = 0;

    jest
      .spyOn(searchModule, 'searchByCategory')
      .mockImplementation((slug: string) => {
        inFlight++;
        maxConcurrent = Math.max(maxConcurrent, inFlight);
        return new Promise((resolve) => {
          setTimeout(() => {
            inFlight--;
            resolve([makeResult(`${slug}-a`, `${slug} A`)]);
          }, 30);
        });
      });
    jest
      .spyOn(offModule, 'getOrFetchProduct')
      .mockImplementation(async (barcode: string) => makeProduct(barcode, 5));

    await fetchTopByCategoryHome(userProfile);

    expect(maxConcurrent).toBeLessThanOrEqual(2);
    expect(maxConcurrent).toBeGreaterThanOrEqual(1);
  });

  it('5. exporte FEATURED_HOME_CATEGORIES avec les 3 slugs attendus', () => {
    expect(FEATURED_HOME_CATEGORIES).toEqual([
      'boissons',
      'chocolats',
      'cereales-petit-dej',
    ]);
  });

  // D4 — le malus emballage est réservé à l'alimentaire : son barème est sourcé
  // sur la migration au CONTACT ALIMENTAIRE (antimoine du PET, BPA des
  // conserves). `rankCategoryItems` compose sans distinguer le type, donc la
  // seule chose qui protège D4 ici est la nature des slugs mis en avant.
  // Ce test casse le jour où un slug cosmétique entre dans la liste.
  it('ne met en avant que des catégories ALIMENTAIRES (garde D4)', () => {
    for (const slug of FEATURED_HOME_CATEGORIES) {
      const category = getCategoryBySlug(slug);
      expect(category).not.toBeNull();
      expect(category?.type).toBe('food');
    }
  });
});
