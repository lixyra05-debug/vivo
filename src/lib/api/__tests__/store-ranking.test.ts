/**
 * Store ranking — calcule la qualité moyenne des produits par enseigne
 * via un proxy Nutri-Score (A=90, B=70, C=50, D=30, E=10).
 *
 * Source : Open Food Facts API v2, params stores_tags + countries_tags=france
 * Cache : 1h (3 600 000 ms)
 */

import {
  calculateStoreRanking,
  nutriScoreToProxy,
  clearStoreRankingCache,
  type StoreRanking,
} from '../store-ranking';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function mockOffSearch(grades: string[]): void {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      products: grades.map((g, i) => ({
        code: `code-${i}`,
        nutrition_grades: g,
      })),
    }),
  });
}

describe('store-ranking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearStoreRankingCache();
  });

  describe('nutriScoreToProxy', () => {
    it('mappe A→90, B→70, C→50, D→30, E→10', () => {
      expect(nutriScoreToProxy('a')).toBe(90);
      expect(nutriScoreToProxy('b')).toBe(70);
      expect(nutriScoreToProxy('c')).toBe(50);
      expect(nutriScoreToProxy('d')).toBe(30);
      expect(nutriScoreToProxy('e')).toBe(10);
    });

    it('renvoie null pour grade inconnu / vide / unknown', () => {
      expect(nutriScoreToProxy('')).toBeNull();
      expect(nutriScoreToProxy('unknown')).toBeNull();
      expect(nutriScoreToProxy('not-applicable')).toBeNull();
      expect(nutriScoreToProxy(null)).toBeNull();
      expect(nutriScoreToProxy(undefined)).toBeNull();
    });

    it('est case-insensitive', () => {
      expect(nutriScoreToProxy('A')).toBe(90);
      expect(nutriScoreToProxy('E')).toBe(10);
    });
  });

  describe('calculateStoreRanking', () => {
    it('retourne un tableau trié par avgScore décroissant avec les 10 enseignes', async () => {
      // 10 enseignes — fournit des notes différentes pour chacune
      const sets: string[][] = [
        ['a', 'a', 'b'], // carrefour ~83
        ['a', 'b', 'b'], // leclerc ~77
        ['b', 'b', 'c'], // auchan ~63
        ['b', 'c', 'c'], // intermarche ~57
        ['c', 'c', 'd'], // picard ~43
        ['c', 'd', 'd'], // monoprix ~37
        ['d', 'd', 'e'], // lidl ~23
        ['d', 'e', 'e'], // aldi ~17
        ['e', 'e', 'e'], // casino 10
        ['a', 'b', 'c'], // franprix 70
      ];
      for (const s of sets) mockOffSearch(s);

      const ranking = await calculateStoreRanking();
      expect(ranking).toHaveLength(10);
      for (let i = 1; i < ranking.length; i++) {
        expect(ranking[i - 1].avgScore).toBeGreaterThanOrEqual(
          ranking[i].avgScore,
        );
      }
      const slugs = ranking.map((r) => r.slug);
      expect(slugs).toEqual(expect.arrayContaining(['carrefour', 'casino']));
    });

    it('chaque entrée porte slug, nameFr, emoji, avgScore (0-100), productCount, color', async () => {
      for (let i = 0; i < 10; i++) mockOffSearch(['a', 'b', 'c']);

      const ranking: StoreRanking[] = await calculateStoreRanking();
      for (const r of ranking) {
        expect(typeof r.slug).toBe('string');
        expect(r.slug.length).toBeGreaterThan(0);
        expect(typeof r.nameFr).toBe('string');
        expect(typeof r.emoji).toBe('string');
        expect(r.avgScore).toBeGreaterThanOrEqual(0);
        expect(r.avgScore).toBeLessThanOrEqual(100);
        expect(typeof r.productCount).toBe('number');
        expect(r.productCount).toBeGreaterThanOrEqual(0);
        expect(['green', 'yellow', 'orange', 'red']).toContain(r.color);
      }
    });

    it("ignore les produits sans nutriscore valide dans le calcul de moyenne", async () => {
      // 5 produits dont 3 sans grade utilisable → moyenne sur 2 (a + a = 90)
      mockOffSearch(['a', 'unknown', 'not-applicable', '', 'a']);
      for (let i = 0; i < 9; i++) mockOffSearch(['c']);

      const ranking = await calculateStoreRanking();
      const carrefour = ranking.find((r) => r.slug === 'carrefour');
      expect(carrefour).toBeDefined();
      expect(carrefour!.avgScore).toBe(90);
      // productCount = nb de produits avec un score valide pris en compte
      expect(carrefour!.productCount).toBe(2);
    });

    it("renvoie avgScore=0 et productCount=0 si OFF répond vide ou erreur", async () => {
      // Toutes les enseignes répondent vide
      for (let i = 0; i < 10; i++) {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ products: [] }),
        });
      }
      const ranking = await calculateStoreRanking();
      for (const r of ranking) {
        expect(r.avgScore).toBe(0);
        expect(r.productCount).toBe(0);
      }
    });

    it("met en cache 1h — un second appel n'effectue aucun fetch supplémentaire", async () => {
      for (let i = 0; i < 10; i++) mockOffSearch(['a', 'b', 'c']);

      await calculateStoreRanking();
      expect(fetchMock).toHaveBeenCalledTimes(10);
      fetchMock.mockClear();

      await calculateStoreRanking();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
