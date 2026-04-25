import { checkCompatibility, FODMAP_TRIGGERS } from '../compatibility-engine';
import type {
  CompatibilityProfile,
  CosmeticProduct,
  CosmeticScoringResult,
  Product,
  ScoringResult,
} from '../../api/types';

// === Fixtures ===

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

function makeCosmetic(overrides: Partial<CosmeticProduct> = {}): CosmeticProduct {
  return {
    barcode: '0000000000002',
    name: 'Cosmétique test',
    brand: 'Test',
    image_url: null,
    ingredients_inci: '',
    ingredients_list: [],
    category: null,
    image_ingredients_url: null,
    obf_last_updated: null,
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

function makeCosmeticScoring(
  overrides: Partial<CosmeticScoringResult> = {}
): CosmeticScoringResult {
  return {
    score_final: 80,
    score_color: 'green',
    penalties: [],
    blockers: [],
    risky_ingredients: [],
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

describe('checkCompatibility', () => {
  it('1. profil vide → tout compatible (rien à tester)', () => {
    const result = checkCompatibility(makeProduct(), makeScoring(), emptyProfile());
    expect(result.isCompatible).toBe(true);
    expect(result.incompatibilities).toEqual([]);
    expect(result.compatibilityPercentage).toBe(100);
    expect(result.score).toBe(80);
  });

  it('2. produit gluten + profil cœliaque (allergie gluten) → incompatible, 1 blocker', () => {
    const product = makeProduct({
      ingredients_raw: 'farine de blé, eau, sel',
    });
    const profile = emptyProfile({ allergies: ['gluten'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.isCompatible).toBe(false);
    const blockers = result.incompatibilities.filter((i) => i.severity === 'blocker');
    expect(blockers).toHaveLength(1);
    expect(blockers[0].type).toBe('allergy');
    expect(blockers[0].labelFr.toLowerCase()).toContain('gluten');
  });

  it('3. produit avec 25g sucres + condition diabete → incompatible (warning sucres élevés)', () => {
    const product = makeProduct({ sugars_100g: 25 });
    const profile = emptyProfile({ conditions: ['diabete'] });
    const result = checkCompatibility(product, makeScoring({ score_final: 60 }), profile);
    expect(result.isCompatible).toBe(true); // warning, not blocker
    const warnings = result.incompatibilities.filter((i) => i.severity === 'warning');
    expect(warnings.length).toBeGreaterThanOrEqual(1);
    expect(warnings.some((w) => w.labelFr.toLowerCase().includes('sucres'))).toBe(true);
  });

  it('4. produit avec sel 2g/100g + condition bebe → incompatible (warning ou blocker)', () => {
    const product = makeProduct({ salt_100g: 2 });
    const profile = emptyProfile({ conditions: ['bebe'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.incompatibilities.length).toBeGreaterThanOrEqual(1);
    expect(
      result.incompatibilities.some((i) => i.type === 'condition' && /sel/i.test(i.labelFr))
    ).toBe(true);
  });

  it('5. produit avec "ail, oignon" dans ingrédients + condition ibs_fodmap → 2 incompatibilités', () => {
    const product = makeProduct({
      ingredients_raw: 'tomate, ail, oignon, sel',
    });
    const profile = emptyProfile({ conditions: ['ibs_fodmap'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const fodmapHits = result.incompatibilities.filter(
      (i) => i.type === 'condition' && /fodmap|ail|oignon/i.test(i.labelFr)
    );
    expect(fodmapHits.length).toBeGreaterThanOrEqual(2);
  });

  it('6. produit score 30 + minScore 50 → blocker score', () => {
    const profile = emptyProfile({ minScore: 50 });
    const result = checkCompatibility(makeProduct(), makeScoring({ score_final: 30 }), profile);
    expect(result.isCompatible).toBe(false);
    const scoreBlocker = result.incompatibilities.find((i) => i.type === 'score');
    expect(scoreBlocker).toBeDefined();
    expect(scoreBlocker?.severity).toBe('blocker');
    expect(scoreBlocker?.labelFr).toContain('30');
    expect(scoreBlocker?.labelFr).toContain('50');
  });

  it('7. compatibilityPercentage = 80% quand 4/5 critères passent', () => {
    // 4 allergies + 1 score check = 5 critères
    // Produit déclenche seulement gluten → 1 incompat / 5 = 20% failed → 80% passed
    const product = makeProduct({ ingredients_raw: 'farine de blé' });
    const profile = emptyProfile({
      allergies: ['gluten', 'arachides', 'soja', 'lupin'],
      minScore: 0,
    });
    const result = checkCompatibility(product, makeScoring({ score_final: 80 }), profile);
    expect(result.compatibilityPercentage).toBe(80);
  });

  it('8. multi-incompatibilités triées : blockers en premier', () => {
    const product = makeProduct({
      ingredients_raw: 'farine de blé, huile de palme',
      sugars_100g: 30,
    });
    const profile = emptyProfile({
      allergies: ['gluten'], // blocker
      avoid: ['huile_palme'], // warning
      conditions: ['diabete'], // warning (sucres élevés)
    });
    const result = checkCompatibility(product, makeScoring({ score_final: 70 }), profile);
    // First should be blocker
    expect(result.incompatibilities[0].severity).toBe('blocker');
    // Find first warning index
    const firstWarningIdx = result.incompatibilities.findIndex(
      (i) => i.severity === 'warning'
    );
    const lastBlockerIdx = result.incompatibilities.map((i) => i.severity).lastIndexOf(
      'blocker'
    );
    expect(lastBlockerIdx).toBeLessThan(firstWarningIdx);
  });

  it('9. produit vegan-safe + dietary vegan → compatible', () => {
    const product = makeProduct({
      ingredients_raw: 'haricots rouges, tomate, oignon, riz, épices',
    });
    const profile = emptyProfile({ dietary: ['vegan'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.isCompatible).toBe(true);
  });

  it('10. produit avec gélatine + dietary halal → blocker', () => {
    const product = makeProduct({
      ingredients_raw: 'sucre, gélatine de porc, arôme',
    });
    const profile = emptyProfile({ dietary: ['halal'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.isCompatible).toBe(false);
    const blockers = result.incompatibilities.filter(
      (i) => i.severity === 'blocker' && i.type === 'dietary'
    );
    expect(blockers.length).toBeGreaterThanOrEqual(1);
  });

  it('11. produit avec ingredients_text contenant "alcool" + condition enceinte → blocker', () => {
    const product = makeProduct({
      ingredients_raw: 'eau, sucre, alcool, arôme',
    });
    const profile = emptyProfile({ conditions: ['enceinte'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.isCompatible).toBe(false);
    expect(
      result.incompatibilities.some(
        (i) => i.severity === 'blocker' && /alcool/i.test(i.labelFr)
      )
    ).toBe(true);
  });

  it('12. produit cosmétique avec rétinol INCI + condition enceinte → blocker', () => {
    const cosmetic = makeCosmetic({
      ingredients_inci: 'aqua, retinol, glycerin',
      ingredients_list: ['Aqua', 'Retinol', 'Glycerin'],
    });
    const profile = emptyProfile({ conditions: ['enceinte'] });
    const result = checkCompatibility(cosmetic, makeCosmeticScoring(), profile);
    expect(result.isCompatible).toBe(false);
    expect(
      result.incompatibilities.some(
        (i) => i.severity === 'blocker' && /r[ée]tinol|retinol/i.test(i.labelFr)
      )
    ).toBe(true);
  });

  it('13. produit avec saturated_fat 8g/100g + condition cholesterol → warning', () => {
    const product = makeProduct({ saturated_fat_100g: 8 });
    const profile = emptyProfile({ conditions: ['cholesterol'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const w = result.incompatibilities.find(
      (i) => i.type === 'condition' && /satur[ée]|gras/i.test(i.labelFr)
    );
    expect(w).toBeDefined();
    expect(w?.severity).toBe('warning');
  });

  it('14. produit avec salt 2g/100g + condition hypertension → warning', () => {
    const product = makeProduct({ salt_100g: 2 });
    const profile = emptyProfile({ conditions: ['hypertension'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const w = result.incompatibilities.find(
      (i) => i.type === 'condition' && /sel/i.test(i.labelFr)
    );
    expect(w).toBeDefined();
    expect(w?.severity).toBe('warning');
  });

  it('15. produit avec huile de palme + avoid huile_palme → warning', () => {
    const product = makeProduct({
      ingredients_raw: 'farine, sucre, huile de palme, sel',
    });
    const profile = emptyProfile({ avoid: ['huile_palme'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const w = result.incompatibilities.find(
      (i) => i.type === 'avoid' && /palme/i.test(i.labelFr)
    );
    expect(w).toBeDefined();
    expect(w?.severity).toBe('warning');
  });

  it('16. produit avec colorant E150d + avoid colorants → warning', () => {
    const product = makeProduct({
      additives_tags: ['en:e150d'],
    });
    const profile = emptyProfile({ avoid: ['colorants'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const w = result.incompatibilities.find(
      (i) => i.type === 'avoid' && /colorant/i.test(i.labelFr)
    );
    expect(w).toBeDefined();
    expect(w?.severity).toBe('warning');
  });

  it('17. ingredients_raw null + profil avec allergies → warning données insuffisantes', () => {
    const product = makeProduct({ ingredients_raw: null });
    const profile = emptyProfile({ allergies: ['gluten'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const w = result.incompatibilities.find(
      (i) => i.severity === 'warning' && /donn[ée]es insuffisantes/i.test(i.labelFr)
    );
    expect(w).toBeDefined();
  });

  it('18. profil avec 14 allergies + ingredients vide → percentage 100 (rien testable)', () => {
    const product = makeProduct({ ingredients_raw: '' });
    const profile = emptyProfile({
      allergies: [
        'gluten',
        'lactose',
        'arachides',
        'fruits_a_coque',
        'soja',
        'oeufs',
        'poisson',
        'crustaces',
        'celeri',
        'moutarde',
        'sesame',
        'sulfites',
        'lupin',
        'mollusques',
      ],
    });
    const result = checkCompatibility(product, makeScoring({ score_final: 100 }), profile);
    expect(result.compatibilityPercentage).toBe(100);
    expect(result.isCompatible).toBe(true);
  });
});

describe('FODMAP_TRIGGERS', () => {
  it('contient au moins 20 entrées', () => {
    expect(FODMAP_TRIGGERS.length).toBeGreaterThanOrEqual(20);
  });

  it('contient ail, oignon, lactose', () => {
    expect(FODMAP_TRIGGERS).toContain('ail');
    expect(FODMAP_TRIGGERS).toContain('oignon');
    expect(FODMAP_TRIGGERS).toContain('lactose');
  });
});
