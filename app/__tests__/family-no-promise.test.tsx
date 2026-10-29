/**
 * S3-2 — Mode Famille : plus aucune promesse sans effet.
 *
 * Les allergies et conditions d'un profil familial sont enregistrées, mais
 * aucune analyse ne les lit : `useActiveCompatProfile` n'a aucun consommateur.
 * Les écrans du Mode Famille ne doivent donc rien promettre — ni blocage, ni
 * score adapté, ni scans personnalisés. Le balayage couvre les textes ET les
 * libellés d'accessibilité : un lecteur d'écran lit les deux.
 *
 * GARDES — seule la formulation change. Les champs restent visibles et
 * modifiables (option 1), et `app/family/edit.tsx` renvoie l'état local
 * complet à chaque mise à jour : un profil existant doit repartir avec ses
 * allergies et conditions, jamais avec `[]`.
 *
 * Écrans importés par leur alias `@/app/…`. Le fichier vit sous app/__tests__/,
 * que la blockList par défaut de Metro (/__tests__/) tient hors du bundle.
 */

import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import FamilyEditScreen from '@/app/family/edit';
import FamilyIndexScreen from '@/app/family/index';
import type {
  FamilyProfile,
  UpdateFamilyProfileInput,
} from '@/src/lib/family/family-store';

// ─── Mocks paramétrables ────────────────────────────────────────────────────

let mockParams: { id?: string } = { id: 'new' };
// `undefined` : lecture encore en cours (isLoading).
let mockProfiles: FamilyProfile[] | undefined = [];
const mockUpdate = jest.fn<Promise<void>, [UpdateFamilyProfileInput]>(() =>
  Promise.resolve(),
);
const mockCreate = jest.fn<Promise<void>, [unknown]>(() => Promise.resolve());

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
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'uid-1' } }),
}));

jest.mock('@/src/lib/hooks/usePremium', () => ({
  usePremium: () => ({
    tier: 'premium',
    isPremium: true,
    isExpert: false,
    isLoading: false,
    canAccess: () => true,
  }),
}));

