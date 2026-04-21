import type { PenaltyDetail } from '../api/types';
import { findAdditive } from './additives-db';

export type NutrientKey =
  | 'energy'
  | 'sugars'
  | 'saturated_fat'
  | 'salt'
  | 'proteins'
  | 'fiber';

export type NutrientStatus = 'good' | 'moderate' | 'bad';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function getNutrientThreshold(
  nutrient: NutrientKey,
  value: number
): NutrientStatus {
  if (!Number.isFinite(value) || value < 0) {
    return 'good';
  }

  switch (nutrient) {
    case 'sugars':
      if (value < 5) return 'good';
      if (value < 15) return 'moderate';
      return 'bad';
    case 'saturated_fat':
      if (value < 2) return 'good';
      if (value < 5) return 'moderate';
      return 'bad';
    case 'salt':
      if (value < 0.5) return 'good';
      if (value < 1.5) return 'moderate';
      return 'bad';
    case 'energy':
      if (value < 200) return 'good';
      if (value < 400) return 'moderate';
      return 'bad';
    case 'proteins':
    case 'fiber':
      return 'good';
  }
}

export interface NutrientValues {
  energy?: number;
  sugars?: number;
  saturated_fat?: number;
  salt?: number;
  proteins?: number;
  fiber?: number;
}

export function convertToPortionValues(
  macros: NutrientValues,
  portionGrams: number
): NutrientValues {
  const safePortion = portionGrams > 0 ? portionGrams : 100;
  const ratio = safePortion / 100;
  const result: NutrientValues = {};

  const keys: (keyof NutrientValues)[] = [
    'energy',
    'sugars',
    'saturated_fat',
    'salt',
    'proteins',
    'fiber',
  ];

  for (const key of keys) {
    const raw = macros[key];
    if (raw !== undefined) {
      result[key] = round1(raw * ratio);
    }
  }

  return result;
}

export interface ScoreVerdict {
  label: string;
  description: string;
}

export function getScoreVerdict(score: number): ScoreVerdict {
  const clamped = Math.max(0, Math.min(100, score));

  if (clamped >= 90) {
    return {
      label: 'Excellent',
      description:
        'Un aliment de qualité irréprochable. À consommer sans hésitation.',
    };
  }
  if (clamped >= 70) {
    return {
      label: 'Bon',
      description:
        "Un produit sain dans l'ensemble. Quelques points d'attention mineurs.",
    };
  }
  if (clamped >= 50) {
    return {
      label: 'Moyen',
      description:
        'Consommation occasionnelle. Des alternatives plus saines existent.',
    };
  }
  if (clamped >= 25) {
    return {
      label: 'Mauvais',
      description: 'À limiter fortement. Plusieurs éléments préoccupants.',
    };
  }
  return {
    label: 'À éviter',
    description: "Composition problématique. On cherche un remplaçant.",
  };
}

export interface PenaltyGroups {
  nova: number;
  additives: number;
  macros: number;
  oils: number;
  clean_labeling: number;
  profile: number;
  bonus: number;
}

export function groupPenaltiesByCategory(
  penalties: PenaltyDetail[]
): PenaltyGroups {
  const groups: PenaltyGroups = {
    nova: 0,
    additives: 0,
    macros: 0,
    oils: 0,
    clean_labeling: 0,
    profile: 0,
    bonus: 0,
  };

  for (const penalty of penalties) {
    if (penalty.points < 0) {
      groups.bonus += Math.abs(penalty.points);
      continue;
    }
    if (penalty.points === 0) {
      continue;
    }

    switch (penalty.category) {
      case 'nova':
        groups.nova += penalty.points;
        break;
      case 'additive':
        groups.additives += penalty.points;
        break;
      case 'macro':
        groups.macros += penalty.points;
        break;
      case 'seed_oil':
        groups.oils += penalty.points;
        break;
      case 'clean_labeling':
        groups.clean_labeling += penalty.points;
        break;
      case 'profile':
        groups.profile += penalty.points;
        break;
    }
  }

  return {
    nova: round1(groups.nova),
    additives: round1(groups.additives),
    macros: round1(groups.macros),
    oils: round1(groups.oils),
    clean_labeling: round1(groups.clean_labeling),
    profile: round1(groups.profile),
    bonus: round1(groups.bonus),
  };
}

export interface IngredientRisk {
  name: string;
  riskLevel: 'safe' | 'moderate' | 'high' | 'blocker';
  penaltyPoints: number;
}

const E_CODE_REGEX = /e\d{3,4}[a-z]?/gi;
const NOISE_REGEX = /^[\d\s().,\-/]+$/;

function cleanTokenName(token: string): string {
  // Remove balanced parenthesized parts, then any stray parens + E-codes that
  // remain (they are represented separately as riskLevel entries).
  const withoutParens = token
    .replace(/\([^)]*\)/g, '')
    .replace(/[()]/g, '')
    .replace(/e\d{3,4}[a-z]?/gi, '')
    .replace(/[,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return withoutParens.slice(0, 80);
}

function resolveRiskLevel(
  tag: string
): { riskLevel: IngredientRisk['riskLevel']; penaltyPoints: number } {
  const entry = findAdditive(tag);
  if (!entry) {
    return { riskLevel: 'safe', penaltyPoints: 0 };
  }
  if (entry.isBlocker || entry.riskLevel === 'blocker') {
    return { riskLevel: 'blocker', penaltyPoints: entry.penaltyPoints };
  }
  if (entry.riskLevel === 'high') {
    return { riskLevel: 'high', penaltyPoints: entry.penaltyPoints };
  }
  if (entry.riskLevel === 'moderate') {
    return { riskLevel: 'moderate', penaltyPoints: entry.penaltyPoints };
  }
  return { riskLevel: 'safe', penaltyPoints: entry.penaltyPoints };
}

export function mapIngredientsToRisk(ingredientsRaw: string): IngredientRisk[] {
  if (!ingredientsRaw || ingredientsRaw.trim().length === 0) {
    return [];
  }

  const tokens = ingredientsRaw.split(/[,;]/);
  const results: IngredientRisk[] = [];
  const seen = new Set<string>();

  for (const rawToken of tokens) {
    const trimmed = rawToken.trim();
    if (trimmed.length === 0) continue;

    // Skip tokens that are entirely opening-paren noise or numeric/symbolic.
    if (trimmed.startsWith('(')) continue;
    if (NOISE_REGEX.test(trimmed)) continue;

    const cleanedName = cleanTokenName(trimmed);

    // Extract all E-codes present in this token.
    const eCodes: string[] = [];
    let match: RegExpExecArray | null;
    E_CODE_REGEX.lastIndex = 0;
    while ((match = E_CODE_REGEX.exec(trimmed)) !== null) {
      eCodes.push(match[0].toLowerCase());
    }

    if (eCodes.length > 0) {
      for (const code of eCodes) {
        const { riskLevel, penaltyPoints } = resolveRiskLevel(code);
        const displayName = cleanedName.length > 0 ? cleanedName : code.toUpperCase();
        const key = `${displayName}|${riskLevel}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({ name: displayName, riskLevel, penaltyPoints });
      }
    } else {
      if (cleanedName.length === 0) continue;
      const key = `${cleanedName}|safe`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ name: cleanedName, riskLevel: 'safe', penaltyPoints: 0 });
    }
  }

  return results;
}
