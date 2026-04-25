import {
  getCurrentWeekRange,
  calculateWeeklySummary,
  formatWeeklySummaryMessage,
} from '../weekly-summary';
import type { ScanRecord, WeeklySummary } from '../types';

function makeScan(
  parisDate: string,
  score = 50,
  category_slug: string | null = null,
  product_type: 'food' | 'cosmetic' = 'food'
): ScanRecord {
  return {
    barcode: `${parisDate}-${score}-${Math.random()}`,
    score_at_scan: score,
    scanned_at: new Date(`${parisDate}T12:00:00+02:00`).toISOString(),
    product_type,
    is_favorite: false,
    category_slug,
  };
}

describe('weekly-summary', () => {
  it('semaine vide → totalScans=0 et message "calme"', () => {
    const summary = calculateWeeklySummary([], [], 0);
    expect(summary.totalScans).toBe(0);
    expect(summary.averageScore).toBe(0);
    expect(summary.productsAvoided).toBe(0);
    expect(summary.excellentProducts).toBe(0);
    expect(summary.topCategory).toBeNull();
    expect(summary.streakDays).toBe(0);
    expect(formatWeeklySummaryMessage(summary)).toBe(
      'Cette semaine est calme. Reprends quand tu veux !'
    );
  });

  it('5 scans variés calcule totalScans, avgScore, avoided/excellent', () => {
    const scans: ScanRecord[] = [
      makeScan('2026-04-20', 90, 'snacks'), // excellent
      makeScan('2026-04-21', 85, 'snacks'), // excellent
      makeScan('2026-04-22', 25, 'boissons'), // avoided
      makeScan('2026-04-23', 50, 'snacks'),
      makeScan('2026-04-24', 70, 'snacks'),
    ];
    const summary = calculateWeeklySummary(scans, [], 5);
    expect(summary.totalScans).toBe(5);
    // Moyenne: (90+85+25+50+70)/5 = 64
    expect(summary.averageScore).toBe(64);
    expect(summary.productsAvoided).toBe(1);
    expect(summary.excellentProducts).toBe(2);
    expect(summary.streakDays).toBe(5);
  });

  it('comparisonVsLastWeek calcule le delta absolu', () => {
    const thisWeek: ScanRecord[] = Array.from({ length: 10 }, () =>
      makeScan('2026-04-22', 60)
    );
    const lastWeek: ScanRecord[] = Array.from({ length: 5 }, () =>
      makeScan('2026-04-15', 50)
    );
    const summary = calculateWeeklySummary(thisWeek, lastWeek, 10);
    expect(summary.comparisonVsLastWeek.scans).toBe(5);
    expect(summary.comparisonVsLastWeek.avgScore).toBe(10); // 60 - 50
  });

  it('formatWeeklySummaryMessage formate correctement (regex sur éléments clés)', () => {
    const summary: WeeklySummary = {
      totalScans: 7,
      averageScore: 72,
      productsAvoided: 1,
      excellentProducts: 3,
      topCategory: 'snacks',
      streakDays: 4,
      comparisonVsLastWeek: { scans: 3, avgScore: 6 },
    };
    const msg = formatWeeklySummaryMessage(summary);
    expect(msg).toMatch(/7 scans/);
    expect(msg).toMatch(/72\/100/);
    // Belle progression OU score moyen progresse OU continue : on attend l'un de ces motifs.
    expect(msg).toMatch(
      /Belle progression|score moyen progresse|Continue|chaque scan compte/
    );
  });

  it('topCategory retourne le slug le plus fréquent ou null si <2 scans avec catégorie', () => {
    // Cas null : aucun scan avec category_slug
    expect(
      calculateWeeklySummary(
        [makeScan('2026-04-20', 60), makeScan('2026-04-21', 60)],
        [],
        0
      ).topCategory
    ).toBeNull();
    // Cas null : 1 seul scan avec catégorie
    expect(
      calculateWeeklySummary(
        [
          makeScan('2026-04-20', 60, 'snacks'),
          makeScan('2026-04-21', 60, null),
        ],
        [],
        0
      ).topCategory
    ).toBeNull();
    // Cas avec top : snacks majoritaire
    const scans: ScanRecord[] = [
      makeScan('2026-04-20', 60, 'snacks'),
      makeScan('2026-04-21', 60, 'snacks'),
      makeScan('2026-04-22', 60, 'boissons'),
    ];
    expect(calculateWeeklySummary(scans, [], 0).topCategory).toBe('snacks');
  });

  it('getCurrentWeekRange renvoie lundi 00:00 → dimanche 23:59 Europe/Paris', () => {
    // Mercredi 22 avril 2026 14:00 Paris
    const wed = new Date('2026-04-22T14:00:00+02:00');
    const { start, end } = getCurrentWeekRange(wed);
    // start doit être lundi 20 avril 2026 00:00 Paris (UTC: 2026-04-19T22:00:00Z car CEST UTC+2)
    expect(start.toISOString()).toBe('2026-04-19T22:00:00.000Z');
    expect(end.toISOString()).toBe('2026-04-26T21:59:59.999Z');

    // Cas dimanche après minuit : la semaine doit contenir CE dimanche.
    const sun = new Date('2026-04-26T01:00:00+02:00'); // dimanche 26 avril 01:00 Paris
    const range2 = getCurrentWeekRange(sun);
    expect(range2.start.toISOString()).toBe('2026-04-19T22:00:00.000Z');
    expect(range2.end.toISOString()).toBe('2026-04-26T21:59:59.999Z');
  });
});
