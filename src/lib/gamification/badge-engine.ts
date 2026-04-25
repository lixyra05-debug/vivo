/**
 * Badge engine — calcule les statistiques de gamification et débloque les badges.
 *
 * 12 badges au total, 5 catégories : milestone, streak, quality, engagement, family.
 * Aucune compensation : une condition non remplie = badge non gagné.
 */

import type {
  BadgeDef,
  EarnedBadge,
  GamificationUserStats,
  ScanRecord,
} from './types';
import { calculateStreak } from './streak-engine';

/**
 * Catalogue des 12 badges (ordre stable, utilisé pour l'affichage).
 */
export const BADGES: BadgeDef[] = [
  {
    id: 'first_scan',
    nameFr: 'Premier scan',
    emoji: '🔍',
    descriptionFr: 'Effectue ton premier scan',
    category: 'milestone',
  },
  {
    id: 'explorer',
    nameFr: 'Explorateur',
    emoji: '🧭',
    descriptionFr: '10 produits scannés',
    category: 'milestone',
  },
  {
    id: 'expert',
    nameFr: 'Expert',
    emoji: '🎓',
    descriptionFr: '50 produits scannés',
    category: 'milestone',
  },
  {
    id: 'legend',
    nameFr: 'Légende',
    emoji: '🏆',
    descriptionFr: '100 produits scannés',
    category: 'milestone',
  },
  {
    id: 'flame_7',
    nameFr: 'Flamme',
    emoji: '🔥',
    descriptionFr: '7 jours consécutifs',
    category: 'streak',
  },
  {
    id: 'tireless_30',
    nameFr: 'Infatigable',
    emoji: '⚡',
    descriptionFr: '30 jours consécutifs',
    category: 'streak',
  },
  {
    id: 'vigilant',
    nameFr: 'Vigilant',
    emoji: '🛡️',
    descriptionFr: '10 produits évités (score < 30)',
    category: 'quality',
  },
  {
    id: 'beauty',
    nameFr: 'Beauté',
    emoji: '✨',
    descriptionFr: '5 produits cosmétiques scannés',
    category: 'quality',
  },
  {
    id: 'gourmet',
    nameFr: 'Gourmet sain',
    emoji: '🥗',
    descriptionFr: '20 excellents choix (score > 80)',
    category: 'quality',
  },
  {
    id: 'detective',
    nameFr: 'Détective',
    emoji: '🕵️',
    descriptionFr: '3 signalements envoyés',
    category: 'engagement',
  },
  {
    id: 'family',
    nameFr: 'Famille',
    emoji: '👨‍👩‍👧',
    descriptionFr: 'Profil multi-utilisateurs (à venir)',
    category: 'family',
  },
  {
    id: 'perfectionist',
    nameFr: 'Perfectionniste',
    emoji: '💎',
    descriptionFr: 'Score moyen ≥ 75 sur 30 scans',
    category: 'quality',
  },
];

/**
 * Index id → BadgeDef pour lookup O(1).
 */
const BADGES_BY_ID: Map<string, BadgeDef> = new Map(BADGES.map((b) => [b.id, b]));

/**
 * Lookup d'un badge par identifiant.
 */
export function getBadgeById(id: string): BadgeDef | null {
  return BADGES_BY_ID.get(id) ?? null;
}

/**
 * Calcule les stats agrégées à partir des scans + données externes (reports, profils).
 *
 * @param scans         historique complet
 * @param reportCount   nombre de signalements envoyés
 * @param profileCount  nombre de profils utilisateur (≥2 = family débloqué — placeholder MVP)
 * @param now           date de référence (par défaut Date.now()) — pour les tests
 */
export function getUserStats(
  scans: ScanRecord[],
  reportCount: number,
  profileCount: number,
  now: Date = new Date()
): GamificationUserStats {
  const totalScans = scans.length;
  const cosmeticScans = scans.filter((s) => s.product_type === 'cosmetic').length;
  const productsAvoided = scans.filter((s) => s.score_at_scan < 30).length;
  const excellentProducts = scans.filter((s) => s.score_at_scan > 80).length;

  // Moyenne des 30 derniers scans (par scanned_at desc)
  let averageScoreLast30 = 0;
  if (totalScans >= 30) {
    const sorted = [...scans].sort(
      (a, b) =>
        new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
    );
    const last30 = sorted.slice(0, 30);
    const sum = last30.reduce((acc, s) => acc + s.score_at_scan, 0);
    averageScoreLast30 = Math.round(sum / 30);
  }

  const { currentStreak } = calculateStreak(scans, now);

  return {
    totalScans,
    cosmeticScans,
    productsAvoided,
    excellentProducts,
    averageScoreLast30,
    currentStreak,
    reportsSubmitted: reportCount,
    hasMultipleProfiles: profileCount > 1,
  };
}

/**
 * Map badge.id → prédicat sur les stats.
 */
function isBadgeEarned(badgeId: string, s: GamificationUserStats): boolean {
  switch (badgeId) {
    case 'first_scan':
      return s.totalScans >= 1;
    case 'explorer':
      return s.totalScans >= 10;
    case 'expert':
      return s.totalScans >= 50;
    case 'legend':
      return s.totalScans >= 100;
    case 'flame_7':
      return s.currentStreak >= 7;
    case 'tireless_30':
      return s.currentStreak >= 30;
    case 'vigilant':
      return s.productsAvoided >= 10;
    case 'beauty':
      return s.cosmeticScans >= 5;
    case 'gourmet':
      return s.excellentProducts >= 20;
    case 'detective':
      return s.reportsSubmitted >= 3;
    case 'family':
      return s.hasMultipleProfiles;
    case 'perfectionist':
      return s.averageScoreLast30 >= 75;
    default:
      return false;
  }
}

export interface CheckBadgesResult {
  earned: BadgeDef[];
  newlyEarned: BadgeDef[];
}

/**
 * Évalue le catalogue contre les stats et renvoie :
 *  - earned       : tous les badges actuellement gagnés (selon les stats)
 *  - newlyEarned  : earned moins ceux déjà présents dans `alreadyEarned`
 */
export function checkBadges(
  stats: GamificationUserStats,
  alreadyEarned: EarnedBadge[]
): CheckBadgesResult {
  const earned = BADGES.filter((b) => isBadgeEarned(b.id, stats));
  const knownIds = new Set(alreadyEarned.map((e) => e.badgeId));
  const newlyEarned = earned.filter((b) => !knownIds.has(b.id));
  return { earned, newlyEarned };
}
