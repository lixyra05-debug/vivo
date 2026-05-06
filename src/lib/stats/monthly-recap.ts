/**
 * Monthly recap calculator — agrège les scans d'un mois civil pour générer
 * une story récapitulative partageable (feature Premium "vivo_recap").
 *
 * Le filtrage temporel utilise le fuseau Europe/Paris : un scan tombe dans le
 * mois M si sa conversion locale Paris appartient à [début M, début M+1).
 */

import type { ScanRecord } from '../gamification/types';

const PARIS_TIMEZONE = 'Europe/Paris';

export interface MonthlyRecap {
  /** "Avril 2026" — Intl 'fr-FR' month + year, première lettre capitalisée. */
  monthLabel: string;
  totalScans: number;
  /** Score moyen arrondi à l'entier (0 si aucun scan). */
  averageScore: number;
  worstProduct: { name: string; score: number; barcode: string } | null;
  bestProduct: { name: string; score: number; barcode: string } | null;
  /** Nombre de scans avec score < 40. */
  avoidCount: number;
  /** Nombre de scans avec score >= 75. */
  excellentCount: number;
  badge: 'detective' | 'eclaire' | 'curieux';
  topBrand: string | null;
  topCategory: string | null;
}

/**
 * Lookup optionnel barcode → métadonnées produit.
 * Permet d'enrichir worstProduct/bestProduct/topBrand sans coupler aux types Supabase.
 */
export interface ProductLookupEntry {
  name?: string | null;
  brand?: string | null;
}

export interface CalculateMonthlyRecapOptions {
  productLookup?: Record<string, ProductLookupEntry | undefined>;
}

/**
 * Renvoie l'année et le mois (1-12) Europe/Paris d'une date ISO.
 */
function toParisYearMonth(iso: string): { year: number; month: number } {
  const date = new Date(iso);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value ?? '0');
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? '0');
  return { year, month };
}

/**
 * "avril 2026" → "Avril 2026" (capitalise la première lettre).
 */
function capitalizeFirst(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Construit le label "Avril 2026" en fr-FR à partir d'année/mois (mois 0-11).
 */
function buildMonthLabel(year: number, month: number): string {
  const anchor = new Date(Date.UTC(year, month, 15));
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return capitalizeFirst(formatter.format(anchor));
}

/**
 * Renvoie la valeur la plus fréquente d'un tableau (premier en cas d'égalité).
 * Renvoie null si tableau vide ou que des null/undefined.
 */
function mostFrequent<T extends string>(values: Array<T | null | undefined>): T | null {
  const counts = new Map<T, number>();
  for (const v of values) {
    if (v == null) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let best: T | null = null;
  let bestCount = -1;
  // Map preserves insertion order → premier en cas d'égalité.
  counts.forEach((count, key) => {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  });
  return best;
}

/**
 * Calcule le récap mensuel à partir des scans bruts d'un utilisateur.
 *
 * @param scans  liste de scans (toutes périodes confondues)
 * @param year   année civile (ex: 2026)
 * @param month  mois 0-11 (compatible JS Date.getMonth)
 * @param options.productLookup  optionnel — barcode → { name, brand } pour
 *   enrichir worstProduct/bestProduct/topBrand (sinon barcode utilisé en fallback)
 */
export function calculateMonthlyRecap(
  scans: ScanRecord[],
  year: number,
  month: number,
  options: CalculateMonthlyRecapOptions = {},
): MonthlyRecap {
  const monthLabel = buildMonthLabel(year, month);
  const targetMonth1Based = month + 1;

  // 1. Filtrage Europe/Paris : on garde uniquement les scans du mois cible.
  const inMonth = scans.filter((s) => {
    const ym = toParisYearMonth(s.scanned_at);
    return ym.year === year && ym.month === targetMonth1Based;
  });

  if (inMonth.length === 0) {
    return {
      monthLabel,
      totalScans: 0,
      averageScore: 0,
      worstProduct: null,
      bestProduct: null,
      avoidCount: 0,
      excellentCount: 0,
      badge: 'curieux',
      topBrand: null,
      topCategory: null,
    };
  }

  // 2. Agrégations simples
  const totalScans = inMonth.length;
  const sumScores = inMonth.reduce((acc, s) => acc + s.score_at_scan, 0);
  const averageScore = Math.round(sumScores / totalScans);
  const avoidCount = inMonth.filter((s) => s.score_at_scan < 40).length;
  const excellentCount = inMonth.filter((s) => s.score_at_scan >= 75).length;

  // 3. Best/Worst — premier rencontré gagne en cas d'égalité.
  let worstScan: ScanRecord = inMonth[0];
  let bestScan: ScanRecord = inMonth[0];
  for (const s of inMonth) {
    if (s.score_at_scan < worstScan.score_at_scan) worstScan = s;
    if (s.score_at_scan > bestScan.score_at_scan) bestScan = s;
  }

  const lookup = options.productLookup ?? {};
  const nameOf = (s: ScanRecord): string => {
    const entry = lookup[s.barcode];
    const trimmed = entry?.name?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : s.barcode;
  };

  // 4. Top brand (via lookup) / top category (via category_slug)
  const brands = inMonth.map((s) => {
    const entry = lookup[s.barcode];
    const trimmed = entry?.brand?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : null;
  });
  const topBrand = mostFrequent<string>(brands);

  const categories = inMonth.map((s) => {
    const c = s.category_slug?.trim();
    return c && c.length > 0 ? c : null;
  });
  const topCategory = mostFrequent<string>(categories);

  // 5. Badge
  let badge: MonthlyRecap['badge'];
  if (totalScans >= 30) badge = 'detective';
  else if (totalScans >= 15) badge = 'eclaire';
  else badge = 'curieux';

  return {
    monthLabel,
    totalScans,
    averageScore,
    worstProduct: {
      name: nameOf(worstScan),
      score: worstScan.score_at_scan,
      barcode: worstScan.barcode,
    },
    bestProduct: {
      name: nameOf(bestScan),
      score: bestScan.score_at_scan,
      barcode: bestScan.barcode,
    },
    avoidCount,
    excellentCount,
    badge,
    topBrand,
    topCategory,
  };
}
