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
