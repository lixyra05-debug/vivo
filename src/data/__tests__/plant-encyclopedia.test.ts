import {
  PLANT_ENCYCLOPEDIA,
  PLANT_CATEGORIES,
  type PlantCategory,
  type PlantEntry,
} from '../plant-encyclopedia';

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
