import type {
  PenaltyDetail,
  ScoreColor,
  ScoringInput,
  ScoringResult,
  UserProfile,
} from '../api/types';
import {
  ADDITIVES_MAP,
  findAdditive,
  normalizeAdditiveTag,
  AZO_COLORANTS,
  type AdditiveEntry,
} from './additives-db';
import { classifyNova } from './nova-classifier';
import { detectSeedOils, type SeedOilDetection } from './seed-oils';
import { detectCleanLabeling } from './clean-labeling';
import { evaluateAdditiveForProfile } from './profiles';
import {
  NOVA_CEILINGS,
  MACRO_PENALTIES,
  SEED_OIL_PENALTIES,
  COCKTAIL_MULTIPLIER,
} from '@/src/constants/scoring-rules';

export function getScoreColor(score: number): ScoreColor {
  if (score >= 70) return 'green';
  if (score >= 50) return 'yellow';
  if (score >= 25) return 'orange';
  return 'red';
}

const SALT_THRESHOLD_100G = 1.5;
const SAT_FAT_REFINED_NOVA_MIN = 3;
const INTOLERANT_LACTOSE_MALUS = 20;
const INTOLERANT_GLUTEN_MALUS = 20;
const LACTOSE_RE = /(lait|lactos|cas[ée]ine|petit-?lait|beurre|cr[èe]me|fromage|yaourt)/i;
const GLUTEN_RE = /(bl[ée]|froment|gluten|seigle|orge|[ée]peautre|kamut)/i;

function buildResult(
  score: number,
  input: ScoringInput & { nova_group: 1 | 2 | 3 | 4 },
  penalties: PenaltyDetail[],
  blockers: string[],
  seedOils: SeedOilDetection[],
  cleanLabeling: string[],
  profileAdjustments: string[]
): ScoringResult {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score_final: clamped,
    score_color: getScoreColor(clamped),
    nova_group: input.nova_group,
    penalties,
    blockers,
    seed_oils_detected: seedOils.map((s) => s.nameFr),
    clean_labeling_alerts: cleanLabeling,
    profile_adjustments: profileAdjustments,
  };
}

function collectAdditives(tags: string[]): Array<{ tag: string; entry: AdditiveEntry }> {
  const seen = new Set<string>();
  const out: Array<{ tag: string; entry: AdditiveEntry }> = [];
  for (const raw of tags ?? []) {
    const norm = normalizeAdditiveTag(raw);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    const entry = ADDITIVES_MAP.get(norm);
    if (entry) out.push({ tag: norm, entry });
  }
  return out;
}

