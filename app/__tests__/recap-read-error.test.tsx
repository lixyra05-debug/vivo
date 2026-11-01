/**
 * Lot H — le récap mensuel ne présente pas une lecture en erreur comme un mois
 * sans scan (« Tu n'as pas encore scanné ce mois-ci ! », « 0 scans ce mois-ci »).
 */
import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import MonthlyRecapScreen from '../recap/monthly';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});
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
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ year: '2026', month: '8' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { session: { user: { id: string } } }) => unknown) =>
    selector({ session: { user: { id: 'user-1' } } }),
}));

let mockTier: 'free' | 'premium' = 'premium';
jest.mock('@/src/lib/premium/premium-gate', () => ({
  ...jest.requireActual('@/src/lib/premium/premium-gate'),
  usePremium: () => ({
    tier: mockTier,
    isPremium: mockTier !== 'free',
    isExpert: false,
    isLoading: false,
    canAccess: () => mockTier !== 'free',
  }),
}));

const mockRefetch = jest.fn();
jest.mock('@/src/lib/stats/use-monthly-recap', () => ({
  useMonthlyRecap: () => ({ recap: null, isLoading: false, isError: true, refetch: mockRefetch }),
}));

describe('Lot H — récap : lecture en erreur ≠ mois sans scan', () => {
  beforeEach(() => {
    mockTier = 'premium';
    mockRefetch.mockClear();
  });

  it('Premium : « Impossible de charger tes scans » et « Réessayer », jamais « pas encore scanné »', () => {
    const { getByText, queryByText, getByLabelText } = render(<MonthlyRecapScreen />);
    expect(getByText('Impossible de charger tes scans')).toBeTruthy();
    expect(queryByText("Tu n'as pas encore scanné ce mois-ci !")).toBeNull();
    fireEvent.press(getByLabelText('Réessayer'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('gratuit : l’aperçu flouté n’affiche pas « 0 » scan', () => {
    mockTier = 'free';
    const { getByText, queryByText } = render(<MonthlyRecapScreen />);
    expect(getByText('scans ce mois-ci')).toBeTruthy();
    expect(queryByText('0')).toBeNull();
  });
});
