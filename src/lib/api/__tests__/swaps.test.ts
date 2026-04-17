import { matchCategoriesForProduct, type SwapCategory, type SwapRule } from '../swaps';

const CATEGORIES: SwapCategory[] = [
  {
    id: 'cat-boissons',
    category_name_fr: 'Boissons sucrées',
    swap_type: 'brut',
    brut_alternatives: [{ name: 'Eau pétillante', why: 'Hydratation' }],
    product_barcodes: [],
    display_order: 1,
  },
  {
    id: 'cat-snacks',
    category_name_fr: 'Snacks salés',
    swap_type: 'brut',
    brut_alternatives: [{ name: 'Amandes', why: 'Magnésium' }],
    product_barcodes: [],
    display_order: 2,
  },
];

const RULES: SwapRule[] = [
  {
    id: 'r1',
    trigger_keywords: ['cola', 'soda'],
    trigger_nova_min: 3,
    swap_category_id: 'cat-boissons',
  },
  {
    id: 'r2',
    trigger_keywords: ['chips', 'pringles'],
    trigger_nova_min: 3,
    swap_category_id: 'cat-snacks',
  },
];

describe('matchCategoriesForProduct', () => {
  it('matche par mot-clé dans le nom', () => {
    const matched = matchCategoriesForProduct(
      {
        name: 'Coca-Cola Zéro',
        brand: null,
        ingredients_raw: null,
        nova_group: 4,
      },
      CATEGORIES,
      RULES
    );
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe('cat-boissons');
  });

  it('respecte le seuil NOVA minimum', () => {
    const matched = matchCategoriesForProduct(
      { name: 'Cola artisanal', brand: null, ingredients_raw: null, nova_group: 2 },
      CATEGORIES,
      RULES
    );
    expect(matched).toHaveLength(0);
  });

  it('retourne vide si aucun keyword ne match', () => {
    const matched = matchCategoriesForProduct(
      { name: 'Yaourt grec', brand: null, ingredients_raw: null, nova_group: 4 },
      CATEGORIES,
      RULES
    );
    expect(matched).toHaveLength(0);
  });

  it('gère les accents et la casse', () => {
    const matched = matchCategoriesForProduct(
      { name: 'PRINGLES Original', brand: null, ingredients_raw: null, nova_group: 4 },
      CATEGORIES,
      RULES
    );
    expect(matched.map((c) => c.id)).toContain('cat-snacks');
  });
});
