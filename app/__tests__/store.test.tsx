import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import StoreScreen from '../store/[slug]';

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

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: jest.fn() }),
  useLocalSearchParams: () => ({ slug: 'carrefour' }),
}));

const mockFetchStoreTopProducts = jest.fn();
jest.mock('@/src/lib/api/stores', () => {
  const actual = jest.requireActual('@/src/lib/api/stores');
  return {
    ...actual,
    fetchStoreTopProducts: (...args: unknown[]) => mockFetchStoreTopProducts(...args),
  };
});

jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: null }) => unknown) =>
    selector({ profile: null }),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('StoreScreen', () => {
  beforeEach(() => {
    mockFetchStoreTopProducts.mockReset();
    mockBack.mockReset();
  });

  it("affiche le nom de l'enseigne dans le header", () => {
    mockFetchStoreTopProducts.mockReturnValue(new Promise(() => undefined));
    const { getByText } = render(
      <Wrapper>
        <StoreScreen />
      </Wrapper>,
    );
    expect(getByText('Carrefour')).toBeTruthy();
  });

  it('affiche le sous-titre "Les meilleurs produits" pendant le chargement', () => {
    mockFetchStoreTopProducts.mockReturnValue(new Promise(() => undefined));
    const { getByText } = render(
      <Wrapper>
        <StoreScreen />
      </Wrapper>,
    );
    expect(getByText('Les meilleurs produits')).toBeTruthy();
    expect(getByText('Calcul des scores…')).toBeTruthy();
  });
});
