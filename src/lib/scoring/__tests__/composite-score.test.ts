import { composeScore } from '../composite-score';
import { calculateScore, getScoreColor } from '../engine';
import type { ScoringInput, ScoringResult, UserProfile } from '../../api/types';
import type { PackagingComponent } from '@/src/data/packaging-risks';

const standardProfile: UserProfile = {
  type: 'standard',
  allergies: [],
  intolerances: [],
};

function baseInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    barcode: '0000000000000',
    ingredients_raw: '',
    additives_tags: [],
    nova_group: 1,
    macros_100g: { sugars: 0, saturated_fat: 0, salt: 0, proteins: 0, fiber: 0 },
    portion_grams: 100,
    oil_types: [],
    is_organic: false,
    ...overrides,
  };
}

/** Les 8 champs de `ScoringResult` — ce que voit un consommateur non modifié. */
const LEGACY_KEYS = [
  'score_final',
  'score_color',
  'nova_group',
  'penalties',
  'blockers',
  'seed_oils_detected',
  'clean_labeling_alerts',
  'profile_adjustments',
] as const;

function legacyView(result: ScoringResult): Record<string, unknown> {
  return Object.fromEntries(LEGACY_KEYS.map((k) => [k, result[k]]));
}

/** Le `packagings[]` réel de la Cristaline — 38 points bruts. */
const CRISTALINE: PackagingComponent[] = [
  {
    material: 'en:pet-1-polyethylene-terephthalate',
    shape: 'en:bottle',
    food_contact: 1,
  },
  {
    material: 'en:hdpe-2-high-density-polyethylene',
    shape: 'en:bottle-cap',
    food_contact: 1,
  },
  { material: 'en:plastic', shape: 'en:label', food_contact: 0 },
];

/** Le pire emballage atteignable : dépasse le plafond de malus. */
const WORST: PackagingComponent[] = [
  { material: 'en:pvc', food_contact: 1 },
  { material: 'en:ps', food_contact: 1 },
  { material: 'en:plastic-film', food_contact: 1 },
];

/** Cas repris de engine.test.ts — le moteur, tel qu'il est aujourd'hui. */
const ENGINE_CASES: Array<{ name: string; input: ScoringInput }> = [
  {
    name: 'pomme brute',
    input: baseInput({
      ingredients_raw: 'pomme',
      macros_100g: { sugars: 0, saturated_fat: 0, salt: 0, proteins: 0.3, fiber: 2.4 },
      portion_grams: 150,
    }),
  },
  {
    name: 'aspartame (bloquant)',
    input: baseInput({
      ingredients_raw: 'eau, aspartame',
      additives_tags: ['en:e951'],
      nova_group: 4,
    }),
  },
  {
    name: 'soda NOVA 4 sucré',
    input: baseInput({
      ingredients_raw: 'eau, sucre, colorant caramel',
      additives_tags: ['en:e150d'],
      nova_group: 4,
      macros_100g: { sugars: 10.6, saturated_fat: 0, salt: 0, proteins: 0, fiber: 0 },
      portion_grams: 330,
    }),
  },
  {
    name: 'céréales enfant',
    input: baseInput({
      ingredients_raw: 'céréales, sucre, huile de tournesol raffinée',
      nova_group: 4,
      macros_100g: { sugars: 25, saturated_fat: 3, salt: 0.5, proteins: 7, fiber: 5 },
      portion_grams: 30,
      oil_types: ['tournesol'],
    }),
  },
  {
    name: 'yaourt bio NOVA 2',
    input: baseInput({
      ingredients_raw: 'lait entier bio, ferments lactiques',
      nova_group: 2,
      macros_100g: { sugars: 4.5, saturated_fat: 2, salt: 0.1, proteins: 3.5, fiber: 0 },
      portion_grams: 125,
      is_organic: true,
    }),
  },
  {
    name: 'sel excessif',
    input: baseInput({
      ingredients_raw: 'bouillon déshydraté',
      nova_group: 3,
      macros_100g: { sugars: 0, saturated_fat: 0, salt: 4.2, proteins: 0, fiber: 0 },
      portion_grams: 10,
    }),
  },
  {
    name: 'clean labeling',
    input: baseInput({
      ingredients_raw: 'eau, arôme naturel, extrait de levure',
      nova_group: 3,
    }),
  },
];

