import { computePackagingPenalty } from '../packaging-modifier';
import {
  MAX_PACKAGING_PENALTY,
  PACKAGING_NON_RECYCLABLE_SURCHARGE,
} from '@/src/constants/scoring-rules';
import {
  PACKAGING_RISKS,
  type PackagingComponent,
} from '@/src/data/packaging-risks';

/** Le `packagings[]` réel de la Cristaline (3274080005003). */
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

describe('computePackagingPenalty — ancrage eau PET', () => {
  it('chiffre la bouteille PET + bouchon HDPE à 38 points', () => {
    // PET   : moderate 26 + plastique au contact 6            = 32
    // HDPE  : low        0 + plastique au contact 6            =  6
    // L'étiquette (food_contact: 0) est écartée par la détection.
    const penalty = computePackagingPenalty(CRISTALINE);

    expect(penalty.factors.map((f) => f.code)).toEqual(['pet', 'hdpe']);
    expect(penalty.factors.map((f) => f.rawPoints)).toEqual([32, 6]);
    expect(penalty.rawPoints).toBe(38);
    expect(penalty.cappedPoints).toBe(38);
  });

  it('marque les deux composants comme au contact confirmé', () => {
    const penalty = computePackagingPenalty(CRISTALINE);
    expect(penalty.factors.every((f) => f.foodContact === 'confirmed')).toBe(true);
  });
});

describe('computePackagingPenalty — matériaux inertes', () => {
  // Une ligne « Verre −12 » sous un badge « Risque faible · Recyclable » serait
  // deux affirmations vraies qui se contredisent. Le verre ne coûte rien.
  it('ne pénalise ni le verre ni le carton, même au contact alimentaire', () => {
    for (const material of ['en:glass', 'en:paper', 'en:paperboard']) {
      const penalty = computePackagingPenalty([{ material, food_contact: 1 }]);
      expect(penalty.rawPoints).toBe(0);
      expect(penalty.factors).toEqual([]);
    }
  });

  it('ne crée jamais de facteur à 0 point', () => {
    const penalty = computePackagingPenalty([
      { material: 'en:glass', shape: 'en:jar', food_contact: 1 },
      { material: 'en:pvc', food_contact: 1 },
    ]);
    expect(penalty.factors.map((f) => f.code)).toEqual(['pvc']);
    expect(penalty.factors.every((f) => f.rawPoints > 0)).toBe(true);
  });
});

describe('computePackagingPenalty — R4 : une donnée absente ne pénalise pas', () => {
  // Miroir de l'allowlist de packaging-risks.test.ts. Cette liste ne doit que
  // rétrécir : toute nouvelle entrée à `recyclable: false` doit être documentée.
  const DOCUMENTED_NOT_RECYCLABLE = ['ps', 'pvc'];

  it("n'applique la surcharge non-recyclable qu'aux matériaux documentés", () => {
    const surcharged = PACKAGING_RISKS.filter((m) => m.recyclable === false)
      .map((m) => m.id)
      .sort();
    expect(surcharged).toEqual(DOCUMENTED_NOT_RECYCLABLE);
  });

  it('note une recyclabilité INCONNUE exactement comme une recyclabilité avérée', () => {
    // plastic_film et unknown_plastic sont `recyclable: null`, et moderate comme
    // le PET qui est `recyclable: true`. Si `null` était traité comme `false`,
    // ils coûteraient PACKAGING_NON_RECYCLABLE_SURCHARGE de plus que le PET.
    const pet = computePackagingPenalty([
      { material: 'en:pet-1-polyethylene-terephthalate', food_contact: 1 },
    ]).rawPoints;

    for (const material of ['en:plastic-film', 'en:plastic']) {
      const unknownRecyclability = computePackagingPenalty([
        { material, food_contact: 1 },
      ]).rawPoints;
      expect(unknownRecyclability).toBe(pet);
      expect(unknownRecyclability).toBeLessThan(
        pet + PACKAGING_NON_RECYCLABLE_SURCHARGE,
      );
    }
  });
});

describe('computePackagingPenalty — pondération du contact alimentaire', () => {
  it('atténue de moitié un contact alimentaire inconnu', () => {
    // PVC : high 40 + plastique au contact 6 + non recyclable 6 = 52 si confirmé.
    const confirmed = computePackagingPenalty([
      { material: 'en:pvc', food_contact: 1 },
    ]);
    expect(confirmed.rawPoints).toBe(52);

    // Contact inconnu : pas de surcharge plastique, puis pondération 0.5.
    const unknown = computePackagingPenalty([{ material: 'en:pvc' }]);
    expect(unknown.rawPoints).toBe(23);
    expect(unknown.factors[0].foodContact).toBe('unknown');
  });
});

describe('computePackagingPenalty — bornes', () => {
  it('plafonne le malus sans écraser le brut', () => {
    const penalty = computePackagingPenalty([
      { material: 'en:pvc', food_contact: 1 },
      { material: 'en:ps', food_contact: 1 },
      { material: 'en:plastic-film', food_contact: 1 },
    ]);
    expect(penalty.rawPoints).toBeGreaterThan(MAX_PACKAGING_PENALTY);
    expect(penalty.cappedPoints).toBe(MAX_PACKAGING_PENALTY);
  });

  it('trie les facteurs du plus pénalisant au moins pénalisant', () => {
    const penalty = computePackagingPenalty(CRISTALINE);
    const points = penalty.factors.map((f) => f.rawPoints);
    expect([...points].sort((a, b) => b - a)).toEqual(points);
  });

  it('renvoie un malus nul sur une entrée absente, vide ou non reconnue', () => {
    const empty = { rawPoints: 0, cappedPoints: 0, factors: [] };
    expect(computePackagingPenalty(null)).toEqual(empty);
    expect(computePackagingPenalty(undefined)).toEqual(empty);
    expect(computePackagingPenalty([])).toEqual(empty);
    expect(computePackagingPenalty([{ material: 'en:licorne' }])).toEqual(empty);
  });
});
