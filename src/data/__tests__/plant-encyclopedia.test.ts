import {
  PLANT_ENCYCLOPEDIA,
  PLANT_CATEGORIES,
  searchPlants,
  type PlantCategory,
  type PlantEntry,
} from '../plant-encyclopedia';
import { EDUCATIONAL_CARDS } from '@/src/lib/education/content-database';

const WHITELISTED_HOSTS = [
  'ema.europa.eu',
  'efsa.europa.eu',
  'cochrane.org',
  'cochranelibrary.com',
  'ncbi.nlm.nih.gov',
  'pubmed.ncbi.nlm.nih.gov',
  'anses.fr',
  'ansm.sante.fr',
  'who.int',
];

const CANONICAL_IDS = [
  'chamomile',
  'valerian',
  'linden',
  'passionflower',
  'hops',
  'melissa',
  'peppermint',
  'fennel',
  'anise',
  'caraway',
  'artichoke',
  'chicory',
  'lavender',
  'thyme',
  'ivy',
  'plantain',
  'elderflower',
  'mallow',
  'marshmallow',
  'calendula',
  'burdock',
  'borage',
  'aloe_vera',
  'red_vine',
  'horse_chestnut',
  'garlic',
  'rosemary',
  'nettle',
  'ginger',
  'turmeric',
];

const ALL_CATEGORIES: PlantCategory[] = [
  'respiratory',
  'digestive',
  'nervous',
  'circulatory',
  'skin',
  'urinary',
  'general',
];

