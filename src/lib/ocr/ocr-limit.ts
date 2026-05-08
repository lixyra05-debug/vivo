import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_COUNT = '@vivo_ocr_daily_count';
const KEY_DATE = '@vivo_ocr_daily_date';

export const OCR_DAILY_LIMIT_FREE = 3;

export interface OcrLimitStatus {
  used: number;
  remaining: number;
  reachedLimit: boolean;
}

function todayParisISODate(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // fr-CA → "YYYY-MM-DD"
  return fmt.format(now);
}

async function readState(now: Date = new Date()): Promise<{ count: number; date: string }> {
  const today = todayParisISODate(now);
  const [storedDate, storedCount] = await Promise.all([
    AsyncStorage.getItem(KEY_DATE),
    AsyncStorage.getItem(KEY_COUNT),
  ]);

  if (storedDate !== today) {
    return { count: 0, date: today };
  }

  const parsed = storedCount ? Number.parseInt(storedCount, 10) : 0;
  const safe = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  return { count: safe, date: today };
}

export async function getOcrLimitStatus(now: Date = new Date()): Promise<OcrLimitStatus> {
  const { count } = await readState(now);
  return {
    used: count,
    remaining: Math.max(0, OCR_DAILY_LIMIT_FREE - count),
    reachedLimit: count >= OCR_DAILY_LIMIT_FREE,
  };
}

export async function consumeOcrScan(now: Date = new Date()): Promise<OcrLimitStatus> {
  const { count, date } = await readState(now);
  const next = count + 1;
  await Promise.all([
    AsyncStorage.setItem(KEY_DATE, date),
    AsyncStorage.setItem(KEY_COUNT, String(next)),
  ]);
  return {
    used: next,
    remaining: Math.max(0, OCR_DAILY_LIMIT_FREE - next),
    reachedLimit: next >= OCR_DAILY_LIMIT_FREE,
  };
}

export async function resetOcrLimit(): Promise<void> {
  await Promise.all([AsyncStorage.removeItem(KEY_DATE), AsyncStorage.removeItem(KEY_COUNT)]);
}
