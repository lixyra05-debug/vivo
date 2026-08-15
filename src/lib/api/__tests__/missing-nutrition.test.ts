/**
 * BLOQUANT 4 — FACE 2, voie (i) : une macro ABSENTE n'est pas une macro à
 * zéro. La note ne bouge pas (voie ii = calibrage = lot 3) ; l'absence est
 * DÉCLARÉE à l'écran, au même niveau que la note, via
 * `getMissingNutritionFields` → `MissingNutritionBanner`.
 *
 * Le couple de tests « décision documentée » verrouille les deux moitiés
 * ENSEMBLE : l'adaptateur lit 0 (la note n'invente ni risque ni innocence)
 * ET le helper liste le champ (l'absence se dit). Retirer l'une des deux
 * moitiés fait tomber ce fichier.
 */
import { getMissingNutritionFields } from '../confidence';
import { productToScoringInput } from '../openfoodfacts';
import type { Product } from '../types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '0000000000001',
    name: 'Produit test',
    brand: 'Test',
    image_url: null,
    ingredients_raw: 'eau, sel',
    additives_tags: [],
    nova_group: 1,
    nutriscore_grade: null,
    energy_kcal_100g: null,
    sugars_100g: 0,
    saturated_fat_100g: 0,
    salt_100g: 0,
    proteins_100g: null,
    fiber_100g: null,
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

describe('getMissingNutritionFields — absent ≠ zéro, dans les DEUX sens', () => {
  it('sugars_100g: null → « sucres » listé', () => {
    expect(getMissingNutritionFields(makeProduct({ sugars_100g: null }))).toContain('sucres');
  });

  it('sugars_100g: 0 → « sucres » NON listé (zéro est une valeur)', () => {
    expect(getMissingNutritionFields(makeProduct({ sugars_100g: 0 }))).not.toContain('sucres');
  });

  it('saturated_fat_100g: null → « gras saturés » listé ; 0 → non listé', () => {
    expect(getMissingNutritionFields(makeProduct({ saturated_fat_100g: null }))).toContain(
      'gras saturés',
    );
    expect(getMissingNutritionFields(makeProduct({ saturated_fat_100g: 0 }))).not.toContain(
      'gras saturés',
    );
  });

  it('salt_100g: null → « sel » listé ; 0 → non listé', () => {
    expect(getMissingNutritionFields(makeProduct({ salt_100g: null }))).toContain('sel');
    expect(getMissingNutritionFields(makeProduct({ salt_100g: 0 }))).not.toContain('sel');
  });

  it('les trois macros pénalisables présentes (même à 0) → liste vide', () => {
    expect(getMissingNutritionFields(makeProduct())).toEqual([]);
  });

  it('les trois absentes → les trois, dans un ordre stable', () => {
    expect(
      getMissingNutritionFields(
        makeProduct({ sugars_100g: null, saturated_fat_100g: null, salt_100g: null }),
      ),
    ).toEqual(['sucres', 'gras saturés', 'sel']);
  });
});

describe('le ?? 0 de l\'adaptateur est une DÉCISION documentée, pas un oubli', () => {
  it('macro absente : le moteur lit 0 ET le helper la liste — les deux moitiés ensemble', () => {
    const product = makeProduct({ sugars_100g: null });
    // Moitié 1 — la note ne bouge pas : l'absence est lue 0 par le moteur
    // (voie i actée ; changer la note = calibrage = lot 3).
    expect(productToScoringInput(product).macros_100g.sugars).toBe(0);
    // Moitié 2 — l'absence n'est pas absoute pour autant : elle est déclarée.
    expect(getMissingNutritionFields(product)).toContain('sucres');
  });
});
