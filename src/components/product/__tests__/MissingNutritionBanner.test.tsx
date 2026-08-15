/**
 * BLOQUANT 4 — FACE 2, le bandeau. Trois exigences :
 *  - il APPARAÎT quand des macros pénalisables sont absentes ;
 *  - il DISPARAÎT quand la liste est vide (un bandeau permanent ne dit rien) ;
 *  - son copy est un constat sur la SOURCE, jamais un jugement sur le
 *    produit (R5 — aucun terme prescriptif ni rassurant).
 *
 * Bloc « ancres audit » (amendement 1) : les eaux passées de 30 à 100 par la
 * face 1 y arrivent par ABSENCE de pénalité, pas par qualité mesurée — le
 * bandeau doit couvrir chacune d'elles. Un 100 nu sur une eau sans macros
 * serait le 30 nu d'avant, retourné.
 */
import { render } from '@testing-library/react-native';
import { MissingNutritionBanner } from '../MissingNutritionBanner';
import type { Product } from '@/src/lib/api/types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '0000000000001',
    name: 'Produit test',
    brand: 'Test',
    image_url: null,
    ingredients_raw: 'Eau minérale naturelle',
    additives_tags: [],
    nova_group: null,
    nutriscore_grade: null,
    energy_kcal_100g: null,
    sugars_100g: null,
    saturated_fat_100g: null,
    salt_100g: null,
    proteins_100g: null,
    fiber_100g: null,
    oil_types: [],
    portion_grams: null,
    packaging_material: null,
    is_organic: false,
    off_last_updated: null,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

describe('MissingNutritionBanner', () => {
  it('apparaît quand des macros sont absentes — copy exacte, constat sur la source', () => {
    const { getByText } = render(
      <MissingNutritionBanner
        product={makeProduct({ sugars_100g: null, saturated_fat_100g: 0, salt_100g: null })}
      />,
    );
    getByText('Données incomplètes : sucres, sel non renseignés par la source');
  });

  it('accorde le singulier quand seul le sel manque', () => {
    const { getByText } = render(
      <MissingNutritionBanner
        product={makeProduct({ sugars_100g: 0, saturated_fat_100g: 0, salt_100g: null })}
      />,
    );
    getByText('Données incomplètes : sel non renseigné par la source');
  });

  it('DISPARAÎT quand toutes les macros sont présentes — même à zéro', () => {
    const { toJSON } = render(
      <MissingNutritionBanner
        product={makeProduct({ sugars_100g: 0, saturated_fat_100g: 0, salt_100g: 0 })}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it("ne juge jamais le produit : aucun terme prescriptif ou rassurant (R5)", () => {
    const { toJSON } = render(
      <MissingNutritionBanner product={makeProduct({ sugars_100g: null })} />,
    );
    const rendered = JSON.stringify(toJSON());
    expect(rendered).not.toMatch(
      /bon|mauvais|sain|éviter|danger|rassur|excellent|privilégi|recommand/i,
    );
  });
});

describe('ancres audit — les eaux passées à 100 par la face 1 sont couvertes', () => {
  const ANCHORS: Array<[string, Partial<Product>]> = [
    ['Perrier (nova absent, macros absentes)', { ingredients_raw: 'Eau minérale naturelle gazeuse' }],
    ['Contrex (nova absent, macros absentes)', {}],
    ['Vittel (nova absent, macros absentes)', {}],
    ['Sidi Ali fiche nova-absente', {}],
    ['Sidi Ali jumeau (nova=1, macros absentes)', { nova_group: 1 }],
  ];

  it.each(ANCHORS)('%s : le bandeau accompagne le 100', (_name, overrides) => {
    const { getByText } = render(<MissingNutritionBanner product={makeProduct(overrides)} />);
    getByText('Données incomplètes : sucres, gras saturés, sel non renseignés par la source');
  });
});
