import {
  getNutrientThreshold,
  convertToPortionValues,
  getScoreVerdict,
  groupPenaltiesByCategory,
  mapIngredientsToRisk,
} from '../display-helpers';
import { scoreColor } from '@/src/constants/colors';
import type { PenaltyDetail } from '../../api/types';

describe('getNutrientThreshold', () => {
  it('classe 0g de sucres comme bon', () => {
    expect(getNutrientThreshold('sugars', 0)).toBe('good');
  });

  it('classe 4.9g de sucres comme bon (sous la borne 5)', () => {
    expect(getNutrientThreshold('sugars', 4.9)).toBe('good');
  });

  it('classe 5g de sucres comme modéré (borne inférieure inclusive)', () => {
    expect(getNutrientThreshold('sugars', 5)).toBe('moderate');
  });

  it('classe 14.9g de sucres comme modéré', () => {
    expect(getNutrientThreshold('sugars', 14.9)).toBe('moderate');
  });

  it('classe 15g de sucres comme mauvais (borne haute inclusive)', () => {
    expect(getNutrientThreshold('sugars', 15)).toBe('bad');
  });

  it('classe 30g de sucres comme mauvais', () => {
    expect(getNutrientThreshold('sugars', 30)).toBe('bad');
  });

  it('classe les graisses saturées selon les seuils 2/5', () => {
    expect(getNutrientThreshold('saturated_fat', 0)).toBe('good');
    expect(getNutrientThreshold('saturated_fat', 1.9)).toBe('good');
    expect(getNutrientThreshold('saturated_fat', 2)).toBe('moderate');
    expect(getNutrientThreshold('saturated_fat', 4.9)).toBe('moderate');
    expect(getNutrientThreshold('saturated_fat', 5)).toBe('bad');
    expect(getNutrientThreshold('saturated_fat', 10)).toBe('bad');
  });

  it('classe le sel selon les seuils 0.5/1.5', () => {
    expect(getNutrientThreshold('salt', 0)).toBe('good');
    expect(getNutrientThreshold('salt', 0.4)).toBe('good');
    expect(getNutrientThreshold('salt', 0.5)).toBe('moderate');
    expect(getNutrientThreshold('salt', 1)).toBe('moderate');
    expect(getNutrientThreshold('salt', 1.5)).toBe('bad');
    expect(getNutrientThreshold('salt', 3)).toBe('bad');
  });

  it("classe l'énergie (kcal) selon les seuils 200/400", () => {
    expect(getNutrientThreshold('energy', 0)).toBe('good');
    expect(getNutrientThreshold('energy', 199)).toBe('good');
    expect(getNutrientThreshold('energy', 200)).toBe('moderate');
    expect(getNutrientThreshold('energy', 399)).toBe('moderate');
    expect(getNutrientThreshold('energy', 400)).toBe('bad');
    expect(getNutrientThreshold('energy', 600)).toBe('bad');
  });

  it('classe les protéines toujours comme bonnes', () => {
    expect(getNutrientThreshold('proteins', 0)).toBe('good');
    expect(getNutrientThreshold('proteins', 5)).toBe('good');
    expect(getNutrientThreshold('proteins', 50)).toBe('good');
  });

  it('classe les fibres toujours comme bonnes', () => {
    expect(getNutrientThreshold('fiber', 0)).toBe('good');
    expect(getNutrientThreshold('fiber', 5)).toBe('good');
    expect(getNutrientThreshold('fiber', 50)).toBe('good');
  });

  it('traite les valeurs négatives comme bonnes', () => {
    expect(getNutrientThreshold('sugars', -3)).toBe('good');
    expect(getNutrientThreshold('salt', -0.1)).toBe('good');
  });

  it('traite NaN comme bon', () => {
    expect(getNutrientThreshold('sugars', Number.NaN)).toBe('good');
    expect(getNutrientThreshold('energy', Number.NaN)).toBe('good');
  });
});

