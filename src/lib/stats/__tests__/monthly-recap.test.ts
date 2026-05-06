/**
 * Tests TDD du calculateur de récap mensuel.
 *
 * Le filtrage temporel utilise le fuseau Europe/Paris : un scan tombe dans le
 * mois M si sa conversion locale Paris appartient à [début M, début M+1).
 */

import { calculateMonthlyRecap } from '../monthly-recap';
import type { ScanRecord } from '@/src/lib/gamification/types';

function makeScan(overrides: Partial<ScanRecord> = {}): ScanRecord {
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

describe('calculateMonthlyRecap', () => {
  it('tableau vide → totalScans=0, averageScore=0, worstProduct=null, badge=curieux', () => {
    const recap = calculateMonthlyRecap([], 2026, 3); // avril 2026

    expect(recap.totalScans).toBe(0);
    expect(recap.averageScore).toBe(0);
    expect(recap.worstProduct).toBeNull();
    expect(recap.bestProduct).toBeNull();
    expect(recap.avoidCount).toBe(0);
    expect(recap.excellentCount).toBe(0);
    expect(recap.badge).toBe('curieux');
    expect(recap.topBrand).toBeNull();
    expect(recap.topCategory).toBeNull();
    expect(recap.monthLabel).toMatch(/Avril 2026/i);
  });

  it('30 scans dans le mois → badge=detective', () => {
    const scans: ScanRecord[] = Array.from({ length: 30 }, (_, i) =>
      makeScan({
        barcode: String(i).padStart(13, '0'),
        scanned_at: `2026-04-${String((i % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
        score_at_scan: 60,
      }),
    );

    const recap = calculateMonthlyRecap(scans, 2026, 3);

    expect(recap.totalScans).toBe(30);
    expect(recap.badge).toBe('detective');
  });

  it('20 scans dans le mois → badge=eclaire', () => {
    const scans: ScanRecord[] = Array.from({ length: 20 }, (_, i) =>
      makeScan({
        barcode: String(i).padStart(13, '0'),
        scanned_at: `2026-04-${String((i % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
        score_at_scan: 55,
      }),
    );

    const recap = calculateMonthlyRecap(scans, 2026, 3);

    expect(recap.totalScans).toBe(20);
    expect(recap.badge).toBe('eclaire');
  });

  it('10 scans dans le mois → badge=curieux', () => {
    const scans: ScanRecord[] = Array.from({ length: 10 }, (_, i) =>
      makeScan({
        barcode: String(i).padStart(13, '0'),
        scanned_at: `2026-04-${String((i % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
        score_at_scan: 50,
      }),
    );

    const recap = calculateMonthlyRecap(scans, 2026, 3);

    expect(recap.totalScans).toBe(10);
    expect(recap.badge).toBe('curieux');
  });

  it('filtrage par year/month — exclut les scans hors période (2 dans, 3 hors)', () => {
    const scans: ScanRecord[] = [
      // 2 scans dans avril 2026
      makeScan({
        barcode: '1111111111111',
        scanned_at: '2026-04-05T10:00:00.000Z',
        score_at_scan: 70,
      }),
      makeScan({
        barcode: '2222222222222',
        scanned_at: '2026-04-25T10:00:00.000Z',
        score_at_scan: 80,
      }),
      // 3 scans hors période
      makeScan({
        barcode: '3333333333333',
        scanned_at: '2026-03-30T10:00:00.000Z',
        score_at_scan: 30,
      }),
      makeScan({
        barcode: '4444444444444',
        scanned_at: '2026-05-01T10:00:00.000Z',
        score_at_scan: 40,
      }),
      makeScan({
        barcode: '5555555555555',
        scanned_at: '2025-04-15T10:00:00.000Z',
        score_at_scan: 25,
      }),
    ];

    const recap = calculateMonthlyRecap(scans, 2026, 3);

    expect(recap.totalScans).toBe(2);
    expect(recap.averageScore).toBe(75);
  });

  it('worstProduct = scan le plus bas, bestProduct = scan le plus haut, topBrand/topCategory = les plus fréquents', () => {
    const scans: ScanRecord[] = [
      {
        barcode: '0000000000001',
        score_at_scan: 20,
        scanned_at: '2026-04-02T10:00:00.000Z',
        product_type: 'food',
        is_favorite: false,
        category_slug: 'biscuits',
      },
      {
        barcode: '0000000000002',
        score_at_scan: 90,
        scanned_at: '2026-04-08T10:00:00.000Z',
        product_type: 'food',
        is_favorite: false,
        category_slug: 'fruits',
      },
      {
        barcode: '0000000000003',
        score_at_scan: 50,
        scanned_at: '2026-04-12T10:00:00.000Z',
        product_type: 'food',
        is_favorite: false,
        category_slug: 'biscuits',
      },
      {
        barcode: '0000000000004',
        score_at_scan: 30,
        scanned_at: '2026-04-20T10:00:00.000Z',
        product_type: 'food',
        is_favorite: false,
        category_slug: 'biscuits',
      },
    ];

    const recap = calculateMonthlyRecap(scans, 2026, 3, {
      productLookup: {
        '0000000000001': { name: 'Biscuit Choco', brand: 'BrandA' },
        '0000000000002': { name: 'Pomme Bio', brand: 'BrandB' },
        '0000000000003': { name: 'Cookie XL', brand: 'BrandA' },
        '0000000000004': { name: 'Sablé', brand: 'BrandA' },
      },
    });

    expect(recap.worstProduct).not.toBeNull();
    expect(recap.worstProduct?.barcode).toBe('0000000000001');
    expect(recap.worstProduct?.score).toBe(20);

    expect(recap.bestProduct).not.toBeNull();
    expect(recap.bestProduct?.barcode).toBe('0000000000002');
    expect(recap.bestProduct?.score).toBe(90);

    expect(recap.topBrand).toBe('BrandA');
    expect(recap.topCategory).toBe('biscuits');
    expect(recap.avoidCount).toBe(2); // scores < 40 → 20 et 30
    expect(recap.excellentCount).toBe(1); // scores >= 75 → 90
  });
});
