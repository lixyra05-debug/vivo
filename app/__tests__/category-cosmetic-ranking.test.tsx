/**
 * S3-3, option catégorie — dans le classement d'une catégorie cosmétique, un
 * produit dont aucun ingrédient n'a été évalué ferme la marche, sans cercle de
 * score : son 100 vient de ce que le moteur n'a rien reconnu, pas d'une mesure.
 * Avant, ce 100 le hissait en tête du « Top des meilleurs produits ».
 *
 * Couches traversées : rendu réel de l'écran catégorie → `normalizeOBFProduct`
 * → `calculateCosmeticScore` → statut S3-3 → tri → `CategoryRankCard`.
 * Couches NON traversées : le réseau (`searchByCategory` et `getOrFetchCosmetic`
 * mockés), l'animation (`FadeIn`, `Skeleton` neutralisés).
 */
import { cleanupAsync, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import CategoryScreen from '@/app/category/[slug]';
import { cosmeticToScoringInput, normalizeOBFProduct } from '@/src/lib/api/openbeautyfacts';
import { calculateCosmeticScore } from '@/src/lib/scoring/cosmetic-engine';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
  };
});

// L'animation n'est pas l'objet de ce test (cf. explore.test.tsx).
jest.mock('@/src/components/ui/FadeIn', () => ({
  FadeIn: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/src/components/ui/Skeleton', () => ({ Skeleton: () => null }));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'shampoings' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: null }) => unknown) => selector({ profile: null }),
}));

// [code-barres, nom, texte INCI] — les non-évalués d'abord, comme OBF peut les rendre.
const mockCatalogue: ReadonlyArray<[string, string, string]> = [
  ['1111111111111', 'Shampoing sans liste', ''],
  ['2222222222222', 'Shampoing aux noms inconnus', 'AQUA (WATER), PARFUM (FRAGRANCE)'],
  ['3333333333333', 'Shampoing parabène', 'Aqua, Methylparaben'],
  ['4444444444444', 'Shampoing doux', 'Aqua, Glycerin'],
];

jest.mock('@/src/lib/api/search', () => ({
  ...jest.requireActual('@/src/lib/api/search'),
  searchByCategory: async () =>
    mockCatalogue.map(([barcode, name]) => ({
      barcode,
      name,
      brand: null,
      image_url: null,
      type: 'cosmetic',
    })),
}));

jest.mock('@/src/lib/api/openbeautyfacts', () => {
  const actual = jest.requireActual<typeof import('@/src/lib/api/openbeautyfacts')>(
    '@/src/lib/api/openbeautyfacts',
  );
  return {
    ...actual,
    getOrFetchCosmetic: async (barcode: string) => {
      const entry = mockCatalogue.find(([code]) => code === barcode);
      return entry
        ? actual.normalizeOBFProduct({
            code: barcode,
            product_name: entry[1],
            ingredients_text: entry[2],
          })
        : null;
    },
  };
});

function note(inci: string): number {
  const produit = normalizeOBFProduct({ code: '0000000000000', ingredients_text: inci });
  return calculateCosmeticScore(cosmeticToScoringInput(produit), 'standard').score_final;
}

// Démonter d'abord (asynchrone dans RNTL), PUIS vider le cache (cf.
// product-cosmetic-scan-history.test.tsx).
let client: QueryClient;

afterEach(async () => {
  await cleanupAsync();
  client.clear();
});

describe('S3-3 — catégorie cosmétique : un produit non évalué ferme la marche', () => {
  it('les produits évalués d’abord, par note ; les non-évalués ensuite, sans note', async () => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const { findAllByRole } = render(
      <QueryClientProvider client={client}>
        <CategoryScreen />
      </QueryClientProvider>,
    );
    const rangs = await findAllByRole('button', { name: /^Rang / });
    expect(rangs.map((r) => r.props.accessibilityLabel)).toEqual([
      `Rang 1, Shampoing doux, score ${note('Aqua, Glycerin')} sur 100`,
      `Rang 2, Shampoing parabène, score ${note('Aqua, Methylparaben')} sur 100`,
      'Rang 3, Shampoing sans liste, non évalué',
      'Rang 4, Shampoing aux noms inconnus, non évalué',
    ]);
  });
});
