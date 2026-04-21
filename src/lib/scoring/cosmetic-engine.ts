import type {
  CosmeticPenaltyDetail,
  CosmeticProfile,
  CosmeticScoringInput,
  CosmeticScoringResult,
  ScoreColor,
  CosmeticIngredientRisk,
} from '../api/types';
import {
  findCosmeticIngredient,
  type CosmeticIngredientEntry,
  type CosmeticCategory,
} from './cosmetic-ingredients-db';
import { evaluateCosmeticIngredientForProfile } from './cosmetic-profiles';

const BLOCKER_SCORE_CAP = 30;

export function getCosmeticScoreColor(score: number): ScoreColor {
  if (score >= 70) return 'green';
  if (score >= 50) return 'yellow';
  if (score >= 30) return 'orange';
  return 'red';
}

function categoryToPenaltyCategory(
  category: CosmeticCategory
): CosmeticPenaltyDetail['category'] {
  if (category === 'other') return 'preservative';
  return category;
}

interface CollectedEntry {
  entry: CosmeticIngredientEntry;
  token: string;
}

function collectIngredients(list: string[]): CollectedEntry[] {
  const seen = new Set<string>();
  const out: CollectedEntry[] = [];
  for (const raw of list ?? []) {
    if (typeof raw !== 'string') continue;
    const entry = findCosmeticIngredient(raw);
    if (!entry) continue;
    if (seen.has(entry.inci)) continue;
    seen.add(entry.inci);
    out.push({ entry, token: raw });
  }
  return out;
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateCosmeticScore(
  input: CosmeticScoringInput,
  profile: CosmeticProfile
): CosmeticScoringResult {
  const penalties: CosmeticPenaltyDetail[] = [];
  const blockers: string[] = [];
  const profileAdjustments: string[] = [];
  const riskyIngredients: Array<{
    inci: string;
    risk: CosmeticIngredientRisk;
    reason: string | null;
  }> = [];

  const collected = collectIngredients(input.ingredients_list);

  let score = 100;

  for (const { entry } of collected) {
    const effect = evaluateCosmeticIngredientForProfile(entry, profile);
    if (effect.label) {
      profileAdjustments.push(effect.label);
    }

    // Track risky ingredients (non-safe), regardless of whether blocked.
    if (entry.risk !== 'safe') {
      riskyIngredients.push({
        inci: entry.inci,
        risk: entry.risk,
        reason: entry.reasonFr,
      });
    }

    if (effect.blocked) {
      blockers.push(`${entry.nameFr} (${entry.inci.toUpperCase()})`);
      penalties.push({
        code: entry.inci,
        label: `Profil : ${entry.nameFr} interdit`,
        points: 100,
        category: 'profile',
      });
      continue;
    }

    if (entry.penalty <= 0) continue;

    const points = entry.penalty * effect.multiplier;
    score -= points;
    penalties.push({
      code: entry.inci,
      label: `${entry.nameFr}`,
      points,
      category: categoryToPenaltyCategory(entry.category),
    });
  }

  // Sort risky ingredients by penalty descending (use original entry penalty to rank).
  riskyIngredients.sort((a, b) => {
    const entryA = findCosmeticIngredient(a.inci);
    const entryB = findCosmeticIngredient(b.inci);
    const pa = entryA?.penalty ?? 0;
    const pb = entryB?.penalty ?? 0;
    return pb - pa;
  });

  // If any blocker fired, cap the score at 30 (like food engine's blocker behavior).
  if (blockers.length > 0) {
    const baseScore = clamp(score);
    const cappedScore = Math.max(0, Math.min(BLOCKER_SCORE_CAP, baseScore));
    return {
      score_final: cappedScore,
      score_color: getCosmeticScoreColor(cappedScore),
      penalties,
      blockers,
      risky_ingredients: riskyIngredients,
      profile_adjustments: profileAdjustments,
    };
  }

  const finalScore = clamp(score);
  return {
    score_final: finalScore,
    score_color: getCosmeticScoreColor(finalScore),
    penalties,
    blockers,
    risky_ingredients: riskyIngredients,
    profile_adjustments: profileAdjustments,
  };
}

export { findCosmeticIngredient };