describe('convertToPortionValues', () => {
  it('ne modifie pas les macros pour une portion de 100g', () => {
    const result = convertToPortionValues(
      { sugars: 10, saturated_fat: 3, salt: 0.8, proteins: 5, fiber: 2 },
      100
    );
    expect(result.sugars).toBe(10);
    expect(result.saturated_fat).toBe(3);
    expect(result.salt).toBe(0.8);
    expect(result.proteins).toBe(5);
    expect(result.fiber).toBe(2);
  });

  it('divise les macros par 2 pour une portion de 50g', () => {
    const result = convertToPortionValues(
      { sugars: 20, saturated_fat: 6 },
      50
    );
    expect(result.sugars).toBe(10);
    expect(result.saturated_fat).toBe(3);
  });

  it('multiplie par 1.5 les macros pour une portion de 150g', () => {
    const result = convertToPortionValues(
      { sugars: 10, energy: 200 },
      150
    );
    expect(result.sugars).toBe(15);
    expect(result.energy).toBe(300);
  });

  it('laisse undefined les champs non fournis', () => {
    const result = convertToPortionValues({ sugars: 10 }, 100);
    expect(result.sugars).toBe(10);
    expect(result.saturated_fat).toBeUndefined();
    expect(result.salt).toBeUndefined();
    expect(result.proteins).toBeUndefined();
    expect(result.fiber).toBeUndefined();
    expect(result.energy).toBeUndefined();
  });

  it('traite une portion ≤ 0 comme 100g (sécurité)', () => {
    const result = convertToPortionValues({ sugars: 10, salt: 1 }, 0);
    expect(result.sugars).toBe(10);
    expect(result.salt).toBe(1);

    const resultNeg = convertToPortionValues({ sugars: 10, salt: 1 }, -50);
    expect(resultNeg.sugars).toBe(10);
    expect(resultNeg.salt).toBe(1);
  });

  it('arrondit les valeurs à 1 décimale', () => {
    const result = convertToPortionValues({ sugars: 10 }, 33);
    // 10 * 0.33 = 3.3
    expect(result.sugars).toBe(3.3);
  });
});

describe('getScoreVerdict', () => {
  it('retourne Excellent pour un score de 100', () => {
    expect(getScoreVerdict(100).label).toBe('Excellent');
  });

  it('retourne Excellent pour 90 et Bon pour 89 (frontière)', () => {
    expect(getScoreVerdict(90).label).toBe('Excellent');
    expect(getScoreVerdict(89).label).toBe('Bon');
  });

  it('retourne Bon pour 70 et Moyen pour 69 (frontière)', () => {
    expect(getScoreVerdict(70).label).toBe('Bon');
    expect(getScoreVerdict(69).label).toBe('Moyen');
  });

  it('retourne Moyen pour 50 et Mauvais pour 49 (frontière)', () => {
    expect(getScoreVerdict(50).label).toBe('Moyen');
    expect(getScoreVerdict(49).label).toBe('Mauvais');
  });

  it('retourne Mauvais pour 25 et À éviter pour 24 (frontière)', () => {
    expect(getScoreVerdict(25).label).toBe('Mauvais');
    expect(getScoreVerdict(24).label).toBe('À éviter');
  });

  it('retourne À éviter pour un score de 0', () => {
    expect(getScoreVerdict(0).label).toBe('À éviter');
  });

  it('clampe les scores hors [0, 100]', () => {
    expect(getScoreVerdict(150).label).toBe('Excellent');
    expect(getScoreVerdict(-10).label).toBe('À éviter');
  });

  it('fournit une description non vide à chaque niveau', () => {
    expect(getScoreVerdict(95).description.length).toBeGreaterThan(0);
    expect(getScoreVerdict(75).description.length).toBeGreaterThan(0);
    expect(getScoreVerdict(55).description.length).toBeGreaterThan(0);
    expect(getScoreVerdict(30).description.length).toBeGreaterThan(0);
    expect(getScoreVerdict(5).description.length).toBeGreaterThan(0);
  });
});

/**
 * Ces deux gardes portent sur les DESCRIPTIONS uniquement. Les libellés
 * (« Excellent » … « À éviter ») forment l'échelle publique de l'app : ils sont
 * figés, et « À éviter » y est un palier, pas un conseil.
 */
