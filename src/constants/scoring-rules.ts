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
