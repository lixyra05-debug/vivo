/**
 * BLOQUANT 4 — FACE 1 : l'absence de `nova_group` ne doit plus être traduite
 * en NOVA 4 (risque maximal). L'adaptateur propage `null`, et le moteur
 * consulte ENFIN son propre classifieur (`engine.ts:80`), inatteignable
 * depuis toujours en production.
 *
 * Ancres de l'audit (notes composées mesurées AVANT, sur la fiche) :
 *   Perrier 22 · Contrex 19 · Vittel 20 · Sidi Ali-absent 18  «NOVA-ABSENT→4»
 *   Sidi Ali-jumeau 68 (nova_brut=1) — même eau, 50 pts d'écart selon qu'un
 *   contributeur OFF a rempli un champ.
 * Ici on mesure la FORMULATION (calculateScore) : AVANT plafond NOVA 4 → 30,
 * APRÈS NOVA classifié 1 → 100. La note composée suit (packaging inchangé).
 *
 * Preuve d'appel réel (amendement 2) : le spy sur le module nova-classifier
 * s'auto-valide par la transition RED→GREEN — en RED il est installé mais
 * jamais appelé (« Number of calls: 0 ») ; si le spy ne mordait pas sur
 * l'import statique du moteur, le GREEN resterait à 0 et le test resterait
 * rouge. Un test qui vérifie le score vérifierait la conséquence ; celui-ci
 * vérifie la cause.
 */
import { productToScoringInput } from '../openfoodfacts';
import { calculateScore } from '@/src/lib/scoring/engine';
import * as novaClassifier from '@/src/lib/scoring/nova-classifier';
import type { Product, UserProfile } from '../types';

const STANDARD: UserProfile = { type: 'standard', allergies: [], intolerances: [] };

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '0000000000001',
    name: 'Produit test',
    brand: 'Test',
    image_url: null,
    ingredients_raw: null,
    additives_tags: [],
    nova_group: null,
    nutriscore_grade: null,
    energy_kcal_100g: null,
    sugars_100g: null,
    saturated_fat_100g: null,
    salt_100g: null,
    proteins_100g: null,
    fiber_100g: null,
    oil_types: [],
    portion_grams: null,
    packaging_material: null,
    is_organic: false,
    off_last_updated: null,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

describe('productToScoringInput — nova_group : absence et bruit propagés, jamais coalescés', () => {
  it('nova_group absent chez OFF → null dans ScoringInput (jamais 4)', () => {
    const input = productToScoringInput(makeProduct({ nova_group: null }));
    expect(input.nova_group).toBeNull();
  });

  it('nova_group hors [1,4] ou non entier (bruit OFF) → null, jamais 4', () => {
    // Une valeur aberrante n'est PAS une absence — mais aucune des deux n'est
    // un risque : les deux se reclassifient depuis les ingrédients
    // (amendement 3 : les aberrantes sont comptées à part dans l'échantillon).
    expect(productToScoringInput(makeProduct({ nova_group: 0 })).nova_group).toBeNull();
    expect(productToScoringInput(makeProduct({ nova_group: 7 })).nova_group).toBeNull();
    expect(productToScoringInput(makeProduct({ nova_group: 2.5 })).nova_group).toBeNull();
  });
});

describe('le classifieur NOVA est enfin sur le chemin de production', () => {
  it('classifyNova est RÉELLEMENT appelé quand nova_group est absent (preuve, pas inférence)', () => {
    const spy = jest.spyOn(novaClassifier, 'classifyNova');
    try {
      const result = calculateScore(
        productToScoringInput(
          makeProduct({ nova_group: null, ingredients_raw: 'Eau minérale naturelle' }),
        ),
        STANDARD,
      );
      expect(spy).toHaveBeenCalledWith('Eau minérale naturelle', []);
      expect(spy.mock.results[0]?.value).toBe(1);
      expect(result.nova_group).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });

  it("classifyNova n'est PAS appelé quand OFF fournit une valeur réelle", () => {
    const spy = jest.spyOn(novaClassifier, 'classifyNova');
    try {
      calculateScore(
        productToScoringInput(makeProduct({ nova_group: 1, ingredients_raw: 'Eau de source' })),
        STANDARD,
      );
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('ancres audit — les eaux minérales ne sont plus « à éviter »', () => {
  const WATERS: Array<[string, string, number]> = [
    // [nom, ingrédients, note composée AVANT mesurée par l'audit]
    ['PERRIER eau minérale naturelle gazeuse', 'Eau minérale naturelle gazeuse', 22],
    ['CONTREX eau minérale naturelle', 'Eau minérale naturelle', 19],
    ['Vittel', 'Eau minérale naturelle', 20],
    ['Sidi Ali (fiche nova absent)', 'Eau minérale naturelle', 18],
  ];

  it.each(WATERS)('%s : formulation 30 → 100 (NOVA classifié 1)', (_name, ingredients) => {
    const result = calculateScore(
      productToScoringInput(makeProduct({ nova_group: null, ingredients_raw: ingredients })),
      STANDARD,
    );
    expect(result.nova_group).toBe(1);
    expect(result.score_final).toBe(100);
  });

  it('Sidi Ali jumeau — nova_group=1 explicite reste 1, formulation 100 (non-régression)', () => {
    const result = calculateScore(
      productToScoringInput(
        makeProduct({ nova_group: 1, ingredients_raw: 'Eau minérale naturelle' }),
      ),
      STANDARD,
    );
    expect(result.nova_group).toBe(1);
    expect(result.score_final).toBe(100);
  });

  it("une VALEUR réelle nova_group=4 reste 4 — on corrige l'absence, pas la valeur", () => {
    const soda = makeProduct({
      nova_group: 4,
      ingredients_raw: 'eau gazéifiée, sucre, arômes',
      sugars_100g: 10,
      portion_grams: 330,
    });
    const result = calculateScore(productToScoringInput(soda), STANDARD);
    expect(result.nova_group).toBe(4);
    expect(result.score_final).toBeLessThanOrEqual(30); // plafond NOVA 4
  });
});

describe('caractérisation — les limites connues, tracées', () => {
  it("classifyNova('') === 1 — le repli du classifieur sur le vide est NOVA 1, pas 4 (portail T1.2d)", () => {
    expect(novaClassifier.classifyNova('', [])).toBe(1);
  });

  it('CARACTÉRISATION — le produit vide-de-tout obtient désormais 100 : dette TRACÉE', () => {
    // AVANT face 1 : 30/100 — le NOVA forcé à 4 était, par accident, le seul
    // garde-fou conservateur de la chaîne (audit, rapport 02 §116).
    // APRÈS face 1 : l'absence totale de donnée produit désormais une note
    // haute — couvert visuellement par le bandeau de la face 2, à traiter au
    // fond dans le lot 3. Le jour où quelqu'un change ce comportement, ce
    // test tombe et ce commentaire doit être lu : le 100 ci-dessous n'est
    // PAS une approbation, c'est une dette tracée. Le trou existait déjà
    // pour les fiches nova=1 vides (Cristaline « to-be-completed ») — la
    // face 1 l'étend aux fiches nova-absent (≤ 28 produits de l'échantillon).
    const empty = makeProduct({
      nova_group: null,
      ingredients_raw: null,
      additives_tags: [],
    });
    const result = calculateScore(productToScoringInput(empty), STANDARD);
    expect(result.nova_group).toBe(1);
    expect(result.score_final).toBe(100);
  });
});
