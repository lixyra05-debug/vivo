import { render } from '@testing-library/react-native';
import { FoodProductView } from '../FoodProductView';
import type { Product, ScoringResult } from '@/src/lib/api/types';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('@/src/components/premium/AlternativesSection', () => ({
  AlternativesSection: () => null,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/src/lib/hooks/usePremium', () => ({
  usePremium: () => ({
    tier: 'free',
    isPremium: false,
    isExpert: false,
    isLoading: false,
    canAccess: () => false,
  }),
}));

jest.mock('@/src/lib/api/use-alternatives', () => ({
  useAlternatives: () => ({ alternatives: [], isLoading: false }),
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) =>
    selector({ user: null }),
}));

const baseProduct: Product = {
  barcode: '3017620422003',
  name: 'Biscuits au chocolat',
  brand: 'Marque test',
  image_url: null,
  ingredients_raw: 'farine de blé, sucre, beurre',
  additives_tags: [],
  nova_group: 4,
  nutriscore_grade: null,
  energy_kcal_100g: 480,
  sugars_100g: 30,
  saturated_fat_100g: 12,
  salt_100g: 0.6,
  proteins_100g: 6,
  fiber_100g: 2,
  oil_types: [],
  portion_grams: 100,
  packaging_material: null,
  is_organic: false,
  off_last_updated: null,
  our_score: null,
  our_score_computed_at: null,
  scan_count: 0,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
};

const baseResult: ScoringResult = {
  score_final: 72,
  score_color: 'yellow',
  nova_group: 4,
  penalties: [],
  blockers: [],
  seed_oils_detected: [],
  clean_labeling_alerts: [],
  profile_adjustments: [],
};

describe('FoodProductView', () => {
  it('rend sans crash et affiche le lien de méthodologie', () => {
    const { getByText } = render(
      <FoodProductView
        product={baseProduct}
        result={baseResult}
        educationalCards={[]}
        categoriesTags={[]}
        packagingTags={[]}
        isPremium={false}
        onUnlockPremium={() => undefined}
        onPressAlternative={() => undefined}
        onPressMethodology={() => undefined}
      />,
    );
    expect(getByText('Comment ce score est calculé ? →')).toBeTruthy();
  });

  it('n\'affiche plus le bouton "Voir les alternatives" (CTA supprimé)', () => {
    const { queryByText } = render(
      <FoodProductView
        product={baseProduct}
        result={{ ...baseResult, score_final: 35 }}
        educationalCards={[]}
        categoriesTags={[]}
        packagingTags={[]}
        isPremium={false}
        onUnlockPremium={() => undefined}
        onPressAlternative={() => undefined}
        onPressMethodology={() => undefined}
      />,
    );
    expect(queryByText('Voir les alternatives')).toBeNull();
  });
});
