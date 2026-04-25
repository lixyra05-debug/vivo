import { SCORING_METHODOLOGY } from '../transparency';

describe('transparency / SCORING_METHODOLOGY', () => {
  it('food.weights somme à 100', () => {
    const w = SCORING_METHODOLOGY.food.weights as Record<string, number>;
    const sum = Object.values(w).reduce((acc, v) => acc + v, 0);
    expect(sum).toBe(100);
  });

  it('cosmetic.weights somme à 100', () => {
    const w = SCORING_METHODOLOGY.cosmetic.weights as Record<string, number>;
    const sum = Object.values(w).reduce((acc, v) => acc + v, 0);
    expect(sum).toBe(100);
  });

  it('faq, sources et structure complète', () => {
    expect(SCORING_METHODOLOGY.faq.length).toBe(5);
    for (const entry of SCORING_METHODOLOGY.faq) {
      expect(entry.questionFr.length).toBeGreaterThan(0);
      expect(entry.answerFr.length).toBeGreaterThan(0);
    }
    expect(SCORING_METHODOLOGY.food.sources.length).toBeGreaterThanOrEqual(4);
    expect(SCORING_METHODOLOGY.cosmetic.sources.length).toBeGreaterThanOrEqual(4);
    for (const src of [
      ...SCORING_METHODOLOGY.food.sources,
      ...SCORING_METHODOLOGY.cosmetic.sources,
    ]) {
      expect(src.name.length).toBeGreaterThan(0);
      expect(src.url).toMatch(/^https?:\/\//);
    }
    // Seuils cohérents
    expect(SCORING_METHODOLOGY.food.thresholds.excellent).toBeGreaterThan(
      SCORING_METHODOLOGY.food.thresholds.good
    );
    expect(SCORING_METHODOLOGY.cosmetic.thresholds.good).toBeGreaterThan(
      SCORING_METHODOLOGY.cosmetic.thresholds.mediocre
    );
  });
});
