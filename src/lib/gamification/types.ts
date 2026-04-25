/**
 * Types partagés entre les modules de gamification, stats et notifications.
 *
 * Agent 1 (gamification + education) ÉTEND ce fichier avec BadgeDef, EarnedBadge,
 * GamificationUserStats, EducationalCard, ScoringMethodology.
 * Agent 2 (stats + notifications) IMPORTE ScanRecord et WeeklySummary depuis ici.
 */

/**
 * Shape simplifiée d'un scan stocké dans `scan_history` pour les engines.
 * Les engines ne connaissent que ces champs (pas le `user_id`, pas le `penalties_snapshot`).
 */
export interface ScanRecord {
  barcode: string;
  score_at_scan: number;
  scanned_at: string; // ISO timestamp UTC
  product_type: 'food' | 'cosmetic';
  is_favorite: boolean;
  category_slug?: string | null; // optionnel, sert au calcul de topCategory
}

/**
 * Résumé hebdomadaire d'activité (semaine ISO Europe/Paris : lun 00:00 → dim 23:59).
 */
export interface WeeklySummary {
  totalScans: number;
  averageScore: number; // arrondi
  productsAvoided: number; // score_at_scan < 30
  excellentProducts: number; // score_at_scan > 80
  topCategory: string | null; // slug catégorie la plus scannée, null si <2 scans
  streakDays: number;
  comparisonVsLastWeek: {
    scans: number; // delta absolu (positif ou négatif)
    avgScore: number; // delta absolu
  };
}

// ─── Gamification : Badges ───────────────────────────────────────────────────

/**
 * Définition statique d'un badge (catalogue).
 */
export interface BadgeDef {
  id: string; // ex: 'first_scan', 'flame_7'
  nameFr: string;
  emoji: string;
  descriptionFr: string; // courte (1 phrase) — décrit la condition
  category: 'milestone' | 'streak' | 'quality' | 'engagement' | 'family';
}

/**
 * Badge effectivement gagné par un utilisateur (persisté en BDD).
 */
export interface EarnedBadge {
  badgeId: string;
  earnedAt: string; // ISO timestamp
}

/**
 * Statistiques agrégées de l'utilisateur, utilisées pour évaluer les badges.
 */
export interface GamificationUserStats {
  totalScans: number;
  cosmeticScans: number;
  productsAvoided: number; // score_at_scan < 30
  excellentProducts: number; // score_at_scan > 80
  averageScoreLast30: number; // moyenne sur 30 derniers scans (0 si <30 scans)
  currentStreak: number;
  reportsSubmitted: number;
  hasMultipleProfiles: boolean; // toujours false en MVP (placeholder)
}

// ─── Education : Cartes & Méthodologie ───────────────────────────────────────

export type EducationalTone = 'informative' | 'positive' | 'warning';

/**
 * Trigger d'une carte éducative — quand la montrer ?
 */
export type EducationalCardTrigger =
  | { type: 'additive'; codes: string[] } // E171, E330...
  | { type: 'ingredient'; keywords: string[] } // 'huile de palme', 'parabène'
  | { type: 'category'; slug: string }
  | { type: 'score'; min?: number; max?: number };

/**
 * Carte éducative affichée sur une fiche produit ou dans le hub Apprendre.
 */
export interface EducationalCard {
  id: string;
  trigger: EducationalCardTrigger;
  titleFr: string;
  bodyFr: string; // 3-4 lignes max (~280 chars)
  source: string; // ex: 'ANSES'
  sourceUrl: string; // URL plausible et officielle
  tone: EducationalTone;
}

/**
 * Pondérations du moteur de scoring par axe (somme = 100).
 */
export interface MethodologyWeights {
  nova: number;
  additives: number;
  macros: number;
  oils: number;
  bonus: number;
}

/**
 * Seuils de qualité (excellent / good / mediocre / bad).
 */
export interface MethodologyThresholds {
  excellent: number;
  good: number;
  mediocre: number;
  bad: number;
}

/**
 * Documentation publique d'une méthodologie de scoring (food OU cosmetic).
 */
export interface MethodologyDoc {
  formulaFr: string;
  weights: MethodologyWeights | Record<string, number>;
  thresholds: MethodologyThresholds;
  sources: Array<{ name: string; url: string }>;
}

/**
 * FAQ — paire question/réponse en français.
 */
export interface FaqEntry {
  questionFr: string;
  answerFr: string;
}

/**
 * Méthodologie complète exposée dans l'écran Transparence.
 */
export interface ScoringMethodology {
  food: MethodologyDoc;
  cosmetic: MethodologyDoc;
  faq: FaqEntry[];
}
