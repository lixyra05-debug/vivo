import { findRemedies, searchRemedies } from '../remedy-finder';

describe('remedy-finder', () => {
  describe('findRemedies', () => {
    it("findRemedies('sleep') retourne au moins 5 plantes", () => {
      const plants = findRemedies('sleep');
      expect(plants.length).toBeGreaterThanOrEqual(5);
      const ids = plants.map((p) => p.id);
      // chamomile, valerian, linden, passionflower, hops, melissa
      expect(ids).toEqual(
        expect.arrayContaining([
          'chamomile',
          'valerian',
          'linden',
          'passionflower',
        ]),
      );
    });

    it("findRemedies('inexistant') retourne []", () => {
      expect(findRemedies('inexistant')).toEqual([]);
    });
  });

  describe('searchRemedies', () => {
    it("searchRemedies('dormir') retourne la catégorie sleep", () => {
      const cats = searchRemedies('dormir');
      const ids = cats.map((c) => c.id);
      expect(ids).toContain('sleep');
    });

    it("searchRemedies('') et searchRemedies('   ') retournent []", () => {
      expect(searchRemedies('')).toEqual([]);
      expect(searchRemedies('   ')).toEqual([]);
    });
  });
});
