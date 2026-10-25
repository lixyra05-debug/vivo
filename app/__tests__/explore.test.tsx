import { act, fireEvent, render } from '@testing-library/react-native';
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

// FadeIn et Skeleton animent l'écran via Reanimated. Sous minuteurs simulés, avancer le temps
// rejoue ces animations en JS (~150 minuteurs) et le premier Skeleton charge LinearGradient en
// plein test : plusieurs secondes réelles, au-delà du plafond de 5 s de Jest sous charge.
// L'animation n'est pas l'objet de ces tests.
jest.mock('@/src/components/ui/FadeIn', () => ({
  FadeIn: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/src/components/ui/Skeleton', () => ({ Skeleton: () => null }));

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

    // Debounce de 400 ms : aucun appel avant l'échéance, un seul à l'échéance.
    act(() => {
      jest.advanceTimersByTime(399);
    });
    expect(mockSearchProducts).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(mockSearchProducts).toHaveBeenCalledTimes(1);
    expect(mockSearchProducts).toHaveBeenCalledWith({ query: 'coca', type: 'all' });
    expect(await findByText('Coca-Cola')).toBeTruthy();
  });

  it("Trophy button navigue vers /store-ranking au tap", () => {
    const { getByLabelText } = render(
      <Wrapper>
        <ExploreScreen />
      </Wrapper>,
    );
    fireEvent.press(getByLabelText('Voir le classement des supermarchés'));
    expect(mockPush).toHaveBeenCalledWith('/store-ranking');
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
