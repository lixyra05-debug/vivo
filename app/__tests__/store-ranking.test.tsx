/**
 * Écran "Classement des supermarchés" : top 3 free + paywall ; full ranking si premium.
 */

import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import StoreRankingScreen from '../store-ranking';

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

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
}));

const mockCalcRanking = jest.fn();
jest.mock('@/src/lib/api/store-ranking', () => ({
  calculateStoreRanking: (...args: unknown[]) => mockCalcRanking(...args),
  clearStoreRankingCache: jest.fn(),
}));

const mockUsePremium = jest.fn();
jest.mock('@/src/lib/hooks/usePremium', () => ({
  usePremium: () => mockUsePremium(),
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'uid-1' } }),
}));

const sampleRanking = [
  { slug: 'carrefour', nameFr: 'Carrefour', emoji: '🟥', avgScore: 78, productCount: 42, color: 'green' as const },
  { slug: 'leclerc', nameFr: 'E.Leclerc', emoji: '🔵', avgScore: 70, productCount: 40, color: 'green' as const },
  { slug: 'auchan', nameFr: 'Auchan', emoji: '🟢', avgScore: 60, productCount: 38, color: 'yellow' as const },
  { slug: 'monoprix', nameFr: 'Monoprix', emoji: '🟤', avgScore: 55, productCount: 35, color: 'yellow' as const },
  { slug: 'lidl', nameFr: 'Lidl', emoji: '🔶', avgScore: 50, productCount: 30, color: 'yellow' as const },
];

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('StoreRankingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalcRanking.mockResolvedValue(sampleRanking);
  });

  it('Free : affiche les 3 premières enseignes + paywall', async () => {
    mockUsePremium.mockReturnValue({
      tier: 'free',
      isPremium: false,
      isExpert: false,
      isLoading: false,
      canAccess: () => false,
    });
    const { findByText, findByLabelText, queryByText } = render(
      <Wrapper>
        <StoreRankingScreen />
      </Wrapper>,
    );
    expect(await findByText('Carrefour')).toBeTruthy();
    expect(await findByText('E.Leclerc')).toBeTruthy();
    expect(await findByText('Auchan')).toBeTruthy();
    await waitFor(() => {
      expect(queryByText('Monoprix')).toBeNull();
      expect(queryByText('Lidl')).toBeNull();
    });
    expect(await findByLabelText(/Débloquer Premium/)).toBeTruthy();
  });

  it('Premium : affiche les 10 enseignes sans paywall', async () => {
    mockUsePremium.mockReturnValue({
      tier: 'premium',
      isPremium: true,
      isExpert: false,
      isLoading: false,
      canAccess: () => true,
    });
    const { findByText, queryByLabelText } = render(
      <Wrapper>
        <StoreRankingScreen />
      </Wrapper>,
    );
    expect(await findByText('Carrefour')).toBeTruthy();
    expect(await findByText('Monoprix')).toBeTruthy();
    expect(await findByText('Lidl')).toBeTruthy();
    expect(queryByLabelText(/Débloquer Premium/)).toBeNull();
  });
});
