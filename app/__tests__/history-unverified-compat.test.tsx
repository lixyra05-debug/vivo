/**
 * Historique × profil allergique — les produits INVÉRIFIABLES ne doivent pas
 * passer pour compatibles par omission.
 *
 * Couches traversées : rendu réel de HistoryScreen → construction du set
 * `incompatibleBarcodes` → `userProfileToCompatibilityProfile` (adapter réel)
 * → `checkCompatibility` (moteur réel, non mocké).
 * Couches NON traversées : Supabase (`useScanHistory` est mocké), la
 * persistance du profil (`useProfileStore` renvoie un littéral).
 *
 * Le profil déclare une allergie au gluten. Trois scans :
 *  - « Vérifié sain »   : ingrédients présents, sans gluten → compatible vérifié
 *  - « Avec gluten »    : ingrédients au blé               → blocker
 *  - « Sans étiquette » : AUCUNE liste d'ingrédients       → invérifiable
 *
 * Règle de sécurité : l'invérifiable rejoint « Incompatibles ». L'afficher à
 * tort dans un filtre d'alerte coûte un faux positif ; le laisser passer pour
 * compatible coûte une réaction allergique.
 *
 * Barrière de score inerte : tous les scans sont à 80, l'adapter pose
 * `minScore: 50` — si ces tests tombent, c'est par le chemin allergie ou
 * vérification, jamais par le score.
 */
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import HistoryScreen from '../(tabs)/history';
import type { ScanHistoryRow } from '@/src/lib/stores/useProductStore';
import type { UserProfileRow } from '@/src/lib/api/types';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
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
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

const mockProfile: UserProfileRow = {
  id: 'user-1',
  display_name: 'Testeuse',
  health_profile: 'standard',
  allergies: ['gluten'],
  intolerances: [],
  preferred_portion_size: 'standard',
  subscription_tier: 'free',
  subscription_expires_at: null,
  scan_count: 3,
  created_at: '2026-04-25T10:00:00Z',
  updated_at: '2026-04-25T10:00:00Z',
};

jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: unknown }) => unknown) =>
    selector({ profile: mockProfile }),
}));

function makeRow(opts: {
  id: string;
  barcode: string;
  name: string;
  ingredients: string | null;
}): ScanHistoryRow {
  return {
    id: opts.id,
    user_id: 'user-1',
    barcode: opts.barcode,
    score_at_scan: 80,
    profile_used: 'standard',
    penalties_snapshot: [],
    is_favorite: false,
    scanned_at: '2026-04-25T10:00:00Z',
    product_type: 'food',
    product: {
      barcode: opts.barcode,
      name: opts.name,
      brand: 'Marque',
      image_url: null,
      ingredients_raw: opts.ingredients,
      additives_tags: [],
      nova_group: 1,
      nutriscore_grade: null,
      energy_kcal_100g: null,
      sugars_100g: null,
      saturated_fat_100g: null,
      salt_100g: null,
      proteins_100g: null,
      fiber_100g: null,
      oil_types: [],
      portion_grams: null,
      packaging_material: null,
      is_organic: false,
      off_last_updated: null,
      our_score: null,
      our_score_computed_at: null,
      scan_count: 1,
      created_at: '2026-04-25T10:00:00Z',
      updated_at: '2026-04-25T10:00:00Z',
    },
  };
}

const mockRows: ScanHistoryRow[] = [
  makeRow({ id: 'r1', barcode: '111', name: 'Vérifié sain', ingredients: 'eau, sel' }),
  makeRow({ id: 'r2', barcode: '222', name: 'Avec gluten', ingredients: 'farine de blé' }),
  makeRow({ id: 'r3', barcode: '333', name: 'Sans étiquette', ingredients: null }),
];

jest.mock('@/src/lib/stores/useProductStore', () => {
  const actual = jest.requireActual('@/src/lib/stores/useProductStore');
  return {
    ...actual,
    useScanHistory: () => ({
      data: mockRows,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    }),
    useToggleFavorite: () => ({ mutate: jest.fn() }),
  };
});

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('HistoryScreen — produits invérifiables et filtre Incompatibles', () => {
  it('compte les produits invérifiables dans le chip « Incompatibles »', () => {
    const { getByText } = render(
      <Wrapper>
        <HistoryScreen />
      </Wrapper>,
    );
    // « Avec gluten » (blocker) + « Sans étiquette » (invérifiable) = 2.
    expect(getByText('Incompatibles (2)')).toBeTruthy();
  });

  it('le filtre retient le blocker ET l\'invérifiable, écarte le vérifié sain', () => {
    const { getByLabelText, queryByLabelText } = render(
      <Wrapper>
        <HistoryScreen />
      </Wrapper>,
    );
    fireEvent.press(getByLabelText('Incompatibles (2)'));
    expect(queryByLabelText(/Avec gluten/)).toBeTruthy();
    expect(queryByLabelText(/Sans étiquette/)).toBeTruthy();
    expect(queryByLabelText(/Vérifié sain/)).toBeNull();
  });
});
