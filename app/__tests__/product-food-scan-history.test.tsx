/**
 * Lot H — garde : un scan alimentaire entre dans l'historique, une fois, en
 * `food`, à la note du moteur.
 *
 * Le prédicat de S3-3 (un cosmétique non évalué n'est pas enregistré) vit dans
 * l'écran cosmétique seulement ; ce test fige l'autre moitié, que rien ne
 * couvrait : la route alimentaire, elle, enregistre.
 *
 * Couches traversées : rendu réel de l'écran produit (route alimentaire) →
 * `normalizeOFFProduct` → `calculateScore` → `composeScore` → effet
 * d'enregistrement. Couches NON traversées : Supabase et Open Food Facts
 * (`getOrFetchProduct`, `useRecordScan`, badges et favoris sont simulés).
 */
import { act, cleanupAsync, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import ProductScreen from '@/app/product/[barcode]';
import { normalizeOFFProduct, productToScoringInput, type OFFProduct } from '@/src/lib/api/openfoodfacts';
import { calculateScore } from '@/src/lib/scoring/engine';
import { composeScore } from '@/src/lib/scoring/composite-score';
import { scanProductRoute } from '@/src/lib/stores/useProductStore';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
  };
});

jest.mock('@/src/components/ui/FadeIn', () => ({
  FadeIn: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/src/components/ui/Skeleton', () => ({ Skeleton: () => null }));

// Recommandations en ligne : hors de l'objet de ce test.
jest.mock('@/src/components/premium/AlternativesSection', () => ({
  AlternativesSection: () => null,
}));
jest.mock('@/src/lib/api/use-alternatives', () => ({
  useAlternatives: () => ({ alternatives: [], isLoading: false }),
}));

/** Un scan : la caméra ouvre la fiche avec le seul type. */
const SCANNED = { barcode: '3274080005003', type: 'food' };
let mockParams: Record<string, string> = SCANNED;
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

/** Les paramètres que la fiche reçoit d'une route `/product/{code}?…`. */
function paramsFrom(route: string): Record<string, string> {
  const [path, query = ''] = route.split('?');
  const params: Record<string, string> = { barcode: path.slice('/product/'.length) };
  for (const pair of query.split('&')) {
    const [key, value = ''] = pair.split('=');
    if (key) params[key] = value;
  }
  return params;
}

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: null }) => unknown) => selector({ profile: null }),
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

jest.mock('@/src/lib/stores/useBadges', () => ({
  useUserBadges: () => ({ data: [] }),
  useUserReportCount: () => ({ data: 0 }),
  useGrantBadges: () => ({ mutate: jest.fn() }),
}));

// L'effet « favori » interroge Supabase directement : aucune ligne.
jest.mock('@/src/lib/api/supabase', () => {
  const chain: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'limit']) chain[method] = () => chain;
  chain.maybeSingle = () => Promise.resolve({ data: null, error: null });
  return { supabase: { from: () => chain } };
});

const mockMutate = jest.fn();
jest.mock('@/src/lib/stores/useProductStore', () => ({
  ...jest.requireActual('@/src/lib/stores/useProductStore'),
  useRecordScan: () => ({ mutate: mockMutate }),
  useScanHistory: () => ({ data: undefined, refetch: jest.fn() }),
  useToggleFavorite: () => ({ mutateAsync: jest.fn() }),
}));

/**
 * Fiche OFF réduite à ce que la note lit (sans marque : pas d'appel Wikidata).
 * Une eau de source : formulation haute, que l'emballage PET abaisse.
 */
const mockEau: OFFProduct = {
  code: '3274080005003',
  product_name: 'Eau de source',
  ingredients_text: 'eau de source',
  nova_group: 1,
  nutriments: {
    'energy-kcal_100g': 0,
    sugars_100g: 0,
    'saturated-fat_100g': 0,
    salt_100g: 0,
    proteins_100g: 0,
    fiber_100g: 0,
  },
};

/** Une bouteille PET au contact : la note composée s'écarte de la formulation. */
const mockPackagings = [
  { material: 'en:pet-1-polyethylene-terephthalate', shape: 'en:bottle', food_contact: 1 },
];

jest.mock('@/src/lib/api/openfoodfacts', () => {
  const actual = jest.requireActual<typeof import('@/src/lib/api/openfoodfacts')>(
    '@/src/lib/api/openfoodfacts',
  );
  return {
    ...actual,
    getOrFetchProduct: async () => actual.normalizeOFFProduct(mockEau),
    fetchProductCategoriesTags: async () => [],
    fetchProductPackagings: async () => mockPackagings,
  };
});

let client: QueryClient;

function rendreFiche() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <ProductScreen />
    </QueryClientProvider>,
  );
}

describe('Lot H — fiche alimentaire : le scan entre dans l’historique', () => {
  afterEach(async () => {
    await cleanupAsync();
    client.clear();
    mockMutate.mockClear();
    mockParams = SCANNED;
  });

  it('un seul enregistrement, de type food, à la note composée (formulation et emballage)', async () => {
    const produit = normalizeOFFProduct(mockEau);
    const composee = composeScore(
      calculateScore(productToScoringInput(produit), { type: 'standard', allergies: [], intolerances: [] }),
      mockPackagings,
    );
    // Le test ne distingue la note enregistrée de la formulation que si elles diffèrent.
    expect(composee.score_final).not.toBe(composee.formulationScore);
    const attendu = composee.score_final;
    rendreFiche();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        barcode: '3274080005003',
        productType: 'food',
        score: attendu,
        profile: 'standard',
      }),
      expect.anything(),
    );
  });

  it('rouverte depuis l’historique (scanProductRoute) : la fiche s’affiche, aucun nouveau scan', async () => {
    mockParams = paramsFrom(scanProductRoute({ barcode: '3274080005003', product_type: 'food' }));
    const { findByText } = rendreFiche();
    expect(await findByText('Eau de source')).toBeTruthy();
    await act(async () => {});
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
