import { isProductCompatible, getIncompatibilityReasons } from '../profile-filters';
import type {
  CompatibilityProfile,
  Product,
  ScoringResult,
} from '../../api/types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '0000000000001',
    name: 'Produit test',
    brand: 'Test',
    image_url: null,
    ingredients_raw: '',
    additives_tags: [],
    nova_group: 1,
    nutriscore_grade: null,
    energy_kcal_100g: null,
    sugars_100g: 0,
    saturated_fat_100g: 0,
    salt_100g: 0,
    proteins_100g: 0,
    fiber_100g: 0,
    oil_types: [],
    portion_grams: 100,
    packaging_material: null,
    is_organic: false,
    off_last_updated: null,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

function makeScoring(overrides: Partial<ScoringResult> = {}): ScoringResult {
  return {
    score_final: 80,
    score_color: 'green',
    nova_group: 1,
    penalties: [],
    blockers: [],
    seed_oils_detected: [],
    clean_labeling_alerts: [],
    profile_adjustments: [],
    ...overrides,
  };
}

function emptyProfile(overrides: Partial<CompatibilityProfile> = {}): CompatibilityProfile {
  return {
    allergies: [],
    dietary: [],
    conditions: [],
    avoid: [],
    minScore: 0,
    ...overrides,
  };
}

describe('isProductCompatible', () => {
  it('1. retourne true pour profil vide', () => {
    expect(isProductCompatible(makeProduct(), makeScoring(), emptyProfile())).toBe(true);
  });

  it('2. retourne false si blocker présent (allergie gluten)', () => {
    const product = makeProduct({ ingredients_raw: 'farine de blé' });
    const profile = emptyProfile({ allergies: ['gluten'] });
    expect(isProductCompatible(product, makeScoring(), profile)).toBe(false);
  });

  it('3. retourne true si seulement warnings (pas de blocker)', () => {
    const product = makeProduct({ salt_100g: 2 });
    const profile = emptyProfile({ conditions: ['hypertension'] });
    expect(isProductCompatible(product, makeScoring(), profile)).toBe(true);
  });
});

describe('getIncompatibilityReasons', () => {
  it('4. retourne les labelFr en ordre', () => {
    const product = makeProduct({
      ingredients_raw: 'farine de blé',
      salt_100g: 2,
    });
    const profile = emptyProfile({
      allergies: ['gluten'],
      conditions: ['hypertension'],
    });
    const reasons = getIncompatibilityReasons(product, makeScoring(), profile);
    expect(reasons.length).toBeGreaterThanOrEqual(2);
    expect(reasons.every((r) => typeof r === 'string')).toBe(true);
    // blockers come first
    expect(reasons[0].toLowerCase()).toContain('gluten');
  });

  it('5. retourne [] pour profil vide', () => {
    expect(getIncompatibilityReasons(makeProduct(), makeScoring(), emptyProfile())).toEqual([]);
  });
});
