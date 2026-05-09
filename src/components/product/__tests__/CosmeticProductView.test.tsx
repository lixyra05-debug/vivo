import { render } from '@testing-library/react-native';
import { CosmeticProductView } from '../CosmeticProductView';
import type {
  CosmeticProduct,
  CosmeticScoringResult,
} from '@/src/lib/api/types';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

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

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) =>
    selector({ user: null }),
}));

const baseProduct: CosmeticProduct = {
  barcode: '3401520107313',
  name: 'Crème hydratante',
  brand: 'Marque test',
  image_url: null,
  ingredients_inci: 'Aqua, Glycerin',
  ingredients_list: ['aqua', 'glycerin'],
  category: null,
  image_ingredients_url: null,
  obf_last_updated: null,
  our_score: null,
  our_score_computed_at: null,
  scan_count: 0,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
};

const baseResult: CosmeticScoringResult = {
  score_final: 80,
  score_color: 'green',
  penalties: [],
  blockers: [],
  risky_ingredients: [],
  profile_adjustments: [],
};

describe('CosmeticProductView', () => {
  it('rend sans crash et affiche le lien de méthodologie', () => {
    const { getByText } = render(
      <CosmeticProductView
        product={baseProduct}
        result={baseResult}
        confidence={null}
        compatibilityResult={null}
        educationalCards={[]}
        packagingTags={[]}
        onPressMethodology={() => undefined}
      />,
    );
    expect(getByText('Comment ce score est calculé ? →')).toBeTruthy();
  });
});
