/**
 * store-ranking — exécution parallèle bornée à 3 (Sprint 2 B-006).
 * Avant : boucle séquentielle (10 fetch en série → ~10s sur 4G).
 * Après : 4 batches de max 3 → temps divisé par ~3.
 */

import {
  calculateStoreRanking,
  clearStoreRankingCache,
} from '../store-ranking';
import { STORES } from '../stores';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

describe('store-ranking — parallélisation bornée à 3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearStoreRankingCache();
  });

  it('1. concurrence maximale = 3 (jamais plus de 3 fetch in-flight)', async () => {
    let inFlight = 0;
    let maxConcurrent = 0;

    fetchMock.mockImplementation(() => {
      inFlight++;
      maxConcurrent = Math.max(maxConcurrent, inFlight);
      return new Promise((resolve) => {
        setTimeout(() => {
          inFlight--;
          resolve({
            ok: true,
            json: async () => ({
              products: [
                { code: 'p1', nutrition_grades: 'a' },
                { code: 'p2', nutrition_grades: 'b' },
              ],
            }),
          });
        }, 20);
      });
    });

    await calculateStoreRanking();
    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(maxConcurrent).toBeLessThanOrEqual(3);
    expect(maxConcurrent).toBeGreaterThan(1); // assure que c'est bien parallèle
  });

  it('2. résultat identique : 10 enseignes présentes avec scores cohérents', async () => {
    // Mock par slug : chaque enseigne renvoie un set unique → score déterministe
    const gradesBySlug: Record<string, string[]> = {
      carrefour: ['a', 'a'],
      leclerc: ['b', 'b'],
      auchan: ['c', 'c'],
      intermarche: ['d', 'd'],
      picard: ['e', 'e'],
      monoprix: ['a', 'b'],
      lidl: ['b', 'c'],
      aldi: ['c', 'd'],
      casino: ['d', 'e'],
      franprix: ['a', 'c'],
    };

    fetchMock.mockImplementation((url: string) => {
      const match = STORES.find((s) =>
        url.includes(`stores_tags=${s.offStoreTag}`),
      );
      const grades = match ? gradesBySlug[match.slug] ?? [] : [];
      return Promise.resolve({
        ok: true,
        json: async () => ({
          products: grades.map((g, i) => ({
            code: `${match?.slug}-${i}`,
            nutrition_grades: g,
          })),
        }),
      });
    });

    const ranking = await calculateStoreRanking();
    expect(ranking).toHaveLength(10);
    const slugs = ranking.map((r) => r.slug).sort();
    expect(slugs).toEqual(STORES.map((s) => s.slug).sort());
    // Vérifier ordre par score : décroissant
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1].avgScore).toBeGreaterThanOrEqual(
        ranking[i].avgScore,
      );
    }
    // Carrefour (a,a) → 90
    const carrefour = ranking.find((r) => r.slug === 'carrefour');
    expect(carrefour?.avgScore).toBe(90);
  });

  it("3. échec partiel : 1 enseigne timeout → les 9 autres OK, leclerc avgScore=0", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('stores_tags=leclerc')) {
        return Promise.reject(new Error('network down'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          products: [
            { code: 'p1', nutrition_grades: 'a' },
            { code: 'p2', nutrition_grades: 'b' },
          ],
        }),
      });
    });

    const ranking = await calculateStoreRanking();
    expect(ranking).toHaveLength(10);
    const leclerc = ranking.find((r) => r.slug === 'leclerc');
    expect(leclerc).toBeDefined();
    expect(leclerc?.avgScore).toBe(0);
    expect(leclerc?.productCount).toBe(0);
    // Les 9 autres sont OK
    const others = ranking.filter((r) => r.slug !== 'leclerc');
    for (const r of others) {
      expect(r.productCount).toBeGreaterThan(0);
    }
  });
});
