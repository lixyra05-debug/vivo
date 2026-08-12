/**
 * Home — test de non-régression de l'écran de référence.
 *
 * Ce que ce test protège : la refonte v2 a déplacé le CTA de scan du bas de
 * page vers le héros, fusionné deux taglines en une et remplacé les titres de
 * section par des libellés `micro`. Autant d'occasions de perdre un élément en
 * chemin sans qu'aucun type ne bronche.
 *
 * Il vérifie donc que l'écran monte et que ses points d'ancrage sont là —
 * pas le pixel, qui relève de l'œil.
 */

import { render } from '@testing-library/react-native';
import HomeScreen from '../index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string; email: string } }) => unknown) =>
    selector({ user: { id: 'user-1', email: 'hector@example.com' } }),
}));

jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (
    selector: (s: { profile: { display_name: string } | null }) => unknown,
  ) => selector({ profile: { display_name: 'Hector' } }),
}));

jest.mock('@/src/lib/stores/useProductStore', () => ({
  useScanHistory: () => ({ data: [], isLoading: false }),
  useUserStats: () => ({ data: { total: 12, avg: 67, bad: 3 } }),
}));

jest.mock('@/src/lib/stats/use-monthly-recap', () => ({
  useMonthlyRecap: () => ({ recap: null, isLoading: false }),
}));

jest.mock('@/src/lib/protocols/use-protocol', () => ({
  useProtocol: () => ({ activeProtocol: null, isLoading: false }),
}));

jest.mock('@/src/lib/hooks/usePremium', () => ({
  usePremium: () => ({
    tier: 'free',
    isPremium: false,
    isExpert: false,
    isLoading: false,
    canAccess: () => false,
  }),
}));

jest.mock('@/src/lib/family/family-store', () => ({
  useFamilyProfiles: () => ({ data: [], isLoading: false }),
  useSetActiveFamilyProfile: () => ({ mutate: jest.fn(), isPending: false }),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('accueille l’utilisateur par son prénom', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Bonjour Hector')).toBeTruthy();
  });

  it('expose le scan dans le héros, sans exiger de scroll', () => {
    const { getByLabelText, getByText } = render(<HomeScreen />);
    expect(getByLabelText('Lancer le scan')).toBeTruthy();
    // La promesse produit doit rester affichée à côté du bouton.
    expect(getByText('Toujours gratuit et illimité')).toBeTruthy();
  });

  it('annonce les sections par des libellés, plus par des titres emoji', () => {
    const { getByText, queryByText } = render(<HomeScreen />);
    expect(getByText('Ton activité')).toBeTruthy();
    expect(getByText('À découvrir')).toBeTruthy();
    expect(queryByText(/🌿|📅|📊/)).toBeNull();
  });

  it('affiche les trois chiffres clés', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('12')).toBeTruthy();
    expect(getByText('67')).toBeTruthy();
    expect(getByText('Score moyen')).toBeTruthy();
  });

  it('masque les bandeaux contextuels quand il n’y a ni recap ni protocole', () => {
    const { queryByText } = render(<HomeScreen />);
    expect(queryByText(/Ton Recap de/)).toBeNull();
    expect(queryByText(/Continue ton protocole/)).toBeNull();
  });
});
