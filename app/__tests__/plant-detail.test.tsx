/**
 * Fiche plante — lot S3 : contre-indications et interactions médicamenteuses
 * sont un contenu de sécurité. Rendues à TOUS les paliers, en clair, et AVANT
 * le paywall dans l'ordre de lecture. Le reste de la fiche garde son palier
 * Expert.
 *
 * Le palier « en chargement » est exactement ce que renvoie usePremium tant
 * que la requête n'a pas répondu : tier 'free', isLoading true
 * (src/lib/hooks/usePremium.ts:38). Le palier « en erreur » se confond avec
 * free : getUserTier convertit toute erreur en 'free' (premium-gate.ts:323-326).
 *
 * Sous app/__tests__/ comme les autres tests d'écran : la blockList par
 * défaut de Metro (/__tests__/) tient ces fichiers hors du bundle.
 */

import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import {
  isHiddenFromAccessibility,
  render,
  screen,
} from '@testing-library/react-native';
import PlantDetailScreen from '@/app/plants/[id]';
import { getPlantById, type PlantEntry } from '@/src/data/plant-encyclopedia';

// ─── Mocks paramétrables ────────────────────────────────────────────────────

let mockTier: 'free' | 'premium' | 'expert' = 'free';
let mockIsLoading = false;
let mockPlantId = 'valerian';

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
  useLocalSearchParams: () => ({ id: mockPlantId }),
}));

// FadeIn démarre à opacité 0 : une animation d'entrée, pas un flou. Neutralisé
// pour que la vérification « en clair » ne lise que les vrais masquages.
jest.mock('@/src/components/ui/FadeIn', () => ({
  FadeIn: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'uid-1' } }),
}));

jest.mock('@/src/lib/hooks/usePremium', () => ({
  usePremium: () => ({
    tier: mockTier,
    isPremium: mockTier !== 'free',
    isExpert: mockTier === 'expert',
    isLoading: mockIsLoading,
    canAccess: () => mockTier === 'expert',
  }),
}));

jest.mock('@/src/lib/herbarium/herbarium-store', () => ({
  addToHerbarium: jest.fn(() => Promise.resolve([])),
  isInHerbarium: jest.fn(() => Promise.resolve(false)),
}));

// Le paywall réel a ses propres tests : ici ne compte que l'endroit où il s'insère.
// Déclaration de fonction (hissée) : la fabrique peut la lire dès le premier import.
function MockPaywall({ featureKey }: { featureKey: string }) {
  return <Text>{`PAYWALL:${featureKey}`}</Text>;
}
jest.mock('@/src/components/premium/PremiumPaywall', () => ({
  PremiumPaywall: MockPaywall,
}));

// ─── Lecture de l'arbre rendu ───────────────────────────────────────────────

/** Nœud de l'arbre rendu, réduit à ce que lit la vérification « en clair ». */
interface RenderedNode {
  props: { style?: unknown; pointerEvents?: unknown };
  parent: RenderedNode | null;
}

/**
 * Vrai si le nœud ou l'un de ses ancêtres le masque comme le fait le flou des
 * écrans Expert (app/plants/index.tsx:191-193) : opacity < 1 ou pointerEvents
 * « none ».
 */
function isObscured(node: RenderedNode): boolean {
  for (let n: RenderedNode | null = node; n; n = n.parent) {
    const style = StyleSheet.flatten(n.props.style as never) as
      | Record<string, unknown>
      | undefined;
    if (n.props.pointerEvents === 'none' || style?.pointerEvents === 'none') {
      return true;
    }
    if (typeof style?.opacity === 'number' && style.opacity < 1) return true;
  }
  return false;
}

/** Nœud de `toJSON()`, réduit à ses enfants. */
interface JsonNode {
  children: Array<JsonNode | string> | null;
}

/** Textes rendus, dans l'ordre de lecture (parcours en profondeur). */
function textsInReadingOrder(): string[] {
  const texts: string[] = [];
  const visit = (node: JsonNode | string): void => {
    if (typeof node === 'string') {
      texts.push(node);
      return;
    }
    node.children?.forEach(visit);
  };
  const tree: JsonNode | JsonNode[] | null = screen.toJSON();
  if (Array.isArray(tree)) tree.forEach(visit);
  else if (tree) visit(tree);
  return texts;
}

