/**
 * S3-3, option historique — un cosmétique dont aucun ingrédient n'a été évalué
 * n'entre pas dans `scan_history`.
 *
 * `score_at_scan` est `INTEGER NOT NULL` : il n'y a pas de « pas de note » à
 * écrire. Enregistrer ce scan, c'est y inscrire le 100 que le moteur rend faute
 * de pénalité relevée — et ce 100 nourrit ensuite l'historique, les moyennes,
 * les « excellents », les badges, le récap mensuel et l'export PDF.
 *
 * Couches traversées : rendu réel de l'écran produit (route cosmétique) →
 * `normalizeOBFProduct` → `calculateCosmeticScore` → statut S3-3.
 * Couches NON traversées : Supabase (`getOrFetchCosmetic` et `useRecordScan`
 * sont mockés), l'animation (`FadeIn`, `Skeleton` neutralisés).
 */
import { act, cleanupAsync, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import ProductScreen from '@/app/product/[barcode]';
import { cosmeticToScoringInput, normalizeOBFProduct } from '@/src/lib/api/openbeautyfacts';
import { calculateCosmeticScore } from '@/src/lib/scoring/cosmetic-engine';
import { scanProductRoute } from '@/src/lib/stores/useProductStore';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

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

const SCANNED = { barcode: '3401520107313', type: 'cosmetic' };
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

const mockMutate = jest.fn();
jest.mock('@/src/lib/stores/useProductStore', () => ({
  ...jest.requireActual('@/src/lib/stores/useProductStore'),
  useRecordScan: () => ({ mutate: mockMutate }),
}));

let mockInci: string | undefined;
jest.mock('@/src/lib/api/openbeautyfacts', () => {
  const actual = jest.requireActual<typeof import('@/src/lib/api/openbeautyfacts')>(
    '@/src/lib/api/openbeautyfacts',
  );
  return {
    ...actual,
    getOrFetchCosmetic: async (barcode: string) =>
      actual.normalizeOBFProduct({
        code: barcode,
        product_name: 'Crème hydratante',
        ingredients_text: mockInci,
      }),
    fetchCosmeticPackagings: async () => [],
  };
});

// La requête cosmétique fixe son propre `gcTime` (7 jours). Démonter d'abord
// (le démontage de RNTL est asynchrone), PUIS vider le cache : dans l'autre
// ordre, un minuteur de ramasse-miettes de 7 jours survit et garde Jest en vie.
let client: QueryClient;

function rendreFiche() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <ProductScreen />
    </QueryClientProvider>,
  );
}

describe('S3-3 — fiche cosmétique : seul ce qui a été évalué entre dans l’historique', () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  afterEach(async () => {
    await cleanupAsync();
    client.clear();
    mockParams = SCANNED;
  });

  it.each([
    ['vide', ''],
    ['aux noms non reconnus', 'AQUA (WATER), PARFUM (FRAGRANCE)'],
  ])('liste %s : la fiche s’affiche, aucun scan n’est enregistré', async (_cas, inci) => {
    mockInci = inci;
    const { findByText } = rendreFiche();
    // L'écran est bien là — c'est l'écriture qui manque, pas la fiche.
    expect(await findByText('Vérification impossible')).toBeTruthy();
    await act(async () => {});
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('contrôle : liste évaluée → un scan, à la note du moteur', async () => {
    mockInci = 'Aqua, Glycerin, Sodium Laureth Sulfate';
    const produit = normalizeOBFProduct({ code: '3401520107313', ingredients_text: mockInci });
    const attendu = calculateCosmeticScore(cosmeticToScoringInput(produit), 'standard').score_final;
    rendreFiche();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        barcode: '3401520107313',
        score: attendu,
        productType: 'cosmetic',
      }),
    );
  });

  it('lot H — rouverte depuis l’historique (scanProductRoute) : liste évaluée, aucun nouveau scan', async () => {
    mockInci = 'Aqua, Glycerin, Sodium Laureth Sulfate';
    mockParams = paramsFrom(scanProductRoute({ barcode: '3401520107313', product_type: 'cosmetic' }));
    const { findByText } = rendreFiche();
    expect(await findByText('Crème hydratante')).toBeTruthy();
    await act(async () => {});
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
