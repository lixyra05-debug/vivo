/**
 * Smart alternatives — Premium feature : suggère 3 alternatives mieux notées
 * (proxy Nutri-Score) dans la même catégorie OFF que le produit scanné.
 *
 * Cache : 10 min, max 100 entrées.
 */

import {
  findAlternatives,
  clearAlternativesCache,
  type AlternativeProduct,
} from '../smart-alternatives';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

interface RawAlt {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutrition_grades?: string;
}

function mockAltsResponse(items: RawAlt[]): void {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ products: items }),
  });
}

describe('smart-alternatives', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAlternativesCache();
  });

  it("renvoie au plus 3 alternatives, triées par scoreDelta décroissant", async () => {
    mockAltsResponse([
      { code: 'a1', product_name: 'P1', nutrition_grades: 'a' }, // 90
      { code: 'b1', product_name: 'P2', nutrition_grades: 'b' }, // 70
      { code: 'a2', product_name: 'P3', nutrition_grades: 'a' }, // 90
      { code: 'c1', product_name: 'P4', nutrition_grades: 'c' }, // 50 — exclu (≤ current)
      { code: 'a3', product_name: 'P5', nutrition_grades: 'a' }, // 90
    ]);

    const alts: AlternativeProduct[] = await findAlternatives(
      'scanned-barcode',
      'en:cookies',
      50,
    );
    expect(alts).toHaveLength(3);
    for (let i = 1; i < alts.length; i++) {
      expect(alts[i - 1].scoreDelta).toBeGreaterThanOrEqual(alts[i].scoreDelta);
    }
    expect(alts[0].scoreDelta).toBe(40);
  });

  it("exclut le produit lui-même (même barcode) des alternatives", async () => {
    mockAltsResponse([
      { code: 'self', product_name: 'Self', nutrition_grades: 'a' },
      { code: 'other', product_name: 'Other', nutrition_grades: 'a' },
    ]);
    const alts = await findAlternatives('self', 'en:cookies', 30);
    expect(alts.find((a) => a.barcode === 'self')).toBeUndefined();
  });

  it("exclut les alternatives au score ≤ score courant", async () => {
    mockAltsResponse([
      { code: 'x1', product_name: 'X1', nutrition_grades: 'c' }, // 50, current=50 → exclu
      { code: 'x2', product_name: 'X2', nutrition_grades: 'd' }, // 30 < 50 → exclu
      { code: 'x3', product_name: 'X3', nutrition_grades: 'b' }, // 70 > 50 → ok
    ]);
    const alts = await findAlternatives('orig', 'en:cookies', 50);
    expect(alts).toHaveLength(1);
    expect(alts[0].barcode).toBe('x3');
  });

  it("renvoie [] si pas de category tag (null/empty)", async () => {
    const a1 = await findAlternatives('orig', null, 50);
    const a2 = await findAlternatives('orig', '', 50);
    expect(a1).toEqual([]);
    expect(a2).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renvoie [] si OFF répond non-OK / erreur réseau", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    });
    const alts = await findAlternatives('orig', 'en:cookies', 50);
    expect(alts).toEqual([]);
  });

  it("met en cache 10 min — appel répété ne refetch pas", async () => {
    mockAltsResponse([
      { code: 'a1', product_name: 'P1', nutrition_grades: 'a' },
      { code: 'b1', product_name: 'P2', nutrition_grades: 'b' },
    ]);
    await findAlternatives('orig', 'en:cookies', 50);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockClear();
    const second = await findAlternatives('orig', 'en:cookies', 50);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(second.length).toBeGreaterThan(0);
  });

  it("chaque alternative porte barcode/name/brand/imageUrl/proxyScore/scoreDelta/grade", async () => {
    mockAltsResponse([
      {
        code: 'alt1',
        product_name: 'Bio Cookie',
        brands: 'BrandX',
        image_url: 'https://img/1.jpg',
        nutrition_grades: 'a',
      },
    ]);
    const alts = await findAlternatives('orig', 'en:cookies', 30);
    expect(alts).toHaveLength(1);
    const a = alts[0];
    expect(a.barcode).toBe('alt1');
    expect(a.name).toBe('Bio Cookie');
    expect(a.brand).toBe('BrandX');
    expect(a.imageUrl).toBe('https://img/1.jpg');
    expect(a.proxyScore).toBe(90);
    expect(a.scoreDelta).toBe(60);
    expect(a.grade).toBe('a');
  });
});
