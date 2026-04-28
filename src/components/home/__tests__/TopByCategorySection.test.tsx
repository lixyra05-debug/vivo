import { render } from '@testing-library/react-native';
import { TopByCategorySection } from '../TopByCategorySection';
import type { TopCategoryBlock } from '@/src/lib/api/top-by-category';
import type { CategoryDef, Product, ScoringResult, SearchResult } from '@/src/lib/api/types';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const boissons: CategoryDef = {
  slug: 'boissons',
  name: 'Boissons',
  emoji: '🥤',
  icon: 'Coffee',
  off_tag: 'beverages',
  obf_tag: null,
  type: 'food',
};

function makeResult(barcode: string, name: string): SearchResult {
  return {
    barcode,
    name,
    brand: 'Marque',
    image_url: null,
    type: 'food',
  };
}

function makeProduct(barcode: string): Product {
  const now = new Date().toISOString();
  return {
    barcode,
    name: barcode,
    brand: 'Marque',
    image_url: null,
    ingredients_raw: 'eau',
    additives_tags: [],
    nova_group: 1,
    nutriscore_grade: null,
    energy_kcal_100g: null,
    sugars_100g: 0,
    saturated_fat_100g: 0,
    salt_100g: 0,
    proteins_100g: 0,
    fiber_100g: 0,
    oil_types: [],
    portion_grams: 100,
    packaging_material: null,
    is_organic: false,
    off_last_updated: now,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: now,
    updated_at: now,
  };
}

const stubScoring: ScoringResult = {
  score_final: 80,
  score_color: 'green',
  nova_group: 1,
  penalties: [],
  blockers: [],
  seed_oils_detected: [],
  clean_labeling_alerts: [],
  profile_adjustments: [],
};

const populatedBlock: TopCategoryBlock = {
  category: boissons,
  items: [
    {
      result: makeResult('B-A', 'Eau minérale'),
      product: makeProduct('B-A'),
      scoring: stubScoring,
      score: 88,
    },
    {
      result: makeResult('B-B', 'Thé vert'),
      product: makeProduct('B-B'),
      scoring: stubScoring,
      score: 75,
    },
  ],
};

describe('TopByCategorySection', () => {
  it("affiche les skeletons quand isLoading=true même avec blocks=[]", () => {
    const { getByText, queryByText } = render(
      <TopByCategorySection blocks={[]} isLoading />,
    );
    // Le titre de la section reste visible
    expect(getByText('Top par catégorie')).toBeTruthy();
    // Aucun nom de produit réel n'apparaît
    expect(queryByText('Eau minérale')).toBeNull();
  });

  it('affiche le titre du bloc et les noms de produits quand blocks peuplés', () => {
    const { getByText } = render(
      <TopByCategorySection blocks={[populatedBlock]} isLoading={false} />,
    );
    expect(getByText('Top par catégorie')).toBeTruthy();
    // Le nom de la catégorie apparait
    expect(getByText('Boissons')).toBeTruthy();
    // Les noms produits apparaissent
    expect(getByText('Eau minérale')).toBeTruthy();
    expect(getByText('Thé vert')).toBeTruthy();
  });

  it("ne rend rien quand blocks est vide et isLoading=false", () => {
    const { queryByText } = render(
      <TopByCategorySection blocks={[]} isLoading={false} />,
    );
    expect(queryByText('Top par catégorie')).toBeNull();
  });
});
