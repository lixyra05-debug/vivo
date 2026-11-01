/**
 * Lot H — une lecture en erreur ne s'affiche jamais comme un historique vide.
 *
 * La jointure refusée par PostgREST (PGRST200) laissait `data` vide :
 * l'historique disait « Aucun scan pour le moment », et son sous-titre « Tes 0
 * derniers scans ». Les textes sont recopiés en clair : changer la formulation
 * doit faire tomber ce test.
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

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: null }) => unknown) => selector({ profile: null }),
}));

const mockRefetch = jest.fn();
/** Lecture refusée par défaut : ni données, ni chargement en cours. */
const REFUSED = { data: undefined as ScanHistoryRow[] | undefined, isLoading: false, isError: true };
let mockQuery = REFUSED;
jest.mock('@/src/lib/stores/useProductStore', () => ({
  ...jest.requireActual('@/src/lib/stores/useProductStore'),
  useScanHistory: () => ({
    ...mockQuery,
    error: mockQuery.isError ? new Error('PGRST200') : null,
    isRefetching: false,
    refetch: mockRefetch,
  }),
  useToggleFavorite: () => ({ mutate: jest.fn() }),
}));

const CACHED_ROW: ScanHistoryRow = {
  id: 'r1',
  user_id: 'user-1',
  barcode: '3017620422003',
  score_at_scan: 64,
  profile_used: 'standard',
  penalties_snapshot: [],
  is_favorite: true,
  scanned_at: '2026-10-30T10:00:00Z',
  product_type: 'food',
  product: null,
};

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Lot H — lecture en erreur ≠ historique vide', () => {
  beforeEach(() => mockRefetch.mockClear());
  afterEach(() => {
    mockQuery = REFUSED;
  });

  it('historique : « Impossible de charger tes scans » et « Réessayer », jamais « Aucun scan » ni « 0 scan »', () => {
    const { getByText, queryByText, getByLabelText } = renderWithClient(<HistoryScreen />);
    expect(getByText('Impossible de charger tes scans')).toBeTruthy();
    expect(queryByText('Aucun scan pour le moment')).toBeNull();
    expect(queryByText(/\b0 derniers scans|\(0\)/)).toBeNull();
    fireEvent.press(getByLabelText('Réessayer'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('favoris : « Impossible de charger tes scans », jamais « Aucun favori »', () => {
    const { getByText, queryByText, getByLabelText } = renderWithClient(<FavoritesScreen />);
    expect(getByText('Impossible de charger tes scans')).toBeTruthy();
    expect(queryByText('Aucun favori pour l’instant')).toBeNull();
    expect(queryByText("Aucun favori pour l'instant")).toBeNull();
    fireEvent.press(getByLabelText('Réessayer'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('historique en cours de chargement : aucun « 0 scan » dans le sous-titre', () => {
    mockQuery = { data: undefined, isLoading: true, isError: false };
    const { getByText, queryByText } = renderWithClient(<HistoryScreen />);
    expect(getByText('Tes derniers scans')).toBeTruthy();
    expect(queryByText(/\b0 derniers scans|\(0\)/)).toBeNull();
  });

  it('une relecture en erreur garde la liste déjà chargée', () => {
    mockQuery = { data: [CACHED_ROW], isLoading: false, isError: true };
    const { getByLabelText, queryByText } = renderWithClient(<HistoryScreen />);
    expect(getByLabelText(/^Produit inconnu\. Score 64 sur 100/)).toBeTruthy();
    expect(queryByText('Impossible de charger tes scans')).toBeNull();
  });
});
