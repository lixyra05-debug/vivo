/**
 * Lot H — une ligne d'historique ouvre la fiche de son type.
 *
 * Tant que l'historique était illisible, l'erreur ne se voyait pas : une ligne
 * ouvrait `/product/{code}` sans type, donc la fiche ALIMENTAIRE, même pour un
 * cosmétique. L'historique et les favoris passent désormais `?type=`.
 */
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import HistoryScreen from '../(tabs)/history';
import FavoritesScreen from '../(tabs)/favorites';
import type { ScanHistoryRow } from '@/src/lib/stores/useProductStore';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
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

jest.mock('@/src/components/ui/FadeIn', () => ({
  FadeIn: ({ children }: { children: ReactNode }) => children,
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: null }) => unknown) => selector({ profile: null }),
}));


/** Telles que les rend la lecture en deux temps : le cosmétique n'a pas de fiche `products`. */
function row(barcode: string, productType: 'food' | 'cosmetic'): ScanHistoryRow {
  return {
    id: barcode,
    user_id: 'user-1',
    barcode,
    score_at_scan: productType === 'food' ? 64 : 72,
    profile_used: 'standard',
    penalties_snapshot: [],
    is_favorite: true,
    scanned_at: '2026-10-30T10:00:00Z',
    product_type: productType,
    product: null,
  };
}

const mockRows: ScanHistoryRow[] = [row('3017620422003', 'food'), row('3401520107313', 'cosmetic')];

jest.mock('@/src/lib/stores/useProductStore', () => ({
  ...jest.requireActual('@/src/lib/stores/useProductStore'),
  useScanHistory: () => ({ data: mockRows, isLoading: false, isRefetching: false, refetch: jest.fn() }),
  useToggleFavorite: () => ({ mutate: jest.fn() }),
}));

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Lot H — une ligne ouvre la fiche de son type', () => {
  beforeEach(() => mockPush.mockClear());

  it.each([
    ['72', '/product/3401520107313?type=cosmetic'],
    ['64', '/product/3017620422003?type=food'],
  ])('historique : la ligne notée %s ouvre %s', (score, route) => {
    const { getByLabelText } = renderWithClient(<HistoryScreen />);
    // Le libellé de la CARTE (le cercle de note porte aussi « Score … sur 100 »).
    fireEvent.press(getByLabelText(new RegExp(`^Produit inconnu\\. Score ${score} sur 100`)));
    expect(mockPush).toHaveBeenCalledWith(route);
  });

  it('favoris : un cosmétique ouvre la fiche cosmétique', () => {
    const { getByLabelText } = renderWithClient(<FavoritesScreen />);
    fireEvent.press(getByLabelText(/^Produit inconnu\. Score 72 sur 100/));
    expect(mockPush).toHaveBeenCalledWith('/product/3401520107313?type=cosmetic');
  });
});
