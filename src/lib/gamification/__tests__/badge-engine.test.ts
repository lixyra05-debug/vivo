import {
  BADGES,
  getUserStats,
  checkBadges,
  getBadgeById,
} from '../badge-engine';
import type { ScanRecord, EarnedBadge } from '../types';

function makeScan(
  parisDate: string,
  score = 50,
  product_type: 'food' | 'cosmetic' = 'food'
): ScanRecord {
  return {
    barcode: `${parisDate}-${score}`,
    score_at_scan: score,
    scanned_at: new Date(`${parisDate}T12:00:00+02:00`).toISOString(),
    product_type,
    is_favorite: false,
    category_slug: null,
  };
}

describe('badge-engine', () => {
  it('catalogue contient 12 badges avec ids uniques', () => {
    expect(BADGES.length).toBe(12);
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(12);
  });

  it('aucun scan → 0 badges gagnés', () => {
    const stats = getUserStats([], 0, 1);
    const { earned } = checkBadges(stats, []);
    expect(earned).toEqual([]);
  });

  it('1 scan food → first_scan gagné, autres milestones non', () => {
    const stats = getUserStats([makeScan('2026-04-25', 60)], 0, 1);
    const { earned } = checkBadges(stats, []);
    const ids = earned.map((b) => b.id);
    expect(ids).toContain('first_scan');
    expect(ids).not.toContain('explorer');
    expect(ids).not.toContain('expert');
  });

  it('newlyEarned filtre les badges déjà obtenus', () => {
    const stats = getUserStats([makeScan('2026-04-25', 60)], 0, 1);
    const already: EarnedBadge[] = [
      { badgeId: 'first_scan', earnedAt: new Date().toISOString() },
    ];
    const { earned, newlyEarned } = checkBadges(stats, already);
    expect(earned.map((b) => b.id)).toContain('first_scan');
    expect(newlyEarned.map((b) => b.id)).not.toContain('first_scan');
  });

  it('10 scans dont 5 cosmétiques + 3 score<30 + 1 score>90 → first_scan + explorer + beauty', () => {
    const scans: ScanRecord[] = [
      makeScan('2026-04-25', 95), // excellent (mais pas 20)
      makeScan('2026-04-24', 20), // avoided
      makeScan('2026-04-23', 25), // avoided
      makeScan('2026-04-22', 28), // avoided
      makeScan('2026-04-21', 60),
      makeScan('2026-04-20', 50, 'cosmetic'),
      makeScan('2026-04-19', 50, 'cosmetic'),
      makeScan('2026-04-18', 50, 'cosmetic'),
      makeScan('2026-04-17', 50, 'cosmetic'),
      makeScan('2026-04-16', 50, 'cosmetic'),
    ];
    const stats = getUserStats(scans, 0, 1);
    const { earned } = checkBadges(stats, []);
    const ids = earned.map((b) => b.id);
    expect(ids).toContain('first_scan');
    expect(ids).toContain('explorer');
    expect(ids).toContain('beauty');
    expect(ids).not.toContain('expert'); // 10 < 50
  });

  it('débloque 11 badges (tout sauf family) avec un set massif', () => {
    // Construire un user qui maxe tout sauf family.
    // 100 scans (legend), 30 cosmétiques (beauty), 30 score<30 (vigilant), 30 score>80 (gourmet),
    // streak 30 (flame_7 + tireless_30), 3 reports (detective), avg30 ≥ 75 (perfectionist).
    const scans: ScanRecord[] = [];
    // 30 jours consécutifs jusqu'au 25 avril → currentStreak = 30
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.UTC(2026, 2, 27 + i, 10, 0, 0));
      const dateStr = d.toISOString().slice(0, 10);
      // un scan par jour, score = 80 → moyenne 80 > 75
      scans.push({
        barcode: `daily-${dateStr}`,
        score_at_scan: 80,
        scanned_at: d.toISOString(),
        product_type: 'food',
        is_favorite: false,
        category_slug: null,
      });
    }
    // 30 cosmétiques en plus (sur des dates plus anciennes pour ne pas casser le streak)
    for (let i = 0; i < 30; i++) {
      scans.push(makeScan('2025-12-01', 50, 'cosmetic'));
    }
    // 30 produits évités (score<30) dates anciennes
    for (let i = 0; i < 30; i++) {
      scans.push(makeScan('2025-11-01', 20));
    }
    // 30 produits excellents en plus (score>80)
    for (let i = 0; i < 30; i++) {
      scans.push(makeScan('2025-10-01', 90));
    }

    const stats = getUserStats(
      scans,
      3,
      1,
      new Date('2026-04-25T12:00:00+02:00')
    );
    expect(stats.totalScans).toBeGreaterThanOrEqual(100);
    expect(stats.cosmeticScans).toBeGreaterThanOrEqual(5);
    expect(stats.productsAvoided).toBeGreaterThanOrEqual(10);
    expect(stats.excellentProducts).toBeGreaterThanOrEqual(20);
    expect(stats.currentStreak).toBeGreaterThanOrEqual(30);
    expect(stats.reportsSubmitted).toBe(3);
    expect(stats.hasMultipleProfiles).toBe(false);
    expect(stats.averageScoreLast30).toBeGreaterThanOrEqual(75);

    const { earned } = checkBadges(stats, []);
    const ids = earned.map((b) => b.id);
    const expected = [
      'first_scan',
      'explorer',
      'expert',
      'legend',
      'flame_7',
      'tireless_30',
      'vigilant',
      'beauty',
      'gourmet',
      'detective',
      'perfectionist',
    ];
    for (const id of expected) {
      expect(ids).toContain(id);
    }
    expect(ids).not.toContain('family');
  });

  it('getBadgeById retourne le badge ou null', () => {
    expect(getBadgeById('expert')?.id).toBe('expert');
    expect(getBadgeById('expert')?.nameFr).toBe('Expert');
    expect(getBadgeById('inconnu')).toBeNull();
  });

  it('averageScoreLast30 est 0 si moins de 30 scans', () => {
    const scans: ScanRecord[] = [
      makeScan('2026-04-25', 95),
      makeScan('2026-04-24', 80),
    ];
    const stats = getUserStats(scans, 0, 1);
    expect(stats.averageScoreLast30).toBe(0);
  });

  it('hasMultipleProfiles=true via profileCount=2 → family débloqué', () => {
    const stats = getUserStats([makeScan('2026-04-25', 60)], 0, 2);
    expect(stats.hasMultipleProfiles).toBe(true);
    const { earned } = checkBadges(stats, []);
    expect(earned.map((b) => b.id)).toContain('family');
  });
});
