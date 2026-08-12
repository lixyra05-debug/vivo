import { render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import HerbariumScreen from '../index';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
  };
});

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('@/src/lib/hooks/usePremium', () => ({
  usePremium: () => ({
    tier: 'expert',
    isPremium: true,
    isExpert: true,
    isLoading: false,
    canAccess: () => true,
  }),
}));

jest.mock('@/src/lib/herbarium/herbarium-store', () => ({
  getHerbarium: jest.fn(() => Promise.resolve([])),
  removeFromHerbarium: jest.fn(() => Promise.resolve([])),
  updateNote: jest.fn(() => Promise.resolve([])),
  isInHerbarium: jest.fn(() => Promise.resolve(false)),
}));

describe('HerbariumScreen', () => {
  it('rend le titre et le message empty state quand l\'herbier est vide', async () => {
    const { getByText } = render(<HerbariumScreen />);
    expect(getByText('Mon Herbier')).toBeTruthy();
    expect(getByText('Tes plantes favorites')).toBeTruthy();
    await waitFor(() => {
      expect(getByText(/votre herbier est vide/i)).toBeTruthy();
    });
    expect(getByText("Voir l'encyclopédie")).toBeTruthy();
  });
});