export function calculateScore(input: ScoringInput, profile: UserProfile): ScoringResult {
  const penalties: PenaltyDetail[] = [];
  const blockers: string[] = [];
  const profileAdjustments: string[] = [];

  const novaGroup = (input.nova_group ?? classifyNova(input.ingredients_raw, input.additives_tags)) as 1 | 2 | 3 | 4;
  const resolvedInput = { ...input, nova_group: novaGroup };

  const additives = collectAdditives(input.additives_tags);
  const seedOils = detectSeedOils(input.ingredients_raw, input.oil_types);
  const cleanLabelingAlerts = detectCleanLabeling(input.ingredients_raw);
  const cleanLabelingLabels = cleanLabelingAlerts.map(
    (a) => `${a.term} — ${a.suspectedMeaning}`
  );

  for (const { entry } of additives) {
    const effect = evaluateAdditiveForProfile(entry, profile.type);
    if (effect.label) profileAdjustments.push(effect.label);

    if (entry.isBlocker) {
      blockers.push(`${entry.code.toUpperCase()} — ${entry.nameFr}`);
      penalties.push({
        code: entry.code,
        label: `Additif bloquant : ${entry.nameFr}`,
        points: 100,
        category: 'additive',
      });
      continue;
    }

    if (effect.blocked) {
      blockers.push(`${entry.code.toUpperCase()} — ${entry.nameFr} (profil)`);
      penalties.push({
        code: entry.code,
        label: `Profil : ${entry.nameFr} interdit`,
        points: 100,
        category: 'profile',
      });
    }
  }

  if (profile.type === 'child' || profile.type === 'pregnant') {
    for (const { tag, entry } of additives) {
      if (AZO_COLORANTS.includes(tag) && !blockers.some((b) => b.startsWith(entry.code.toUpperCase()))) {
        blockers.push(`${entry.code.toUpperCase()} — ${entry.nameFr} (azoïque)`);
        penalties.push({
          code: entry.code,
          label: `Profil ${profile.type} : colorant azoïque interdit`,
          points: 100,
          category: 'profile',
        });
      }
    }
  }

  if (blockers.length > 0) {
    return buildResult(
      0,
      resolvedInput,
      penalties,
      blockers,
      seedOils,
      cleanLabelingLabels,
      profileAdjustments
    );
  }

  let score = 100;

  const ceiling = NOVA_CEILINGS[novaGroup];
  if (ceiling < score) {
    penalties.push({
      code: `nova${novaGroup}`,
      label: `Plafond NOVA ${novaGroup}`,
      points: score - ceiling,
      category: 'nova',
    });
    score = ceiling;
  }

  let additiveTotal = 0;
  const highRiskCount = additives.filter(
    ({ entry }) => entry.riskLevel === 'high' || entry.riskLevel === 'moderate'
  ).length;
  const cocktail = highRiskCount >= 2;

  for (const { entry } of additives) {
    if (entry.penaltyPoints <= 0) continue;
    const effect = evaluateAdditiveForProfile(entry, profile.type);
    let points = entry.penaltyPoints * effect.multiplier;
    if (cocktail && (entry.riskLevel === 'high' || entry.riskLevel === 'moderate')) {
      points *= COCKTAIL_MULTIPLIER;
    }
    additiveTotal += points;
    penalties.push({
      code: entry.code,
      label: `${entry.code.toUpperCase()} ${entry.nameFr}${cocktail ? ' (effet cocktail x2)' : ''}`,
      points,
      category: 'additive',
    });
  }
  if (cocktail) {
    profileAdjustments.push('Effet cocktail : pénalités additifs x2');
  }
  score -= additiveTotal;

  const macros = input.macros_100g;
  const portion = Math.max(0, input.portion_grams ?? 0);
  const perPortion = (per100g: number) => (Math.max(0, per100g) / 100) * portion;

  const sugarCharge = perPortion(macros?.sugars ?? 0);
  if (sugarCharge > 0) {
    const pts = sugarCharge * MACRO_PENALTIES.sugarPerGram;
    penalties.push({
      code: 'sugars',
      label: `Sucres ${sugarCharge.toFixed(1)}g / portion`,
      points: pts,
      category: 'macro',
    });
    score -= pts;
  }

  if (novaGroup >= SAT_FAT_REFINED_NOVA_MIN) {
    const satCharge = perPortion(macros?.saturated_fat ?? 0);
    if (satCharge > 0) {
      const pts = satCharge * MACRO_PENALTIES.saturatedFatPerGram;
      penalties.push({
        code: 'sat_fat',
        label: `Graisses saturées raffinées ${satCharge.toFixed(1)}g / portion`,
        points: pts,
        category: 'macro',
      });
      score -= pts;
    }
  }

  if ((macros?.salt ?? 0) > SALT_THRESHOLD_100G) {
    penalties.push({
      code: 'salt',
      label: `Sel excessif (${macros.salt.toFixed(2)}g / 100g)`,
      points: MACRO_PENALTIES.saltExcess,
      category: 'macro',
    });
    score -= MACRO_PENALTIES.saltExcess;
  }

  if (novaGroup === 1) {
    const proteinBonus = Math.max(0, macros?.proteins ?? 0);
    const fiberBonus = Math.max(0, macros?.fiber ?? 0);
    if (proteinBonus > 0) {
      penalties.push({
        code: 'protein_bonus',
        label: `Protéines +${proteinBonus.toFixed(1)}g`,
        points: -proteinBonus,
        category: 'macro',
      });
      score += proteinBonus;
    }
    if (fiberBonus > 0) {
      penalties.push({
        code: 'fiber_bonus',
        label: `Fibres +${fiberBonus.toFixed(1)}g`,
        points: -fiberBonus,
        category: 'macro',
      });
      score += fiberBonus;
    }
  }

  let seedOilTotal = 0;
  for (const oil of seedOils) {
    if (!oil.refined) continue;
    let pts = SEED_OIL_PENALTIES.refined;
    let label = `${oil.nameFr} raffinée`;
    if (oil.deodorized) {
      pts += SEED_OIL_PENALTIES.deodorizedExtra;
      label += ' + désodorisée';
    }
    seedOilTotal += pts;
    penalties.push({ code: `oil_${oil.oil}`, label, points: pts, category: 'seed_oil' });
  }
  score -= seedOilTotal;

  if (cleanLabelingAlerts.length > 0) {
    const pts = cleanLabelingAlerts.length * 5;
    penalties.push({
      code: 'clean_labeling',
      label: `Clean labeling (${cleanLabelingAlerts.length} terme(s) trompeur(s))`,
      points: pts,
      category: 'clean_labeling',
    });
    score -= pts;
  }

  if (profile.type === 'intolerant') {
    const raw = input.ingredients_raw ?? '';
    const hasLactose =
      (profile.intolerances?.includes('lactose') || profile.allergies?.includes('lactose')) &&
      LACTOSE_RE.test(raw);
    const hasGluten =
      (profile.intolerances?.includes('gluten') || profile.allergies?.includes('gluten')) &&
      GLUTEN_RE.test(raw);
    if (hasLactose) {
      penalties.push({
        code: 'profile_lactose',
        label: 'Profil intolérant : lactose détecté',
        points: INTOLERANT_LACTOSE_MALUS,
        category: 'profile',
      });
      profileAdjustments.push('Lactose détecté — pénalité intolérant +20');
      score -= INTOLERANT_LACTOSE_MALUS;
    }
    if (hasGluten) {
      penalties.push({
        code: 'profile_gluten',
        label: 'Profil intolérant : gluten détecté',
        points: INTOLERANT_GLUTEN_MALUS,
        category: 'profile',
      });
      profileAdjustments.push('Gluten détecté — pénalité intolérant +20');
      score -= INTOLERANT_GLUTEN_MALUS;
    }
  }

  return buildResult(
    score,
    resolvedInput,
    penalties,
    blockers,
    seedOils,
    cleanLabelingLabels,
    profileAdjustments
  );
}

export { findAdditive };
