/**
 * Moteur de statistiques avancées (Premium tier — `advanced_stats`).
 *
 * Indépendant de `profile-stats-engine` : duplique localement les helpers
 * Europe/Paris pour rester autonome (changement de l'un n'impacte pas l'autre).
 *
 * Sortie :
 *  - trend28d : 28 points jour (Paris) + slope régression linéaire
 *  - distribution : 5 buckets de scores
 *  - topCategories / topBrands : top 5 par count desc, tie-break avgScore desc
 *  - streak : current + longest
 *  - toxicExposure : agrégation `penalties_snapshot` sur 30j Paris
 */

import type { ScanRecord } from '@/src/lib/gamification/types';

const PARIS_TIMEZONE = 'Europe/Paris';
const DAY_MS = 86_400_000;

// ─── Types publics ──────────────────────────────────────────────────────────

export interface TrendPoint {
  date: string; // YYYY-MM-DD (Europe/Paris)
  avgScore: number;
  count: number;
}

export interface ScoreDistribution {
  excellent: number; // >= 85
  good: number; // 70-84
  mid: number; // 50-69
  poor: number; // 30-49
  bad: number; // < 30
}

export interface CategoryAggregate {
  name: string;
  count: number;
  avgScore: number;
}

export interface BrandAggregate {
  name: string;
  count: number;
  avgScore: number;
}

export interface StreakStats {
  current: number;
  longest: number;
}

export interface ToxicExposure {
  totalPenalties: number;
  uniqueAdditives: number;
  worstAdditive: { code: string; count: number } | null;
}

export interface AdvancedStats {
  trend28d: { points: TrendPoint[]; slope: number };
  distribution: ScoreDistribution;
  topCategories: CategoryAggregate[];
  topBrands: BrandAggregate[];
  streak: StreakStats;
  toxicExposure: ToxicExposure;
}

// ─── Helpers Europe/Paris ───────────────────────────────────────────────────

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

function parisDateStartUtc(parisDateString: string): Date {
  const [year, month, day] = parisDateString.split('-').map((s) => parseInt(s, 10));
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PARIS_TIMEZONE,
    hour: '2-digit',
    hour12: false,
  });
  const parisHour = parseInt(formatter.format(noonUtc), 10);
  const offsetHours = parisHour - 12;
  return new Date(Date.UTC(year, month - 1, day, -offsetHours, 0, 0));
}

function subtractParisDays(date: Date, nDays: number): string {
  const todayParis = toParisDateString(date);
  const todayMidnightUtc = parisDateStartUtc(todayParis);
  const target = new Date(todayMidnightUtc.getTime() - nDays * DAY_MS);
  return toParisDateString(target);
}

// ─── Helpers de typage des penalties ────────────────────────────────────────

interface PenaltyEntry {
  code?: string;
  points?: number;
}

/** Coerce le snapshot non typé en tableau d'entrées exploitables. */
function coercePenalties(snapshot: unknown): PenaltyEntry[] {
  if (!Array.isArray(snapshot)) return [];
  const out: PenaltyEntry[] = [];
  for (const entry of snapshot) {
    if (entry && typeof entry === 'object') {
      const e = entry as Record<string, unknown>;
      const code = typeof e.code === 'string' ? e.code : undefined;
      const points = typeof e.points === 'number' ? e.points : undefined;
      out.push({ code, points });
    }
  }
  return out;
}

