import { fetchProductMultiSource } from '../openfoodfacts';

describe('fetchProductMultiSource', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retourne un produit food quand OFF répond avec un produit', async () => {
    const offProduct = {
      code: '5449000000996',
      product_name: 'Coca-Cola',
      brands: 'Coca-Cola',
      ingredients_text: 'eau, sucre',
      additives_tags: ['en:e150d'],
      nova_group: 4,
    };
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 1, product: offProduct }), { status: 200 }),
    );
    const result = await fetchProductMultiSource('5449000000996');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('food');
    expect(result?.product.code).toBe('5449000000996');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toEqual(
      expect.stringContaining('fr.openfoodfacts.org'),
    );
  });

  it('retombe sur OBF quand OFF retourne null', async () => {
    const obfProduct = {
      code: '3600540123456',
      product_name: 'Shampoing doux',
      brands: 'MarqueX',
      ingredients_text: 'Aqua, Sodium Laureth Sulfate',
      categories_tags: ['en:shampoos'],
    };
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      // OFF : produit non trouvé (status !== 1)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 0 }), { status: 200 }),
      )
      // OBF : trouvé
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 1, product: obfProduct }), { status: 200 }),
      );

    const result = await fetchProductMultiSource('3600540123456');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('cosmetic');
    expect(result?.product.code).toBe('3600540123456');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1][0]).toEqual(
      expect.stringContaining('world.openbeautyfacts.org'),
    );
  });

  it('retourne null si OFF et OBF ne trouvent rien', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('not found', { status: 404 }))
      .mockResolvedValueOnce(new Response('not found', { status: 404 }));

    const result = await fetchProductMultiSource('0000000000000');
    expect(result).toBeNull();
  });
});
