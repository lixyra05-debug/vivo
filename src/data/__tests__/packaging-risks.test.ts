import {
  MAX_DETECTED_MATERIALS,
  PACKAGING_RISKS,
  detectPackagingRisk,
  normalizePackagings,
  type PackagingComponent,
} from '../packaging-risks';

const SOURCE_ALLOWLIST_REGEX = /efsa|anses|echa|circ|iarc|oms|eur-lex|ansm/i;

const ids = (components: PackagingComponent[]) =>
  detectPackagingRisk(components).map((m) => m.id);

describe('PACKAGING_RISKS — Catalogue', () => {
  it('contient unknown_plastic en dernière position (fallback)', () => {
    const last = PACKAGING_RISKS[PACKAGING_RISKS.length - 1];
    expect(last.id).toBe('unknown_plastic');
    expect(last.tagPatterns).toEqual([]);
  });

  it('tous les id sont uniques', () => {
    const catalogIds = PACKAGING_RISKS.map((m) => m.id);
    expect(new Set(catalogIds).size).toBe(catalogIds.length);
  });

  it('garde-fou anti-source-tierce : toutes les sources matchent EFSA/ANSES/ECHA/CIRC/OMS/eur-lex/ANSM', () => {
    for (const material of PACKAGING_RISKS) {
      expect(material.sources.length).toBeGreaterThan(0);
      for (const source of material.sources) {
        expect(source).toMatch(SOURCE_ALLOWLIST_REGEX);
      }
    }
  });

  it("aucune source ne cite Gouget, Beauvillard, Clément, O'Neill ou source non officielle", () => {
    const FORBIDDEN = /gouget|beauvillard|clément|clement|o'?neill/i;
    for (const material of PACKAGING_RISKS) {
      for (const source of material.sources) {
        expect(source).not.toMatch(FORBIDDEN);
      }
    }
  });

  it("une recyclabilité inconnue vaut null, jamais false", () => {
    // `false` est une affirmation. La poser par défaut, c'est retomber dans le
    // défaut que ce lot corrige : traduire une absence de donnée en verdict.
    // Seules ces entrées ont une exclusion des filières documentée par leurs
    // sources. Cette liste ne doit que rétrécir.
    const DOCUMENTED_NOT_RECYCLABLE = ['pvc', 'ps'];

    const claimed = PACKAGING_RISKS.filter((m) => m.recyclable === false).map(
      (m) => m.id,
    );
    expect(claimed.sort()).toEqual([...DOCUMENTED_NOT_RECYCLABLE].sort());
  });

  it("un matériau générique ne peut pas se prononcer sur sa recyclabilité", () => {
    // `en:plastic` représente 42 % des matériaux observés : l'ancien
    // `recyclable: false` affirmait la non-recyclabilité sur une part énorme
    // du catalogue, sans rien en savoir.
    const byId = (id: string) => PACKAGING_RISKS.find((m) => m.id === id);
    expect(byId('unknown_plastic')?.recyclable).toBeNull();
    // Son propre concern dit que ça dépend de la composition.
    expect(byId('plastic_film')?.recyclable).toBeNull();
    // « PLA, etc. » recouvre des polymères au sort opposé.
    expect(byId('bioplastic')?.recyclable).toBeNull();
  });

  it('aucun pattern de matériau ne désigne en réalité une forme', () => {
    // `pouch`, `wrapper`, `conserve`, `canned` décrivent un conditionnement,
    // pas une matière. Ils vivent désormais dans `shape` — et matchaient
    // auparavant n'importe quel emballage souple, y compris en papier.
    const SHAPES_NOT_MATERIALS = ['pouch', 'wrapper', 'conserve', 'canned'];
    for (const material of PACKAGING_RISKS) {
      for (const pattern of material.tagPatterns) {
        expect([material.id, pattern]).not.toEqual([
          material.id,
          expect.stringMatching(
            new RegExp(`^(${SHAPES_NOT_MATERIALS.join('|')})$`),
          ),
        ]);
      }
    }
  });
});

/**
 * ANCRAGE — bouteille Cristaline « isabelle » 1,5 L, code 3274080005003.
 *
 * C'est le produit qui a révélé le bug. Son `packaging_tags` hérité contient
 * réellement :
 *
 *   ["en:aluminium-can", "en:hdpefilm-packet", "en:ppfilm-wrapper", "en:ldpe-film"]
 *
 * — d'où « Aluminium — risque modéré » affiché sur une bouteille en plastique.
 * Le matching n'avait pas tort : la donnée était fausse. Ce test verrouille le
 * fait qu'on lit désormais `packagings[]`, et qu'on en tire le bon verdict.
 */
describe("detectPackagingRisk — ancrage Cristaline (packagings[] réel)", () => {
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

  it('détecte le PET du corps et le HDPE du bouchon', () => {
    expect(ids(CRISTALINE)).toEqual(['pet', 'hdpe']);
  });

  it("n'annonce JAMAIS d'aluminium sur cette bouteille", () => {
    expect(ids(CRISTALINE)).not.toContain('aluminium');
  });

  it("n'annonce pas l'étiquette : elle n'est pas au contact de l'eau", () => {
    // `en:plastic` + `food_contact: 0` → exclu, donc pas de « plastique non
    // spécifié » ajouté à la liste.
    expect(ids(CRISTALINE)).not.toContain('unknown_plastic');
  });
});

