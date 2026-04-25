import { calculateProfileStats } from '@/src/lib/stats/profile-stats-engine';
import type { ScanRecord } from '@/src/lib/gamification/types';

/**
 * Helpers de construction de scans pour les tests.
 * Les timestamps sont en UTC ; le fuseau Europe/Paris est appliqué côté engine.
 */
function makeScan(overrides: Partial<ScanRecord> = {}): ScanRecord {
  return {
    barcode: '0000000000000',
    score_at_scan: 50,
    scanned_at: '2026-04-22T10:00:00.000Z',
    product_type: 'food',
    is_favorite: false,
    category_slug: null,
    ...overrides,
  };
}

describe('calculateProfileStats', () => {
  // "now" figé : mercredi 22 avril 2026 12:00 UTC = 14:00 Europe/Paris
  // Semaine ISO en cours : lundi 20 avril → dimanche 26 avril (Europe/Paris)
  const now = new Date('2026-04-22T12:00:00.000Z');

  it('retourne tous zéros quand aucun scan, avec scansByDay de 28 entrées toutes à zéro', () => {
    const stats = calculateProfileStats([], now);

    expect(stats.totalScans).toBe(0);
    expect(stats.totalCosmeticScans).toBe(0);
    expect(stats.averageScoreAllTime).toBe(0);
    expect(stats.averageScoreThisWeek).toBe(0);
    expect(stats.productsAvoided).toBe(0);
    expect(stats.excellentProducts).toBe(0);
    expect(stats.topCategories).toEqual([]);
    expect(stats.scansByDay).toHaveLength(28);
    expect(stats.scansByDay.every((d) => d.count === 0 && d.avgScore === 0)).toBe(true);
    expect(stats.weekOverWeekDelta).toEqual({ scans: 0, avgScore: 0 });
  });

  it('avec 1 scan aujourd\'hui, totalScans=1 et scansByDay[27].count=1', () => {
    const scans: ScanRecord[] = [
      makeScan({ score_at_scan: 75, scanned_at: '2026-04-22T10:00:00.000Z' }),
    ];

    const stats = calculateProfileStats(scans, now);

    expect(stats.totalScans).toBe(1);
    expect(stats.averageScoreAllTime).toBe(75);
    expect(stats.scansByDay).toHaveLength(28);
    expect(stats.scansByDay[27].count).toBe(1);
    expect(stats.scansByDay[27].avgScore).toBe(75);
    expect(stats.scansByDay[27].date).toBe('2026-04-22');
  });

  it('avec 50 scans variés, totalScans/averageScoreAllTime/productsAvoided/excellentProducts corrects', () => {
    const scans: ScanRecord[] = [];
    // 20 produits "à éviter" (score < 30) — score 10
    for (let i = 0; i < 20; i++) {
      scans.push(makeScan({ score_at_scan: 10, scanned_at: '2026-04-15T10:00:00.000Z' }));
    }
    // 10 produits "excellents" (score > 80) — score 90
    for (let i = 0; i < 10; i++) {
      scans.push(makeScan({ score_at_scan: 90, scanned_at: '2026-04-16T10:00:00.000Z' }));
    }
    // 20 produits "neutres" — score 50
    for (let i = 0; i < 20; i++) {
      scans.push(makeScan({ score_at_scan: 50, scanned_at: '2026-04-17T10:00:00.000Z' }));
    }

    const stats = calculateProfileStats(scans, now);

    expect(stats.totalScans).toBe(50);
    // (20*10 + 10*90 + 20*50) / 50 = (200 + 900 + 1000) / 50 = 42
    expect(stats.averageScoreAllTime).toBe(42);
    expect(stats.productsAvoided).toBe(20);
    expect(stats.excellentProducts).toBe(10);
  });

  it('topCategories retourne le top 3 par count desc', () => {
    const scans: ScanRecord[] = [
      ...Array.from({ length: 5 }, () =>
        makeScan({ category_slug: 'biscuits', scanned_at: '2026-04-20T10:00:00.000Z' })
      ),
      ...Array.from({ length: 8 }, () =>
        makeScan({ category_slug: 'boissons', scanned_at: '2026-04-20T10:00:00.000Z' })
      ),
      ...Array.from({ length: 3 }, () =>
        makeScan({ category_slug: 'cereales', scanned_at: '2026-04-20T10:00:00.000Z' })
      ),
      ...Array.from({ length: 2 }, () =>
        makeScan({ category_slug: 'plats-prepares', scanned_at: '2026-04-20T10:00:00.000Z' })
      ),
      // Sans catégorie : ne doit pas apparaître
      ...Array.from({ length: 4 }, () =>
        makeScan({ category_slug: null, scanned_at: '2026-04-20T10:00:00.000Z' })
      ),
    ];

    const stats = calculateProfileStats(scans, now);

    expect(stats.topCategories).toHaveLength(3);
    expect(stats.topCategories[0]).toEqual({ category: 'boissons', count: 8 });
    expect(stats.topCategories[1]).toEqual({ category: 'biscuits', count: 5 });
    expect(stats.topCategories[2]).toEqual({ category: 'cereales', count: 3 });
  });

  it('weekOverWeekDelta positif : 10 scans cette semaine vs 5 la précédente → scans=+5', () => {
    const scans: ScanRecord[] = [];
    // Cette semaine ISO (lundi 20 avril → dimanche 26 avril Paris) : 10 scans avec score 80
    for (let i = 0; i < 10; i++) {
      scans.push(
        makeScan({
          score_at_scan: 80,
          scanned_at: '2026-04-21T10:00:00.000Z', // mardi 21 avril, semaine en cours
        })
      );
    }
    // Semaine précédente (lundi 13 avril → dimanche 19 avril Paris) : 5 scans avec score 50
    for (let i = 0; i < 5; i++) {
      scans.push(
        makeScan({
          score_at_scan: 50,
          scanned_at: '2026-04-15T10:00:00.000Z', // mercredi 15 avril, semaine précédente
        })
      );
    }

    const stats = calculateProfileStats(scans, now);

    expect(stats.weekOverWeekDelta.scans).toBe(5);
    expect(stats.weekOverWeekDelta.avgScore).toBe(30); // 80 - 50
    expect(stats.averageScoreThisWeek).toBe(80);
  });

  it('weekOverWeekDelta négatif : 3 scans cette semaine vs 8 la précédente → scans=-5', () => {
    const scans: ScanRecord[] = [];
    for (let i = 0; i < 3; i++) {
      scans.push(makeScan({ score_at_scan: 60, scanned_at: '2026-04-21T10:00:00.000Z' }));
    }
    for (let i = 0; i < 8; i++) {
      scans.push(makeScan({ score_at_scan: 70, scanned_at: '2026-04-15T10:00:00.000Z' }));
    }

    const stats = calculateProfileStats(scans, now);

    expect(stats.weekOverWeekDelta.scans).toBe(-5);
    expect(stats.weekOverWeekDelta.avgScore).toBe(-10); // 60 - 70
  });

  it('totalCosmeticScans compte uniquement product_type === "cosmetic"', () => {
    const scans: ScanRecord[] = [
      makeScan({ product_type: 'food', scanned_at: '2026-04-21T10:00:00.000Z' }),
      makeScan({ product_type: 'food', scanned_at: '2026-04-21T10:00:00.000Z' }),
      makeScan({ product_type: 'cosmetic', scanned_at: '2026-04-21T10:00:00.000Z' }),
      makeScan({ product_type: 'cosmetic', scanned_at: '2026-04-21T10:00:00.000Z' }),
      makeScan({ product_type: 'cosmetic', scanned_at: '2026-04-21T10:00:00.000Z' }),
    ];

    const stats = calculateProfileStats(scans, now);

    expect(stats.totalScans).toBe(5);
    expect(stats.totalCosmeticScans).toBe(3);
  });
});