function plantById(id: string): PlantEntry {
  const plant = getPlantById(id);
  if (!plant) throw new Error(`fiche « ${id} » absente de PLANT_ENCYCLOPEDIA`);
  return plant;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

// Valériane : interactions RENSEIGNÉES — on lit le texte de la fiche, pas le repli.
const VALERIAN = plantById('valerian');
const VALERIAN_INTERACTIONS = VALERIAN.interactions ?? '';

/** [libellé, tier renvoyé par usePremium, isLoading] */
const PALIERS_SANS_EXPERT: Array<[string, 'free' | 'premium', boolean]> = [
  ['free', 'free', false],
  ['premium', 'premium', false],
  ['palier en chargement', 'free', true],
];

describe('Fiche plante — précautions visibles à tous les paliers', () => {
  beforeEach(() => {
    mockTier = 'free';
    mockIsLoading = false;
    mockPlantId = 'valerian';
  });

  it.each(PALIERS_SANS_EXPERT)(
    '%s : contre-indications et interactions rendues en clair, avant le paywall',
    (_label, tier, isLoading) => {
      mockTier = tier;
      mockIsLoading = isLoading;
      expect(VALERIAN_INTERACTIONS).not.toBe('');

      render(<PlantDetailScreen />);

      const texts = textsInReadingOrder();
      const paywallAt = texts.indexOf('PAYWALL:plant_database');
      expect(paywallAt).toBeGreaterThan(-1);
      // Titre de section : indexOf compare des chaînes exactes, il ne confond
      // pas le titre avec le texte des propriétés, qui commence pareil.
      const propertiesAt = texts.indexOf('Propriétés documentées');
      expect(propertiesAt).toBeGreaterThan(-1);

      for (const precaution of [VALERIAN.contraindications, VALERIAN_INTERACTIONS]) {
        expect(texts).toContain(precaution);
        expect(texts.indexOf(precaution)).toBeLessThan(paywallAt);
        // Aucun bénéfice avant les précautions (option A).
        expect(texts.indexOf(precaution)).toBeLessThan(propertiesAt);
        const node = screen.getByText(precaution, { includeHiddenElements: true });
        expect(isObscured(node)).toBe(false);
        expect(isHiddenFromAccessibility(node)).toBe(false);
        // Présent dans l'arbre mais coupé à l'écran ne compterait pas.
        expect(node.props.numberOfLines).toBeUndefined();
      }
    },
  );

  it('free : le reste de la fiche garde son palier Expert', () => {
    render(<PlantDetailScreen />);

    expect(screen.getByText('PAYWALL:plant_database')).toBeTruthy();
    for (const title of ['Usage traditionnel', 'Partie utilisée', 'Préparation']) {
      expect(screen.queryByText(title)).toBeNull();
    }
    // Propriétés tronquées à 80 caractères hors Expert.
    expect(screen.queryByText(VALERIAN.properties)).toBeNull();
  });

  it('expert : chaque précaution rendue une seule fois, sans paywall', async () => {
    mockTier = 'expert';
    render(<PlantDetailScreen />);

    expect(screen.getAllByText(VALERIAN.contraindications)).toHaveLength(1);
    expect(screen.getAllByText(VALERIAN_INTERACTIONS)).toHaveLength(1);
    expect(screen.queryByText(/^PAYWALL:/)).toBeNull();
    expect(screen.getByText('Préparation')).toBeTruthy();
    // L'effet Expert (isInHerbarium) se résout après le premier rendu.
    expect(await screen.findByText('Ajouter à mon herbier 🌿')).toBeTruthy();
  });

  it("free, fiche sans interactions renseignées : le repli n'affirme pas une absence documentée", () => {
    mockPlantId = 'chamomile';
    expect(plantById('chamomile').interactions).toBeNull();
    render(<PlantDetailScreen />);

    const texts = textsInReadingOrder();
    expect(texts).toContain('Aucune interaction renseignée sur cette fiche.');
    expect(texts).not.toContain('Aucune interaction notable documentée.');
  });

  // C2b — ces limites n'étaient écrites que dans la Préparation, Expert.
  // Recopiées dans les contre-indications, elles se lisent hors Expert.
  it.each([
    ['ginseng', 'Cure de 4-12 semaines max.'],
    ['lavender', 'Huile essentielle uniquement après avis professionnel.'],
  ])('free, %s : « %s » se lit en clair dans les contre-indications', (id, limit) => {
    mockPlantId = id;
    render(<PlantDetailScreen />);

    // La Préparation reste fermée : seules les contre-indications portent la limite.
    expect(screen.queryByText('Préparation')).toBeNull();
    const { contraindications } = plantById(id);
    expect(textsInReadingOrder().filter((t) => t.includes(limit))).toEqual([
      contraindications,
    ]);
    const node = screen.getByText(contraindications, { includeHiddenElements: true });
    expect(isObscured(node)).toBe(false);
    expect(isHiddenFromAccessibility(node)).toBe(false);
    expect(node.props.numberOfLines).toBeUndefined();
  });
});
