/**
 * Weekly summary — calcule la synthèse hebdomadaire (semaine ISO Europe/Paris).
 *
 * Une semaine va du lundi 00:00:00 (Paris) au dimanche 23:59:59.999 (Paris).
 * Les comparaisons sont faites en delta absolu vs semaine précédente.
 */

import type { ScanRecord, WeeklySummary } from './types';

/**
 * Renvoie l'offset minutes Europe/Paris pour une date donnée (gère DST).
 * Positif = Paris en avance sur UTC (ex: +120 en CEST, +60 en CET).
 */
function parisOffsetMinutes(d: Date): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value ?? '0');
  // Heure "vue" à Paris reconstruite en UTC.
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') === 24 ? 0 : get('hour'),
    get('minute'),
    get('second')
  );
  return Math.round((asUtc - d.getTime()) / 60000);
}

/**
 * Renvoie le début de la semaine (lundi 00:00:00.000 Paris) contenant `now`.
 */
export function getCurrentWeekRange(now: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const offsetMin = parisOffsetMinutes(now);
  // Représentation "Paris" décalée : on travaille comme si c'était UTC pour identifier le jour.
  const parisShifted = new Date(now.getTime() + offsetMin * 60_000);

  // Jour de la semaine en Paris (0=dim, 1=lun, ... 6=sam)
  const dow = parisShifted.getUTCDay();
  // Décalage pour atteindre lundi : si dow=0 (dim) → 6 jours en arrière
  const daysFromMonday = (dow + 6) % 7;

  // Date Paris à minuit lundi (en représentation shifted)
  const startShifted = new Date(parisShifted.getTime());
  startShifted.setUTCDate(startShifted.getUTCDate() - daysFromMonday);
  startShifted.setUTCHours(0, 0, 0, 0);

  // Reconvertir vers UTC réel : on doit recalculer l'offset à la date du lundi
  // (pour gérer les semaines qui chevauchent un changement DST).
  const provisionalStartUtc = new Date(startShifted.getTime() - offsetMin * 60_000);
  const offsetAtStart = parisOffsetMinutes(provisionalStartUtc);
  const start = new Date(startShifted.getTime() - offsetAtStart * 60_000);

  // Fin = +7 jours - 1 ms
  const endShifted = new Date(startShifted.getTime());
  endShifted.setUTCDate(endShifted.getUTCDate() + 7);
  endShifted.setUTCMilliseconds(endShifted.getUTCMilliseconds() - 1);
  const provisionalEndUtc = new Date(endShifted.getTime() - offsetMin * 60_000);
  const offsetAtEnd = parisOffsetMinutes(provisionalEndUtc);
  const end = new Date(endShifted.getTime() - offsetAtEnd * 60_000);

  return { start, end };
}

/**
 * Calcule la moyenne arrondie d'un tableau de scores.
 */
function avgScore(scans: ScanRecord[]): number {
  if (scans.length === 0) return 0;
  const sum = scans.reduce((acc, s) => acc + s.score_at_scan, 0);
  return Math.round(sum / scans.length);
}

/**
 * Calcule la synthèse de la semaine courante.
 *
 * @param scansThisWeek  scans dans la semaine en cours (filtrés en amont)
 * @param scansLastWeek  scans de la semaine précédente (pour comparison)
 * @param currentStreak  streak courant (calculé via streak-engine)
 */
export function calculateWeeklySummary(
  scansThisWeek: ScanRecord[],
  scansLastWeek: ScanRecord[],
  currentStreak: number
): WeeklySummary {
  const totalScans = scansThisWeek.length;
  const averageScore = avgScore(scansThisWeek);
  const productsAvoided = scansThisWeek.filter((s) => s.score_at_scan < 30).length;
  const excellentProducts = scansThisWeek.filter((s) => s.score_at_scan > 80).length;

  // top category : compte parmi ceux qui ont une category_slug non null
  const withCat = scansThisWeek.filter(
    (s): s is ScanRecord & { category_slug: string } =>
      typeof s.category_slug === 'string' && s.category_slug.length > 0
  );
  let topCategory: string | null = null;
  if (withCat.length >= 2) {
    const counts = new Map<string, number>();
    for (const s of withCat) {
      counts.set(s.category_slug, (counts.get(s.category_slug) ?? 0) + 1);
    }
    let bestSlug: string | null = null;
    let bestCount = 0;
    for (const [slug, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        bestSlug = slug;
      }
    }
    topCategory = bestSlug;
  }

  const lastAvg = avgScore(scansLastWeek);
  const comparisonVsLastWeek = {
    scans: totalScans - scansLastWeek.length,
    avgScore: averageScore - lastAvg,
  };

  return {
    totalScans,
    averageScore,
    productsAvoided,
    excellentProducts,
    topCategory,
    streakDays: currentStreak,
    comparisonVsLastWeek,
  };
}

/**
 * Formate un message FR encourageant pour la synthèse.
 */
export function formatWeeklySummaryMessage(summary: WeeklySummary): string {
  if (summary.totalScans === 0) {
    return 'Cette semaine est calme. Reprends quand tu veux !';
  }
  const plural = summary.totalScans > 1 ? 's' : '';
  let comparison: string;
  const dScans = summary.comparisonVsLastWeek.scans;
  const dAvg = summary.comparisonVsLastWeek.avgScore;
  if (dScans > 0) {
    comparison = 'Belle progression vs semaine dernière !';
  } else if (dAvg >= 5) {
    comparison = 'Ton score moyen progresse 📈';
  } else if (dAvg <= -5) {
    comparison = 'Continue, chaque scan compte';
  } else {
    comparison = 'Continue sur cette lancée !';
  }
  return `Cette semaine : ${summary.totalScans} scan${plural}, score moyen ${summary.averageScore}/100. ${comparison}`;
}
