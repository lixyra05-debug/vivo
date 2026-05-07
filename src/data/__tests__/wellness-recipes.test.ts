import { PLANT_ENCYCLOPEDIA } from '../plant-encyclopedia';
import { WELLNESS_RECIPES } from '../wellness-recipes';

describe('wellness-recipes — catalogue de recettes', () => {
  it('contient au moins 30 recettes', () => {
    expect(WELLNESS_RECIPES.length).toBeGreaterThanOrEqual(30);
  });

  it('chaque plantId référence une plante existante dans PLANT_ENCYCLOPEDIA', () => {
    const validIds = new Set(PLANT_ENCYCLOPEDIA.map((p) => p.id));
    for (const recipe of WELLNESS_RECIPES) {
      for (const plantId of recipe.plantIds) {
        expect(validIds.has(plantId)).toBe(true);
      }
    }
  });

  it("aucun champ vide ou invalide (id, titleFr, emoji, ingredients, preparationFr, timingFr, benefitsFr, durationMinutes)", () => {
    for (const recipe of WELLNESS_RECIPES) {
      expect(recipe.id.length).toBeGreaterThan(0);
      expect(recipe.titleFr.length).toBeGreaterThan(0);
      expect(recipe.emoji.length).toBeGreaterThan(0);
      expect(Array.isArray(recipe.ingredientsFr)).toBe(true);
      expect(recipe.ingredientsFr.length).toBeGreaterThan(0);
      for (const ingredient of recipe.ingredientsFr) {
        expect(ingredient.length).toBeGreaterThan(0);
      }
      expect(recipe.preparationFr.length).toBeGreaterThan(0);
      expect(recipe.timingFr.length).toBeGreaterThan(0);
      expect(recipe.benefitsFr.length).toBeGreaterThan(0);
      expect(recipe.durationMinutes).toBeGreaterThan(0);
      expect(Array.isArray(recipe.plantIds)).toBe(true);
      expect(recipe.plantIds.length).toBeGreaterThan(0);
    }
  });

  it('garde-fou R5 : aucun preparationFr/benefitsFr/timingFr ne contient de claim thérapeutique', () => {
    const banned = /(?<!dis)\bsoigne\b|guérit|guerit|\btraite\b|remplace|\bmédicament\b/i;
    for (const recipe of WELLNESS_RECIPES) {
      expect(recipe.preparationFr).not.toMatch(banned);
      expect(recipe.benefitsFr).not.toMatch(banned);
      expect(recipe.timingFr).not.toMatch(banned);
    }
  });
});