describe('PLANT_ENCYCLOPEDIA — Encyclopédie Plantes Médicinales', () => {
  it('contient au moins 40 entrées', () => {
    expect(PLANT_ENCYCLOPEDIA.length).toBeGreaterThanOrEqual(40);
  });

  it('tous les id sont uniques', () => {
    const ids = PLANT_ENCYCLOPEDIA.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('tous les category appartiennent au type PlantCategory', () => {
    const validCategories = new Set<string>(Object.keys(PLANT_CATEGORIES));
    for (const p of PLANT_ENCYCLOPEDIA) {
      expect(validCategories.has(p.category as string)).toBe(true);
    }
  });

  it('tous les sourceUrl sont en https et sur domaines whitelistés', () => {
    for (const p of PLANT_ENCYCLOPEDIA) {
      expect(p.sourceUrl).toMatch(/^https:\/\//);
      const matched = WHITELISTED_HOSTS.some((host) =>
        p.sourceUrl.toLowerCase().includes(host),
      );
      if (!matched) {
        throw new Error(
          `Plant ${p.id} a un sourceUrl non whitelisté: ${p.sourceUrl}`,
        );
      }
      expect(matched).toBe(true);
    }
  });

  describe('Garde-fou anti-Beauvillard / Clément / O\'Neill', () => {
    it("aucune source ne cite Beauvillard, Clément ou O'Neill", () => {
      const banned = ['beauvillard', 'clément', 'clement', "o'neill", 'oneill'];
      for (const p of PLANT_ENCYCLOPEDIA) {
        const src = p.source.toLowerCase();
        for (const term of banned) {
          if (src.includes(term)) {
            throw new Error(
              `Plant ${p.id} cite source interdite "${term}" : ${p.source}`,
            );
          }
          expect(src).not.toContain(term);
        }
      }
    });
  });

  describe('Garde-fou langage thérapeutique R5', () => {
    it("aucune plante n'utilise 'soigne', 'guérit', 'traite ', 'remplace'", () => {
      const banned = [
        'soigne',
        'guérit',
        'guerit',
        'traite ',
        'remplace',
      ];
      for (const p of PLANT_ENCYCLOPEDIA) {
        const blob = `${p.properties} ${p.traditionalUse}`.toLowerCase();
        for (const term of banned) {
          if (blob.includes(term)) {
            throw new Error(
              `Plant ${p.id} utilise terme thérapeutique interdit "${term}"`,
            );
          }
          expect(blob).not.toContain(term);
        }
      }
    });
  });

  describe('Couverture catégories', () => {
    it.each(
      ALL_CATEGORIES.filter((c) => c !== 'general').map((c) => [c]),
    )('catégorie %s a au moins 3 plantes', (category) => {
      const count = PLANT_ENCYCLOPEDIA.filter(
        (p) => p.category === category,
      ).length;
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  describe('30 IDs canoniques requis', () => {
    it.each(CANONICAL_IDS.map((id) => [id]))(
      'contient l\'ID canonique "%s"',
      (id) => {
        const found = PLANT_ENCYCLOPEDIA.find((p: PlantEntry) => p.id === id);
        expect(found).toBeDefined();
      },
    );
  });
});

/**
 * VERROU SANTÉ — lot S3, item 4. La fiche `borage` et la carte éducative
 * `borage_pa_warning` (EFSA pub/4908) disaient deux choses : la fiche
 * déconseillait les parties aériennes « au long cours », ce qui laissait
 * entendre qu'un usage court était acceptable ; la carte déconseille toute
 * consommation interne, sans limite de durée. La fiche reprend le corps de
 * la carte octet pour octet — texte sourcé existant, le plus prudent, aucun
 * contenu médical nouveau.
 */
describe('Bourrache — la fiche dit ce que dit la carte EFSA', () => {
  function getBorage(): PlantEntry {
    const plant = PLANT_ENCYCLOPEDIA.find((p) => p.id === 'borage');
    if (!plant) throw new Error('Fiche borage introuvable');
    return plant;
  }

  function borageCardBody(): string {
    const card = EDUCATIONAL_CARDS.find((c) => c.id === 'borage_pa_warning');
    if (!card) throw new Error('Carte borage_pa_warning introuvable');
    return card.bodyFr;
  }

  it('la fiche bourrache reprend mot pour mot le corps de la carte EFSA', () => {
    expect(getBorage().contraindications).toBe(borageCardBody());
  });

  it('partUsed ne contient plus « au long cours »', () => {
    const { partUsed } = getBorage();
    expect(partUsed).not.toContain('au long cours');
    // Seul « au long cours » part : la mise en garde reste.
    expect(partUsed).toBe('Graines (huile) — éviter les parties aériennes');
  });

  it('garde : les interactions ne changent pas', () => {
    expect(getBorage().interactions).toBe(
      "Prudence avec anticoagulants (effet potentiel sur l'agrégation plaquettaire).",
    );
  });

  it('garde : la carte reste la surface la plus prudente (consommation interne déconseillée, sans limite de durée)', () => {
    const body = borageCardBody();
    expect(body).toContain('Consommation interne déconseillée.');
    expect(body).not.toContain('au long cours');
  });

  // `properties` affirmait un confort cutané que la carte, reprise ci-dessus
  // dans `contraindications`, dit « sans allégation santé validée ». La
  // phrase part, la composition documentée reste.
  it("properties ne contient plus « Contribue au confort cutané dans le cadre d'une alimentation équilibrée. »", () => {
    const { properties } = getBorage();
    expect(properties).not.toContain('Contribue au confort cutané');
    expect(properties).toBe(
      'Propriétés documentées : huile riche en acide gamma-linolénique.',
    );
  });

  // searchPlants cherche dans `properties`. Mesuré : la phrase retirée ne
  // menait seule à la bourrache que par ses propres mots (« contribue »,
  // « cadre », « alimentation », « équilibrée »…) ; les recherches qui ont un
  // sens pour cette fiche passent par le nom, `traditionalUse` ou le reste
  // de `properties`.
  it.each([['bourrache'], ['borago'], ['huile'], ['gamma-linolénique']])(
    'garde : searchPlants("%s") trouve toujours la bourrache',
    (query) => {
      expect(searchPlants(query).map((p) => p.id)).toContain('borage');
    },
  );
});

/**
 * VERROU SANTÉ — lot S3, C2b. Depuis C2, `contraindications` et
 * `interactions` sont rendues à tous les paliers ; `preparation` reste Expert
 * (`ExpertSections`, app/plants/[id].tsx). Deux limites de sécurité n'étaient
 * écrites que dans `preparation` : hors Expert, personne ne les lisait. Elles
 * sont recopiées mot pour mot à la fin de `contraindications` — texte
 * existant, aucun contenu médical nouveau — et restent dans `preparation`.
 * Une fréquence journalière est une posologie, pas une limite : elle n'est
 * pas recopiée. Le bouleau est reporté au lot contenu : sa consigne
 * d'hydratation, lue sous « Contre-indications » à côté de l'œdème cardiaque
 * ou rénal, dirait l'inverse de ce qu'elle veut dire.
 */
describe('C2b — les limites de la Préparation se lisent dans les contre-indications', () => {
  function plant(id: string): PlantEntry {
    const found = PLANT_ENCYCLOPEDIA.find((p) => p.id === id);
    if (!found) throw new Error(`Fiche ${id} introuvable`);
    return found;
  }

  // [id, limite telle qu'écrite dans la Préparation, contre-indications avant C2b]
  const LIMITS: Array<[string, string, string]> = [
    [
      'ginseng',
      'Cure de 4-12 semaines max.',
      'Hypertension non contrôlée, troubles cardiaques, troubles psychiatriques, grossesse, allaitement, enfant.',
    ],
    [
      'lavender',
      'Huile essentielle uniquement après avis professionnel.',
      'Huile essentielle déconseillée chez les enfants de moins de 6 ans et en grossesse. Voie orale strictement encadrée.',
    ],
  ];

  it.each(LIMITS)(
    '%s : « %s » figure dans la Préparation et, mot pour mot, dans les contre-indications',
    (id, limit, contraindicationsBefore) => {
      const { preparation, contraindications } = plant(id);
      expect(preparation).toContain(limit);
      // Rien d'autre ne change : la reprise s'ajoute après le texte existant.
      expect(contraindications).toBe(`${contraindicationsBefore} ${limit}`);
    },
  );

  it("busserole : les interactions ne parlent plus d'efficacité — suppression seule", () => {
    const { interactions } = plant('bearberry');
    expect(interactions).not.toContain('efficacité');
    expect(interactions).toBe("Éviter avec aliments acidifiant l'urine.");
  });

  it('gingembre : la Préparation renvoie aux contre-indications pour la grossesse', () => {
    const { preparation, contraindications } = plant('ginger');
    expect(preparation).toContain('Grossesse : voir les contre-indications');
    // Le renvoi mène quelque part : les contre-indications, rendues à tous
    // sous ce titre, parlent de grossesse.
    expect(contraindications).toContain('Grossesse');
    // Rien d'autre ne change : le renvoi s'ajoute après la préparation existante.
    expect(preparation).toBe(
      'Infusion 0,5-1 g de poudre ou décoction de rhizome frais (1-2 g) par tasse, 3 fois par jour. Grossesse : voir les contre-indications.',
    );
  });

  // [id, fréquence journalière écrite dans la Préparation]
  const FREQUENCIES: Array<[string, string]> = [
    ['bearberry', "jusqu'à 4 fois par jour"],
    ['melissa', "jusqu'à 3 fois par jour"],
  ];

  it.each(FREQUENCIES)(
    'garde %s : « %s » reste dans la Préparation, pas dans les contre-indications',
    (id, frequency) => {
      const { preparation, contraindications } = plant(id);
      expect(preparation).toContain(frequency);
      expect(contraindications).not.toContain(frequency);
      expect(contraindications).not.toMatch(/fois par jour/);
    },
  );

  // Bouleau reporté au lot contenu : rien n'est recopié tant que la consigne
  // d'hydratation n'est pas réécrite pour l'œdème cardiaque ou rénal.
  it('garde bouleau (reporté) : « consommation hydrique » reste hors des contre-indications', () => {
    const { preparation, contraindications } = plant('birch');
    expect(preparation).toContain('consommation hydrique abondante');
    expect(contraindications).not.toContain('consommation hydrique');
  });
});
