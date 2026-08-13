/**
 * Traduit un emballage détecté en malus de score.
 *
 * Module PUR : aucune I/O, aucun React, aucune dépendance au moteur de
 * formulation. Il ne connaît que le catalogue `packaging-risks` et le barème
 * de `scoring-rules`. La composition avec le score de formulation se fait
 * ailleurs (`composite-score.ts`) — ici on ne produit qu'un nombre de points
 * et sa justification.
 *
 * Le malus renvoyé est BRUT : ni amorti, ni soustrait. Le plafonnement est
 * exposé séparément (`cappedPoints`) pour que l'appelant puisse distinguer
 * « emballage très mauvais » de « emballage au plafond ».
 */

import {
  detectPackagingDetections,
  isPlasticMaterial,
  type FoodContactStatus,
  type PackagingComponent,
  type PackagingRiskLevel,
} from '@/src/data/packaging-risks';
import {
  MAX_PACKAGING_PENALTY,
  PACKAGING_NON_RECYCLABLE_SURCHARGE,
  PACKAGING_PLASTIC_CONTACT_SURCHARGE,
  PACKAGING_RISK_POINTS,
  PACKAGING_UNKNOWN_CONTACT_WEIGHT,
} from '@/src/constants/scoring-rules';

export interface PackagingFactor {
  /** Identifiant catalogue (`pet`, `pvc`…). Stable, utilisable comme clé de liste. */
  code: string;
  /** Nom lisible, repris tel quel du catalogue. */
  label: string;
  riskLevel: PackagingRiskLevel;
  foodContact: FoodContactStatus;
  /** Toujours > 0 : un matériau à 0 point n'est pas un facteur. */
  rawPoints: number;
}

export interface PackagingPenalty {
  /** Somme des facteurs, sans plafond. */
  rawPoints: number;
  /** `min(rawPoints, MAX_PACKAGING_PENALTY)` — ce que la composition doit consommer. */
  cappedPoints: number;
  /** Trié par points décroissants. `[]` quand rien n'est détecté ou que tout est inerte. */
  factors: PackagingFactor[];
}

const EMPTY: PackagingPenalty = { rawPoints: 0, cappedPoints: 0, factors: [] };

/**
 * Points bruts d'un matériau donné.
 *
 * Trois termes s'additionnent avant pondération :
 *   1. le niveau de risque du matériau ;
 *   2. une surcharge si c'est un polymère AU CONTACT confirmé de l'aliment
 *      (c'est la migration qui est pénalisée, pas le plastique en soi) ;
 *   3. une surcharge si l'exclusion des filières de recyclage est DOCUMENTÉE.
 *
 * Le tout est pondéré par la certitude du contact alimentaire.
 */
function materialPoints(
  id: string,
  riskLevel: PackagingRiskLevel,
  recyclable: boolean | null,
  foodContact: FoodContactStatus,
): number {
  const confirmed = foodContact === 'confirmed';

  let points = PACKAGING_RISK_POINTS[riskLevel];
  if (confirmed && isPlasticMaterial(id)) {
    points += PACKAGING_PLASTIC_CONTACT_SURCHARGE;
  }
  // `=== false` et non `!recyclable` : `null` signifie inconnu, et l'inconnu
  // ne pénalise jamais.
  if (recyclable === false) {
    points += PACKAGING_NON_RECYCLABLE_SURCHARGE;
  }

  return confirmed ? points : points * PACKAGING_UNKNOWN_CONTACT_WEIGHT;
}

/**
 * Malus emballage à partir du `packagings[]` brut normalisé.
 *
 * Renvoie un malus nul — et zéro facteur — pour un emballage inerte (verre,
 * carton) ou absent. La carte de décomposition disparaît alors d'elle-même
 * plutôt que d'afficher une ligne à 0.
 */
export function computePackagingPenalty(
  packagings: PackagingComponent[] | null | undefined,
): PackagingPenalty {
  if (!Array.isArray(packagings) || packagings.length === 0) return EMPTY;

  const detections = detectPackagingDetections(packagings);
  if (detections.length === 0) return EMPTY;

  const factors: PackagingFactor[] = [];
  for (const { entry, foodContact } of detections) {
    const rawPoints = materialPoints(
      entry.id,
      entry.riskLevel,
      entry.recyclable,
      foodContact,
    );
    if (rawPoints <= 0) continue;
    factors.push({
      code: entry.id,
      label: entry.nameFr,
      riskLevel: entry.riskLevel,
      foodContact,
      rawPoints,
    });
  }

  if (factors.length === 0) return EMPTY;

  factors.sort((a, b) => b.rawPoints - a.rawPoints);
  const rawPoints = factors.reduce((sum, f) => sum + f.rawPoints, 0);

  return {
    rawPoints,
    cappedPoints: Math.min(rawPoints, MAX_PACKAGING_PENALTY),
    factors,
  };
}
