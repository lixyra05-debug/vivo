/**
 * Tests TDD du moteur de statistiques avancées (Premium tier).
 *
 * Couvre : trend 28j, distribution buckets, top categories/brands, streak,
 * exposition toxicologique sur 30j (penalties_snapshot agrégé).
 */
import { calculateAdvancedStats } from '../advanced-stats';
import type { ScanRecord } from '@/src/lib/gamification/types';

interface ScanRecordWithPenalties extends ScanRecord {
  penalties_snapshot?: unknown;
  brand?: string | null;
}

function makeScan(
  overrides: Partial<ScanRecordWithPenalties> = {},
): ScanRecordWithPenalties {
  return {
    barcode: '0000000000000',
    score_at_scan: 50,
    scanned_at: '2026-04-15T10:00:00.000Z',
    product_type: 'food',
    is_favorite: false,
    category_slug: null,
    ...overrides,
  };
}

describe('calculateAdvancedStats', () => {
  it('tableau vide → tous les compteurs à 0, distribution {0,…,0}, slope=0, worstAdditive=null', () => {
    const stats = calculateAdvancedStats([], new Date('2026-05-07T10:00:00Z'));

    expect(stats.trend28d.points).toHaveLength(28);
    expect(stats.trend28d.slope).toBe(0);
    expect(stats.distribution).toEqual({
      excellent: 0,
      good: 0,
      mid: 0,
      poor: 0,
      bad: 0,
    });
    expect(stats.topCategories).toEqual([]);
    expect(stats.topBrands).toEqual([]);
    expect(stats.streak).toEqual({ current: 0, longest: 0 });
    expect(stats.toxicExposure).toEqual({
      totalPenalties: 0,
      uniqueAdditives: 0,
      worstAdditive: null,
    });
  });

  it('distribution buckets : 5 scans avec scores [90, 80, 60, 40, 20]', () => {
    const scans: ScanRecord[] = [
      makeScan({ barcode: '1', score_at_scan: 90 }),
      makeScan({ barcode: '2', score_at_scan: 80 }),
      makeScan({ barcode: '3', score_at_scan: 60 }),
      makeScan({ barcode: '4', score_at_scan: 40 }),
      makeScan({ barcode: '5', score_at_scan: 20 }),
    ];
    const stats = calculateAdvancedStats(scans, new Date('2026-05-07T10:00:00Z'));

    expect(stats.distribution).toEqual({
      excellent: 1, // >= 85
      good: 1, // 70-84
      mid: 1, // 50-69
      poor: 1, // 30-49
      bad: 1, // < 30
    });
  });

  it("topBrands tie-break : count égal → la plus haute avgScore l'emporte", () => {
    const scans = [
      // Brand A : count=3, avgScore=80
      makeScan({ barcode: 'a1', brand: 'BrandA', score_at_scan: 80 }),
      makeScan({ barcode: 'a2', brand: 'BrandA', score_at_scan: 80 }),
      makeScan({ barcode: 'a3', brand: 'BrandA', score_at_scan: 80 }),
      // Brand B : count=3, avgScore=60
      makeScan({ barcode: 'b1', brand: 'BrandB', score_at_scan: 60 }),
      makeScan({ barcode: 'b2', brand: 'BrandB', score_at_scan: 60 }),
      makeScan({ barcode: 'b3', brand: 'BrandB', score_at_scan: 60 }),
    ];
    const stats = calculateAdvancedStats(
      scans as ScanRecord[],
      new Date('2026-05-07T10:00:00Z'),
    );

    expect(stats.topBrands).toHaveLength(2);
    expect(stats.topBrands[0].name).toBe('BrandA');
    expect(stats.topBrands[0].avgScore).toBe(80);
    expect(stats.topBrands[1].name).toBe('BrandB');
  });

  it('slope > 1 quand les scores augmentent linéairement sur 28 jours', () => {
    const now = new Date('2026-05-07T10:00:00Z');
    const scans: ScanRecord[] = [];
    // Pour chaque jour des 28 derniers, un scan avec score croissant 30 → 85
    for (let i = 0; i < 28; i++) {
      const dayMs = now.getTime() - (27 - i) * 86_400_000;
      const score = 30 + i * 2; // 30, 32, …, 84
      scans.push(
        makeScan({
          barcode: `d${i}`,
          score_at_scan: score,
          scanned_at: new Date(dayMs).toISOString(),
        }),
      );
    }
    const stats = calculateAdvancedStats(scans, now);

    expect(stats.trend28d.slope).toBeGreaterThan(1);
  });

  it('toxic exposure agrège penalties_snapshot et identifie le worstAdditive', () => {
    const now = new Date('2026-05-07T10:00:00Z');
    const recent = (offsetDays: number) =>
      new Date(now.getTime() - offsetDays * 86_400_000).toISOString();
    const scans: ScanRecordWithPenalties[] = [
      makeScan({
        barcode: 's1',
        scanned_at: recent(1),
        penalties_snapshot: [{ code: 'E951', points: 5 }],
      }),
      makeScan({
        barcode: 's2',
        scanned_at: recent(2),
        penalties_snapshot: [{ code: 'E951', points: 5 }],
      }),
      makeScan({
        barcode: 's3',
        scanned_at: recent(3),
        penalties_snapshot: [{ code: 'E211', points: 3 }],
      }),
    ];
    const stats = calculateAdvancedStats(scans as ScanRecord[], now);

    expect(stats.toxicExposure.uniqueAdditives).toBe(2);
    expect(stats.toxicExposure.totalPenalties).toBe(13);
    expect(stats.toxicExposure.worstAdditive).toEqual({ code: 'E951', count: 2 });
  });
});