/** Récupère la marque sur un scan (les champs DB peuvent ajouter `brand`). */
function getBrand(scan: ScanRecord): string | null {
  const value = (scan as ScanRecord & { brand?: unknown }).brand;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

// ─── Calcul ─────────────────────────────────────────────────────────────────

export function calculateAdvancedStats(
  scans: ScanRecord[],
  now: Date = new Date(),
): AdvancedStats {
  // 1) Distribution
  const distribution: ScoreDistribution = {
    excellent: 0,
    good: 0,
    mid: 0,
    poor: 0,
    bad: 0,
  };
  for (const s of scans) {
    if (s.score_at_scan >= 85) distribution.excellent++;
    else if (s.score_at_scan >= 70) distribution.good++;
    else if (s.score_at_scan >= 50) distribution.mid++;
    else if (s.score_at_scan >= 30) distribution.poor++;
    else distribution.bad++;
  }

  // 2) Trend 28j Paris
  const scoresByDay = new Map<string, number[]>();
  for (const s of scans) {
    const day = toParisDateString(new Date(s.scanned_at));
    const arr = scoresByDay.get(day) ?? [];
    arr.push(s.score_at_scan);
    scoresByDay.set(day, arr);
  }
  const points: TrendPoint[] = [];
  for (let i = 27; i >= 0; i--) {
    const day = subtractParisDays(now, i);
    const scores = scoresByDay.get(day) ?? [];
    if (scores.length === 0) {
      points.push({ date: day, avgScore: 0, count: 0 });
    } else {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      points.push({ date: day, avgScore: avg, count: scores.length });
    }
  }

  // Régression linéaire simple : x = 0..27, y = avgScore
  let slope = 0;
  if (points.length >= 2) {
    const n = points.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = points[i].avgScore;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    const denom = sumX2 * n - sumX * sumX;
    slope = denom === 0 ? 0 : (sumXY * n - sumX * sumY) / denom;
  }

  // 3) Top categories
  const catCounts = new Map<string, { count: number; sum: number }>();
  for (const s of scans) {
    const slug = s.category_slug;
    if (!slug) continue;
    const cur = catCounts.get(slug) ?? { count: 0, sum: 0 };
    cur.count++;
    cur.sum += s.score_at_scan;
    catCounts.set(slug, cur);
  }
  const topCategories: CategoryAggregate[] = Array.from(catCounts.entries())
    .map(([name, agg]) => ({
      name,
      count: agg.count,
      avgScore: Math.round(agg.sum / agg.count),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.avgScore - a.avgScore;
    })
    .slice(0, 5);

  // 4) Top brands
  const brandCounts = new Map<string, { count: number; sum: number }>();
  for (const s of scans) {
    const brand = getBrand(s);
    if (!brand) continue;
    const cur = brandCounts.get(brand) ?? { count: 0, sum: 0 };
    cur.count++;
    cur.sum += s.score_at_scan;
    brandCounts.set(brand, cur);
  }
  const topBrands: BrandAggregate[] = Array.from(brandCounts.entries())
    .map(([name, agg]) => ({
      name,
      count: agg.count,
      avgScore: Math.round(agg.sum / agg.count),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.avgScore - a.avgScore;
    })
    .slice(0, 5);

  // 5) Streak (jours Paris distincts)
  const distinctDays = new Set<string>();
  for (const s of scans) {
    distinctDays.add(toParisDateString(new Date(s.scanned_at)));
  }
  const sortedDays = Array.from(distinctDays).sort(); // ASC
  let longest = 0;
  let current = 0;

  if (sortedDays.length > 0) {
    // Plus longue séquence consécutive
    let run = 1;
    longest = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = parisDateStartUtc(sortedDays[i - 1]).getTime();
      const cur = parisDateStartUtc(sortedDays[i]).getTime();
      if (Math.round((cur - prev) / DAY_MS) === 1) {
        run++;
        longest = Math.max(longest, run);
      } else {
        run = 1;
      }
    }

    // Streak courante : remonte depuis aujourd'hui Paris tant que la veille existe
    const todayParis = toParisDateString(now);
    if (distinctDays.has(todayParis)) {
      current = 1;
      let cursor = parisDateStartUtc(todayParis).getTime();
      while (true) {
        const prevDay = toParisDateString(new Date(cursor - DAY_MS));
        if (distinctDays.has(prevDay)) {
          current++;
          cursor -= DAY_MS;
        } else {
          break;
        }
      }
    }
  }

  // 6) Toxic exposure (30 derniers jours Paris)
  const cutoff30 = parisDateStartUtc(subtractParisDays(now, 29)).getTime();
  let totalPenalties = 0;
  const codeCounts = new Map<string, number>();
  const codeOrder: string[] = []; // pour le tie-break "première occurrence"

  for (const s of scans) {
    const ts = new Date(s.scanned_at).getTime();
    if (ts < cutoff30) continue;
    const entries = coercePenalties(
      (s as ScanRecord & { penalties_snapshot?: unknown }).penalties_snapshot,
    );
    for (const e of entries) {
      if (typeof e.points === 'number') totalPenalties += e.points;
      if (typeof e.code === 'string' && e.code.length > 0) {
        if (!codeCounts.has(e.code)) {
          codeCounts.set(e.code, 0);
          codeOrder.push(e.code);
        }
        codeCounts.set(e.code, (codeCounts.get(e.code) ?? 0) + 1);
      }
    }
  }
  const uniqueAdditives = codeCounts.size;
  let worstAdditive: { code: string; count: number } | null = null;
  for (const code of codeOrder) {
    const count = codeCounts.get(code) ?? 0;
    if (worstAdditive === null || count > worstAdditive.count) {
      worstAdditive = { code, count };
    }
    // Tie-break : première occurrence l'emporte (on ne remplace pas si égal)
  }

  return {
    trend28d: { points, slope },
    distribution,
    topCategories,
    topBrands,
    streak: { current, longest },
    toxicExposure: {
      totalPenalties,
      uniqueAdditives,
      worstAdditive,
    },
  };
}
