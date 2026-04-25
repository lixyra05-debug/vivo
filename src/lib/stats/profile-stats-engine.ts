/**
 * Moteur de calcul de statistiques agrégées du profil utilisateur.
 *
 * Toutes les agrégations temporelles utilisent le fuseau Europe/Paris pour
 * garantir une cohérence avec l'utilisateur final (la "semaine ISO" et le
 * "jour" sont calculés en heure locale Paris, pas en UTC).
 */

import type { ScanRecord } from '@/src/lib/gamification/types';

const PARIS_TIMEZONE = 'Europe/Paris';

export interface ProfileStats {
  totalScans: number;
  totalCosmeticScans: number;
  averageScoreAllTime: number;
  averageScoreThisWeek: number;
  productsAvoided: number;
  excellentProducts: number;
  topCategories: Array<{ category: string; count: number }>;
  scansByDay: Array<{ date: string; count: number; avgScore: number }>;
  weekOverWeekDelta: { scans: number; avgScore: number };
}

/**
 * Retourne la date au format YYYY-MM-DD dans le fuseau Europe/Paris.
 */
function toParisDateString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

/**
 * Retourne le numéro de jour de la semaine ISO (1=lundi, 7=dimanche)
 * dans le fuseau Europe/Paris.
 */
function getParisWeekday(date: Date): number {
  // Intl renvoie en anglais ; on mappe les short names → 1..7
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PARIS_TIMEZONE,
    weekday: 'short',
  });
  const short = formatter.format(date);
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return map[short] ?? 1;
}

/**
 * Construit une Date UTC qui, lorsqu'elle est convertie en Europe/Paris,
 * tombe à minuit (00:00) le `parisDateString` (format YYYY-MM-DD).
 *
 * Approche : on commence par minuit UTC du même jour, puis on ajuste de
 * l'offset Europe/Paris (heure UTC affichée à Paris pour cette date).
 */
function parisDateStartUtc(parisDateString: string): Date {
  const [year, month, day] = parisDateString.split('-').map((s) => parseInt(s, 10));
  // On part de midi UTC pour éviter les bascules autour de minuit
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  // À midi UTC, on regarde quelle heure il est à Paris pour déterminer l'offset
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PARIS_TIMEZONE,
    hour: '2-digit',
    hour12: false,
  });
  const parisHourStr = formatter.format(noonUtc);
  const parisHour = parseInt(parisHourStr, 10);
  // Offset Paris vs UTC en heures (été : +2, hiver : +1)
  const offsetHours = parisHour - 12;
  // Minuit Paris en UTC = 00:00 - offset
  return new Date(Date.UTC(year, month - 1, day, -offsetHours, 0, 0));
}

/**
 * Soustrait `nDays` jours civils Europe/Paris à `date`, retourne la date
 * Paris correspondante au format YYYY-MM-DD.
 */
function subtractParisDays(date: Date, nDays: number): string {
  const todayParis = toParisDateString(date);
  const todayMidnightUtc = parisDateStartUtc(todayParis);
  const target = new Date(todayMidnightUtc.getTime() - nDays * 24 * 60 * 60 * 1000);
  return toParisDateString(target);
}

/**
 * Retourne la date YYYY-MM-DD du lundi de la semaine ISO contenant `date`,
 * en fuseau Europe/Paris.
 */
function getMondayOfWeek(date: Date): string {
  const weekday = getParisWeekday(date); // 1..7
  const offsetDays = weekday - 1;
  return subtractParisDays(date, offsetDays);
}

/**
 * Calcule les statistiques de profil agrégées à partir d'une liste de scans.
 *
 * @param scans Liste des ScanRecord à agréger.
 * @param now  Date de référence (default: maintenant). Sert à figer "aujourd'hui"
 *             pour les tests et les snapshots.
 */
export function calculateProfileStats(scans: ScanRecord[], now: Date = new Date()): ProfileStats {
  const totalScans = scans.length;
  const totalCosmeticScans = scans.filter((s) => s.product_type === 'cosmetic').length;
  const productsAvoided = scans.filter((s) => s.score_at_scan < 30).length;
  const excellentProducts = scans.filter((s) => s.score_at_scan > 80).length;

  // Moyenne all-time
  const averageScoreAllTime =
    totalScans === 0
      ? 0
      : Math.round(scans.reduce((sum, s) => sum + s.score_at_scan, 0) / totalScans);

  // Lundi des semaines en cours et précédente (Europe/Paris)
  const mondayThisWeek = getMondayOfWeek(now);
  const mondayLastWeek = subtractParisDays(parisDateStartUtc(mondayThisWeek), 7);
  // Limite supérieure de la semaine précédente (lundi de cette semaine, exclusif)
  const mondayThisWeekUtc = parisDateStartUtc(mondayThisWeek);
  const mondayLastWeekUtc = parisDateStartUtc(mondayLastWeek);

  const scansThisWeek: ScanRecord[] = [];
  const scansLastWeek: ScanRecord[] = [];

  for (const scan of scans) {
    const ts = new Date(scan.scanned_at).getTime();
    if (ts >= mondayThisWeekUtc.getTime()) {
      scansThisWeek.push(scan);
    } else if (ts >= mondayLastWeekUtc.getTime()) {
      scansLastWeek.push(scan);
    }
  }

  const averageScoreThisWeek =
    scansThisWeek.length === 0
      ? 0
      : Math.round(
          scansThisWeek.reduce((sum, s) => sum + s.score_at_scan, 0) / scansThisWeek.length
        );

  const averageScoreLastWeek =
    scansLastWeek.length === 0
      ? 0
      : Math.round(
          scansLastWeek.reduce((sum, s) => sum + s.score_at_scan, 0) / scansLastWeek.length
        );

  // Top categories (top 3 par count desc, sans padding)
  const categoryCounts = new Map<string, number>();
  for (const scan of scans) {
    if (scan.category_slug) {
      categoryCounts.set(scan.category_slug, (categoryCounts.get(scan.category_slug) ?? 0) + 1);
    }
  }
  const topCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // scansByDay : 28 derniers jours, du plus ancien (index 0) au plus récent (index 27)
  const scansByDay: Array<{ date: string; count: number; avgScore: number }> = [];
  // Map jour Paris → liste des scores
  const scoresByDay = new Map<string, number[]>();
  for (const scan of scans) {
    const dayParis = toParisDateString(new Date(scan.scanned_at));
    const arr = scoresByDay.get(dayParis) ?? [];
    arr.push(scan.score_at_scan);
    scoresByDay.set(dayParis, arr);
  }

  for (let i = 27; i >= 0; i--) {
    const dayParis = subtractParisDays(now, i);
    const scores = scoresByDay.get(dayParis) ?? [];
    if (scores.length === 0) {
      scansByDay.push({ date: dayParis, count: 0, avgScore: 0 });
    } else {
      const avg = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
      scansByDay.push({ date: dayParis, count: scores.length, avgScore: avg });
    }
  }

  // Week-over-week deltas
  const scansDelta = scansThisWeek.length - scansLastWeek.length;
  const avgScoreDelta =
    averageScoreThisWeek === 0 || averageScoreLastWeek === 0
      ? 0
      : averageScoreThisWeek - averageScoreLastWeek;

  return {
    totalScans,
    totalCosmeticScans,
    averageScoreAllTime,
    averageScoreThisWeek,
    productsAvoided,
    excellentProducts,
    topCategories,
    scansByDay,
    weekOverWeekDelta: { scans: scansDelta, avgScore: avgScoreDelta },
  };
}