jest.mock('@/src/lib/family/family-store', () => ({
  MAX_FAMILY_PROFILES: 4,
  useFamilyProfiles: () => ({ data: mockProfiles, isLoading: mockProfiles === undefined }),
  useCreateFamilyProfile: () => ({
    mutateAsync: mockCreate,
    mutate: jest.fn(),
    isPending: false,
  }),
  useUpdateFamilyProfile: () => ({
    mutateAsync: mockUpdate,
    mutate: jest.fn(),
    isPending: false,
  }),
  useDeleteFamilyProfile: () => ({
    mutateAsync: jest.fn(),
    mutate: jest.fn(),
    isPending: false,
  }),
  useSetActiveFamilyProfile: () => ({ mutate: jest.fn(), isPending: false }),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function makeProfile(): FamilyProfile {
  return {
    id: 'p-1',
    user_id: 'uid-1',
    name: 'Léa',
    avatar_emoji: '🧒',
    age_group: 'child',
    allergies: ['gluten'],
    conditions: ['diabete'],
    is_active: false,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  };
}

// ─── Balayage des promesses ─────────────────────────────────────────────────

/** Ce que les profils familiaux ne font pas : bloquer, adapter, personnaliser. */
const PROMISES: readonly RegExp[] = [
  /bloquer|bloquera|bloqu/i,
  /sera adapté|adapt(e|é|era)/i,
  /personnalis/i,
];

type ScreenQueries = Pick<
  ReturnType<typeof render>,
  'queryAllByText' | 'queryAllByLabelText'
>;

function textOf(children: unknown): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  return Array.isArray(children) ? children.map(textOf).join('') : '';
}

/** Chaque texte ou libellé qui promet, en clair — `[]` quand il n'y en a aucun. */
function promisesOn(view: ScreenQueries): string[] {
  return PROMISES.flatMap((pattern) => [
    ...view
      .queryAllByText(pattern)
      .map((node) => `${pattern} → « ${textOf(node.props.children)} »`),
    ...view
      .queryAllByLabelText(pattern)
      .map((node) => `${pattern} → libellé « ${String(node.props.accessibilityLabel)} »`),
  ]);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Mode Famille — aucune promesse sans effet (S3-2)', () => {
  beforeEach(() => {
    mockParams = { id: 'new' };
    mockProfiles = [];
  });

  it("édition, création : aucun texte ne promet de bloquer, d'adapter ni de personnaliser", () => {
    const view = render(
      <Wrapper>
        <FamilyEditScreen />
      </Wrapper>,
    );
    // Garde anti-vide : le formulaire est bien rendu, champs de santé compris.
    expect(view.getByText('Nouveau profil')).toBeTruthy();
    expect(view.getByText('Allergies & intolérances')).toBeTruthy();
    expect(view.getByText('Conditions de santé')).toBeTruthy();
    expect(promisesOn(view)).toEqual([]);
    // Chaque champ de santé dit qu'il ne sert qu'à mémoriser.
    expect(view.getAllByText(/^Pour mémoire :/)).toHaveLength(2);
  });

  it('liste, état vide : aucun texte ne promet de personnaliser les scans', () => {
    const view = render(
      <Wrapper>
        <FamilyIndexScreen />
      </Wrapper>,
    );
    expect(view.getByText('Aucun profil familial')).toBeTruthy();
    expect(promisesOn(view)).toEqual([]);
  });
});

/**
 * Tests synchrones, sans `waitFor` : `handleSubmit` appelle `mutateAsync`
 * avant son premier `await`, la charge utile est donc lisible dès le retour
 * de `press`. Aucune attente réelle — le résultat ne dépend pas de la charge.
 */
describe('Mode Famille — garde : les champs restent, les données aussi', () => {
  beforeEach(() => {
    mockParams = { id: 'p-1' };
    mockProfiles = [makeProfile()];
    mockUpdate.mockClear();
  });

  it('enregistrer un profil existant renvoie ses allergies et conditions, jamais []', () => {
    const { getByLabelText } = render(
      <Wrapper>
        <FamilyEditScreen />
      </Wrapper>,
    );

    fireEvent.press(getByLabelText('Enregistrer'));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p-1',
        allergies: ['gluten'],
        conditions: ['diabete'],
      }),
    );
  });

  it('les champs restent modifiables : un allergène coché part avec les autres', () => {
    const { getByLabelText } = render(
      <Wrapper>
        <FamilyEditScreen />
      </Wrapper>,
    );

    fireEvent.press(getByLabelText('Lactose'));
    fireEvent.press(getByLabelText('Enregistrer'));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        allergies: ['gluten', 'lactose'],
        conditions: ['diabete'],
      }),
    );
  });
});

/**
 * C3b — `fetchFamilyProfiles` avale les erreurs et rend `[]` : après une
 * lecture échouée (ou tant qu'elle court), l'écran d'édition reste un
 * formulaire vide. Enregistrer y écrirait allergies et conditions vides,
 * avatar et tranche d'âge par défaut — un effacement silencieux.
 */
describe('Mode Famille — « Enregistrer » attend le profil (C3b)', () => {
  beforeEach(() => {
    mockParams = { id: 'p-1' };
    mockUpdate.mockClear();
    mockCreate.mockClear();
  });

  it.each<[string, FamilyProfile[] | undefined]>([
    ['lecture échouée (liste vide)', []],
    ['lecture en cours', undefined],
  ])('%s, nom saisi : aucun envoi', (_cas, profiles) => {
    mockProfiles = profiles;
    const view = render(
      <Wrapper>
        <FamilyEditScreen />
      </Wrapper>,
    );
    expect(view.getByText('Modifier le profil')).toBeTruthy();

    fireEvent.changeText(view.getByPlaceholderText('Ex : Léa'), 'Léa');
    fireEvent.press(view.getByLabelText('Enregistrer'));

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('garde : en création, « Créer le profil » envoie toujours', () => {
    mockParams = { id: 'new' };
    mockProfiles = [];
    const view = render(
      <Wrapper>
        <FamilyEditScreen />
      </Wrapper>,
    );

    fireEvent.changeText(view.getByPlaceholderText('Ex : Léa'), 'Léa');
    fireEvent.press(view.getByLabelText('Créer le profil'));

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
