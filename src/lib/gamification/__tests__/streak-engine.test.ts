import {
  calculateStreak,
  isStreakActive,
  getStreakMessage,
} from '../streak-engine';
import type { ScanRecord } from '../types';

/**
 * Helper : construit un ScanRecord minimal avec une date Europe/Paris à minuit local.
 * On exprime la date locale Paris en ISO UTC.
 */
function makeScan(parisDate: string, score = 50): ScanRecord {
  // parisDate ex: '2026-04-25' — on prend midi local pour éviter les bordures DST.
  return {
    barcode: '1234',
    score_at_scan: score,
    scanned_at: new Date(`${parisDate}T12:00:00+02:00`).toISOString(),
    product_type: 'food',
    is_favorite: false,
    category_slug: null,
  };
}

describe('streak-engine', () => {
  describe('calculateStreak', () => {
    it('retourne 0/0/null pour un tableau vide', () => {
      expect(calculateStreak([])).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastScanDate: null,
      });
    });

    it('compte 3 jours consécutifs (avant-hier/hier/aujourd\'hui Paris)', () => {
      // On simule "aujourd'hui = 2026-04-25" via la date des scans
      const now = new Date('2026-04-25T12:00:00+02:00');
      const scans: ScanRecord[] = [
        makeScan('2026-04-23'),
        makeScan('2026-04-24'),
        makeScan('2026-04-25'),
      ];
      const result = calculateStreak(scans, now);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
      expect(result.lastScanDate).toBe('2026-04-25');
    });

    it('casse le streak après un gap de 2 jours et repart à 1', () => {
      const now = new Date('2026-04-25T12:00:00+02:00');
      const scans: ScanRecord[] = [
        makeScan('2026-04-20'),
        makeScan('2026-04-21'),
        makeScan('2026-04-22'),
        // gap (rien le 23 ni le 24)
        makeScan('2026-04-25'),
      ];
      const result = calculateStreak(scans, now);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(3);
      expect(result.lastScanDate).toBe('2026-04-25');
    });

    it('retourne longestStreak correctement (5 jours puis 3 jours)', () => {
      const now = new Date('2026-04-25T12:00:00+02:00');
      const scans: ScanRecord[] = [
        // 5 jours consécutifs
        makeScan('2026-04-10'),
        makeScan('2026-04-11'),
        makeScan('2026-04-12'),
        makeScan('2026-04-13'),
        makeScan('2026-04-14'),
        // gap
        // 3 jours consécutifs incluant aujourd'hui
        makeScan('2026-04-23'),
        makeScan('2026-04-24'),
        makeScan('2026-04-25'),
      ];
      const result = calculateStreak(scans, now);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(5);
    });
  });

  describe('isStreakActive', () => {
    it('retourne true si lastScanDate est aujourd\'hui ou hier, false au-delà', () => {
      const now = new Date('2026-04-25T08:00:00+02:00');
      expect(isStreakActive('2026-04-25', now)).toBe(true);
      expect(isStreakActive('2026-04-24', now)).toBe(true);
      expect(isStreakActive('2026-04-23', now)).toBe(false);
      expect(isStreakActive(null, now)).toBe(false);
    });
  });

  describe('getStreakMessage', () => {
    it('retourne les bons messages FR par palier', () => {
      expect(getStreakMessage(0)).toBe(
        'Scanne un produit pour lancer ton streak !'
      );
      expect(getStreakMessage(1)).toBe('Premier pas !');
      expect(getStreakMessage(2)).toBe('2 jours, ça commence bien !');
      expect(getStreakMessage(4)).toBe('4 jours de suite, beau début !');
      expect(getStreakMessage(7)).toBe('1 semaine, impressionnant !');
      expect(getStreakMessage(14)).toBe('2 semaines, tu es régulier !');
      expect(getStreakMessage(30)).toBe('1 mois ! Tu es un expert !');
      expect(getStreakMessage(60)).toBe('Incroyable, 60 jours !');
    });
  });
});
