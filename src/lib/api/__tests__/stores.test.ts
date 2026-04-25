import {
  STORES,
  clearStoreCache,
  fetchStoreTopProducts,
  getStoreBySlug,
} from '../stores';

function mockJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('stores', () => {
  beforeEach(() => {
    clearStoreCache();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('contient exactement 10 enseignes françaises', () => {
    expect(STORES).toHaveLength(10);
    for (const s of STORES) {
      expect(s.country).toBe('FR');
    }
  });

  it("getStoreBySlug('carrefour') retourne l'entrée Carrefour", () => {
    const store = getStoreBySlug('carrefour');
    expect(store).not.toBeNull();
    expect(store?.nameFr).toBe('Carrefour');
    expect(store?.offStoreTag).toBe('carrefour');
    expect(store?.displayOrder).toBe(0);
  });

  it("fetchStoreTopProducts appelle l'URL OFF v2 avec les bons paramètres", async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        mockJsonResponse({
          products: [
            {
              code: '3017620422003',
              product_name: 'Nutella',
              brands: 'Ferrero',
              image_url: 'https://img/nutella',
              nutrition_grades: 'e',
            },
          ],
        })
      );
    const res = await fetchStoreTopProducts('carrefour', 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('https://world.openfoodfacts.org/api/v2/search');
    expect(url).toContain('stores_tags=carrefour');
    expect(url).toContain('countries_tags=france');
    expect(url).toContain('page_size=24');
    expect(url).toContain('page=1');
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      barcode: '3017620422003',
      type: 'food',
      name: 'Nutella',
    });
  });

  it('hit cache dans le TTL évite un nouveau fetch', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        mockJsonResponse({
          products: [
            {
              code: 'X1',
              product_name: 'X',
              brands: null,
              image_url: null,
            },
          ],
        })
      );
    const first = await fetchStoreTopProducts('leclerc', 1);
    const second = await fetchStoreTopProducts('leclerc', 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });
});
