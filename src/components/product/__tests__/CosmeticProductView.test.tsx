import { render } from '@testing-library/react-native';
import { CosmeticProductView } from '../CosmeticProductView';
import { CompatibilityBanner, UNVERIFIED_BODY, UNVERIFIED_TITLE } from '../CompatibilityBanner';
import { cosmeticToScoringInput, normalizeOBFProduct } from '@/src/lib/api/openbeautyfacts';
import { checkCompatibility } from '@/src/lib/scoring/compatibility-engine';
import { calculateCosmeticScore } from '@/src/lib/scoring/cosmetic-engine';
import { findRelevantCards } from '@/src/lib/education/content-database';
import type {
  CompatibilityProfile,
  CosmeticProduct,
  CosmeticScoringResult,
} from '@/src/lib/api/types';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
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

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) =>
    selector({ user: null }),
}));

const baseProduct: CosmeticProduct = {
  barcode: '3401520107313',
  name: 'Crème hydratante',
  brand: 'Marque test',
  image_url: null,
  ingredients_inci: 'Aqua, Glycerin',
  ingredients_list: ['aqua', 'glycerin'],
  category: null,
  image_ingredients_url: null,
  obf_last_updated: null,
  our_score: null,
  our_score_computed_at: null,
  scan_count: 0,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
};

const baseResult: CosmeticScoringResult = {
  score_final: 80,
  score_color: 'green',
  penalties: [],
  blockers: [],
  risky_ingredients: [],
  profile_adjustments: [],
};

describe('CosmeticProductView', () => {
  it('rend sans crash et affiche le lien de méthodologie', () => {
    const { getByText } = render(
      <CosmeticProductView
        product={baseProduct}
        result={baseResult}
        confidence={null}
        compatibilityResult={null}
        educationalCards={[]}
        packagings={[]}
        onPressMethodology={() => undefined}
      />,
    );
    expect(getByText('Comment ce score est calculé ? →')).toBeTruthy();
  });
});

/**
 * S3-3 — la fiche d'un cosmétique dont aucun ingrédient n'a été évalué ne pose
 * ni l'état vert du bandeau de compatibilité ni « Excellent choix ! ». Le
 * moteur de compatibilité n'est pas touché : `isCompatible` et
 * `verificationStatus` (D11) gardent leur sens, c'est la fiche qui se tait.
 *
 * Aucune assertion ne lit le titre de l'état vert : sa formulation peut changer
 * sans que la règle change. On cherche le composant `CompatibilityBanner`, et
 * l'état vert se reconnaît à ce qu'il n'est ni « Vérification impossible » ni
 * « Incompatible ».
 */
