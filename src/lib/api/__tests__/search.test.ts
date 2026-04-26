import { clearSearchCache, searchProducts } from '../search';

function mockJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('search', () => {
  beforeEach(() => {
    clearSearchCache();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retourne un tableau vide sur query vide', async () => {
    const spy = jest.spyOn(global, 'fetch');
    const res = await searchProducts({ query: '   ', type: 'all' });
    expect(res).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("appelle l'endpoint OFF avec les bons paramètres si type='food'", async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        mockJsonResponse({
          products: [
            {
              code: '111',
              product_name: 'Coca',
              brands: 'Coca-Cola',
              image_url: 'https://img/1',
            },
          ],
        })
      );
    const res = await searchProducts({ query: 'coca', type: 'food' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('https://fr.openfoodfacts.org/api/v2/search');
    expect(url).toContain('search_terms=coca');
    expect(url).toContain('page_size=24');
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ barcode: '111', type: 'food', name: 'Coca' });
  });

  it("appelle l'endpoint OBF si type='cosmetic'", async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        mockJsonResponse({
          products: [
            {
              code: '222',
              product_name: 'Shampoing',
              brands: 'B',
              image_url: null,
            },
          ],
        })
      );
    const res = await searchProducts({ query: 'shampoing', type: 'cosmetic' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('https://world.openbeautyfacts.org/api/v2/search');
    expect(res).toHaveLength(1);
    expect(res[0].type).toBe('cosmetic');
    expect(res[0].barcode).toBe('222');
  });

  it("type='all' interroge OFF + OBF et dédoublonne par code-barres", async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = String(input);
      if (url.includes('openfoodfacts.org')) {
        return Promise.resolve(
          mockJsonResponse({
            products: [
              { code: 'AAA', product_name: 'Food A', brands: null, image_url: null },
              { code: 'BBB', product_name: 'Food B', brands: null, image_url: null },
            ],
          })
        );
      }
      return Promise.resolve(
        mockJsonResponse({
          products: [
            { code: 'BBB', product_name: 'Cosmetic B', brands: null, image_url: null },
            { code: 'CCC', product_name: 'Cosmetic C', brands: null, image_url: null },
          ],
        })
      );
    });
    const res = await searchProducts({ query: 'bio', type: 'all' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const barcodes = res.map((r) => r.barcode).sort();
    expect(barcodes).toEqual(['AAA', 'BBB', 'CCC']);
    // Premier arrivé gagne : BBB doit être marqué food
    const bbb = res.find((r) => r.barcode === 'BBB');
    expect(bbb?.type).toBe('food');
  });

  it('hit cache dans le TTL évite un nouveau fetch', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        mockJsonResponse({
          products: [
            { code: 'X1', product_name: 'X', brands: null, image_url: null },
          ],
        })
      );
    const first = await searchProducts({ query: 'eau', type: 'food' });
    const second = await searchProducts({ query: 'eau', type: 'food' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });
});
