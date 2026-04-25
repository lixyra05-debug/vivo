import { getCosmeticConfidence, getProductConfidence } from '../confidence';
import type { CosmeticProduct, Product } from '../types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date().toISOString();
  return {
    barcode: '0000000000000',
    name: null,
    brand: null,
    image_url: null,
    ingredients_raw: null,
    additives_tags: [],
    nova_group: null,
    nutriscore_grade: null,
    energy_kcal_100g: null,
    sugars_100g: null,
    saturated_fat_100g: null,
    salt_100g: null,
    proteins_100g: null,
    fiber_100g: null,
    oil_types: [],
    portion_grams: null,
    packaging_material: null,
    is_organic: false,
    off_last_updated: null,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function makeCosmetic(overrides: Partial<CosmeticProduct> = {}): CosmeticProduct {
  const now = new Date().toISOString();
  return {
    barcode: '1111111111111',
    name: null,
    brand: null,
    image_url: null,
    ingredients_inci: '',
    ingredients_list: [],
    category: null,
    image_ingredients_url: null,
    obf_last_updated: null,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe('confidence', () => {
  it("produit complet (6/6) → niveau 'verified'", () => {
    const p = makeProduct({
      image_url: 'https://img/x',
      name: 'Coca',
      brand: 'Coca-Cola',
      ingredients_raw: 'eau, sucre',
      nutriscore_grade: 'e',
      energy_kcal_100g: 180,
    });
    const c = getProductConfidence(p);
    expect(c.level).toBe('verified');
    expect(c.labelFr).toBe('Vérifié fabricant');
    expect(c.color).toBe('#4CAF50');
    expect(c.reasons.length).toBeGreaterThan(0);
  });

  it("produit avec 4/6 champs → niveau 'community'", () => {
    const p = makeProduct({
      image_url: 'https://img/x',
      name: 'Yaourt',
      brand: 'Danone',
      ingredients_raw: 'lait, ferments',
      // pas de nutriscore_grade ni de nutriment
    });
    const c = getProductConfidence(p);
    expect(c.level).toBe('community');
    expect(c.labelFr).toBe('Contribution communautaire');
    expect(c.color).toBe('#C4A882');
    expect(c.reasons.length).toBeGreaterThan(0);
    expect(c.reasons.length).toBeLessThanOrEqual(3);
  });

  it("produit avec 2/6 champs → niveau 'unverified'", () => {
    const p = makeProduct({
      name: 'Mystère',
      brand: 'Marque X',
    });
    const c = getProductConfidence(p);
    expect(c.level).toBe('unverified');
    expect(c.labelFr).toBe('À vérifier');
    expect(c.color).toBe('#FF9800');
    expect(c.reasons.length).toBeGreaterThan(0);
    expect(c.reasons).toContain('À vérifier avant usage');
  });

  it("edge case : tous les champs null → 'unverified' avec reasons non vide", () => {
    const p = makeProduct();
    const c = getProductConfidence(p);
    expect(c.level).toBe('unverified');
    expect(c.reasons.length).toBeGreaterThan(0);
    expect(c.reasons.length).toBeLessThanOrEqual(3);
  });

  it("cosmétique complet (5/5) → niveau 'verified'", () => {
    const cp = makeCosmetic({
      image_url: 'https://img/cosmo',
      name: 'Shampoing doux',
      brand: 'Ecover',
      ingredients_inci: 'AQUA, SODIUM LAURETH SULFATE, GLYCERIN',
      category: 'shampoings',
    });
    const c = getCosmeticConfidence(cp);
    expect(c.level).toBe('verified');
    expect(c.labelFr).toBe('Vérifié fabricant');
    expect(c.color).toBe('#4CAF50');
  });
});
