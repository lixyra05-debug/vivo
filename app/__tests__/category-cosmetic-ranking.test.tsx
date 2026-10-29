/**
 * S3-3, option catégorie — dans le classement d'une catégorie cosmétique, un
 * produit dont aucun ingrédient n'a été évalué ferme la marche, sans cercle de
 * score : son 100 vient de ce que le moteur n'a rien reconnu, pas d'une mesure.
 * Avant, ce 100 le hissait en tête du « Top des meilleurs produits ».
 *
 * Couches traversées : rendu réel de l'écran catégorie → `normalizeOBFProduct`
 * → `calculateCosmeticScore` → statut S3-3 → tri → `CategoryRankCard` ; avec un
 * profil, `userProfileToCompatibilityProfile` → `isProductCompatible` →
 * `CompatibilityToggle`.
 * Couches NON traversées : le réseau (`searchByCategory` et `getOrFetchCosmetic`
 * mockés), l'animation (`FadeIn`, `Skeleton` neutralisés), la persistance du
 * profil (`useProfileStore` renvoie `mockProfile`).
 */
import { cleanupAsync, fireEvent, render, within } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import CategoryScreen from '@/app/category/[slug]';
import { cosmeticToScoringInput, normalizeOBFProduct } from '@/src/lib/api/openbeautyfacts';
import { calculateCosmeticScore } from '@/src/lib/scoring/cosmetic-engine';
import type { UserProfileRow } from '@/src/lib/api/types';

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

// L'animation n'est pas l'objet de ce test (cf. explore.test.tsx).
jest.mock('@/src/components/ui/FadeIn', () => ({
  FadeIn: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/src/components/ui/Skeleton', () => ({ Skeleton: () => null }));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'shampoings' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

// Sans profil par défaut : le toggle « Mon profil » n'apparaît pas.
let mockProfile: UserProfileRow | null = null;

jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: unknown }) => unknown) =>
    selector({ profile: mockProfile }),
}));

// [code-barres, nom, texte INCI] — les non-évalués d'abord, comme OBF peut les rendre.
const mockCatalogue: ReadonlyArray<[string, string, string]> = [
  ['1111111111111', 'Shampoing sans liste', ''],
  ['2222222222222', 'Shampoing aux noms inconnus', 'AQUA (WATER), PARFUM (FRAGRANCE)'],
  ['3333333333333', 'Shampoing parabène', 'Aqua, Methylparaben'],
  ['4444444444444', 'Shampoing doux', 'Aqua, Glycerin'],
];

jest.mock('@/src/lib/api/search', () => ({
  ...jest.requireActual('@/src/lib/api/search'),
  searchByCategory: async () =>
    mockCatalogue.map(([barcode, name]) => ({
      barcode,
      name,
      brand: null,
      image_url: null,
      type: 'cosmetic',
    })),
}));

jest.mock('@/src/lib/api/openbeautyfacts', () => {
  const actual = jest.requireActual<typeof import('@/src/lib/api/openbeautyfacts')>(
    '@/src/lib/api/openbeautyfacts',
  );
  return {
    ...actual,
    // Image, marque et catégorie renseignées : seule la liste INCI départage
    // les niveaux de confiance.
    getOrFetchCosmetic: async (barcode: string) => {
      const entry = mockCatalogue.find(([code]) => code === barcode);
      return entry
        ? actual.normalizeOBFProduct({
            code: barcode,
            product_name: entry[1],
            brands: 'Marque test',
            image_url: `https://images.openbeautyfacts.org/${barcode}.jpg`,
            categories_tags: ['en:shampoos'],
            ingredients_text: entry[2],
          })
        : null;
    },
  };
});

function note(inci: string): number {
  const produit = normalizeOBFProduct({ code: '0000000000000', ingredients_text: inci });
  return calculateCosmeticScore(cosmeticToScoringInput(produit), 'standard').score_final;
}

// Démonter d'abord (asynchrone dans RNTL), PUIS vider le cache (cf.
// product-cosmetic-scan-history.test.tsx).
let client: QueryClient;

afterEach(async () => {
  await cleanupAsync();
  client.clear();
  mockProfile = null;
});

function rendreEcran() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <CategoryScreen />
    </QueryClientProvider>,
  );
}

