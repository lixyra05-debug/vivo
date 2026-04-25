import {
  EDUCATIONAL_CARDS,
  findRelevantCards,
} from '../content-database';

describe('content-database', () => {
  it('contient au moins 20 cartes avec ids uniques et champs FR remplis', () => {
    expect(EDUCATIONAL_CARDS.length).toBeGreaterThanOrEqual(20);
    const ids = EDUCATIONAL_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(EDUCATIONAL_CARDS.length);
    for (const card of EDUCATIONAL_CARDS) {
      expect(card.titleFr.length).toBeGreaterThan(0);
      expect(card.bodyFr.length).toBeGreaterThan(0);
      expect(card.bodyFr.length).toBeLessThanOrEqual(320);
      expect(card.source.length).toBeGreaterThan(0);
      expect(card.sourceUrl).toMatch(/^https?:\/\//);
      expect(['informative', 'positive', 'warning']).toContain(card.tone);
    }
  });

  it('produit Nutella-like → renvoie carte huile de palme ou lécithine (e322)', () => {
    const cards = findRelevantCards(
      {
        additives_tags: ['en:e322'],
        ingredients_raw:
          'sucre, huile de palme, noisettes, cacao maigre, lait écrémé en poudre, lécithine de soja',
        ingredients_inci: null,
        category_slug: 'pates-a-tartiner',
      },
      { score_final: 35 },
      3
    );
    const ids = cards.map((c) => c.id);
    expect(ids.includes('palm_oil') || ids.includes('e322')).toBe(true);
  });

  it('produit soda à l\'aspartame → renvoie carte aspartame', () => {
    const cards = findRelevantCards(
      {
        additives_tags: ['en:e951'],
        ingredients_raw:
          'eau gazéifiée, colorant E150d, acidifiants E338 et E330, édulcorants : aspartame, acésulfame K, arômes',
        ingredients_inci: null,
        category_slug: 'sodas',
      },
      { score_final: 40 },
      2
    );
    expect(cards.map((c) => c.id)).toContain('aspartame');
  });

  it('cosmétique avec parabène → renvoie carte parabens (warning)', () => {
    const cards = findRelevantCards(
      {
        additives_tags: [],
        ingredients_raw: null,
        ingredients_inci:
          'aqua, glycerin, methylparaben, propylparaben, phenoxyethanol, parfum',
        category_slug: 'cremes',
      },
      { score_final: 50 },
      3
    );
    const ids = cards.map((c) => c.id);
    expect(ids).toContain('parabens');
    // L'ordre warning > informative : parabens (warning) doit arriver en premier
    expect(cards[0].id).toBe('parabens');
  });

  it('score 95 → renvoie score_excellent (positive)', () => {
    const cards = findRelevantCards(
      {
        additives_tags: [],
        ingredients_raw: 'pommes',
        ingredients_inci: null,
        category_slug: 'fruits',
      },
      { score_final: 95 },
      2
    );
    expect(cards.map((c) => c.id)).toContain('score_excellent');
  });

  it('produit sans aucun match → renvoie []', () => {
    const cards = findRelevantCards(
      {
        additives_tags: [],
        ingredients_raw: 'eau de source',
        ingredients_inci: null,
        category_slug: 'eaux',
      },
      { score_final: 70 },
      2
    );
    expect(cards).toEqual([]);
  });
});
