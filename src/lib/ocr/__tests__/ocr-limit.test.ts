import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  consumeOcrScan,
  getOcrLimitStatus,
  resetOcrLimit,
  OCR_DAILY_LIMIT_FREE,
} from '../ocr-limit';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('ocr-limit', () => {
  it('initialement remaining = OCR_DAILY_LIMIT_FREE et reachedLimit=false', async () => {
    const status = await getOcrLimitStatus();
    expect(status.used).toBe(0);
    expect(status.remaining).toBe(OCR_DAILY_LIMIT_FREE);
    expect(status.reachedLimit).toBe(false);
  });

  it('consumeOcrScan incrémente le compteur, après 3 scans reachedLimit=true', async () => {
    const day = new Date('2026-05-07T10:00:00Z');
    let status = await consumeOcrScan(day);
    expect(status.used).toBe(1);
    expect(status.reachedLimit).toBe(false);

    status = await consumeOcrScan(day);
    expect(status.used).toBe(2);

    status = await consumeOcrScan(day);
    expect(status.used).toBe(3);
    expect(status.remaining).toBe(0);
    expect(status.reachedLimit).toBe(true);
  });

  it('reset au passage à un nouveau jour Paris (date différente)', async () => {
    const day1 = new Date('2026-05-07T10:00:00Z');
    await consumeOcrScan(day1);
    await consumeOcrScan(day1);
    let status = await getOcrLimitStatus(day1);
    expect(status.used).toBe(2);

    const day2 = new Date('2026-05-08T10:00:00Z');
    status = await getOcrLimitStatus(day2);
    expect(status.used).toBe(0);
    expect(status.remaining).toBe(OCR_DAILY_LIMIT_FREE);
  });

  it('resetOcrLimit remet à zéro', async () => {
    const day = new Date('2026-05-07T10:00:00Z');
    await consumeOcrScan(day);
    await consumeOcrScan(day);
    await resetOcrLimit();
    const status = await getOcrLimitStatus(day);
    expect(status.used).toBe(0);
  });
});