describe('S3-3 — catégorie cosmétique : un produit non évalué ferme la marche', () => {
  it('les produits évalués d’abord, par note ; les non-évalués ensuite, sans note', async () => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const { findAllByRole } = render(
      <QueryClientProvider client={client}>
        <CategoryScreen />
      </QueryClientProvider>,
    );
    const rangs = await findAllByRole('button', { name: /^Rang / });
    expect(rangs.map((r) => r.props.accessibilityLabel)).toEqual([
      `Rang 1, Shampoing doux, score ${note('Aqua, Glycerin')} sur 100`,
      `Rang 2, Shampoing parabène, score ${note('Aqua, Methylparaben')} sur 100`,
      'Rang 3, Shampoing sans liste, non évalué',
      'Rang 4, Shampoing aux noms inconnus, non évalué',
    ]);
  });
});

/**
 * S3-3 — « Mon profil » ne compte pas un cosmétique non évalué parmi les
 * compatibles : sa fiche ne l'affirme pas compatible, la liste non plus. Y
 * reste la taille de la liste « Tous les produits », où il figure toujours,
 * en dernier, « Non évalué ».
 */
describe('S3-3 — catégorie cosmétique : un non-évalué ne compte pas parmi les compatibles', () => {
  const ALLERGIQUE: UserProfileRow = {
    id: 'user-1',
    display_name: 'Testeuse',
    health_profile: 'standard',
    allergies: ['gluten'],
    intolerances: [],
    preferred_portion_size: 'standard',
    subscription_tier: 'free',
    subscription_expires_at: null,
    scan_count: 0,
    created_at: '2026-04-25T10:00:00Z',
    updated_at: '2026-04-25T10:00:00Z',
  };

  // [cas, profil] — pour chacun, le moteur juge « compatible et vérifié » au
  // moins un des deux produits non évalués (cf. profile-filters.test.ts).
  const PROFILS: ReadonlyArray<[string, UserProfileRow]> = [
    ['allergie au gluten', ALLERGIQUE],
    ['profil diabète', { ...ALLERGIQUE, health_profile: 'diabetic', allergies: [] }],
  ];

  it.each(PROFILS)(
    '%s : « 2 / 4 compatibles », seuls les produits évalués restent dans la liste filtrée',
    async (_cas, profil) => {
      mockProfile = profil;
      const { findAllByRole, getByLabelText, queryAllByRole, queryByText } = rendreEcran();
      await findAllByRole('button', { name: /^Rang / }, { timeout: 4000 });
      fireEvent.press(getByLabelText('Afficher uniquement les produits compatibles avec mon profil'));
      // Les deux produits évalués, sans gluten, franchissent la barrière de score (≥ 50).
      expect([note('Aqua, Glycerin'), note('Aqua, Methylparaben')].every((n) => n >= 50)).toBe(
        true,
      );
      // Y reste 4 : « Tous les produits » montre toujours les deux non-évalués.
      expect(queryByText('2 / 4 compatibles')).toBeTruthy();
      expect(
        queryAllByRole('button', { name: /^Rang / }).map((r) => r.props.accessibilityLabel),
      ).toEqual([
        `Rang 1, Shampoing doux, score ${note('Aqua, Glycerin')} sur 100`,
        `Rang 2, Shampoing parabène, score ${note('Aqua, Methylparaben')} sur 100`,
      ]);
    },
  );

  it('« Vérifié fabricant » n’accompagne pas « Non évalué » ; les autres niveaux restent', async () => {
    const { findAllByRole } = rendreEcran();
    const rangs = await findAllByRole('button', { name: /^Rang / }, { timeout: 4000 });
    expect(
      rangs.map(
        (r) => within(r).queryByLabelText(/^Niveau de confiance/)?.props.accessibilityLabel ?? null,
      ),
    ).toEqual([
      'Niveau de confiance : Vérifié fabricant',
      'Niveau de confiance : Vérifié fabricant',
      // Liste vide : quatre champs sur cinq, un niveau qui ne contredit rien.
      'Niveau de confiance : Contribution communautaire',
      // Noms non reconnus : les cinq champs sont là, mais rien n'a été évalué.
      null,
    ]);
  });
});
