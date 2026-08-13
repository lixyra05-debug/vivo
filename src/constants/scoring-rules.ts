export const NOVA_CEILINGS = {
  1: 100,
  2: 80,
  3: 60,
  4: 30,
} as const;

export const SCORE_THRESHOLDS = {
  green: 70,
  yellow: 50,
  orange: 25,
} as const;

export const MACRO_PENALTIES = {
  sugarPerGram: 2,
  saturatedFatPerGram: 2,
  saltExcess: 5,
} as const;

export const SEED_OIL_PENALTIES = {
  refined: 30,
  deodorizedExtra: 40,
} as const;

export const COCKTAIL_MULTIPLIER = 2;

/**
 * Barème emballage — appliqué EN DEHORS de `engine.ts`, par `composite-score.ts`.
 * Le score de formulation n'est jamais recalculé : il est amorti.
 *
 * Calibrage : une eau en bouteille PET pure (formulation 100, PET + bouchon HDPE
 * tous deux au contact) doit atterrir autour de 62 — pas 100, pas 50.
 *
 * `low` vaut 0 : le verre et le carton ne coûtent rien. `PackagingSection`
 * affiche déjà « Verre — Risque faible · Recyclable » ; une ligne « Verre −12 »
 * juste en dessous serait deux affirmations vraies qui se contredisent.
 * Les polymères à risque faible (HDPE, PP…) sont atteints par la surcharge
 * plastique-au-contact, pas par leur niveau de risque.
 */
export const PACKAGING_RISK_POINTS = {
  high: 40,
  moderate: 26,
  low: 0,
} as const;

/** Migration au contact : ne s'applique qu'aux polymères, et seulement si le contact est confirmé. */
export const PACKAGING_PLASTIC_CONTACT_SURCHARGE = 6;

/**
 * Ne se déclenche que sur `recyclable === false`, une propriété DOCUMENTÉE
 * (PVC, PS). Une recyclabilité inconnue (`null`) n'ajoute rien : absence de
 * donnée n'est pas une mauvaise note.
 */
export const PACKAGING_NON_RECYCLABLE_SURCHARGE = 6;

/**
 * `food_contact` est absent sur ~40 % des composants OFF. La détection les
 * conserve délibérément ; le barème les atténue plutôt que de les compter plein
 * tarif — ou de les ignorer.
 */
export const PACKAGING_UNKNOWN_CONTACT_WEIGHT = 0.5;

/**
 * Plafond du malus brut. Garantit que l'emballage seul ne peut jamais faire
 * descendre une formulation parfaite sous 55 — le contenu reste dominant.
 */
export const MAX_PACKAGING_PENALTY = 45;
