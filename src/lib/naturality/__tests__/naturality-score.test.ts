import { detectNaturalIngredients } from '../naturality-score';

describe('naturality-score — detectNaturalIngredients', () => {
  it('détecte le thym dans une liste FR avec accents simples', () => {
    const result = detectNaturalIngredients('eau, thym, sucre');
    const ids = result.map((m) => m.plantId);
    expect(ids).toContain('thyme');
  });

  it('renvoie un tableau vide pour des ingrédients sans plante', () => {
    const result = detectNaturalIngredients('aqua, parfum');
    expect(result).toEqual([]);
  });

  it('détecte chamomile via son nom latin Matricaria recutita', () => {
    const result = detectNaturalIngredients(
      'Matricaria recutita extract, water, glycerin',
    );
    const ids = result.map((m) => m.plantId);
    expect(ids).toContain('chamomile');
  });

  it('ne matche pas une sous-chaîne (thymol synthétique ne doit pas trouver thym)', () => {
    const result = detectNaturalIngredients('thymol synthétique, eau');
    const ids = result.map((m) => m.plantId);
    expect(ids).not.toContain('thyme');
  });
});
