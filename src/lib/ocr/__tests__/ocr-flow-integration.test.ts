/**
 * Tests d'intégration légers sur les helpers ocr-limit consommés par
 * l'écran `app/ocr/analyzing.tsx`. Vérifie le contrat free user / 3 scans.
 *
 * Note : `consumeOcrScan` continue d'incrémenter au-delà de la limite
 * (le caller doit gate via `getOcrLimitStatus().reachedLimit` AVANT d'appeler
 * `consumeOcrScan`). Le présent test verrouille ce contrat.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  consumeOcrScan,
  getOcrLimitStatus,
  OCR_DAILY_LIMIT_FREE,
} from '../ocr-limit';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('ocr flow integration — quota free tier', () => {
  it("après 3 consumeOcrScan, getOcrLimitStatus().reachedLimit === true", async () => {
    const day = new Date('2026-05-08T10:00:00Z');
    for (let i = 0; i < OCR_DAILY_LIMIT_FREE; i += 1) {
      await consumeOcrScan(day);
    }
    const status = await getOcrLimitStatus(day);
    expect(status.used).toBe(OCR_DAILY_LIMIT_FREE);
    expect(status.remaining).toBe(0);
    expect(status.reachedLimit).toBe(true);
  });

  it("un 4ème consumeOcrScan continue d'incrémenter (le gate doit être appliqué côté caller)", async () => {
    const day = new Date('2026-05-08T10:00:00Z');
    for (let i = 0; i < OCR_DAILY_LIMIT_FREE; i += 1) {
      await consumeOcrScan(day);
    }
    // À ce stade, reachedLimit est true mais consumeOcrScan continue d'incrémenter
    const fourth = await consumeOcrScan(day);
    expect(fourth.used).toBe(OCR_DAILY_LIMIT_FREE + 1);
    expect(fourth.reachedLimit).toBe(true);
    expect(fourth.remaining).toBe(0); // Math.max(0, X) → reste 0
  });
});
