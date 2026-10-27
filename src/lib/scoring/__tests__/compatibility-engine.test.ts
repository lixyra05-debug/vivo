import {
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