describe('composeScore — R2 : non-régression du moteur de formulation', () => {
  // L'assertion qui protège le moteur. Si elle tombe, la couche de composition
  // a cessé d'être une couche.
  it.each(ENGINE_CASES)(
    'laisse $name strictement identique sans donnée emballage',
    ({ input }) => {
      const formulation = calculateScore(input, standardProfile);
      for (const packagings of [[], null, undefined]) {
        const composed = composeScore(formulation, packagings);
        expect(legacyView(composed)).toEqual(legacyView(formulation));
        expect(composed.formulationScore).toBe(formulation.score_final);
        expect(composed.packagingPenalty).toBe(0);
      }
    },
  );

  it('laisse le score intact quand l’emballage est inerte (verre, carton)', () => {
    const formulation = calculateScore(
      baseInput({ ingredients_raw: 'miel' }),
      standardProfile,
    );
    const composed = composeScore(formulation, [
      { material: 'en:glass', shape: 'en:jar', food_contact: 1 },
      { material: 'en:paper', shape: 'en:label', food_contact: 0 },
    ]);

    expect(legacyView(composed)).toEqual(legacyView(formulation));
    expect(composed.packagingPenalty).toBe(0);
    // Une donnée d'emballage EXISTE, elle ne coûte simplement rien.
    expect(composed.hasPackagingData).toBe(true);
  });
});

/** Formulation synthétique — isole la composition de l'arithmétique du moteur. */
function formulationOf(score: number): ScoringResult {
  return {
    score_final: score,
    score_color: getScoreColor(score),
    nova_group: 1,
    penalties: [],
    blockers: [],
    seed_oils_detected: [],
    clean_labeling_alerts: [],
    profile_adjustments: [],
  };
}

describe('composeScore — R3 : intensité modérée', () => {
  it('fait atterrir une eau PET pure à 62', () => {
    const composed = composeScore(formulationOf(100), CRISTALINE);
    expect(composed.score_final).toBe(62);
    expect(composed.score_final).toBeGreaterThanOrEqual(60);
    expect(composed.score_final).toBeLessThanOrEqual(65);
    expect(composed.formulationScore).toBe(100);
    expect(composed.packagingPenalty).toBe(38);
  });

  it("ne laisse jamais l'emballage seul faire descendre une formulation parfaite sous 55", () => {
    const composed = composeScore(formulationOf(100), WORST);
    expect(composed.score_final).toBe(55);
    expect(composed.score_final).toBeGreaterThanOrEqual(55);
  });

  it('garde le contenu dominant : le malus appliqué ne dépasse jamais 45 % du score', () => {
    for (let score = 0; score <= 100; score += 1) {
      const composed = composeScore(formulationOf(score), WORST);
      expect(composed.packagingPenalty).toBeLessThanOrEqual(
        Math.ceil(score * 0.45),
      );
    }
  });
});

describe('composeScore — plancher et sémantique du zéro', () => {
  it('maintient un produit déjà mauvais au-dessus du plancher absurde', () => {
    // formulation 20 + le pire emballage possible → 11, pas 0.
    expect(composeScore(formulationOf(20), WORST).score_final).toBe(11);
  });

  it('réserve le 0 aux additifs bloquants', () => {
    // Sur toute l'échelle : seule une formulation nulle produit une note nulle.
    for (let score = 0; score <= 100; score += 1) {
      const composed = composeScore(formulationOf(score), WORST);
      expect(composed.score_final === 0).toBe(score === 0);
    }
  });

  it('ne dégrade pas un produit déjà bloqué à 0', () => {
    const blocked: ScoringResult = {
      ...formulationOf(0),
      blockers: ['E951 — Aspartame'],
    };
    const composed = composeScore(blocked, WORST);
    expect(composed.score_final).toBe(0);
    expect(composed.packagingPenalty).toBe(0);
    expect(composed.blockers).toEqual(['E951 — Aspartame']);
  });
});