describe('getScoreVerdict — le verdict constate, il ne prescrit pas', () => {
  const TIERS = [95, 75, 55, 30, 5];

  // Tournures qui disent à l'utilisateur quoi faire du produit.
  const PRESCRIPTION =
    /\b(à consommer|consommer|consommation|à limiter|limiter|évitez|privilégi|remplaç|remplacer|bannir|mangez)\b/i;

  // Qualificatifs absolus ou allégations de santé sur le produit entier.
  const ABSOLU = /\b(irréprochables?|sains?|saines?|parfaites?|parfaits?|inoffensifs?|garantis?)\b|sans danger/i;

  it("aucune description ne prescrit une conduite de consommation", () => {
    for (const score of TIERS) {
      const { description } = getScoreVerdict(score);
      expect([score, PRESCRIPTION.test(description)]).toEqual([score, false]);
    }
  });

  it('aucune description ne qualifie le produit en absolu', () => {
    for (const score of TIERS) {
      const { description } = getScoreVerdict(score);
      expect([score, ABSOLU.test(description)]).toEqual([score, false]);
    }
  });
});

describe('cohérence des échelles de score', () => {
  // Le score n'a qu'une échelle publique. `ScoreCircle` en tenait une seconde,
  // décalée d'un cran (95 → « Bon » à l'oral, « Excellent » à l'écran) ;
  // l'écran OCR en tenait une troisième (75 / 50 / 30) qui colorait un même 72
  // en jaune ici et en vert sur une fiche produit.

  function colorBoundaries(): number[] {
    const found: number[] = [];
    for (let s = 1; s <= 100; s++) {
      if (scoreColor(s) !== scoreColor(s - 1)) found.push(s);
    }
    return found;
  }

  it("l'échelle de couleur n'a que trois bornes : 25, 50, 70", () => {
    expect(colorBoundaries()).toEqual([25, 50, 70]);
  });

  it('toute borne de couleur est aussi une borne de verdict', () => {
    // L'inverse est faux et voulu : 90 sépare Excellent de Bon sans changer
    // de couleur. Le verdict raffine l'échelle, il ne la contredit pas.
    for (const s of colorBoundaries()) {
      expect([s, getScoreVerdict(s).label]).not.toEqual([
        s,
        getScoreVerdict(s - 1).label,
      ]);
    }
  });
});

describe('groupPenaltiesByCategory', () => {
  it('retourne toutes les catégories à 0 pour une liste vide', () => {
    const groups = groupPenaltiesByCategory([]);
    expect(groups).toEqual({
      nova: 0,
      additives: 0,
      macros: 0,
      oils: 0,
      clean_labeling: 0,
      profile: 0,
      bonus: 0,
    });
  });

  it('ventile correctement une pénalité par catégorie', () => {
    const penalties: PenaltyDetail[] = [
      { code: 'nova4', label: 'NOVA 4', points: 40, category: 'nova' },
      { code: 'e951', label: 'Aspartame', points: 100, category: 'additive' },
      { code: 'sugar', label: 'Sucres', points: 10, category: 'macro' },
      { code: 'oil_sunflower', label: 'Tournesol', points: 30, category: 'seed_oil' },
      { code: 'natural', label: 'Naturel', points: 5, category: 'clean_labeling' },
      { code: 'profile_child', label: 'Profil enfant', points: 20, category: 'profile' },
    ];
    const groups = groupPenaltiesByCategory(penalties);
    expect(groups.nova).toBe(40);
    expect(groups.additives).toBe(100);
    expect(groups.macros).toBe(10);
    expect(groups.oils).toBe(30);
    expect(groups.clean_labeling).toBe(5);
    expect(groups.profile).toBe(20);
    expect(groups.bonus).toBe(0);
  });

  it('traite les points négatifs comme des bonus (valeur absolue)', () => {
    const penalties: PenaltyDetail[] = [
      { code: 'bonus_proteins', label: 'Bonus protéines', points: -5, category: 'macro' },
      { code: 'bonus_fiber', label: 'Bonus fibres', points: -3, category: 'macro' },
    ];
    const groups = groupPenaltiesByCategory(penalties);
    expect(groups.bonus).toBe(8);
    expect(groups.macros).toBe(0);
  });

  it('additionne un mix complet (nova + additifs + macros + bonus)', () => {
    const penalties: PenaltyDetail[] = [
      { code: 'nova4', label: 'NOVA 4', points: 40, category: 'nova' },
      { code: 'e150d', label: 'Caramel', points: 30, category: 'additive' },
      { code: 'e330', label: 'Acide citrique', points: 20, category: 'additive' },
      { code: 'sugars', label: 'Sucres', points: 15, category: 'macro' },
      { code: 'bonus_proteins', label: 'Bonus protéines', points: -5, category: 'macro' },
    ];
    const groups = groupPenaltiesByCategory(penalties);
    expect(groups.nova).toBe(40);
    expect(groups.additives).toBe(50);
    expect(groups.macros).toBe(15);
    expect(groups.bonus).toBe(5);
    expect(groups.oils).toBe(0);
    expect(groups.clean_labeling).toBe(0);
    expect(groups.profile).toBe(0);
  });
});

