import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import ExploreScreen from '../(tabs)/explore';
import type { SearchResult } from '@/src/lib/api/types';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

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

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

const mockSearchProducts = jest.fn();
jest.mock('@/src/lib/api/search', () => ({
  searchProducts: (...args: unknown[]) => mockSearchProducts(...args),
  searchByCategory: jest.fn(),
  clearSearchCache: jest.fn(),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('ExploreScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockReset();
    mockSearchProducts.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('affiche le titre "Explorer"', () => {
    const { getByText } = render(
      <Wrapper>
        <ExploreScreen />
      </Wrapper>,
    );
    expect(getByText('Explorer')).toBeTruthy();
  });

  it('affiche la grille de catégories quand la recherche est vide', () => {
    const { getByText } = render(
      <Wrapper>
        <ExploreScreen />
      </Wrapper>,
    );
    expect(getByText('Catégories')).toBeTruthy();
    // Au moins une catégorie food et une cosmétique
    expect(getByText('Biscuits sucrés')).toBeTruthy();
    expect(getByText('Shampoings')).toBeTruthy();
  });

  it('affiche les résultats de recherche après la frappe (>2 caractères) et debounce', async () => {
    const results: SearchResult[] = [
      {
        barcode: '111',
        name: 'Coca-Cola',
        brand: 'Coca',
        image_url: null,
        type: 'food',
      },
    ];
    mockSearchProducts.mockResolvedValue(results);

    const { getByLabelText, findByText } = render(
      <Wrapper>
        <ExploreScreen />
      </Wrapper>,
    );
    const input = getByLabelText('Rechercher un produit');
    fireEvent.changeText(input, 'coca');

    // Avance le timer pour le debounce (400ms)
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => expect(mockSearchProducts).toHaveBeenCalled());
    expect(await findByText('Coca-Cola')).toBeTruthy();
  });

  it('filtre les catégories selon le chip actif', () => {
    const { getByLabelText, queryByText } = render(
      <Wrapper>
        <ExploreScreen />
      </Wrapper>,
    );
    // Au départ, on voit les deux types
    expect(queryByText('Biscuits sucrés')).toBeTruthy();
    expect(queryByText('Shampoings')).toBeTruthy();

    // Tap sur "Cosmétiques"
    fireEvent.press(getByLabelText('Cosmétiques'));

    // Les catégories food ne sont plus visibles, les cosmétiques oui
    expect(queryByText('Biscuits sucrés')).toBeNull();
    expect(queryByText('Shampoings')).toBeTruthy();
  });
});
