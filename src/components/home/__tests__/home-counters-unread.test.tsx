/**
 * Lot H — les compteurs de l'accueil ne disent pas « aucun scan » tant qu'ils
 * ne sont pas lus.
 *
 * `useUserStats` en chargement ou en erreur rend `data: undefined`. Greeting et
 * StatsRow affichaient alors « Scanne ton premier produit pour démarrer. » et
 * « 0 » scan : un historique vide, faux pour qui a déjà scanné. Hors connexion,
 * aucun scan n'est enregistré : là, le « 0 » reste vrai.
 */
import { render } from '@testing-library/react-native';
import { Greeting } from '../Greeting';
import { StatsRow } from '../StatsRow';
import type { UserStats } from '@/src/lib/stores/useProductStore';

const SIGNED_IN = { id: 'user-1', email: 'testeur@example.com' };
let mockUser: { id: string; email: string } | null = SIGNED_IN;
let mockStats: UserStats | undefined;

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string; email: string } | null }) => unknown) =>
    selector({ user: mockUser }),
}));

jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: null }) => unknown) => selector({ profile: null }),
}));

jest.mock('@/src/lib/stores/useProductStore', () => ({
  useUserStats: () => ({ data: mockStats }),
}));

function renderHome() {
  return render(
    <>
      <Greeting />
      <StatsRow />
    </>,
  );
}

describe('Accueil — compteurs non lus (lot H)', () => {
  beforeEach(() => {
    mockUser = SIGNED_IN;
    mockStats = undefined;
  });

  it('connecté, compteurs non lus : « — » et un sous-titre neutre, jamais « 0 » ni « premier produit »', () => {
    const { getAllByText, getByText, queryByText } = renderHome();
    expect(getAllByText('—')).toHaveLength(3);
    expect(queryByText('0')).toBeNull();
    expect(getByText('Que scannes-tu aujourd’hui ?')).toBeTruthy();
    expect(queryByText('Scanne ton premier produit pour démarrer.')).toBeNull();
  });

  it('compteurs lus : les chiffres, et le sous-titre selon le nombre de scans', () => {
    mockStats = { total: 12, unique: 9, avg: 67, bad: 3 };
    const { getByText, queryByText } = renderHome();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('67')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('Bel élan — analysons ton prochain produit.')).toBeTruthy();
    expect(queryByText('—')).toBeNull();
  });

  it('hors connexion, rien n’est enregistré : « 0 » et « premier produit » restent vrais', () => {
    mockUser = null;
    const { getAllByText, getByText } = renderHome();
    expect(getAllByText('0')).toHaveLength(2);
    expect(getByText('Scanne ton premier produit pour démarrer.')).toBeTruthy();
  });
});