describe('mapIngredientsToRisk', () => {
  it('retourne un tableau vide pour une chaîne vide', () => {
    expect(mapIngredientsToRisk('')).toEqual([]);
  });

  it('retourne un tableau vide pour une chaîne avec uniquement des espaces', () => {
    expect(mapIngredientsToRisk('   \t  ')).toEqual([]);
  });

  it('retourne 3 entrées sûres pour une liste sans additifs', () => {
    const result = mapIngredientsToRisk('farine de blé, sucre, sel');
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('farine de blé');
    expect(result[0].riskLevel).toBe('safe');
    expect(result[1].name).toBe('sucre');
    expect(result[1].riskLevel).toBe('safe');
    expect(result[2].name).toBe('sel');
    expect(result[2].riskLevel).toBe('safe');
  });

  it('extrait plusieurs E-codes dans un même token parenthèsé', () => {
    // E322 et E471 ne sont PAS dans la db → fallback 'safe'.
    // E171 est dans la db avec isBlocker: true → 'blocker'.
    const result = mapIngredientsToRisk(
      'émulsifiants (E322, E471), aspartame, colorant E171'
    );
    // Entrées attendues (dans l'ordre d'apparition, dédupliquées par name+risk) :
    //   1) 'émulsifiants' safe (depuis E322)
    //   2) 'émulsifiants' safe (depuis E471) → doublon → skip
    //   3) 'aspartame' safe (pas d'E-code, token nettoyé)
    //   4) 'colorant E171' blocker
    const names = result.map((r) => `${r.name}|${r.riskLevel}`);
    expect(names).toContain('émulsifiants|safe');
    expect(names).toContain('aspartame|safe');
    expect(names.some((n) => n.startsWith('colorant') && n.endsWith('|blocker'))).toBe(true);
    // Pas de doublon sur émulsifiants.
    const emulsifiantCount = names.filter((n) => n === 'émulsifiants|safe').length;
    expect(emulsifiantCount).toBe(1);
  });

  it('marque aspartame (E951) comme blocker et tartrazine (E102) comme high', () => {
    // E951 → isBlocker: true → 'blocker'
    // E102 → riskLevel: 'high' → 'high'
    const result = mapIngredientsToRisk(
      'eau, aspartame (E951), colorant (E102)'
    );
    const aspartame = result.find((r) => r.name.toLowerCase().startsWith('aspartame'));
    const tartrazine = result.find(
      (r) => r.name.toLowerCase().startsWith('colorant') && r.riskLevel === 'high'
    );
    expect(aspartame).toBeDefined();
    expect(aspartame!.riskLevel).toBe('blocker');
    expect(tartrazine).toBeDefined();
    expect(tartrazine!.riskLevel).toBe('high');

    // "eau" doit être safe.
    const eau = result.find((r) => r.name === 'eau');
    expect(eau).toBeDefined();
    expect(eau!.riskLevel).toBe('safe');
  });

  it("reconnaît un E-code moderate (E150d → moderate)", () => {
    const result = mapIngredientsToRisk('colorant E150d');
    const caramel = result.find((r) => r.name.toLowerCase().includes('colorant'));
    expect(caramel).toBeDefined();
    expect(caramel!.riskLevel).toBe('moderate');
  });
});