describe('detectPackagingRisk — contact alimentaire (C2)', () => {
  it('exclut un composant dont le contact alimentaire est explicitement nul', () => {
    expect(ids([{ material: 'en:pvc', food_contact: 0 }])).toEqual([]);
  });

  it('conserve un composant dont le contact alimentaire est INCONNU', () => {
    // Le champ est absent sur ~40 % des composants observés. Le traiter comme
    // « pas de contact » viderait la section pour la moitié des produits.
    expect(ids([{ material: 'en:pvc' }])).toEqual(['pvc']);
    expect(ids([{ material: 'en:pvc', food_contact: null }])).toEqual(['pvc']);
  });

  it('fait passer le matériau au contact devant un risque plus élevé', () => {
    // Un PVC de suremballage ne doit pas masquer le HDPE que la boisson touche.
    const result = ids([
      {
        material: 'en:hdpe-2-high-density-polyethylene',
        shape: 'en:bottle',
        food_contact: 1,
      },
      { material: 'en:pvc', shape: 'en:sleeve' },
    ]);
    expect(result).toEqual(['hdpe', 'pvc']);
  });
});

describe('detectPackagingRisk — matériau et forme', () => {
  it('matche PET sur la taxonomie réelle, y compris `en:pet-transparent`', () => {
    expect(ids([{ material: 'en:pet-1-polyethylene-terephthalate' }])).toEqual(['pet']);
    expect(ids([{ material: 'en:pet-transparent' }])).toEqual(['pet']);
  });

  it('matche `en:paper` sur le carton — il ne matchait rien auparavant', () => {
    expect(ids([{ material: 'en:paper' }])).toEqual(['cardboard']);
    expect(ids([{ material: 'en:paperboard' }])).toEqual(['cardboard']);
  });

  it("`en:metal` seul ne fait pas une conserve : il faut la forme", () => {
    expect(ids([{ material: 'en:metal', shape: 'en:tray' }])).toEqual([]);
    expect(ids([{ material: 'en:metal', shape: 'en:can' }])).toEqual(['metal_can']);
  });

  it('matche PVC en risque élevé', () => {
    const [pvc] = detectPackagingRisk([{ material: 'en:3-pvc' }]);
    expect(pvc.id).toBe('pvc');
    expect(pvc.riskLevel).toBe('high');
  });

  it('gère les préfixes de langue, les accents et les majuscules', () => {
    expect(ids([{ material: 'fr:plastique-recycle' }])).toEqual(['unknown_plastic']);
    // Entrée réelle non normalisée côté OFF : « fr:Plastique et métal ».
    // Sans forme, elle ne peut pas devenir une conserve.
    const mixed = ids([{ material: 'fr:Plastique et métal' }]);
    expect(mixed).toEqual(['unknown_plastic']);
  });

  it('déduplique quand plusieurs composants pointent le même matériau', () => {
    expect(
      ids([
        { material: 'en:pet-1-polyethylene-terephthalate', shape: 'en:bottle' },
        { material: 'en:polyethylene-terephthalate', shape: 'en:tray' },
      ]),
    ).toEqual(['pet']);
  });
});

describe('detectPackagingRisk — plastique non spécifié', () => {
  it('signale un plastique générique quand aucun polymère précis n’est connu', () => {
    expect(ids([{ material: 'en:plastic', shape: 'en:bottle' }])).toEqual([
      'unknown_plastic',
    ]);
  });

  it('se tait quand un polymère précis a déjà été identifié', () => {
    // Afficher « non spécifié » à côté du polymère qu'on vient de nommer
    // n'apprend rien.
    expect(
      ids([
        { material: 'en:pet-1-polyethylene-terephthalate' },
        { material: 'en:plastic' },
      ]),
    ).toEqual(['pet']);
  });
});

describe('detectPackagingRisk — bornes', () => {
  it('renvoie un tableau vide pour une entrée vide ou non-array', () => {
    expect(detectPackagingRisk([])).toEqual([]);
    expect(detectPackagingRisk(null as unknown as PackagingComponent[])).toEqual([]);
    expect(
      detectPackagingRisk(undefined as unknown as PackagingComponent[]),
    ).toEqual([]);
  });

  it('ignore les composants sans matériau exploitable', () => {
    expect(ids([{ shape: 'en:bottle' }, { material: '' }, { material: null }])).toEqual(
      [],
    );
  });

  it(`plafonne à ${MAX_DETECTED_MATERIALS} matériaux, les plus à risque d'abord`, () => {
    const result = ids([
      { material: 'en:pvc' },
      { material: 'en:ps-6-polystyrene' },
      { material: 'en:aluminium' },
      { material: 'en:glass' },
      { material: 'en:cardboard' },
    ]);
    expect(result).toHaveLength(MAX_DETECTED_MATERIALS);
    expect(result).toEqual(['pvc', 'ps', 'aluminium']);
  });
});

describe('normalizePackagings', () => {
  it('tolère un payload absent ou malformé', () => {
    expect(normalizePackagings(undefined)).toEqual([]);
    expect(normalizePackagings(null)).toEqual([]);
    expect(normalizePackagings('en:plastic')).toEqual([]);
    expect(normalizePackagings([null, 42, 'x'])).toEqual([]);
  });

  it('conserve matériau, forme et contact alimentaire', () => {
    expect(
      normalizePackagings([
        { material: 'en:glass', shape: 'en:jar', food_contact: 1, weight: 12 },
      ]),
    ).toEqual([{ material: 'en:glass', shape: 'en:jar', food_contact: 1 }]);
  });

  it('traite un contact alimentaire non interprétable comme INCONNU, jamais comme nul', () => {
    // Une coercition hasardeuse vers 0 exclurait le composant du calcul.
    const [component] = normalizePackagings([
      { material: 'en:glass', food_contact: 'oui' },
    ]);
    expect(component.food_contact).toBeNull();
    expect(ids([component])).toEqual(['glass']);
  });
});
