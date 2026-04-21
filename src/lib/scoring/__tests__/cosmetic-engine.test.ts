import { calculateCosmeticScore } from '../cosmetic-engine';
import { COSMETIC_INGREDIENTS, findCosmeticIngredient } from '../cosmetic-ingredients-db';
import type { CosmeticScoringInput } from '../../api/types';

function baseInput(overrides: Partial<CosmeticScoringInput> = {}): CosmeticScoringInput {
  return {
    barcode: '0000000000000',
    ingredients_inci: '',
    ingredients_list: [],
    category: null,
    ...overrides,
  };
}

describe('COSMETIC_INGREDIENTS database', () => {
  it('contient au moins 100 entrées INCI', () => {
    expect(COSMETIC_INGREDIENTS.length).toBeGreaterThanOrEqual(100);
  });

  it('retrouve un ingrédient par son alias', () => {
    const entry = findCosmeticIngredient('parabens');
    expect(entry).not.toBeNull();
    expect(entry?.inci).toBe('methylparaben');
  });
});

describe('calculateCosmeticScore', () => {
  it('1. Pure water → score 100, color green, no penalties', () => {
    const result = calculateCosmeticScore(
      baseInput({ ingredients_list: ['aqua'] }),
      'standard'
    );
    expect(result.score_final).toBe(100);
    expect(result.score_color).toBe('green');
    expect(result.penalties).toHaveLength(0);
    expect(result.blockers).toHaveLength(0);
    expect(result.risky_ingredients).toHaveLength(0);
  });

  it('2. Shampoo with SLS + sodium chloride + cocamidopropyl betaine → mid-score, SLS in risky_ingredients', () => {
    const result = calculateCosmeticScore(
      baseInput({
        ingredients_list: [
          'aqua',
          'sodium lauryl sulfate',
          'sodium chloride',
          'cocamidopropyl betaine',
        ],
      }),
      'standard'
    );
    // SLS = 15, cocamidopropyl betaine = 3, total = 18, score = 82
    expect(result.score_final).toBeGreaterThanOrEqual(80);
    expect(result.score_final).toBeLessThanOrEqual(90);
    expect(
      result.risky_ingredients.some((r) => r.inci === 'sodium lauryl sulfate')
    ).toBe(true);
  });

  it('3. Cream with methylparaben → standard profile deducts its penalty, score < 100', () => {
    const result = calculateCosmeticScore(
      baseInput({
        ingredients_list: ['aqua', 'glycerin', 'methylparaben'],
      }),
      'standard'
    );
    expect(result.score_final).toBeLessThan(100);
    expect(result.score_final).toBe(75); // 100 - 25
    expect(result.blockers).toHaveLength(0);
    expect(
      result.risky_ingredients.some((r) => r.inci === 'methylparaben')
    ).toBe(true);
  });

  it('4. Same cream + pregnant profile → blocked, score ≤ 30, methylparaben in blockers', () => {
    const result = calculateCosmeticScore(
      baseInput({
        ingredients_list: ['aqua', 'glycerin', 'methylparaben'],
      }),
      'enceinte'
    );
    expect(result.score_final).toBeLessThanOrEqual(30);
    expect(
      result.blockers.some((b) => b.toLowerCase().includes('methylparaben'))
    ).toBe(true);
    expect(result.profile_adjustments.length).toBeGreaterThan(0);
  });

  it('5. Cream with MIT + limonene → peau_sensible profile doubles both penalties', () => {
    const standard = calculateCosmeticScore(
      baseInput({
        ingredients_list: ['aqua', 'methylisothiazolinone', 'limonene'],
      }),
      'standard'
    );
    const sensitive = calculateCosmeticScore(
      baseInput({
        ingredients_list: ['aqua', 'methylisothiazolinone', 'limonene'],
      }),
      'peau_sensible'
    );
    // Standard: MIT 20 + limonene 10 = 30 → score 70
    // Sensitive: both doubled: MIT 40 + limonene 20 = 60 → score 40
    expect(standard.score_final).toBe(70);
    expect(sensitive.score_final).toBe(40);
    expect(sensitive.profile_adjustments.length).toBeGreaterThanOrEqual(2);
  });

  it('6. Baby oil with phenoxyethanol → bebe profile blocks it', () => {
    const result = calculateCosmeticScore(
      baseInput({
        ingredients_list: [
          'prunus amygdalus dulcis',
          'tocopherol',
          'phenoxyethanol',
        ],
      }),
      'bebe'
    );
    expect(
      result.blockers.some((b) => b.toLowerCase().includes('phenoxyethanol'))
    ).toBe(true);
    expect(result.score_final).toBeLessThanOrEqual(30);
  });

  it('7. Unknown INCI (pseudoingredientxyz) → ignored, no penalty', () => {
    const result = calculateCosmeticScore(
      baseInput({
        ingredients_list: ['aqua', 'pseudoingredientxyz', 'glycerin'],
      }),
      'standard'
    );
    expect(result.score_final).toBe(100);
    expect(result.penalties).toHaveLength(0);
  });

  it('8. Duplicate INCI in list → counted once', () => {
    const result = calculateCosmeticScore(
      baseInput({
        ingredients_list: ['aqua', 'methylparaben', 'methylparaben', 'methylparaben'],
      }),
      'standard'
    );
    // Only one penalty of 25, not 75
    expect(result.score_final).toBe(75);
    expect(
      result.penalties.filter((p) => p.code === 'methylparaben')
    ).toHaveLength(1);
  });

  it('9. Case insensitive matching (METHYLPARABEN same as methylparaben)', () => {
    const upper = calculateCosmeticScore(
      baseInput({ ingredients_list: ['AQUA', 'METHYLPARABEN'] }),
      'standard'
    );
    const lower = calculateCosmeticScore(
      baseInput({ ingredients_list: ['aqua', 'methylparaben'] }),
      'standard'
    );
    expect(upper.score_final).toBe(lower.score_final);
    expect(upper.score_final).toBe(75);
  });

  it('10. Alias matching (parabens lookup)', () => {
    const result = calculateCosmeticScore(
      baseInput({ ingredients_list: ['aqua', 'parabens'] }),
      'standard'
    );
    // 'parabens' is an alias of methylparaben → penalty 25
    expect(result.score_final).toBe(75);
    expect(
      result.risky_ingredients.some((r) => r.inci === 'methylparaben')
    ).toBe(true);
  });

  it('11. Score clamped to 0 (pile many high-penalty ingredients) → score 0, color red', () => {
    const result = calculateCosmeticScore(
      baseInput({
        ingredients_list: [
          'methylparaben', // 25
          'ethylparaben', // 25
          'propylparaben', // 30
          'butylparaben', // 30
          'bha', // 30
          'bht', // 25
          'triclosan', // 35
          'oxybenzone', // 30
        ],
      }),
      'standard'
    );
    expect(result.score_final).toBe(0);
    expect(result.score_color).toBe('red');
  });

  it('12. Score color mapping thresholds (green / yellow / orange / red)', () => {
    // Green ≥ 70: pure water
    const green = calculateCosmeticScore(
      baseInput({ ingredients_list: ['aqua'] }),
      'standard'
    );
    expect(green.score_color).toBe('green');

    // Yellow 50-69: a BHT (25) + sodium lauryl sulfate (15) = 40 → score 60
    const yellow = calculateCosmeticScore(
      baseInput({ ingredients_list: ['aqua', 'bht', 'sodium lauryl sulfate'] }),
      'standard'
    );
    expect(yellow.score_final).toBeGreaterThanOrEqual(50);
    expect(yellow.score_final).toBeLessThan(70);
    expect(yellow.score_color).toBe('yellow');

    // Orange 30-49: two parabens (25 + 25) + BHT (25) = 75 → score 25? Actually need 30-49
    // methylparaben (25) + BHA (30) + BHT (25) = 80 → score 20 (red)
    // Try methylparaben (25) + BHA (30) = 55 → score 45 → orange
    const orange = calculateCosmeticScore(
      baseInput({ ingredients_list: ['aqua', 'methylparaben', 'bha'] }),
      'standard'
    );
    expect(orange.score_final).toBeGreaterThanOrEqual(30);
    expect(orange.score_final).toBeLessThan(50);
    expect(orange.score_color).toBe('orange');

    // Red < 30
    const red = calculateCosmeticScore(
      baseInput({
        ingredients_list: ['methylparaben', 'ethylparaben', 'bha', 'bht', 'triclosan'],
      }),
      'standard'
    );
    expect(red.score_final).toBeLessThan(30);
    expect(red.score_color).toBe('red');
  });

  it('13. risky_ingredients sorted by penalty descending', () => {
    const result = calculateCosmeticScore(
      baseInput({
        ingredients_list: ['aqua', 'limonene', 'triclosan', 'methylparaben'],
      }),
      'standard'
    );
    // limonene=10, methylparaben=25, triclosan=35 → order: triclosan, methylparaben, limonene
    const penalties = result.risky_ingredients.map((r) => {
      const e = findCosmeticIngredient(r.inci);
      return e?.penalty ?? 0;
    });
    for (let i = 0; i < penalties.length - 1; i++) {
      expect(penalties[i]).toBeGreaterThanOrEqual(penalties[i + 1]);
    }
    expect(result.risky_ingredients[0].inci).toBe('triclosan');
  });

  it('14. profile_adjustments populated only when a profile rule fires', () => {
    // Standard profile with no ingredients with override → empty
    const neutral = calculateCosmeticScore(
      baseInput({ ingredients_list: ['aqua', 'glycerin'] }),
      'standard'
    );
    expect(neutral.profile_adjustments).toHaveLength(0);

    // peau_sensible with limonene (override 'double') → one adjustment
    const sensitive = calculateCosmeticScore(
      baseInput({ ingredients_list: ['aqua', 'limonene'] }),
      'peau_sensible'
    );
    expect(sensitive.profile_adjustments.length).toBeGreaterThan(0);
  });

  it('15. Score ≥ 70 and no penalties → color green, blockers empty', () => {
    const result = calculateCosmeticScore(
      baseInput({
        ingredients_list: ['aqua', 'glycerin', 'tocopherol', 'hyaluronic acid'],
      }),
      'standard'
    );
    expect(result.score_final).toBeGreaterThanOrEqual(70);
    expect(result.score_color).toBe('green');
    expect(result.blockers).toHaveLength(0);
    expect(result.penalties).toHaveLength(0);
  });
});
