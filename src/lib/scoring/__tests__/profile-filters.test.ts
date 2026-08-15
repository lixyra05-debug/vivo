import { isProductCompatible, getIncompatibilityReasons } from '../profile-filters';
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

/**
 * VERROU SÉMANTIQUE — ne pas retirer, ne pas « simplifier ».
 *
 * Deux questions différentes, deux réponses différentes :
 *  - `checkCompatibility(...).isCompatible` répond à « existe-t-il un
 *    blocker ? » (blockers.length === 0). Cette sémantique est GELÉE : elle
 *    est consommée ailleurs et ne doit pas changer.
 *  - `isProductCompatible` répond à « peut-on AFFIRMER ce produit compatible ? »
 *    — ce qui exige que la vérification ait eu lieu. Un produit sans liste
 *    d'ingrédients n'a pas de blocker parce qu'on n'a rien pu chercher :
 *    il sort du filtre « Ce que je peux manger ». Au doute, on exclut.
 *
 * Barrière de score inerte par construction : `makeScoring()` pose
 * `score_final: 80` contre `minScore: 0` — si ces tests tombent, c'est par
 * le chemin de la vérification, jamais par le score.
 */
describe('isProductCompatible — « pas vérifié » n\'est pas « compatible »', () => {
  it('6. exclut un produit invérifiable malgré isCompatible=true côté moteur', () => {
    const product = makeProduct({ ingredients_raw: null });
    const profile = emptyProfile({ allergies: ['gluten'] });

    // Pré-condition (R2) : la sémantique du MOTEUR est inchangée — pas de
    // blocker trouvé, donc isCompatible=true, mais vérification impossible.
    const engine = checkCompatibility(product, makeScoring(), profile);
    expect(engine.isCompatible).toBe(true);
    expect(engine.verificationStatus).toBe('insufficient_data');

    // …et pourtant le filtre ne doit PAS l'affirmer compatible.
    expect(isProductCompatible(product, makeScoring(), profile)).toBe(false);
  });

  it('7. garde un produit vérifié ET compatible (pas de sur-exclusion)', () => {
    const product = makeProduct({ ingredients_raw: 'eau, sel' });
    const profile = emptyProfile({ allergies: ['gluten'] });
    expect(checkCompatibility(product, makeScoring(), profile).verificationStatus).toBe(
      'verified'
    );
    expect(isProductCompatible(product, makeScoring(), profile)).toBe(true);
  });

  it('8. profil sans rien à vérifier : un produit sans ingrédients reste compatible', () => {
    // Aucun contrôle demandé → rien d'invérifiable → aucune raison d'exclure.
    const product = makeProduct({ ingredients_raw: null });
    expect(isProductCompatible(product, makeScoring(), emptyProfile())).toBe(true);
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
