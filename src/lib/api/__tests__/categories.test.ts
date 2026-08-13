import {
  CATEGORIES,
  getAllCategories,
  getCategoriesByType,
  getCategoryBySlug,
} from '../categories';

describe('categories', () => {
  it('contient exactement 26 entrées', () => {
    expect(CATEGORIES).toHaveLength(26);
    expect(getAllCategories()).toHaveLength(26);
  });

  it('getCategoryBySlug retourne la catégorie shampoings', () => {
    const cat = getCategoryBySlug('shampoings');
    expect(cat).not.toBeNull();
    expect(cat?.name).toBe('Shampoings');
    expect(cat?.type).toBe('cosmetic');
    expect(cat?.obf_tag).toBe('shampoos');
    expect(cat?.off_tag).toBeNull();
  });

  it('getCategoriesByType("food") retourne 13 catégories alimentaires', () => {
    const foods = getCategoriesByType('food');
    expect(foods).toHaveLength(13);
    for (const c of foods) {
      expect(c.type).toBe('food');
      expect(c.off_tag).not.toBeNull();
      expect(c.obf_tag).toBeNull();
    }
  });

  it('getCategoriesByType("cosmetic") retourne 13 cosmétiques avec obf_tag', () => {
    const cosmetics = getCategoriesByType('cosmetic');
    expect(cosmetics).toHaveLength(13);
    for (const c of cosmetics) {
      expect(c.type).toBe('cosmetic');
      expect(c.obf_tag).not.toBeNull();
      expect(typeof c.obf_tag).toBe('string');
      expect((c.obf_tag as string).length).toBeGreaterThan(0);
      expect(c.off_tag).toBeNull();
    }
  });

  // D4 — l'écran catégorie aiguille sur `category.type === 'food'` pour choisir
  // entre le score composé (avec malus emballage) et le score cosmétique. Cet
  // aiguillage n'a de sens que si le type est correctement porté par la donnée :
  // un `deodorants` requalifié en 'food' ferait prendre un malus emballage à un
  // cosmétique, alors que sa fiche annonce « Qualité de la formulation ».
  it('porte bien le type qui aiguille le calcul du score (garde D4)', () => {
    expect(getCategoryBySlug('deodorants')?.type).toBe('cosmetic');
    expect(getCategoryBySlug('boissons')?.type).toBe('food');
  });
});
