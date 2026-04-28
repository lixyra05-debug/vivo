import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import HistoryScreen from '../(tabs)/history';
import type { ScanHistoryRow } from '@/src/lib/stores/useProductStore';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
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

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: null }) => unknown) =>
    selector({ profile: null }),
}));

function makeRow(
  id: string,
  barcode: string,
  productType: 'food' | 'cosmetic',
  name: string,
): ScanHistoryRow {
  return {
    id,
    user_id: 'user-1',
    barcode,
    score_at_scan: 65,
    profile_used: 'standard',
    penalties_snapshot: [],
    is_favorite: false,
    scanned_at: '2026-04-25T10:00:00Z',
    product_type: productType,
    product: {
      barcode,
      name,
      brand: 'Marque',
      image_url: null,
      ingredients_raw: null,
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
      created_at: '2026-04-25T10:00:00Z',
      updated_at: '2026-04-25T10:00:00Z',
    },
  };
}

const mockRows: ScanHistoryRow[] = [
  makeRow('r1', '111', 'food', 'Yaourt nature'),
  makeRow('r2', '222', 'food', 'Pain complet'),
  makeRow('r3', '333', 'food', 'Pommes bio'),
  makeRow('r4', '444', 'cosmetic', 'Crème hydratante'),
  makeRow('r5', '555', 'cosmetic', 'Shampoing doux'),
];

jest.mock('@/src/lib/stores/useProductStore', () => {
  const actual = jest.requireActual('@/src/lib/stores/useProductStore');
  return {
    ...actual,
    useScanHistory: () => ({
      data: mockRows,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    }),
    useToggleFavorite: () => ({ mutate: jest.fn() }),
  };
});

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('HistoryScreen filtre par type de produit', () => {
  it('affiche les 5 scans (3 food + 2 cosmetic) par défaut sur Tous', () => {
    const { queryByLabelText } = render(
      <Wrapper>
        <HistoryScreen />
      </Wrapper>,
    );
    expect(queryByLabelText(/Yaourt nature/)).toBeTruthy();
    expect(queryByLabelText(/Pain complet/)).toBeTruthy();
    expect(queryByLabelText(/Pommes bio/)).toBeTruthy();
    expect(queryByLabelText(/Crème hydratante/)).toBeTruthy();
    expect(queryByLabelText(/Shampoing doux/)).toBeTruthy();
  });

  it("filtre uniquement les produits Alimentation quand l'onglet Alimentation est actif", () => {
    const { getByLabelText, queryByLabelText } = render(
      <Wrapper>
        <HistoryScreen />
      </Wrapper>,
    );
    fireEvent.press(getByLabelText(/Scans Alimentation/));
    expect(queryByLabelText(/Yaourt nature/)).toBeTruthy();
    expect(queryByLabelText(/Pain complet/)).toBeTruthy();
    expect(queryByLabelText(/Pommes bio/)).toBeTruthy();
    expect(queryByLabelText(/Crème hydratante/)).toBeNull();
    expect(queryByLabelText(/Shampoing doux/)).toBeNull();
  });

  it("filtre uniquement les produits Cosmétiques quand l'onglet Cosmétiques est actif", () => {
    const { getByLabelText, queryByLabelText } = render(
      <Wrapper>
        <HistoryScreen />
      </Wrapper>,
    );
    fireEvent.press(getByLabelText(/Scans Cosmétiques/));
    expect(queryByLabelText(/Yaourt nature/)).toBeNull();
    expect(queryByLabelText(/Pain complet/)).toBeNull();
    expect(queryByLabelText(/Pommes bio/)).toBeNull();
    expect(queryByLabelText(/Crème hydratante/)).toBeTruthy();
    expect(queryByLabelText(/Shampoing doux/)).toBeTruthy();
  });

  it('affiche les compteurs corrects sur les onglets (5 / 3 / 2)', () => {
    const { getByLabelText } = render(
      <Wrapper>
        <HistoryScreen />
      </Wrapper>,
    );
    expect(getByLabelText('Tous les scans (5)')).toBeTruthy();
    expect(getByLabelText('Scans Alimentation (3)')).toBeTruthy();
    expect(getByLabelText('Scans Cosmétiques (2)')).toBeTruthy();
  });
});