describe('composeScore — invariants de classement', () => {
  it('ne peut jamais inverser deux produits à emballage égal', () => {
    let previous = -1;
    for (let score = 0; score <= 100; score += 1) {
      const current = composeScore(formulationOf(score), CRISTALINE).score_final;
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });

  it('recalcule la couleur à partir de la note composée', () => {
    for (const score of [100, 90, 75, 60, 40, 20, 0]) {
      const composed = composeScore(formulationOf(score), CRISTALINE);
      expect(composed.score_color).toBe(getScoreColor(composed.score_final));
    }
  });
});

describe('composeScore — décomposition affichable', () => {
  it('produit des facteurs dont la somme vaut exactement la note', () => {
    const packagingCases = [CRISTALINE, WORST, [{ material: 'en:pvc' }], []];
    for (let score = 0; score <= 100; score += 1) {
      for (const packagings of packagingCases) {
        const composed = composeScore(formulationOf(score), packagings);
        const sum = composed.factors.reduce((acc, f) => acc + f.points, 0);
        expect(sum).toBe(composed.score_final);
      }
    }
  });

  it('ouvre sur la formulation, puis les emballages du plus pénalisant au moins', () => {
    const composed = composeScore(formulationOf(100), CRISTALINE);
    expect(composed.factors[0]).toMatchObject({
      kind: 'formulation',
      code: 'formulation',
      points: 100,
    });
    expect(composed.factors.slice(1).map((f) => f.code)).toEqual(['pet', 'hdpe']);
    expect(composed.factors.slice(1).every((f) => f.points < 0)).toBe(true);
  });

  it('réduit la décomposition à la seule formulation sans emballage pénalisant', () => {
    // La carte se masque d'elle-même sur ce cas (moins de deux facteurs).
    const composed = composeScore(formulationOf(80), []);
    expect(composed.factors).toHaveLength(1);
  });

  it('n’émet aucune ligne emballage à 0 point', () => {
    for (let score = 0; score <= 100; score += 1) {
      const composed = composeScore(formulationOf(score), CRISTALINE);
      expect(composed.factors.every((f) => f.points !== 0 || score === 0)).toBe(
        true,
      );
    }
  });

  it('qualifie chaque emballage par son risque et son contact, sans prescrire', () => {
    const composed = composeScore(formulationOf(100), CRISTALINE);
    const details = composed.factors.slice(1).map((f) => f.detail ?? '');
    expect(details).toEqual([
      'risque modéré · au contact',
      'risque faible · au contact',
    ]);
    for (const detail of details) {
      expect(detail).not.toMatch(/évite|évitez|préfère|préférez|ne pas|choisis/i);
    }
  });
});

describe('composeScore — l’emballage reste hors de penalties[]', () => {
  it('ne verse aucun facteur emballage dans penalties, sérialisé en historique', () => {
    // penalties_snapshot alimente « exposition toxique » : y verser `pet`
    // le compterait comme un additif.
    const formulation = calculateScore(
      baseInput({
        ingredients_raw: 'eau, colorant caramel',
        additives_tags: ['en:e150d'],
        nova_group: 4,
      }),
      standardProfile,
    );
    const composed = composeScore(formulation, CRISTALINE);

    expect(composed.penalties).toEqual(formulation.penalties);
    expect(composed.penalties.map((p) => p.code)).not.toContain('pet');
    expect(composed.penalties.map((p) => p.code)).not.toContain('hdpe');
  });
});
