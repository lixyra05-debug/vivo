import type { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import RecipesIndex from '../index';

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

describe('RecipesIndexScreen', () => {
  it("rend l'écran Recettes avec le titre et le sous-titre", () => {
    const { getByText } = render(<RecipesIndex />);
    expect(getByText(/Recettes Bien-être/i)).toBeTruthy();
    expect(getByText(/30 préparations/i)).toBeTruthy();
  });
});