describe('CosmeticProductView — S3-3, aucun ingrédient évalué', () => {
  const DIABETE: CompatibilityProfile = {
    allergies: [],
    dietary: [],
    conditions: ['diabete'],
    avoid: [],
    minScore: 50,
  };
  const GLUTEN: CompatibilityProfile = { ...DIABETE, allergies: ['gluten'], conditions: [] };

  /** Toute la chaîne de l'écran : OBF → note → compatibilité → cartes. */
  function rendre(inci: string, profil: CompatibilityProfile) {
    // Sans marque : la section maison-mère n'interroge pas Wikidata.
    const product = normalizeOBFProduct({ code: '3401520107313', ingredients_text: inci });
    const result = calculateCosmeticScore(cosmeticToScoringInput(product), 'standard');
    const compatibilityResult = checkCompatibility(product, result, profil);
    const educationalCards = findRelevantCards(
      {
        additives_tags: [],
        ingredients_raw: null,
        ingredients_inci: product.ingredients_inci,
        category_slug: null,
      },
      { score_final: result.score_final },
      2,
    );
    const ecran = render(
      <CosmeticProductView
        product={product}
        result={result}
        confidence={null}
        compatibilityResult={compatibilityResult}
        educationalCards={educationalCards}
        packagings={[]}
        onPressMethodology={() => undefined}
      />,
    );
    return { compatibilityResult, educationalCards, ...ecran };
  }

  // [cas, texte INCI, profil]
  const VERT_SANS_FONDEMENT: ReadonlyArray<[string, string, CompatibilityProfile]> = [
    ['profil diabète seul, séparateurs seuls', ',,;', DIABETE],
    ['profil diabète seul, noms non reconnus', 'AQUA (WATER), PARFUM (FRAGRANCE)', DIABETE],
    ['allergie au gluten, noms non reconnus', 'AQUA (WATER), PARFUM (FRAGRANCE)', GLUTEN],
  ];

  it.each(VERT_SANS_FONDEMENT)(
    '%s : le bandeau ne se pose pas, son vert serait sans fondement',
    (_cas, inci, profil) => {
      const { compatibilityResult, UNSAFE_queryByType } = rendre(inci, profil);
      // Le moteur, inchangé, conclut toujours « compatible et vérifié »…
      expect([compatibilityResult.isCompatible, compatibilityResult.verificationStatus]).toEqual([
        true,
        'verified',
      ]);
      // …mais la fiche ne pose pas le bandeau qui le peindrait en vert.
      expect(UNSAFE_queryByType(CompatibilityBanner)).toBeNull();
    },
  );

  it('allergie déclarée, liste vide : le bandeau D11 « Vérification impossible » reste rendu', () => {
    const { compatibilityResult, getByText } = rendre('', GLUTEN);
    expect(compatibilityResult.verificationStatus).toBe('insufficient_data');
    expect(getByText(UNVERIFIED_BODY)).toBeTruthy();
  });

  it('allergène lu dans le texte : « Incompatible avec votre profil » reste rendu', () => {
    const { compatibilityResult, getByText } = rendre(
      'AQUA (WATER), TRITICUM VULGARE (WHEAT) GERM OIL',
      GLUTEN,
    );
    expect(compatibilityResult.isCompatible).toBe(false);
    expect(getByText('Incompatible avec votre profil')).toBeTruthy();
  });

  it('« Excellent choix ! » ne commente plus un 100 qui ne mesure rien', () => {
    const { educationalCards, queryByText } = rendre('', DIABETE);
    // Constat : la carte déclenchée par la note est bien proposée à la fiche…
    expect(educationalCards.map((c) => c.id)).toEqual(['score_excellent']);
    // …qui ne la rend plus.
    expect(queryByText('Excellent choix !')).toBeNull();
  });

  it('une carte déclenchée par un ingrédient reste rendue : seule la carte de la note part', () => {
    // « METHYLPARABEN (CONSERVATEUR) » : la parenthèse empêche la base INCI de
    // reconnaître le nom (statut non évalué), mais la carte parabènes, un
    // avertissement, se déclenche sur le texte.
    const { educationalCards, getByText, queryByText } = rendre(
      'AQUA (WATER), METHYLPARABEN (CONSERVATEUR)',
      DIABETE,
    );
    const ids = educationalCards.map((c) => c.id);
    expect(ids).toContain('parabens');
    expect(ids).toContain('score_excellent');
    expect(getByText('Parabènes : perturbateurs suspectés')).toBeTruthy();
    expect(queryByText('Excellent choix !')).toBeNull();
  });

  it('contrôle : liste évaluée → le bandeau vert et la carte de la note restent', () => {
    const { compatibilityResult, UNSAFE_getByType, getByText, queryByText } = rendre(
      'Aqua, Glycerin',
      DIABETE,
    );
    // Même constat du moteur que dans les cas sans évaluation…
    expect([compatibilityResult.isCompatible, compatibilityResult.verificationStatus]).toEqual([
      true,
      'verified',
    ]);
    // …et ici le bandeau est posé, ni « Vérification impossible » ni « Incompatible » : vert.
    expect(UNSAFE_getByType(CompatibilityBanner)).toBeTruthy();
    expect(queryByText(UNVERIFIED_TITLE)).toBeNull();
    expect(queryByText('Incompatible avec votre profil')).toBeNull();
    expect(getByText('Excellent choix !')).toBeTruthy();
  });
});
