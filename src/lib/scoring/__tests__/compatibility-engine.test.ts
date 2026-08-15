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
