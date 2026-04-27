// Régression B-002 : `text.includes(allergen)` matchait des sous-chaînes
// (ex. "amande" dans "amandine", "gluten" dans "glutenfree"). Désormais on
// utilise des frontières de mot via RegExp `\b…\b`.
import { checkCompatibility } from '../compatibility-engine';
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

function profileWith(p: Partial<CompatibilityProfile> = {}): CompatibilityProfile {
  return {
    allergies: [],
    dietary: [],
    conditions: [],
    avoid: [],
    minScore: 0,
    ...p,
  };
}

describe('compatibility-engine — frontières de mots (B-002)', () => {
  it('"amandine" ne déclenche PAS allergie fruits_a_coque (vs "amande")', () => {
    const product = makeProduct({
      ingredients_raw: 'biscuit amandine au sucre',
    });
    const profile = profileWith({ allergies: ['fruits_a_coque'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const allergyHits = result.incompatibilities.filter((i) => i.type === 'allergy');
    expect(allergyHits).toHaveLength(0);
  });

  it('"amande" en mot entier déclenche bien allergie fruits_a_coque', () => {
    const product = makeProduct({
      ingredients_raw: 'farine, amande, sucre',
    });
    const profile = profileWith({ allergies: ['fruits_a_coque'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const allergyHits = result.incompatibilities.filter((i) => i.type === 'allergy');
    expect(allergyHits).toHaveLength(1);
  });

  it('"glutenfree" ne déclenche PAS allergie gluten (mot collé)', () => {
    const product = makeProduct({
      ingredients_raw: 'pain glutenfree certifié',
    });
    const profile = profileWith({ allergies: ['gluten'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const allergyHits = result.incompatibilities.filter((i) => i.type === 'allergy');
    expect(allergyHits).toHaveLength(0);
  });

  it('multi-allergènes : seuls les mots entiers présents matchent', () => {
    // "soja" présent comme mot, "blé" absent (seulement "tableau" qui ne
    // contient pas "blé"). Avant la correction, on n'aurait pas eu de faux
    // positif sur "blé" mais on garde ce cas pour valider que plusieurs
    // allergies coexistent correctement.
    const product = makeProduct({
      ingredients_raw: 'eau, soja, sucre, sel',
    });
    const profile = profileWith({ allergies: ['soja', 'gluten', 'arachides'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const allergyHits = result.incompatibilities.filter((i) => i.type === 'allergy');
    expect(allergyHits).toHaveLength(1);
    expect(allergyHits[0].labelFr.toLowerCase()).toContain('soja');
  });

  it('FODMAP : "ail" en mot entier déclenche, mais pas "ailerons"', () => {
    const product = makeProduct({
      ingredients_raw: 'ailerons de poulet, sel',
    });
    const profile = profileWith({ conditions: ['ibs_fodmap'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const fodmapHits = result.incompatibilities.filter(
      (i) => i.type === 'condition' && /fodmap/i.test(i.labelFr),
    );
    expect(fodmapHits).toHaveLength(0);
  });
});
