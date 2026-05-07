/**
 * Écran Stats avancées : free → paywall, premium → contenu rendu.
 */

import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import AdvancedStatsScreen from '../stats/index';

// ─── Mocks paramétrables ────────────────────────────────────────────────────

let mockTier: 'free' | 'premium' | 'expert' = 'premium';
let mockScans: Array<{
  barcode: string;
  score_at_scan: number;
  scanned_at: string;
  product_type: 'food' | 'cosmetic';
  is_favorite: boolean;
  product: unknown;
}> = [];

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

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'uid-1' } }),
}));

jest.mock('@/src/lib/hooks/usePremium', () => ({
  usePremium: () => ({
    tier: mockTier,
    isPremium: mockTier !== 'free',
    isExpert: mockTier === 'expert',
    isLoading: false,
    canAccess: () => mockTier !== 'free',
  }),
}));

jest.mock('@/src/lib/stores/useProductStore', () => ({
  useScanHistory: () => ({
    data: mockScans,
    isLoading: false,
    error: null,
  }),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('AdvancedStatsScreen', () => {
  beforeEach(() => {
    mockTier = 'premium';
    mockScans = [];
  });

  it("Free : rend le PremiumPaywall", () => {
    mockTier = 'free';
    const { getByText, queryByText } = render(
      <Wrapper>
        <AdvancedStatsScreen />
      </Wrapper>,
    );
    // Header reste affiché
    expect(getByText('Statistiques avancées')).toBeTruthy();
    // Aucune section data n'apparaît
    expect(queryByText('Tendance 28 jours')).toBeNull();
    expect(queryByText('Distribution des scores')).toBeNull();
  });

  it('Premium sans scans : affiche le state vide', () => {
    mockTier = 'premium';
    mockScans = [];
    const { getByText, queryByText } = render(
      <Wrapper>
        <AdvancedStatsScreen />
      </Wrapper>,
    );
    expect(getByText('Aucune donnée à analyser')).toBeTruthy();
    expect(queryByText('Tendance 28 jours')).toBeNull();
  });

  it('Premium avec scans : rend les sections principales', () => {
    mockTier = 'premium';
    mockScans = [
      {
        barcode: '123',
        score_at_scan: 80,
        scanned_at: new Date().toISOString(),
        product_type: 'food',
        is_favorite: false,
        product: null,
      },
      {
        barcode: '456',
        score_at_scan: 60,
        scanned_at: new Date().toISOString(),
        product_type: 'food',
        is_favorite: false,
        product: null,
      },
    ];
    const { getByText } = render(
      <Wrapper>
        <AdvancedStatsScreen />
      </Wrapper>,
    );
    expect(getByText('Tendance 28 jours')).toBeTruthy();
    expect(getByText('Distribution des scores')).toBeTruthy();
    expect(getByText('Top 5 catégories')).toBeTruthy();
    expect(getByText('Top 5 marques')).toBeTruthy();
    expect(getByText('Régularité')).toBeTruthy();
  });
});
