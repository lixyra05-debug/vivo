/**
 * Compose le score affiché à partir du score de formulation et de l'emballage.
 *
 * CETTE COUCHE EST AU-DESSUS DU MOTEUR. `engine.ts` n'est pas modifié et son
 * résultat n'est jamais recalculé : il est amorti. Le sous-score de formulation
 * reste exposé tel quel, ce qui permet à la fiche de montrer « formulation X,
 * emballage −Y » sans que l'un contamine l'autre.
 *
 * ── Modèle : amortissement proportionnel ──────────────────────────────────
 *
 *     note = arrondi( formulation × (1 − malusPlafonné / 100) )
 *
 * Trois propriétés en découlent, et ce sont elles qui justifient le modèle :
 *
 *   • `note === 0` ⟺ `formulation === 0`. Le zéro reste RÉSERVÉ aux additifs
 *     bloquants (`engine.ts`, chemin `buildResult(0, …)`). Un biscuit sous
 *     plastique ne devient jamais indiscernable d'un produit à l'aspartame.
 *
 *   • L'emballage seul ne fait jamais descendre une formulation parfaite sous
 *     55 : le contenu reste dominant, et c'est démontrable, pas déclaratif.
 *
 *   • À emballage constant, la note reste croissante avec la formulation :
 *     les classements ne peuvent pas s'inverser.
 *
 * ── Pourquoi l'emballage n'entre PAS dans `penalties[]` ────────────────────
 *
 * `penalties` est sérialisé dans `scan_history.penalties_snapshot`, que
 * `advanced-stats` agrège en « exposition toxique » : il somme tous les
 * `points` et compte tous les `code` comme additifs uniques. Y verser `pet` ou
 * `hdpe` rapporterait des emballages à l'utilisateur comme étant des additifs.
 * L'emballage vit donc uniquement dans `factors`.
 */

import type { PackagingComponent } from '@/src/data/packaging-risks';
import type { ScoringResult } from '../api/types';
import { getScoreColor } from './engine';
import { MAX_PACKAGING_PENALTY } from '@/src/constants/scoring-rules';
import {
  computePackagingPenalty,
  type PackagingFactor,
} from './packaging-modifier';

export interface ScoreFactor {
  kind: 'formulation' | 'packaging';
  /** `'formulation'` ou un identifiant catalogue emballage. Clé de liste stable. */
  code: string;
  label: string;
  /** Qualificatif court et factuel, jamais prescriptif. */
  detail?: string;
  /** SIGNÉ et déjà arrondi. La somme des facteurs vaut exactement `score_final`. */
  points: number;
}

/**
 * Sur-type de `ScoringResult` : tout consommateur existant continue de lire
 * `score_final` sans savoir que l'emballage y est entré (aucun champ
 * `finalScore` concurrent — un nombre, un nom).
 */
export interface CompositeScoringResult extends ScoringResult {
  /** Le `score_final` du moteur, intact. */
  formulationScore: number;
  /** `formulationScore − score_final`, toujours ≥ 0. */
  packagingPenalty: number;
  /** Malus brut avant plafond et amortissement — diagnostic et tests. */
  packagingPenaltyRaw: number;
  hasPackagingData: boolean;
  factors: ScoreFactor[];
}

const RISK_LABEL = {
  high: 'risque élevé',
  moderate: 'risque modéré',
  low: 'risque faible',
} as const;

const CONTACT_LABEL = {
  confirmed: 'au contact',
  unknown: 'contact non précisé',
} as const;

/**
 * Répartit un entier sur des poids réels sans perdre ni inventer d'unité
 * (méthode du plus fort reste). Sans cela, les lignes affichées ne
 * s'additionneraient pas au score affiché — une décomposition qui ne tombe pas
 * juste est pire que pas de décomposition du tout.
 */
function distributeRounded(total: number, weights: number[]): number[] {
  if (total <= 0 || weights.length === 0) return weights.map(() => 0);
  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (sum <= 0) return weights.map(() => 0);

  const exact = weights.map((w) => (w / sum) * total);
  const out = exact.map((v) => Math.floor(v));
  let remainder = total - out.reduce((acc, v) => acc + v, 0);

  const byFraction = exact
    .map((v, index) => ({ index, fraction: v - Math.floor(v) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let k = 0; k < byFraction.length && remainder > 0; k += 1) {
    out[byFraction[k].index] += 1;
    remainder -= 1;
  }
  return out;
}

function buildPackagingFactors(
  packagingFactors: PackagingFactor[],
  appliedPenalty: number,
): ScoreFactor[] {
  const distributed = distributeRounded(
    appliedPenalty,
    packagingFactors.map((f) => f.rawPoints),
  );

  const out: ScoreFactor[] = [];
  packagingFactors.forEach((factor, index) => {
    const points = distributed[index];
    // Un facteur qui ne retire rien (formulation nulle, arrondi) n'est pas
    // affiché : pas de ligne fantôme à 0.
    if (points <= 0) return;
    out.push({
      kind: 'packaging',
      code: factor.code,
      label: factor.label,
      detail: `${RISK_LABEL[factor.riskLevel]} · ${CONTACT_LABEL[factor.foodContact]}`,
      points: -points,
    });
  });
  return out;
}

/**
 * Applique le malus emballage au résultat du moteur de formulation.
 *
 * Sans donnée d'emballage exploitable, renvoie le résultat du moteur à
 * l'identique — mêmes valeurs, `packagingPenalty` à 0 — de sorte qu'un produit
 * sans emballage connu note exactement comme avant l'introduction de cette
 * couche.
 */
export function composeScore(
  formulation: ScoringResult,
  packagings: PackagingComponent[] | null | undefined,
): CompositeScoringResult {
  const formulationScore = formulation.score_final;
  const hasPackagingData = Array.isArray(packagings) && packagings.length > 0;
  const penalty = computePackagingPenalty(packagings);

  const base: CompositeScoringResult = {
    ...formulation,
    formulationScore,
    packagingPenalty: 0,
    packagingPenaltyRaw: penalty.rawPoints,
    hasPackagingData,
    factors: [
      {
        kind: 'formulation',
        code: 'formulation',
        label: 'Formulation',
        points: formulationScore,
      },
    ],
  };

  if (penalty.cappedPoints <= 0) return base;

  const capped = Math.min(penalty.cappedPoints, MAX_PACKAGING_PENALTY);
  const damped = capped * (formulationScore / 100);
  const score = Math.max(
    0,
    Math.min(100, Math.round(formulationScore - damped)),
  );
  const applied = formulationScore - score;

  if (applied <= 0) return base;

  return {
    ...base,
    score_final: score,
    score_color: getScoreColor(score),
    packagingPenalty: applied,
    factors: [
      base.factors[0],
      ...buildPackagingFactors(penalty.factors, applied),
    ],
  };
}
