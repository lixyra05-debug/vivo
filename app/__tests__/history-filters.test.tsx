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

function makeRow(overrides: Partial<ScanHistoryRow>): ScanHistoryRow {
  return {
    id: overrides.id ?? 'row-default',
    user_id: 'user-1',
    barcode: overrides.barcode ?? '0000',
    score_at_scan: overrides.score_at_scan ?? 50,
    profile_used: 'standard',
    penalties_snapshot: [],
    is_favorite: false,
    scanned_at: '2026-04-25T10:00:00Z',
    product: {
      barcode: overrides.barcode ?? '0000',
      name: overrides.product?.name ?? 'Produit',
      brand: overrides.product?.brand ?? 'Marque',
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
  makeRow({ id: 'r1', barcode: '111', score_at_scan: 92, product: { name: 'Excellent A' } as never }),
  makeRow({ id: 'r2', barcode: '222', score_at_scan: 85, product: { name: 'Excellent B' } as never }),
  makeRow({ id: 'r3', barcode: '333', score_at_scan: 50, product: { name: 'Moyen' } as never }),
  makeRow({ id: 'r4', barcode: '444', score_at_scan: 20, product: { name: 'Mauvais X' } as never }),
  makeRow({ id: 'r5', barcode: '555', score_at_scan: 10, product: { name: 'Mauvais Y' } as never }),
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

describe('HistoryScreen filtres rapides', () => {
  it('affiche tous les scans avec le filtre "Tous" actif par défaut', () => {
    const { getByLabelText, queryByLabelText, queryByText } = render(
      <Wrapper>
        <HistoryScreen />
      </Wrapper>,
    );
    expect(getByLabelText(/Excellent A/)).toBeTruthy();
    expect(queryByLabelText(/Mauvais X/)).toBeTruthy();
    expect(queryByText('Aucun scan dans ce filtre')).toBeNull();
  });

  it('le chip "À éviter" affiche son compteur (2)', () => {
    const { getByText } = render(
      <Wrapper>
        <HistoryScreen />
      </Wrapper>,
    );
    expect(getByText('À éviter (2)')).toBeTruthy();
    expect(getByText('Excellents (2)')).toBeTruthy();
  });

  it('tap sur le chip "À éviter" filtre la liste aux scans <30', () => {
    const { getByLabelText, queryByLabelText } = render(
      <Wrapper>
        <HistoryScreen />
      </Wrapper>,
    );
    fireEvent.press(getByLabelText('À éviter (2)'));
    expect(queryByLabelText(/Mauvais X/)).toBeTruthy();
    expect(queryByLabelText(/Mauvais Y/)).toBeTruthy();
    expect(queryByLabelText(/Excellent A/)).toBeNull();
    expect(queryByLabelText(/^Moyen,/)).toBeNull();
  });

  it('affiche le bandeau insight avec les pourcentages', () => {
    const { getByText } = render(
      <Wrapper>
        <HistoryScreen />
      </Wrapper>,
    );
    // 5 rows : 2 excellents (40%), 2 à éviter (40%)
    expect(getByText(/Sur tes 5 derniers scans/)).toBeTruthy();
    expect(getByText(/40/)).toBeTruthy();
  });
});
