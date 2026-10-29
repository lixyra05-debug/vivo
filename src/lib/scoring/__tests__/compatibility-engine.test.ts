import {
  ALLERGEN_TAG_TO_KEY,
  checkCompatibility,
  FODMAP_TRIGGERS,
  INSUFFICIENT_DATA_LABEL_FR,
  normalizeAllergenKey,
} from '../compatibility-engine';
import type {
  CompatibilityProfile,
  CosmeticProduct,
  CosmeticScoringResult,
  Product,
  ScoringResult,
} from '../../api/types';

// === Fixtures ===

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '0000000000001',
    name: 'Produit test',
    brand: 'Test',
    image_url: null,
    ingredients_raw: '',
    additives_tags: [],
    nova_group: 1,
    nutriscore_grade: null,
    energy_kcal_100g: null,
    sugars_100g: 0,
    saturated_fat_100g: 0,
    salt_100g: 0,
    proteins_100g: 0,
    fiber_100g: 0,
    oil_types: [],
    portion_grams: 100,
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

function makeCosmetic(overrides: Partial<CosmeticProduct> = {}): CosmeticProduct {
  return {
    barcode: '0000000000002',
    name: 'Cosmétique test',
    brand: 'Test',
    image_url: null,
    ingredients_inci: '',
    ingredients_list: [],
    category: null,
    image_ingredients_url: null,
    obf_last_updated: null,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

function makeScoring(overrides: Partial<ScoringResult> = {}): ScoringResult {
  return {
    score_final: 80,
    score_color: 'green',
    nova_group: 1,
    penalties: [],
    blockers: [],
    seed_oils_detected: [],
    clean_labeling_alerts: [],
    profile_adjustments: [],
    ...overrides,
  };
}

function makeCosmeticScoring(
  overrides: Partial<CosmeticScoringResult> = {}
): CosmeticScoringResult {
  return {
    score_final: 80,
    score_color: 'green',
    penalties: [],
    blockers: [],
    risky_ingredients: [],
    profile_adjustments: [],
    ...overrides,
  };
}

function emptyProfile(overrides: Partial<CompatibilityProfile> = {}): CompatibilityProfile {
  return {
    allergies: [],
    dietary: [],
    conditions: [],
    avoid: [],
    minScore: 0,
    ...overrides,
  };
}

describe('checkCompatibility', () => {
  it('1. profil vide → tout compatible (rien à tester)', () => {
    const result = checkCompatibility(makeProduct(), makeScoring(), emptyProfile());
    expect(result.isCompatible).toBe(true);
    expect(result.incompatibilities).toEqual([]);
    expect(result.compatibilityPercentage).toBe(100);
    expect(result.score).toBe(80);
  });

  it('2. produit gluten + profil cœliaque (allergie gluten) → incompatible, 1 blocker', () => {
    const product = makeProduct({
      ingredients_raw: 'farine de blé, eau, sel',
    });
    const profile = emptyProfile({ allergies: ['gluten'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.isCompatible).toBe(false);
    const blockers = result.incompatibilities.filter((i) => i.severity === 'blocker');
    expect(blockers).toHaveLength(1);
    expect(blockers[0].type).toBe('allergy');
    expect(blockers[0].labelFr.toLowerCase()).toContain('gluten');
  });

  it('3. produit avec 25g sucres + condition diabete → incompatible (warning sucres élevés)', () => {
    const product = makeProduct({ sugars_100g: 25 });
    const profile = emptyProfile({ conditions: ['diabete'] });
    const result = checkCompatibility(product, makeScoring({ score_final: 60 }), profile);
    expect(result.isCompatible).toBe(true); // warning, not blocker
    const warnings = result.incompatibilities.filter((i) => i.severity === 'warning');
    expect(warnings.length).toBeGreaterThanOrEqual(1);
    expect(warnings.some((w) => w.labelFr.toLowerCase().includes('sucres'))).toBe(true);
  });

  it('4. produit avec sel 2g/100g + condition bebe → incompatible (warning ou blocker)', () => {
    const product = makeProduct({ salt_100g: 2 });
    const profile = emptyProfile({ conditions: ['bebe'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.incompatibilities.length).toBeGreaterThanOrEqual(1);
    expect(
      result.incompatibilities.some((i) => i.type === 'condition' && /sel/i.test(i.labelFr))
    ).toBe(true);
  });

  it('5. produit avec "ail, oignon" dans ingrédients + condition ibs_fodmap → 2 incompatibilités', () => {
    const product = makeProduct({
      ingredients_raw: 'tomate, ail, oignon, sel',
    });
    const profile = emptyProfile({ conditions: ['ibs_fodmap'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const fodmapHits = result.incompatibilities.filter(
      (i) => i.type === 'condition' && /fodmap|ail|oignon/i.test(i.labelFr)
    );
    expect(fodmapHits.length).toBeGreaterThanOrEqual(2);
  });

  it('6. produit score 30 + minScore 50 → blocker score', () => {
    const profile = emptyProfile({ minScore: 50 });
    const result = checkCompatibility(makeProduct(), makeScoring({ score_final: 30 }), profile);
    expect(result.isCompatible).toBe(false);
    const scoreBlocker = result.incompatibilities.find((i) => i.type === 'score');
    expect(scoreBlocker).toBeDefined();
    expect(scoreBlocker?.severity).toBe('blocker');
    expect(scoreBlocker?.labelFr).toContain('30');
    expect(scoreBlocker?.labelFr).toContain('50');
  });

  it('7. compatibilityPercentage = 80% quand 4/5 critères passent', () => {
    // 4 allergies + 1 score check = 5 critères
    // Produit déclenche seulement gluten → 1 incompat / 5 = 20% failed → 80% passed
    const product = makeProduct({ ingredients_raw: 'farine de blé' });
    const profile = emptyProfile({
      allergies: ['gluten', 'arachides', 'soja', 'lupin'],
      minScore: 0,
    });
    const result = checkCompatibility(product, makeScoring({ score_final: 80 }), profile);
    expect(result.compatibilityPercentage).toBe(80);
  });

  it('8. multi-incompatibilités triées : blockers en premier', () => {
    const product = makeProduct({
      ingredients_raw: 'farine de blé, huile de palme',
      sugars_100g: 30,
    });
    const profile = emptyProfile({
      allergies: ['gluten'], // blocker
      avoid: ['huile_palme'], // warning
      conditions: ['diabete'], // warning (sucres élevés)
    });
    const result = checkCompatibility(product, makeScoring({ score_final: 70 }), profile);
    // First should be blocker
    expect(result.incompatibilities[0].severity).toBe('blocker');
    // Find first warning index
    const firstWarningIdx = result.incompatibilities.findIndex(
      (i) => i.severity === 'warning'
    );
    const lastBlockerIdx = result.incompatibilities.map((i) => i.severity).lastIndexOf(
      'blocker'
    );
    expect(lastBlockerIdx).toBeLessThan(firstWarningIdx);
  });

  it('9. produit vegan-safe + dietary vegan → compatible', () => {
    const product = makeProduct({
      ingredients_raw: 'haricots rouges, tomate, oignon, riz, épices',
    });
    const profile = emptyProfile({ dietary: ['vegan'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.isCompatible).toBe(true);
  });

  it('10. produit avec gélatine + dietary halal → blocker', () => {
    const product = makeProduct({
      ingredients_raw: 'sucre, gélatine de porc, arôme',
    });
    const profile = emptyProfile({ dietary: ['halal'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.isCompatible).toBe(false);
    const blockers = result.incompatibilities.filter(
      (i) => i.severity === 'blocker' && i.type === 'dietary'
    );
    expect(blockers.length).toBeGreaterThanOrEqual(1);
  });

  it('11. produit avec ingredients_text contenant "alcool" + condition enceinte → blocker', () => {
    const product = makeProduct({
      ingredients_raw: 'eau, sucre, alcool, arôme',
    });
    const profile = emptyProfile({ conditions: ['enceinte'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.isCompatible).toBe(false);
    expect(
      result.incompatibilities.some(
        (i) => i.severity === 'blocker' && /alcool/i.test(i.labelFr)
      )
    ).toBe(true);
  });

  it('12. produit cosmétique avec rétinol INCI + condition enceinte → blocker', () => {
    const cosmetic = makeCosmetic({
      ingredients_inci: 'aqua, retinol, glycerin',
      ingredients_list: ['Aqua', 'Retinol', 'Glycerin'],
    });
    const profile = emptyProfile({ conditions: ['enceinte'] });
    const result = checkCompatibility(cosmetic, makeCosmeticScoring(), profile);
    expect(result.isCompatible).toBe(false);
    expect(
      result.incompatibilities.some(
        (i) => i.severity === 'blocker' && /r[ée]tinol|retinol/i.test(i.labelFr)
      )
    ).toBe(true);
  });

  it('13. produit avec saturated_fat 8g/100g + condition cholesterol → warning', () => {
    const product = makeProduct({ saturated_fat_100g: 8 });
    const profile = emptyProfile({ conditions: ['cholesterol'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const w = result.incompatibilities.find(
      (i) => i.type === 'condition' && /satur[ée]|gras/i.test(i.labelFr)
    );
    expect(w).toBeDefined();
    expect(w?.severity).toBe('warning');
  });

  it('14. produit avec salt 2g/100g + condition hypertension → warning', () => {
    const product = makeProduct({ salt_100g: 2 });
    const profile = emptyProfile({ conditions: ['hypertension'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const w = result.incompatibilities.find(
      (i) => i.type === 'condition' && /sel/i.test(i.labelFr)
    );
    expect(w).toBeDefined();
    expect(w?.severity).toBe('warning');
  });

  it('15. produit avec huile de palme + avoid huile_palme → warning', () => {
    const product = makeProduct({
      ingredients_raw: 'farine, sucre, huile de palme, sel',
    });
    const profile = emptyProfile({ avoid: ['huile_palme'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const w = result.incompatibilities.find(
      (i) => i.type === 'avoid' && /palme/i.test(i.labelFr)
    );
    expect(w).toBeDefined();
    expect(w?.severity).toBe('warning');
  });

  it('16. produit avec colorant E150d + avoid colorants → warning', () => {
    const product = makeProduct({
      additives_tags: ['en:e150d'],
    });
    const profile = emptyProfile({ avoid: ['colorants'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const w = result.incompatibilities.find(
      (i) => i.type === 'avoid' && /colorant/i.test(i.labelFr)
    );
    expect(w).toBeDefined();
    expect(w?.severity).toBe('warning');
  });

  it('17. ingredients_raw null + profil avec allergies → warning données insuffisantes', () => {
    const product = makeProduct({ ingredients_raw: null });
    const profile = emptyProfile({ allergies: ['gluten'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    const w = result.incompatibilities.find(
      (i) => i.severity === 'warning' && /donn[ée]es insuffisantes/i.test(i.labelFr)
    );
    expect(w).toBeDefined();
  });

  it('18. profil avec 14 allergies + ingredients vide → percentage 100 (rien testable)', () => {
    const product = makeProduct({ ingredients_raw: '' });
    const profile = emptyProfile({
      allergies: [
        'gluten',
        'lactose',
        'arachides',
        'fruits_a_coque',
        'soja',
        'oeufs',
        'poisson',
        'crustaces',
        'celeri',
        'moutarde',
        'sesame',
        'sulfites',
        'lupin',
        'mollusques',
      ],
    });
    const result = checkCompatibility(product, makeScoring({ score_final: 100 }), profile);
    expect(result.compatibilityPercentage).toBe(100);
    expect(result.isCompatible).toBe(true);
  });
});

describe('verificationStatus', () => {
  it("vaut 'insufficient_data' quand une allergie est déclarée sans liste d'ingrédients", () => {
    const product = makeProduct({ ingredients_raw: '' });
    const profile = emptyProfile({ allergies: ['arachides'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.verificationStatus).toBe('insufficient_data');
  });

  it("vaut 'verified' dès que les ingrédients sont exploitables", () => {
    const product = makeProduct({ ingredients_raw: 'eau, sucre, sel' });
    const profile = emptyProfile({ allergies: ['arachides'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.verificationStatus).toBe('verified');
  });

  it("vaut 'verified' si aucun critère ne demandait d'inspecter le texte", () => {
    // Profil vide sur un produit sans ingrédients : il n'y avait rien à
    // vérifier, donc rien n'a échoué. Ne pas confondre avec le cas ci-dessus.
    const result = checkCompatibility(makeProduct(), makeScoring(), emptyProfile());
    expect(result.verificationStatus).toBe('verified');
  });

  it("n'altère ni isCompatible ni compatibilityPercentage — champ purement additif", () => {
    // Garde-fou de non-régression : c'est exactement le cas qui produisait
    // « Compatible » à tort. Les deux champs historiques doivent garder leur
    // valeur d'avant, seul le nouveau statut porte l'information manquante.
    const product = makeProduct({ ingredients_raw: '' });
    const profile = emptyProfile({ allergies: ['arachides', 'gluten'] });
    const result = checkCompatibility(product, makeScoring(), profile);
    expect(result.isCompatible).toBe(true);
    expect(result.compatibilityPercentage).toBe(100);
    expect(result.verificationStatus).toBe('insufficient_data');
  });

  it('expose le motif une seule fois même avec plusieurs critères en échec', () => {
    const product = makeProduct({ ingredients_raw: '' });
    const profile = emptyProfile({
      allergies: ['arachides', 'gluten'],
      dietary: ['vegan'],
    });
    const result = checkCompatibility(product, makeScoring(), profile);
    const flags = result.incompatibilities.filter(
      (i) => i.labelFr === INSUFFICIENT_DATA_LABEL_FR,
    );
    expect(flags).toHaveLength(1);
  });
});

describe('FODMAP_TRIGGERS', () => {
  it('contient au moins 20 entrées', () => {
    expect(FODMAP_TRIGGERS.length).toBeGreaterThanOrEqual(20);
  });

  it('contient ail, oignon, lactose', () => {
    expect(FODMAP_TRIGGERS).toContain('ail');
    expect(FODMAP_TRIGGERS).toContain('oignon');
    expect(FODMAP_TRIGGERS).toContain('lactose');
  });
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Les allergies déclarées doivent être vérifiées, quelle que soit la FORME sous
 * laquelle le profil les a stockées.
 *
 * Les écrans de profil ont longtemps stocké des LIBELLÉS d'affichage
 * (« Gluten », « Fruits à coque », « Œufs ») là où le moteur indexe des CLÉS
 * (`gluten`, `fruits_a_coque`, `oeufs`). Le lookup échouait, et le `continue`
 * qui suivait sortait de la boucle AVANT tout signalement : ni vérification,
 * ni aveu. La bannière annonçait « Compatible avec votre profil » à un
 * allergique dont l'allergène était dans le produit.
 *
 * Ces profils sont déjà en base et ne peuvent pas être réécrits : la
 * normalisation est donc DÉFENSIVE, appliquée à la lecture, dans le moteur —
 * le seul point de passage commun à tous les producteurs de profil
 * (`profile-adapter`, `compatibility-presets`, Mode Famille).
 *
 * NOTE DE CONCEPTION DES FIXTURES — `emptyProfile()` pose `minScore: 0` et
 * `makeScoring()` un `score_final: 80`. La barrière de score (« Score sous le
 * seuil ») est donc INERTE ici : un `isCompatible: false` ne peut venir que du
 * chemin testé. Les assertions portent malgré tout sur le blocker de type
 * `allergy` précis, pour qu'aucun autre chemin ne puisse se déguiser en succès.
 * ─────────────────────────────────────────────────────────────────────────────
 */
describe('checkCompatibility — clés d’allergènes tolérantes à la forme stockée', () => {
  /** Les 6 libellés que les écrans de profil ont réellement stockés. */
  const LIBELLES_STOCKES: ReadonlyArray<[string, string, string]> = [
    // [valeur stockée par l'écran, ingrédient du produit, clé moteur attendue]
    ['Gluten', 'farine de blé, eau, sel', 'gluten'],
    ['Lactose', 'lait entier, sucre', 'lactose'],
    ['Arachides', "huile d'arachide, sel", 'arachides'],
    ['Fruits à coque', 'éclats de noisette, sucre', 'fruits_a_coque'],
    ['Œufs', 'oeuf entier, farine', 'oeufs'],
    ['Soja', 'lécithine de soja, cacao', 'soja'],
  ];

  it.each(LIBELLES_STOCKES)(
    'un profil stockant « %s » bloque un produit qui en contient',
    (stocke, ingredients) => {
      const product = makeProduct({ ingredients_raw: ingredients });
      const profile = emptyProfile({ allergies: [stocke] });

      const result = checkCompatibility(product, makeScoring(), profile);

      const allergyBlockers = result.incompatibilities.filter(
        (i) => i.type === 'allergy' && i.severity === 'blocker',
      );
      expect(allergyBlockers).toHaveLength(1);
      expect(result.isCompatible).toBe(false);
    },
  );

  // Idempotence : les clés déjà correctes (Mode Famille, presets, profils
  // migrés) doivent continuer de fonctionner à l'identique.
  it('bloque toujours un profil stockant déjà la clé canonique', () => {
    const product = makeProduct({ ingredients_raw: 'farine de blé, eau' });
    const result = checkCompatibility(
      product,
      makeScoring(),
      emptyProfile({ allergies: ['gluten'] }),
    );
    expect(
      result.incompatibilities.filter((i) => i.type === 'allergy'),
    ).toHaveLength(1);
  });

  // Un allergène que le moteur ne sait pas chercher n'est pas une bonne
  // nouvelle : c'est une vérification qui n'a pas eu lieu, et elle doit se dire.
  it('avoue son ignorance sur un allergène inconnu au lieu de passer en silence', () => {
    const product = makeProduct({ ingredients_raw: 'kiwi, sucre' });
    const result = checkCompatibility(
      product,
      makeScoring(),
      emptyProfile({ allergies: ['Kiwi'] }),
    );
    expect(result.verificationStatus).toBe('insufficient_data');
  });

  it('avoue son ignorance quand le produit n’a aucun texte d’ingrédients', () => {
    const product = makeProduct({ ingredients_raw: null });
    const result = checkCompatibility(
      product,
      makeScoring(),
      emptyProfile({ allergies: ['Gluten'] }),
    );
    expect(result.verificationStatus).toBe('insufficient_data');
  });
});

describe('normalizeAllergenKey', () => {
  /** Les 14 clés de l'Annexe II telles qu'indexées par le moteur. */
  const CLES_CANONIQUES = [
    'gluten',
    'lactose',
    'arachides',
    'fruits_a_coque',
    'soja',
    'oeufs',
    'poisson',
    'crustaces',
    'celeri',
    'moutarde',
    'sesame',
    'sulfites',
    'lupin',
    'mollusques',
  ];

  // Sans idempotence, la normalisation défensive casserait tous les appelants
  // déjà corrects — c'est la condition qui rend le correctif sûr.
  it.each(CLES_CANONIQUES)('laisse « %s » inchangée (idempotence)', (cle) => {
    expect(normalizeAllergenKey(cle)).toBe(cle);
  });

  it('met en minuscules', () => {
    expect(normalizeAllergenKey('Gluten')).toBe('gluten');
  });

  it('retire les diacritiques et remplace les espaces par des underscores', () => {
    expect(normalizeAllergenKey('Fruits à coque')).toBe('fruits_a_coque');
    expect(normalizeAllergenKey('Céleri')).toBe('celeri');
  });

  // Œ (U+0152) n'a pas de décomposition CANONIQUE : NFD la laisse intacte.
  // Seul un remplacement explicite la casse — d'où ce test dédié.
  it('décompose la ligature œ', () => {
    expect(normalizeAllergenKey('Œufs')).toBe('oeufs');
    expect(normalizeAllergenKey('œufs')).toBe('oeufs');
  });

  it('normalise tirets et espaces multiples', () => {
    expect(normalizeAllergenKey('Fruits-à-coque')).toBe('fruits_a_coque');
    expect(normalizeAllergenKey('  Fruits   à  coque  ')).toBe('fruits_a_coque');
  });
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Une donnée ABSENTE n'est pas une donnée à ZÉRO.
 *
 * Les critères quantitatifs lisaient `product.sugars_100g ?? 0` : un produit
 * dont la teneur en sucres est INCONNUE était traité comme un produit à 0 g de
 * sucres, donc « compatible », et `verificationStatus` sortait `'verified'`.
 * Un diabétique lisait « Compatible avec votre profil » sur un produit dont
 * aucune donnée nutritionnelle n'existait.
 *
 * Le type dit pourtant la vérité : `sugars_100g: number | null`. C'est le
 * `?? 0` qui détruisait l'information à la lecture.
 * ─────────────────────────────────────────────────────────────────────────────
 */
describe('checkCompatibility — absence de donnée ≠ valeur zéro', () => {
  const CAS_ABSENCE: ReadonlyArray<[string, string, Partial<Product>]> = [
    ['diabete', 'sucres', { sugars_100g: null }],
    ['bebe', 'sel', { salt_100g: null }],
    ['bebe', 'sucres', { sugars_100g: null }],
    ['bebe', 'NOVA', { nova_group: null }],
    ['hypertension', 'sel', { salt_100g: null }],
    ['cholesterol', 'graisses saturées', { saturated_fat_100g: null }],
  ];

  it.each(CAS_ABSENCE)(
    'condition « %s » : ne prétend pas avoir vérifié quand %s est absent',
    (condition, _champ, overrides) => {
      const product = makeProduct({
        ingredients_raw: 'eau, sucre',
        ...overrides,
      });
      const result = checkCompatibility(
        product,
        makeScoring(),
        emptyProfile({ conditions: [condition] }),
      );
      expect(result.verificationStatus).toBe('insufficient_data');
    },
  );

  // LE test de non-régression du correctif : s'il tombe, c'est que la
  // correction a confondu absence et zéro — c'est-à-dire qu'elle a reproduit
  // le bug qu'elle prétend corriger.
  const CAS_VRAI_ZERO: ReadonlyArray<[string, Partial<Product>]> = [
    ['diabete', { sugars_100g: 0 }],
    ['bebe', { salt_100g: 0, sugars_100g: 0, nova_group: 1 }],
    ['hypertension', { salt_100g: 0 }],
    ['cholesterol', { saturated_fat_100g: 0 }],
  ];

  it.each(CAS_VRAI_ZERO)(
    'condition « %s » : un VRAI zéro reste une vérification faite',
    (condition, overrides) => {
      const product = makeProduct({
        ingredients_raw: 'eau, sucre',
        ...overrides,
      });
      const result = checkCompatibility(
        product,
        makeScoring(),
        emptyProfile({ conditions: [condition] }),
      );
      expect(result.verificationStatus).toBe('verified');
    },
  );
});

// === Lot S1 — un allergène se lit dans toutes ses graphies d'étiquette ===

/**
 * Listes d'ingrédients RÉELLES, recopiées telles quelles depuis Open Food Facts
 * (champ `ingredients_text_fr`, licence ODbL, relevées le 27 octobre 2026) :
 * allergènes en majuscules, accents omis, ligature œ, pluriels, soulignés _x_.
 *
 * Avant ce lot, un mot-clé ne se reconnaissait qu'au singulier et avec ses
 * accents : « NOISETTES » (Nutella), « CREME » (crème fraîche), « Œufs »,
 * « (SULFITES) » passaient pour absents, et l'allergique lisait « Compatible
 * avec votre profil ».
 */
const VRAIES_LISTES = {
  // Lentilles cuisinées à l'Auvergnate
  '3021690201123': 'Eau, lentilles précuites 28%, couenne de porc, saindoux, oignons 1%, arôme naturel, farine de BLE, carottes 0,7%, graisse de canard, plante aromatique, arôme naturel de poivre avec autres arômes naturels, affermissant: chlorure de calcium, arôme naturel de CELERI. Traces éventuelles de : œuf, lait, moutarde.',
  // Crème fraîche épaisse entière Elle & Vire
  '3451790439353': 'CREME de Normandie, ferments lactiques.',
  // Napolitain l'Original
  '7622201809638': 'Farine de blé, Sucre, Huile de palme, Sirop de glucose-fructose, Œufs, Chocolat en poudre (Sucre, Poudre de cacao), Stabilisants (Glycérol, Sorbitols), Lactosérum en poudre (de Lait), Alcool, Sirop de glucose, Cacao maigre en poudre, Poudres à lever (Carbonates d\'ammonium, Diphosphates, Carbonates de sodium), Huile de colza, Graisse de karité, Sel, Arômes, Amidon, Émulsifiants (E472b, E472a, Lécithines de soja, E471), Lait écrémé en poudre, colorant (E160a), Épaississant (Gomme xanthane), Beurre concentré, Correcteurs d\'acidité (Citrates de sodium, Acide citrique), Conservateur (Sorbate de potassium)',
  // Brioche tressée nature Harrys
  '3228857001231': 'Farine de BLÉ 51,8%, eau, OEUFS frais 12,2%, sucre 11,5%, huile de colza 10,8%, sucre perlé 2,3% (sucre, graisse végétale : karité, arôme), gluten de BLÉ, arômes dont fleur d\'oranger (contient alcool), extraits végétaux à pouvoir colorant (curcuma, paprika), levure, fibre de BLÉ, sel, farine d\'ORGE maltée, extrait d\'acérola. Peut contenir des traces de LAIT, GRAINES DE SÉSAME, FRUITS A COQUE et SOJA.',
  // La Madeleine Pur beurre
  '3178530402728': 'Beurre 26%, farine de blé tendre, Sucre, œufs 21%, sirop de sucre inverti, amandes en poudre, arôme naturel de vanille (contient alcool), poudres à lever: carbonates et citrates de sodium (blé), sel, arôme naturel. Traces éventuelles de: fruits à coque, soja.',
  // Nutella
  '3017620422003': 'Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants: lécithines [SOJA), vanilline. Sans gluten.',
  // Snickers
  '5000159461122': 'Sucre, sirop de glucose, _cacahuètes_, _lait_ écrémé en poudre, beurre de cacao, pâte de cacao, huile de tournesol, _lactose_, matière grasse du _lait_, petit-_lait_ en poudre, matière grasse de palme, sel, émulsifiant (lécithine de _soja_), blanc d’_œuf_ en poudre, protéine de _lait_, extrait naturel de vanille.',
  // Brandade à la morue
  '3571492210019': 'Pommes de terre 37%, morue 30% (Gadus spp), huile de tournesol, églefin 8% (Melanogrammus aeglefinus), eau, oignons, flocons de pommes de terre (pommes de terre, extrait de curcuma), Lait en poudre, ail sec 0,29%, sel, persil 0,06%, poivre. Traces possibles d\'arachides, céleri, crustacés, fruits à coque, gluten, mollusques, moutarde, œuf, sésame et soja.',
  // Sardines à l'huile d'olive vierge extra
  '3019081238643': '_Sardines_, huile d\'olive vierge extra, sel',
  // Harengs moutarde à l'ancienne
  '3700260700746': 'Harengs 70%, eau, moutarde de Dijon 6.4% (eau, graines de moutarde, vinaigre d\'alcool, sel), huile de colza, moutarde à l\'ancienne 3.4% (eau, graines de moutarde, vinaigre d\'alcool, sel), vinaigre d\'alcool, sucre, amidon transformé de maïs, vin blanc, sel, arôme naturel, curcuma, arôme naturel de poivre, épaississant: gomme guar, gomme xanthane.',
  // Bâtonnets de surimi saveur crabe
  '3256220125772': 'Chair de POISSON 38%, eau, amidon de BLE et fécule de pomme de terre, blanc d\'OEUF réhydraté, huile de colza, sucre, sel, LAIT ÉCRÉMÉ réhydraté, arômes naturels (contient CRUSTACES, POISSONS et MOLLUSQUES), colorant : extrait de paprika.',
  // Quenelles de brochet sauce Nantua
  '3038353911909': 'Sauce: eau, CRÈME (stabilisant : E407), concentré de tomate, amidon transformé de riz, LAIT en poudre, amidon transformé de pomme de terre, cognac (dont sel, arôme), extrait d\'ECREVISSE, persil, poudre de CREVETTES grises (contient mollusques), ail, épice. \n\nQuenelles (36%): farine de BLE, matière grasse de porc, OEUFS frais (14%), BROCHET (13%), eau, sel, arôme,',
  // Salade Manhattan Sodebo
  '3242274030056': 'Salade composée 80% : spécialités céréalières cuites (eau, semoule de BLE dur, OEUF, curcuma), OEUF, salade 11%, viande de poulet, carottes, FROMAGE à pâte dure, jus de citron, huile de colza et/ou tournesol, eau, amidon et/ou fécule, dextrose, ferments, sel, arôme naturel, persil. \nSauce vinaigrette balsamique 7% : huile de colza, huile d\'olive vierge, vinaigre de vin (SULFITES), moût de raisin, sel. Cookie au chocolat 7% : sucre, farine de BLE, OEUF, BEURRE, huile de colza, pâte et beurre de cacao, poudre de cacao maigre, poudre à lever : bicarbonate de sodium, émulsifiants : lécithines (SOJA), arôme naturel, sel. \nGressins 4% et fourchette 2% : farine de BLE, fibre de BLE, semoule de BLE dur, BEURRE, huile d\'olive vierge, huile de colza et/ou tournesol, eau, levure boulangère, sucre, amidon et/ou fécule, sel, graines de pavot.',
  // Filets de maquereaux vin blanc et aromates
  '3019081241216': 'Filets de maquereaux (60%), eau, carottes (5%), oignons (5%), vinaigre d\'alcool, cornichons (cornichons, vinaigre d\'alcool, sel) (dont sulfites) (1,7%), vinaigre de vin blanc, vin blanc (1%), sel, jus de citron concentré, poivre noir, laurier, thym.',
  // Poisson à l'andalouse, riz safrané
  '3166352967037': 'Poisson 33,3% (merlu blanc), riz cuit 20,8% (eau, riz), courgettes grillées 14,4%, eau, poivrons rouges 6,5%, oignons 4,8%, petits pois 4,8%, huile d\'olive vierge 2,5%, chorizo 1,6% (viande de porc origine France, gras de porc, épices et plantes aromatiques, sel, arômes naturels), farine de blé, épices et plantes aromatiques, sel, huile de tournesol, purée d\'ail, concentré de tomates, safran. \n\nTraces possibles de: crustacés, mollusques, soja, œuf, lait, moutarde, céleri.',
  // Chamonix
  '3017760819121': 'Sirop de glucose-fructose, farine de BLÉ 36 %, sucre, purée d\'orange 5 %, jus d\'orange concentré 1,4%, huile de colza, jaune d\'OEUF en poudre, stabilisant (glycérol), poudre à lever (carbonates d\'ammonium), correcteur d\'acidité (acide citrique), gélifiant (pectines), arômes, colorant (norbixine de rocou), conservateur (sorbate de potassium). PEUT CONTENIR LAIT, SÉSAME ET FRUITS À COQUE.',
  // Riz soufflé au chocolat
  '4021700900021': 'Sucre, graisses végétales (palmiste, palme), riz soufflé, semoule de maïs, semoule de riz, farine de froment, farine de malt, extrait de malt), dextrose, beurre de cacao, lait entier en poudre, pâte de cacao, lactosérum doux en poudre, farine de lupin, cacao en poudre maigre, beurre de karité, lactose, émulsifiant: lécithines (soja), E476; sel, arômes.',
  // Muesli croustillant
  '20775018': '46% flocons d\'avoine complète, sucre, 11% graines de blé, 7% petits rouleaux de hc.olat au lan et de cocolat lancucre, laite poudre entier, beurre de cacao*, pâte de cacao*, poudre de lactosérum doux (lait), émulsifiant lé cithines), huile de palme. 4% petits rouleau de chocolat noir (sucre, pâte de cacao*, beurre de cacao*, émulsifiant: lécithines), 2% farine de riz 25 noisettes, cacao en po id % maïs, sel de cuisine, 0,1% gluten de blé, 0,1% farine de malt (orge, blé), 0,08% extrait de malt d\'orge. *Certifié Rainforest Alliance. Pour en savoir plus, rendez-vous sur ra.org. Peut contenir des traces d\'autres fruits à coque (amandes, noix, noix de cajou, noix de pécan, noix du Brésil, pistaches, noix de Macadamia), d\'arachides, de soja, de graines de sésame, de moutarde et de lupin.',
} as const;

type CodeBarres = keyof typeof VRAIES_LISTES;

describe('checkCompatibility — allergènes : pluriel, accent omis, ligature œ (lot S1)', () => {
  function verifier(allergie: string, ingredients: string) {
    return checkCompatibility(
      makeProduct({ ingredients_raw: ingredients }),
      makeScoring(),
      emptyProfile({ allergies: [allergie] }),
    );
  }

  function bloquantsAllergie(result: ReturnType<typeof checkCompatibility>) {
    return result.incompatibilities.filter(
      (i) => i.type === 'allergy' && i.severity === 'blocker',
    );
  }

  // [allergie déclarée, code-barres, graphie qui échappait au moteur]
  const GRAPHIES_MANQUEES: ReadonlyArray<[string, CodeBarres, string]> = [
    ['gluten', '3021690201123', 'farine de BLE'],
    ['lactose', '3451790439353', 'CREME de Normandie'],
    ['oeufs', '7622201809638', 'Œufs'],
    ['oeufs', '3228857001231', 'OEUFS frais'],
    ['oeufs', '3178530402728', 'œufs 21%'],
    ['fruits_a_coque', '3017620422003', 'NOISETTES 13%'],
    ['fruits_a_coque', '3178530402728', 'amandes en poudre'],
    ['arachides', '5000159461122', '_cacahuètes_'],
    ['arachides', '3571492210019', "Traces possibles d'arachides"],
    ['poisson', '3019081238643', '_Sardines_'],
    ['poisson', '3700260700746', 'Harengs 70%'],
    ['crustaces', '3256220125772', 'CRUSTACES'],
    ['crustaces', '3038353911909', 'CREVETTES grises'],
    ['sulfites', '3242274030056', '(SULFITES)'],
    ['sulfites', '3019081241216', '(dont sulfites)'],
    ['mollusques', '3166352967037', 'Traces possibles de : …, mollusques'],
    ['mollusques', '3038353911909', '(contient mollusques)'],
  ];

  it.each(GRAPHIES_MANQUEES)(
    '« %s » est bloqué dans %s, qui écrit « %s »',
    (allergie, code) => {
      const result = verifier(allergie, VRAIES_LISTES[code]);
      expect(bloquantsAllergie(result)).toHaveLength(1);
      expect(result.isCompatible).toBe(false);
      // D11 : la liste était lisible, la vérification a bien eu lieu.
      expect(result.verificationStatus).toBe('verified');
    },
  );

  // Ce que le moteur reconnaissait déjà doit le rester.
  const GRAPHIES_DEJA_LUES: ReadonlyArray<[string, CodeBarres, string]> = [
    ['soja', '3017620422003', 'lécithines [SOJA)'],
    ['celeri', '3021690201123', 'arôme naturel de CELERI'],
    ['moutarde', '3700260700746', 'moutarde de Dijon'],
    ['sesame', '3017760819121', 'SÉSAME'],
    ['lupin', '4021700900021', 'farine de lupin'],
    ['fruits_a_coque', '20775018', 'noix, noix de cajou, noix de pécan'],
    ['oeufs', '5000159461122', 'blanc d’_œuf_ en poudre'],
  ];

  it.each(GRAPHIES_DEJA_LUES)(
    '« %s » reste bloqué dans %s (« %s »)',
    (allergie, code) => {
      const result = verifier(allergie, VRAIES_LISTES[code]);
      expect(bloquantsAllergie(result)).toHaveLength(1);
      expect(result.isCompatible).toBe(false);
      expect(result.verificationStatus).toBe('verified');
    },
  );

  // Mots voisins qui ne doivent PAS déclencher l'alerte. Ce sont des fragments,
  // pas des listes complètes : chacun isole le mot piège.
  const VOISINS: ReadonlyArray<[string, string, string]> = [
    ['oeufs', 'viande de bœuf, sel', 'bœuf n’est pas œuf'],
    ['oeufs', 'BŒUF haché 98%, sel', 'en majuscules non plus'],
    ['oeufs', 'eggplant, olive oil, salt', 'eggplant n’est pas egg'],
    ['lactose', 'laitue, tomate, concombre', 'laitue n’est pas lait'],
    ['arachides', 'acide arachidonique (ARA), acide docosahexaénoïque (DHA)', 'acide gras des laits infantiles'],
    ['gluten', "sirop d'orgeat", 'orgeat n’est pas orge'],
    ['mollusques', 'lait cru, sel, ferments lactiques. Moulé à la louche.', 'moulé n’est pas moule'],
    ['sulfites', 'eau minérale naturelle, sulfate de magnésium', 'sulfate n’est pas sulfite'],
  ];

  it.each(VOISINS)(
    '« %s » n’est pas déclenché par « %s » (%s)',
    (allergie, ingredients) => {
      const result = verifier(allergie, ingredients);
      expect(result.incompatibilities.filter((i) => i.type === 'allergy')).toHaveLength(0);
      expect(result.isCompatible).toBe(true);
      expect(result.verificationStatus).toBe('verified');
    },
  );

  // Le profil cœliaque lit la même liste de mots-clés que l'allergie au gluten :
  // les deux doivent conclure pareil sur la même étiquette.
  it('le profil cœliaque bloque aussi « farine de BLE »', () => {
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: VRAIES_LISTES['3021690201123'] }),
      makeScoring(),
      emptyProfile({ conditions: ['coeliaque'] }),
    );
    expect(
      result.incompatibilities.filter((i) => i.labelFr.startsWith('Contient du gluten')),
    ).toHaveLength(1);
    expect(result.isCompatible).toBe(false);
  });
});

// === Lot S1b — la source : texte français d'abord, allergènes déclarés en complément ===

/**
 * Fiches RÉELLES d'Open Food Facts (licence ODbL, relevées le 29 octobre 2026),
 * champs recopiés tels quels. `ingredients_raw` est le texte de la langue
 * principale de la fiche ; `ingredients_text_fr` et `allergens_tags` sont les
 * deux sources que S1b donne à la compatibilité.
 */
const FICHES_S1B = {
  // Nutella — langue principale : l'anglais, tronqué. Faux positif CONNU, hors
  // lot (D-E, négations) : « Sans gluten. » se lit « gluten », pour une
  // allergie au gluten comme pour le profil cœliaque.
  nutella: {
    ingredients_raw: 'sugar, palm oil',
    ingredients_text_fr:
      'Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants: lécithines [SOJA), vanilline. Sans gluten.',
    allergens_tags: ['en:milk', 'en:nuts', 'en:soybeans'],
  },
  // Nut & Fruit Mix Classic (20005726) — texte bulgare seulement ; OFF sert un
  // texte français VIDE, que le moteur saute.
  noixBulgare: {
    ingredients_raw:
      '40% светли стафиди (светли стафиди, слънчо - гледово масло), 20% бланширани бадеми, 15% орехи, 10% лешници, 10% бразилски орехи, 5% кашу, Може да съдържа следи от други ядки, фъстъци,',
    ingredients_text_fr: '',
    allergens_tags: ['en:nuts', 'en:peanuts'],
  },
  // Amora Sauce Crudités (8711200459926) — le sésame n'est que dans le texte
  // anglais, et seulement en mention de traces (« may contain: sesame »).
  // Faux positif CONNU, hors lot (D-C) : « vinaigre d'alcool » se lit
  // « alcool » pour les profils grossesse et halal.
  amora: {
    ingredients_raw:
      'water, rapeseed oil, apple cider vinegar² (apple cider vinegar, concentrated apple must), corn starch², egg yolk², salt², onion powder², stabilizer: guar gum², natural mustard flavour², may contain: sesame, ²ingredients of natural origin,',
    ingredients_text_fr:
      "Eau, huile de colza, vinaigre d'alcool, vinaigre de cidre adouci (vinaigre de cidre, moût de pomme concentré), amidon modifié, jaune d'ŒUF, sel, sucre, oignon en poudre, arôme naturel de MOUTARDE, stabilisant : gomme xanthane.",
    allergens_tags: ['en:eggs', 'en:mustard'],
  },
  // Oatly Barista (7394376616228) — texte anglais seulement.
  oatly: {
    ingredients_raw:
      'water,  oats  10%, rapeseed oil, acidity regulator (dipotassium phosphate), minerals (calcium carbonate, potassium iodide), salt, vitamins (d2, riboflavin and b12),',
    ingredients_text_fr: '',
    allergens_tags: ['en:gluten'],
  },
  // Oreo Double Crème (7622210137258) — langue principale : le néerlandais.
  // Mention de traces lue « contient », hors lot : « PEUT CONTENIR LAIT. »
  // bloque l'allergie au lait et le profil végan ; le tag en:milk est recopié
  // des traces (traces_tags : en:milk).
  oreo: {
    ingredients_raw:
      'suiker, _tarwebloem_, palmolie, koolzaadolie, _tarwezetmeel_, magere cacaopoeder 3.5%, glucose-fructosestroop, rijsmiddelen (kaliumcarbonaten, ammoniumcarbonaten, natriumcarbonaten), zout, emulgatoren (_sojalecithine_, zonnebloemlecithine), aroma',
    ingredients_text_fr:
      "Sucre, farine de BLÉ, huile de palme, amidon de BLÉ, huile de colza, cacao maigre en poudre 3,7 %, sirop de glucose-fructose, poudres à lever (carbonates d'ammonium, carbonates de potassium, carbonates de sodium), sel, émulsifiant (lécithines de SOJA), correcteur d'acidité (hydroxyde de sodium), arômes. PEUT CONTENIR LAIT.",
    allergens_tags: ['en:gluten', 'en:milk', 'en:soybeans'],
  },
  // Cornichons (8711200460755) — la même recette en français et en anglais.
  // Faux positif CONNU, hors lot (D-C) : le vinaigre se lit comme de l'alcool
  // pour la grossesse et le halal — « alcool » (vinaigre d'alcool) en français,
  // « wine » (white wine vinegar) en anglais.
  cornichons: {
    ingredients_raw:
      'pickles (including sulphites), spirit vinegar, onion 8%, white wine vinegar, salt, spices to 1,9% (mustard seeds, red bell pepper, rehydrated, coriander seeds, allspice, black pepper), natural flavor of tarragon with other natural flavourings,',
    ingredients_text_fr:
      "cornichons (dont SULFITES), vinaigre d'alcool, oignon 8%, vinaigre de vin blanc, sel, épices 1,9% (graines de MOUTARDE, poivron rouge réhydraté, graines de coriandre, piment de la Jamaïque, poivre noir), arôme naturel d'estragon avec autres arômes naturels.",
    allergens_tags: ['en:mustard', 'en:sulphur-dioxide-and-sulphites'],
  },
} as const;

/** `as const` fige des tableaux en lecture seule : on les recopie pour `Product`. */
function ficheS1b(fiche: (typeof FICHES_S1B)[keyof typeof FICHES_S1B]): Partial<Product> {
  return { ...fiche, allergens_tags: [...fiche.allergens_tags] };
}

describe('checkCompatibility — texte français d’abord, allergènes déclarés en complément (lot S1b)', () => {
  function motifsAllergie(result: ReturnType<typeof checkCompatibility>) {
    return result.incompatibilities.filter((i) => i.type === 'allergy');
  }

  it.each([
    ['fruits_a_coque', 'NOISETTES'],
    ['lactose', 'LAIT'],
    ['soja', 'SOJA'],
  ])('Nutella, allergie %s : bloqué, mot détecté « %s » lu dans le texte français', (allergie, mot) => {
    const result = checkCompatibility(
      makeProduct(ficheS1b(FICHES_S1B.nutella)),
      makeScoring(),
      emptyProfile({ allergies: [allergie] }),
    );
    const motifs = motifsAllergie(result);
    expect(motifs).toHaveLength(1);
    expect(motifs[0].matchedText).toBe(mot);
    expect(result.isCompatible).toBe(false);
    expect(result.verificationStatus).toBe('verified');
  });

  it('le français d’abord : quand les deux textes nomment l’allergène, le mot vient du français', () => {
    // Même recette dans les deux langues : « MOUTARDE » et « mustard ».
    const result = checkCompatibility(
      makeProduct(ficheS1b(FICHES_S1B.cornichons)),
      makeScoring(),
      emptyProfile({ allergies: ['moutarde'] }),
    );
    expect(motifsAllergie(result).map((m) => m.matchedText)).toEqual(['MOUTARDE']);
  });

  it('sans texte français, texte illisible pour les mots-clés : le tag déclaré est lu', () => {
    // Texte bulgare : aucun mot-clé ne peut s'y lire. OFF déclare en:nuts.
    const result = checkCompatibility(
      makeProduct(ficheS1b(FICHES_S1B.noixBulgare)),
      makeScoring(),
      emptyProfile({ allergies: ['fruits_a_coque'] }),
    );
    const motifs = motifsAllergie(result);
    expect(motifs).toHaveLength(1);
    // Aucun mot n'a été LU : rien à afficher sous le motif.
    expect(motifs[0].matchedText).toBeUndefined();
    expect(result.isCompatible).toBe(false);
  });

  it('sans texte français : le texte principal reste lu', () => {
    const result = checkCompatibility(
      makeProduct({ ...ficheS1b(FICHES_S1B.oatly), allergens_tags: [] }),
      makeScoring(),
      emptyProfile({ allergies: ['gluten'] }),
    );
    expect(motifsAllergie(result)).toHaveLength(1);
    expect(result.isCompatible).toBe(false);
  });

  it('aucune alerte perdue : une mention de traces du seul texte principal reste lue, comme avant', () => {
    // Le texte français d'Amora ne parle pas de sésame ; l'anglais dit « may
    // contain: sesame ». Le moteur lit les traces comme « contient » (hors lot) ;
    // lire le français D'ABORD ne doit pas faire taire ce qu'il voyait avant.
    const result = checkCompatibility(
      makeProduct(ficheS1b(FICHES_S1B.amora)),
      makeScoring(),
      emptyProfile({ allergies: ['sesame'] }),
    );
    expect(motifsAllergie(result)).toHaveLength(1);
    expect(motifsAllergie(result)[0].matchedText).toBe('sesame');
  });

  it('tags sans texte : un tag présent est lu comme « contient »', () => {
    // La déclaration de la fiche peut se tromper (traces recopiées, châtaigne
    // déclarée « fruit à coque ») : une alerte de trop plutôt qu'une manquée.
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: null, ingredients_text_fr: null, allergens_tags: ['en:milk'] }),
      makeScoring(),
      emptyProfile({ allergies: ['lactose'] }),
    );
    expect(motifsAllergie(result)).toHaveLength(1);
    expect(motifsAllergie(result)[0].matchedText).toBeUndefined();
    expect(result.isCompatible).toBe(false);
    // D11 : l'allergie a bien été vérifiée — par la déclaration, pas par le texte.
    expect(result.verificationStatus).toBe('verified');
  });

  it('tags sans texte : l’absence d’un tag ne prouve rien', () => {
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: null, ingredients_text_fr: null, allergens_tags: ['en:milk'] }),
      makeScoring(),
      emptyProfile({ allergies: ['gluten'] }),
    );
    expect(result.isCompatible).toBe(true);
    expect(result.verificationStatus).toBe('insufficient_data');
  });

  // Les deux formes d'une ligne de cache ancienne : écrite avant que la
  // migration 017 n'existe (propriétés absentes), puis lue après (NULL et '{}').
  it.each<[string, Partial<Product>, boolean]>([
    ['propriétés absentes', {}, false],
    ['colonnes NULL et vide', { ingredients_text_fr: null, allergens_tags: [] }, true],
  ])('ligne de cache ancienne (%s) : seul le texte principal est lu', (_forme, colonnes, champsPresents) => {
    // Le Nutella y reste « compatible » pour un allergique aux fruits à coque —
    // limite connue de ces lignes, jusqu'à ce qu'un écran rafraîchisse le cache.
    const ancienne = makeProduct({ ingredients_raw: FICHES_S1B.nutella.ingredients_raw, ...colonnes });
    // Chaque forme est bien celle qu'elle dit être : la fabrique ne pose aucun champ S1b.
    expect(['ingredients_text_fr' in ancienne, 'allergens_tags' in ancienne]).toEqual([
      champsPresents,
      champsPresents,
    ]);
    const result = checkCompatibility(
      ancienne,
      makeScoring(),
      emptyProfile({ allergies: ['fruits_a_coque'] }),
    );
    expect(result.isCompatible).toBe(true);
    expect(result.verificationStatus).toBe('verified');
  });

  it('tag inconnu : ignoré, même quand il nomme un allergène', () => {
    // « nl:Milch », « en:Œufs » : tags saisis à la main, hors taxonomie OFF. Seuls
    // les 14 tags canoniques comptent ; sans texte, rien n'est donc vérifié.
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: null, allergens_tags: ['nl:Milch', 'en:Œufs', 'en:kiwi'] }),
      makeScoring(),
      emptyProfile({ allergies: ['lactose', 'oeufs'] }),
    );
    expect(motifsAllergie(result)).toHaveLength(0);
    expect(result.verificationStatus).toBe('insufficient_data');
  });

  it('la table tag → clé est un pour un avec les 14 clés du moteur', () => {
    const CLES = [
      'gluten', 'lactose', 'arachides', 'fruits_a_coque', 'soja', 'oeufs', 'poisson',
      'crustaces', 'celeri', 'moutarde', 'sesame', 'sulfites', 'lupin', 'mollusques',
    ];
    const tags = Object.keys(ALLERGEN_TAG_TO_KEY);
    const cles = Object.values(ALLERGEN_TAG_TO_KEY);
    expect(tags).toHaveLength(14);
    expect(new Set(cles).size).toBe(14);
    expect([...cles].sort()).toEqual([...CLES].sort());
    expect(tags.every((t) => /^en:[a-z-]+$/.test(t))).toBe(true);
  });

  // Chaque paire, une à une : une permutation des valeurs passerait le test de forme.
  it.each([
    ['en:gluten', 'gluten'],
    ['en:milk', 'lactose'],
    ['en:peanuts', 'arachides'],
    ['en:nuts', 'fruits_a_coque'],
    ['en:soybeans', 'soja'],
    ['en:eggs', 'oeufs'],
    ['en:fish', 'poisson'],
    ['en:crustaceans', 'crustaces'],
    ['en:celery', 'celeri'],
    ['en:mustard', 'moutarde'],
    ['en:sesame-seeds', 'sesame'],
    ['en:sulphur-dioxide-and-sulphites', 'sulfites'],
    ['en:lupin', 'lupin'],
    ['en:molluscs', 'mollusques'],
  ])('%s se lit comme l’allergie %s, et seulement elle', (tag, cle) => {
    expect(ALLERGEN_TAG_TO_KEY[tag]).toBe(cle);
    const sansTexte = makeProduct({ ingredients_raw: null, allergens_tags: [tag] });
    expect(
      checkCompatibility(sansTexte, makeScoring(), emptyProfile({ allergies: [cle] })).isCompatible,
    ).toBe(false);
    // Une autre allergie n'est pas concernée : sans texte, elle reste invérifiée.
    const autre = cle === 'gluten' ? 'lupin' : 'gluten';
    const r = checkCompatibility(sansTexte, makeScoring(), emptyProfile({ allergies: [autre] }));
    expect([r.isCompatible, r.verificationStatus]).toEqual([true, 'insufficient_data']);
  });

  it('le mot vient du premier TEXTE qui nomme l’allergène, pas du premier mot-clé (Amandes)', () => {
    // Amandes décortiquées (20724696), champs réels : « almond » précède
    // « amande » dans les mots-clés, mais le texte français est lu d'abord.
    const result = checkCompatibility(
      makeProduct({
        ingredients_raw: 'shelled almonds',
        ingredients_text_fr: '_Amandes_.',
        allergens_tags: ['en:nuts'],
      }),
      makeScoring(),
      emptyProfile({ allergies: ['fruits_a_coque'] }),
    );
    expect(motifsAllergie(result).map((m) => m.matchedText)).toEqual(['Amandes']);
  });

  it('limite connue (D-B, union) : une châtaigne déclarée « fruits à coque » bloque, sans mot détecté', () => {
    // Crème de marrons de l'Ardèche (0022314010025), champs réels. La fiche
    // déclare en:nuts ; le texte ne nomme que châtaignes et marrons, hors de
    // l'annexe II du règlement 1169/2011. Le tag est lu comme « contient » :
    // l'alerte de trop est assumée. Ce test fige la limite (CLAUDE.md, dette).
    const texte =
      'Châtaignes (50%), sucre, marrons glacés (châtaignes (54,6%), sucre, sirop de glucose, extrait de vanille de Madagascar), extrait de vanille Madagascar.';
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: texte, ingredients_text_fr: texte, allergens_tags: ['en:nuts'] }),
      makeScoring(),
      emptyProfile({ allergies: ['fruits_a_coque'] }),
    );
    expect(motifsAllergie(result)).toStrictEqual([
      { type: 'allergy', labelFr: 'Contient fruits à coque (allergie déclarée)', severity: 'blocker' },
    ]);
    expect(result.isCompatible).toBe(false);
  });

  it('textes blancs : rien n’est cherché, la vérification se dit impossible', () => {
    // Le parseur rend null un français blanc mais recopie le texte principal tel
    // quel : le moteur doit sauter lui-même une chaîne d'espaces.
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: '   ', ingredients_text_fr: '  ' }),
      makeScoring(),
      emptyProfile({ allergies: ['gluten'] }),
    );
    expect(result.verificationStatus).toBe('insufficient_data');
    expect(result.checkedAllergenCount).toBe(0);
  });

  it('cœliaque : le tag en:gluten compte aussi quand le texte existe mais ne nomme rien', () => {
    // Oreo, texte néerlandais seul : « _tarwebloem_ » n'est pas un mot-clé.
    const result = checkCompatibility(
      makeProduct({
        ingredients_raw: FICHES_S1B.oreo.ingredients_raw,
        ingredients_text_fr: null,
        allergens_tags: ['en:gluten'],
      }),
      makeScoring(),
      emptyProfile({ conditions: ['coeliaque'] }),
    );
    expect(result.incompatibilities.map((i) => i.labelFr)).toEqual([
      'Contient du gluten — interdit pour cœliaque',
    ]);
  });

  it('cœliaque : le tag en:gluten suffit, comme pour l’allergie au gluten', () => {
    const sansTexte = makeProduct({ ingredients_raw: null, allergens_tags: ['en:gluten'] });
    const coeliaque = checkCompatibility(sansTexte, makeScoring(), emptyProfile({ conditions: ['coeliaque'] }));
    const allergie = checkCompatibility(sansTexte, makeScoring(), emptyProfile({ allergies: ['gluten'] }));
    expect(coeliaque.isCompatible).toBe(false);
    expect(allergie.isCompatible).toBe(false);
  });
});

// === Lot S1b — les autres lecteurs du texte : régimes et conditions ===

describe('checkCompatibility — régimes et conditions lisent aussi le texte français (lot S1b)', () => {
  // Aucun tag : seul le texte français peut fonder ces verdicts.
  function sansTags(fiche: (typeof FICHES_S1B)[keyof typeof FICHES_S1B]): Product {
    return makeProduct({ ...ficheS1b(fiche), allergens_tags: [] });
  }

  it('végan : le lait du Nutella se lit dans le texte français', () => {
    const result = checkCompatibility(
      sansTags(FICHES_S1B.nutella),
      makeScoring(),
      emptyProfile({ dietary: ['vegan'] }),
    );
    expect(result.incompatibilities.map((i) => i.labelFr)).toContain('Non végan (contient lait)');
    expect(result.isCompatible).toBe(false);
  });

  it('cœliaque : la « farine de BLÉ » de l’Oreo se lit, son texte principal est néerlandais', () => {
    const result = checkCompatibility(
      sansTags(FICHES_S1B.oreo),
      makeScoring(),
      emptyProfile({ conditions: ['coeliaque'] }),
    );
    expect(result.incompatibilities.map((i) => i.labelFr)).toEqual([
      'Contient du gluten (blé) — interdit pour cœliaque',
    ]);
  });

  it('huile de palme : « huile de palme » se lit là où le néerlandais dit « palmolie »', () => {
    const result = checkCompatibility(
      sansTags(FICHES_S1B.oreo),
      makeScoring(),
      emptyProfile({ avoid: ['huile_palme'] }),
    );
    expect(result.incompatibilities.map((i) => i.labelFr)).toEqual(["Contient de l'huile de palme"]);
  });

  it('grossesse : le « lait cru » se lit dans le texte français (fiche construite)', () => {
    // Fiche CONSTRUITE pour le test : un fromage au lait cru dont le texte
    // principal, néerlandais, ne contient aucun mot-clé (« rauwe melk »).
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: 'rauwe melk, zout, stremsel', ingredients_text_fr: 'lait cru, sel, présure' }),
      makeScoring(),
      emptyProfile({ conditions: ['enceinte'] }),
    );
    expect(result.incompatibilities.map((i) => i.labelFr)).toEqual([
      'Interdit pendant la grossesse (contient lait cru)',
    ]);
  });

  it('grossesse : le texte principal reste lu quand le français existe (fiche construite)', () => {
    // Deux rédactions : seule l'anglaise nomme le lait cru.
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: 'raw milk cheese, salt', ingredients_text_fr: 'fromage, sel' }),
      makeScoring(),
      emptyProfile({ conditions: ['enceinte'] }),
    );
    expect(result.incompatibilities.map((i) => i.labelFr)).toEqual([
      'Interdit pendant la grossesse (contient raw milk)',
    ]);
  });

  it('végan et végétarien : le texte principal reste lu quand le français existe (Sardines)', () => {
    // Sardines (20703622), champs réels : « poissons » (pluriel) échappe aux
    // mots-clés des régimes (D-D) ; seul « fish », dans le texte principal,
    // porte l'alerte.
    const sardines = makeProduct({
      ingredients_raw: '72 % sardines (fish), 27 % extra virgin olive oil, 1 % salt.',
      ingredients_text_fr: "72 % sardines (poissons), 27 % huile d'olive vierge extra, 1 % sel.",
      allergens_tags: ['en:fish'],
    });
    expect(
      ['vegan', 'vegetarien'].map(
        (d) => checkCompatibility(sardines, makeScoring(), emptyProfile({ dietary: [d] })).isCompatible,
      ),
    ).toEqual([false, false]);
  });

  // Chaque paire FR/EN, une à une : une valeur fausse fusionnerait deux aliments.
  it.each([
    ['ail', 'garlic'],
    ['oignon', 'onion'],
    ['blé', 'wheat'],
    ['lait', 'milk'],
    ['pomme', 'apple'],
    ['poire', 'pear'],
    ['miel', 'honey'],
    ['champignon', 'mushroom'],
    ['artichaut', 'artichoke'],
    ['chou-fleur', 'cauliflower'],
  ])('FODMAP : « %s » et « %s » ne font qu’un déclencheur, nommé en français', (fr, en) => {
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: `sugar, ${en}`, ingredients_text_fr: `sucre, ${fr}` }),
      makeScoring(),
      emptyProfile({ conditions: ['ibs_fodmap'] }),
    );
    expect(result.incompatibilities.map((i) => i.labelFr)).toEqual([`Déclencheur FODMAP détecté : ${fr}`]);
  });

  it('FODMAP : dix aliments différents restent dix déclencheurs', () => {
    const result = checkCompatibility(
      makeProduct({
        ingredients_raw: 'garlic, onion, wheat, milk, apple, pear, honey, mushroom, artichoke, cauliflower',
      }),
      makeScoring(),
      emptyProfile({ conditions: ['ibs_fodmap'] }),
    );
    expect(result.incompatibilities.filter((i) => i.labelFr.startsWith('Déclencheur FODMAP'))).toHaveLength(10);
  });

  it('FODMAP : dans un seul texte bilingue aussi, chaque aliment ne compte qu’une fois', () => {
    // Une ligne de cache ancienne, ou une fiche sans texte français, peut porter
    // les deux langues dans le seul texte principal.
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: 'Ingredients: wheat flour, milk, garlic. Ingrédients : farine de blé, lait, ail.' }),
      makeScoring(),
      emptyProfile({ conditions: ['ibs_fodmap'] }),
    );
    expect(result.incompatibilities.map((i) => i.labelFr)).toEqual([
      'Déclencheur FODMAP détecté : ail',
      'Déclencheur FODMAP détecté : blé',
      'Déclencheur FODMAP détecté : lait',
    ]);
  });

  it('FODMAP : un même aliment lu dans les deux langues ne compte qu’une fois', () => {
    // « oignon 8% » et « onion 8% » : un seul déclencheur, nommé en français.
    const result = checkCompatibility(
      sansTags(FICHES_S1B.cornichons),
      makeScoring(),
      emptyProfile({ conditions: ['ibs_fodmap'] }),
    );
    expect(
      result.incompatibilities.filter((i) => i.labelFr.startsWith('Déclencheur FODMAP')).map((i) => i.labelFr),
    ).toEqual(['Déclencheur FODMAP détecté : oignon']);
  });
});

// === Lot S1b (C5 côté moteur) — le mot lu, et les allergies cherchées ===

describe('checkCompatibility — graphie lue et allergies cherchées (C5)', () => {
  function motifsAllergie(result: ReturnType<typeof checkCompatibility>) {
    return result.incompatibilities.filter((i) => i.type === 'allergy');
  }

  it('expose « NOISETTES » tel que la liste Nutella l’écrit, libellé inchangé', () => {
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: VRAIES_LISTES['3017620422003'] }),
      makeScoring(),
      emptyProfile({ allergies: ['fruits_a_coque'] }),
    );
    const motifs = motifsAllergie(result);
    expect(motifs).toHaveLength(1);
    expect(motifs[0].labelFr).toBe('Contient fruits à coque (allergie déclarée)');
    expect(motifs[0].matchedText).toBe('NOISETTES');
  });

  it('« farine de BLE » donne « BLE », pas le mot-clé « blé »', () => {
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: VRAIES_LISTES['3021690201123'] }),
      makeScoring(),
      emptyProfile({ allergies: ['gluten'] }),
    );
    expect(motifsAllergie(result)[0]?.matchedText).toBe('BLE');
  });

  it('sulfites trouvés par tag additif seulement : aucune graphie inventée', () => {
    const result = checkCompatibility(
      makeProduct({ ingredients_raw: 'raisin, eau', additives_tags: ['en:e220'] }),
      makeScoring(),
      emptyProfile({ allergies: ['sulfites'] }),
    );
    const motifs = motifsAllergie(result);
    expect(motifs).toHaveLength(1);
    expect(motifs[0].matchedText).toBeUndefined();
  });

  it('compte les allergies réellement cherchées dans le texte', () => {
    const avecListe = makeProduct({ ingredients_raw: 'eau, sel' });
    // Clé inconnue du moteur : non cherchée (et la vérification se dit incomplète).
    const result = checkCompatibility(
      avecListe,
      makeScoring(),
      emptyProfile({ allergies: ['gluten', 'inconnu'] }),
    );
    expect(result.checkedAllergenCount).toBe(1);
    expect(result.verificationStatus).toBe('insufficient_data');
    // Pas de liste d'ingrédients : rien n'a été cherché dans un texte, même avec un tag.
    expect(
      checkCompatibility(
        makeProduct({ allergens_tags: ['en:gluten'] }),
        makeScoring(),
        emptyProfile({ allergies: ['gluten'] }),
      ).checkedAllergenCount,
    ).toBe(0);
    // Profil diabète seul : aucune allergie à chercher.
    expect(
      checkCompatibility(avecListe, makeScoring(), emptyProfile({ conditions: ['diabete'] }))
        .checkedAllergenCount,
    ).toBe(0);
  });
});
