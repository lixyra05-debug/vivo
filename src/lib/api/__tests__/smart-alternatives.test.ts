/**
 * Smart alternatives — tests TDD du rewrite Sprint Alternatives Premium.
 *
 * Cascade hiérarchique sur `categoriesTags` (racine → spécifique).
 * Type `Alternative` enrichi (score / novaGroup / additivesCount / category).
 */

import {
  findAlternatives,
  getAlternativesTitle,
  clearAlternativesCache,
  type Alternative,
} from '../smart-alternatives';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

interface RawAlt {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutrition_grades?: string;
  nova_group?: number | string;
  additives_n?: number;
}

function mockOffPage(items: RawAlt[]): void {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ products: items }),
  });
}

/**
 * Génère N produits valides (image + nom + grade donné) sur le tag fourni
 * pour atteindre le seuil ≥5 dans la cascade.
 */
function buildValidPage(
  count: number,
  grade: string,
  prefix: string,
): RawAlt[] {
  return Array.from({ length: count }, (_, i) => ({
    code: `${prefix}-${i}`,
    product_name: `${prefix} #${i}`,
    image_url: `https://img/${prefix}-${i}.jpg`,
    nutrition_grades: grade,
    nova_group: 1,
    additives_n: 0,
  }));
}

describe('smart-alternatives — findAlternatives', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAlternativesCache();
  });

  it('mappe les nutrition_grades vers les scores 90/70/50/30/10', async () => {
    mockOffPage([
      {
        code: 'p-a',
        product_name: 'A',
        image_url: 'https://img/a.jpg',
        nutrition_grades: 'a',
      },
      {
        code: 'p-b',
        product_name: 'B',
        image_url: 'https://img/b.jpg',
        nutrition_grades: 'b',
      },
      {
        code: 'p-c',
        product_name: 'C',
        image_url: 'https://img/c.jpg',
        nutrition_grades: 'c',
      },
      {
        code: 'p-d',
        product_name: 'D',
        image_url: 'https://img/d.jpg',
        nutrition_grades: 'd',
      },
      {
        code: 'p-e',
        product_name: 'E',
        image_url: 'https://img/e.jpg',
        nutrition_grades: 'e',
      },
    ]);

    const alts = await findAlternatives('orig', ['en:cookies'], 0);
    const expected: Record<string, number> = {
      'p-a': 90,
      'p-b': 70,
      'p-c': 50,
      'p-d': 30,
      'p-e': 10,
    };
    for (const [barcode, score] of Object.entries(expected)) {
      const found = alts.find((a) => a.barcode === barcode);
      expect(found?.score).toBe(score);
    }
  });

  it('exclut les produits sans image_url ou sans product_name', async () => {
    mockOffPage([
      {
        code: 'ok',
        product_name: 'OK',
        image_url: 'https://img/ok.jpg',
        nutrition_grades: 'a',
      },
      // pas de product_name
      {
        code: 'no-name',
        image_url: 'https://img/x.jpg',
        nutrition_grades: 'a',
      },
      // pas d'image
      {
        code: 'no-img',
        product_name: 'NoImg',
        nutrition_grades: 'a',
      },
      // product_name vide
      {
        code: 'empty-name',
        product_name: '   ',
        image_url: 'https://img/e.jpg',
        nutrition_grades: 'a',
      },
    ]);

    const alts = await findAlternatives('orig', ['en:cookies'], 0);
    expect(alts.map((a) => a.barcode)).toEqual(['ok']);
  });

  it('exclut le produit scanné (même barcode)', async () => {
    mockOffPage([
      {
        code: 'self',
        product_name: 'Self',
        image_url: 'https://img/s.jpg',
        nutrition_grades: 'a',
      },
      {
        code: 'other',
        product_name: 'Other',
        image_url: 'https://img/o.jpg',
        nutrition_grades: 'a',
      },
    ]);
    const alts = await findAlternatives('self', ['en:cookies'], 0);
    expect(alts.find((a) => a.barcode === 'self')).toBeUndefined();
    expect(alts.find((a) => a.barcode === 'other')).toBeDefined();
  });

  it('trie par score desc, puis par additivesCount asc en cas d\'égalité', async () => {
    mockOffPage([
      {
        code: 'a-3add',
        product_name: 'A 3 add',
        image_url: 'https://img/1.jpg',
        nutrition_grades: 'a',
        additives_n: 3,
      },
      {
        code: 'b-0add',
        product_name: 'B 0 add',
        image_url: 'https://img/2.jpg',
        nutrition_grades: 'b',
        additives_n: 0,
      },
      {
        code: 'a-0add',
        product_name: 'A 0 add',
        image_url: 'https://img/3.jpg',
        nutrition_grades: 'a',
        additives_n: 0,
      },
    ]);
    const alts = await findAlternatives('orig', ['en:cookies'], 0);
    expect(alts.map((a) => a.barcode)).toEqual([
      'a-0add', // 90/0
      'a-3add', // 90/3
      'b-0add', // 70/0
    ]);
  });

  it('retombe vers le tag parent si le tag spécifique a <5 valides', async () => {
    // Tag spécifique en:cookies → 2 valides
    mockOffPage(buildValidPage(2, 'a', 'sp'));
    // Parent en:foods → 6 valides
    mockOffPage(buildValidPage(6, 'a', 'pa'));

    const alts = await findAlternatives(
      'orig',
      ['en:foods', 'en:cookies'],
      0,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // On a basculé sur le parent (≥5 atteint) → résultats du parent.
    for (const a of alts) {
      expect(a.barcode.startsWith('pa-')).toBe(true);
      expect(a.category).toBe('en:foods');
    }
  });

  it('court-circuite la cascade si le tag spécifique atteint déjà ≥5', async () => {
    mockOffPage(buildValidPage(6, 'a', 'sp'));
    const alts = await findAlternatives(
      'orig',
      ['en:foods', 'en:cookies'],
      0,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(alts.length).toBe(5);
    for (const a of alts) {
      expect(a.category).toBe('en:cookies');
    }
  });

  it('s\'arrête après 3 tentatives, même si le chemin est plus long', async () => {
    // 5 niveaux de tags → max 3 tentatives autorisées.
    // Toutes les pages renvoient 0 valide.
    mockOffPage([]);
    mockOffPage([]);
    mockOffPage([]);
    // Si on appelait davantage, mockResolvedValueOnce ne couvrirait pas et le test casserait
    // — c'est notre garde-fou.

    const alts = await findAlternatives(
      'orig',
      ['en:lvl1', 'en:lvl2', 'en:lvl3', 'en:lvl4', 'en:lvl5'],
      0,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(alts).toEqual([]);
  });

  it('retourne au maximum 5 alternatives', async () => {
    mockOffPage(buildValidPage(8, 'a', 'big'));
    const alts = await findAlternatives('orig', ['en:cookies'], 0);
    expect(alts.length).toBe(5);
  });

  it('met en cache le résultat (clé barcode + chemin + score)', async () => {
    mockOffPage(buildValidPage(6, 'a', 'cache'));
    const first = await findAlternatives(
      'orig',
      ['en:foods', 'en:cookies'],
      30,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.length).toBe(5);

    const second = await findAlternatives(
      'orig',
      ['en:foods', 'en:cookies'],
      30,
    );
    // Pas d'appel fetch supplémentaire.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.length).toBe(5);
  });

  it('retourne [] si categoriesTags est vide, sans fetch', async () => {
    const alts = await findAlternatives('orig', [], 50);
    expect(alts).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('coerce nova_group string → number', async () => {
    mockOffPage([
      {
        code: 'sn1',
        product_name: 'StringNova',
        image_url: 'https://img/sn1.jpg',
        nutrition_grades: 'a',
        nova_group: '3',
      },
      {
        code: 'sn2',
        product_name: 'NoNova',
        image_url: 'https://img/sn2.jpg',
        nutrition_grades: 'a',
        // nova_group manquant → null
      },
    ]);
    const alts = await findAlternatives('orig', ['en:cookies'], 0);
    const sn1 = alts.find((a) => a.barcode === 'sn1');
    const sn2 = alts.find((a) => a.barcode === 'sn2');
    expect(sn1?.novaGroup).toBe(3);
    expect(sn2?.novaGroup).toBeNull();
  });

  it('additivesCount tombe à 0 par défaut quand additives_n est absent', async () => {
    mockOffPage([
      {
        code: 'no-add',
        product_name: 'NoAdd',
        image_url: 'https://img/no.jpg',
        nutrition_grades: 'a',
        // additives_n absent
      },
    ]);
    const alts = await findAlternatives('orig', ['en:cookies'], 0);
    expect(alts[0].additivesCount).toBe(0);
  });

  it('traite !res.ok comme 0 résultats puis poursuit la cascade vers le parent', async () => {
    // 404 — pas de retry côté fetchWithTimeout (≥500 only) → 1 appel pour ce tag.
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });
    mockOffPage(buildValidPage(5, 'a', 'pa'));

    const alts = await findAlternatives(
      'orig',
      ['en:foods', 'en:cookies'],
      0,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(alts.length).toBe(5);
    for (const a of alts) {
      expect(a.category).toBe('en:foods');
    }
  });

  it('traite FetchTimeoutError comme 0 résultats puis poursuit la cascade', async () => {
    // fetchWithTimeout retry 2x sur erreur réseau (totalAttempts=3) puis lève
    // FetchTimeoutError. On simule cet épuisement avec 3 rejets consécutifs.
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    mockOffPage(buildValidPage(5, 'a', 'pa'));

    const alts = await findAlternatives(
      'orig',
      ['en:foods', 'en:cookies'],
      0,
    );
    // 3 retries pour le tag spécifique (totalAttempts=3 dans fetchWithTimeout)
    // + 1 appel pour le parent = 4 appels global.fetch.
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(alts.length).toBe(5);
    for (const a of alts) {
      expect(a.category).toBe('en:foods');
    }
  });

  it('expose tous les champs Alternative attendus sur chaque résultat', async () => {
    mockOffPage([
      {
        code: 'full',
        product_name: 'Full',
        brands: 'BrandX',
        image_url: 'https://img/full.jpg',
        nutrition_grades: 'a',
        nova_group: 2,
        additives_n: 1,
      },
    ]);
    const alts = await findAlternatives('orig', ['en:cookies'], 30);
    expect(alts).toHaveLength(1);
    const a: Alternative = alts[0];
    expect(a.barcode).toBe('full');
    expect(a.name).toBe('Full');
    expect(a.brand).toBe('BrandX');
    expect(a.imageUrl).toBe('https://img/full.jpg');
    expect(a.score).toBe(90);
    expect(a.scoreDelta).toBe(60);
    expect(a.category).toBe('en:cookies');
    expect(a.novaGroup).toBe(2);
    expect(a.additivesCount).toBe(1);
  });

  it('exclut les produits dont le score n\'est pas strictement supérieur au score courant', async () => {
    mockOffPage([
      // 50 ≤ 50 → exclu
      {
        code: 'eq',
        product_name: 'Eq',
        image_url: 'https://img/eq.jpg',
        nutrition_grades: 'c',
      },
      // 70 > 50 → ok
      {
        code: 'gt',
        product_name: 'Gt',
        image_url: 'https://img/gt.jpg',
        nutrition_grades: 'b',
      },
      // 30 < 50 → exclu
      {
        code: 'lt',
        product_name: 'Lt',
        image_url: 'https://img/lt.jpg',
        nutrition_grades: 'd',
      },
    ]);
    const alts = await findAlternatives('orig', ['en:cookies'], 50);
    expect(alts.map((a) => a.barcode)).toEqual(['gt']);
  });
});

describe('smart-alternatives — getAlternativesTitle', () => {
  it('retourne un titre adapté selon le score courant', () => {
    expect(getAlternativesTitle(30)).toBe(
      '🔄 Des alternatives bien meilleures existent',
    );
    expect(getAlternativesTitle(60)).toBe(
      '🔄 Des alternatives plus saines existent',
    );
    expect(getAlternativesTitle(90)).toBe(
      '🔄 Alternatives dans cette catégorie',
    );
  });

  it('frontière : 49 → bien meilleures, 50 → plus saines', () => {
    expect(getAlternativesTitle(49)).toBe(
      '🔄 Des alternatives bien meilleures existent',
    );
    expect(getAlternativesTitle(50)).toBe(
      '🔄 Des alternatives plus saines existent',
    );
  });

  it('frontière : 79 → plus saines, 80 → dans cette catégorie', () => {
    expect(getAlternativesTitle(79)).toBe(
      '🔄 Des alternatives plus saines existent',
    );
    expect(getAlternativesTitle(80)).toBe(
      '🔄 Alternatives dans cette catégorie',
    );
  });
});
