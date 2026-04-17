import { calculateScore } from '../engine';
import type { ScoringInput, UserProfile } from '../../api/types';

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
    macros_100g: {
      sugars: 0,
      saturated_fat: 0,
      salt: 0,
      proteins: 0,
      fiber: 0,
    },
    portion_grams: 100,
    oil_types: [],
    is_organic: false,
    ...overrides,
  };
}

describe('calculateScore', () => {
  it('donne 100 à une pomme brute (NOVA 1, fibres/protéines en bonus)', () => {
    const result = calculateScore(
      baseInput({
        barcode: '0000000000001',
        ingredients_raw: 'pomme',
        nova_group: 1,
        macros_100g: { sugars: 0, saturated_fat: 0, salt: 0, proteins: 0.3, fiber: 2.4 },
        portion_grams: 150,
      }),
      standardProfile
    );
    expect(result.score_final).toBe(100);
    expect(result.score_color).toBe('green');
    expect(result.blockers).toHaveLength(0);
  });

  it('bloque à 0 dès qu\'un additif bloquant (Aspartame) est présent', () => {
    const result = calculateScore(
      baseInput({
        ingredients_raw: 'eau, aspartame',
        additives_tags: ['en:e951'],
        nova_group: 4,
      }),
      standardProfile
    );
    expect(result.score_final).toBe(0);
    expect(result.score_color).toBe('red');
    expect(result.blockers.some((b) => b.includes('E951'))).toBe(true);
  });

  it('plafonne un produit NOVA 4 à 30 max (sans additif bloquant)', () => {
    const result = calculateScore(
      baseInput({
        ingredients_raw: 'amidon modifié, maltodextrine',
        nova_group: 4,
        additives_tags: [],
      }),
      standardProfile
    );
    expect(result.score_final).toBeLessThanOrEqual(30);
  });

  it('pénalise une huile de tournesol raffinée (-30)', () => {
    const result = calculateScore(
      baseInput({
        ingredients_raw: 'huile de tournesol raffinée',
        oil_types: ['sunflower'],
        nova_group: 3,
      }),
      standardProfile
    );
    const penalty = result.penalties.find((p) => p.code === 'oil_sunflower');
    expect(penalty).toBeDefined();
    expect(penalty!.points).toBe(30);
  });

  it('applique l\'effet cocktail x2 pour 2+ additifs non-bloquants', () => {
    const result = calculateScore(
      baseInput({
        ingredients_raw: 'eau, colorants',
        additives_tags: ['en:e150d', 'en:e330'],
        nova_group: 4,
      }),
      standardProfile
    );
    const e150d = result.penalties.find((p) => p.code === 'e150d');
    const e330 = result.penalties.find((p) => p.code === 'e330');
    expect(e150d!.points).toBe(60);
    expect(e330!.points).toBe(40);
  });

  it('bloque à 0 pour un enfant quand un colorant azoïque (E102) est présent', () => {
    const child: UserProfile = { type: 'child', allergies: [], intolerances: [] };
    const result = calculateScore(
      baseInput({
        ingredients_raw: 'sucre, colorants',
        additives_tags: ['en:e102'],
        nova_group: 4,
      }),
      child
    );
    expect(result.score_final).toBe(0);
    expect(result.blockers.some((b) => b.includes('E102'))).toBe(true);
  });

  it('détecte "extrait de levure" comme MSG caché (clean labeling alert)', () => {
    const result = calculateScore(
      baseInput({
        ingredients_raw: 'farine, extrait de levure, sel',
        nova_group: 3,
      }),
      standardProfile
    );
    expect(result.clean_labeling_alerts.some((a) => a.includes('Extrait de levure'))).toBe(true);
  });

  it('retourne un score faible pour le Coca-Cola (mock)', () => {
    const result = calculateScore(
      baseInput({
        barcode: '5449000000996',
        ingredients_raw:
          'eau gazéifiée, sucre, colorant caramel e150d, acide phosphorique, arôme naturel, caféine',
        additives_tags: ['en:e150d', 'en:e338'],
        nova_group: 4,
        macros_100g: { sugars: 10.6, saturated_fat: 0, salt: 0, proteins: 0, fiber: 0 },
        portion_grams: 330,
      }),
      standardProfile
    );
    expect(result.score_final).toBeLessThan(25);
    expect(result.nova_group).toBe(4);
  });

  it('retourne un score faible pour Chocapic (mock, sucres + UPF)', () => {
    const result = calculateScore(
      baseInput({
        barcode: '7613034626844',
        ingredients_raw:
          'céréales 58,9% (blé, riz), sucre, cacao maigre 8,5%, sirop de glucose, huile de palme, sel, arôme, vitamines',
        additives_tags: [],
        nova_group: 4,
        macros_100g: { sugars: 25, saturated_fat: 3.5, salt: 0.3, proteins: 8, fiber: 6 },
        portion_grams: 30,
      }),
      standardProfile
    );
    expect(result.score_final).toBeLessThanOrEqual(30);
    expect(result.seed_oils_detected.some((o) => o.includes('palme'))).toBe(true);
  });

  it('score un yaourt bio nature raisonnablement (NOVA 2-3, peu d\'additifs)', () => {
    const result = calculateScore(
      baseInput({
        barcode: '3033490004743',
        ingredients_raw: 'lait entier, ferments lactiques',
        additives_tags: [],
        nova_group: 2,
        macros_100g: { sugars: 4.5, saturated_fat: 1.8, salt: 0.1, proteins: 4.2, fiber: 0 },
        portion_grams: 125,
        is_organic: true,
      }),
      standardProfile
    );
    expect(result.score_final).toBeGreaterThan(40);
    expect(result.blockers).toHaveLength(0);
  });

  it('applique un plafond NOVA 2 (80) pour du sucre ou du miel', () => {
    const result = calculateScore(
      baseInput({
        ingredients_raw: 'miel',
        nova_group: 2,
        macros_100g: { sugars: 0, saturated_fat: 0, salt: 0, proteins: 0, fiber: 0 },
        portion_grams: 10,
      }),
      standardProfile
    );
    expect(result.score_final).toBeLessThanOrEqual(80);
  });

  it('retourne la bonne couleur selon les seuils', () => {
    const green = calculateScore(baseInput({ ingredients_raw: 'banane', nova_group: 1 }), standardProfile);
    expect(green.score_color).toBe('green');

    const blocked = calculateScore(
      baseInput({ additives_tags: ['en:e171'], nova_group: 4 }),
      standardProfile
    );
    expect(blocked.score_color).toBe('red');
  });
});
