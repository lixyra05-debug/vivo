import {
  cosmeticToScoringInput,
  fetchCosmeticByBarcode,
  normalizeOBFProduct,
  type OBFProduct,
} from '../openbeautyfacts';
import type { CosmeticProduct } from '../types';

describe('openbeautyfacts', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retourne null lorsque OBF renvoie 404', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('not found', { status: 404 })
    );
    const result = await fetchCosmeticByBarcode('0000000000000');
    expect(result).toBeNull();
  });

  it('normalise un produit OBF et parse la liste INCI', () => {
    const obf: OBFProduct = {
      code: '3600540123456',
      product_name: 'Shampoing doux',
      brands: 'MarqueX',
      image_url: 'https://example.org/img.jpg',
      image_ingredients_url: 'https://example.org/ing.jpg',
      ingredients_text: 'Aqua, Sodium Laureth Sulfate; Cocamidopropyl Betaine, AQUA',
      categories_tags: ['en:shampoos', 'en:cosmetics'],
    };
    const normalized = normalizeOBFProduct(obf);
    expect(normalized.barcode).toBe('3600540123456');
    expect(normalized.name).toBe('Shampoing doux');
    expect(normalized.brand).toBe('MarqueX');
    expect(normalized.category).toBe('shampoos');
    expect(normalized.ingredients_inci).toContain('Aqua');
    // Dédup + lowercase
    expect(normalized.ingredients_list).toEqual([
      'aqua',
      'sodium laureth sulfate',
      'cocamidopropyl betaine',
    ]);
    expect(normalized.image_ingredients_url).toBe('https://example.org/ing.jpg');
  });

  it('cosmeticToScoringInput mappe les champs correctement', () => {
    const product: CosmeticProduct = {
      barcode: '123',
      name: 'Crème',
      brand: 'Y',
      image_url: null,
      ingredients_inci: 'Aqua, Glycerin',
      ingredients_list: ['aqua', 'glycerin'],
      category: 'face-creams',
      image_ingredients_url: null,
      obf_last_updated: null,
      our_score: null,
      our_score_computed_at: null,
      scan_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    const input = cosmeticToScoringInput(product);
    expect(input).toEqual({
      barcode: '123',
      ingredients_inci: 'Aqua, Glycerin',
      ingredients_list: ['aqua', 'glycerin'],
      category: 'face-creams',
    });
  });
});
