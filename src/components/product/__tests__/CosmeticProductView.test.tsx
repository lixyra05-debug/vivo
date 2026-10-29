import { render } from '@testing-library/react-native';
import { CosmeticProductView } from '../CosmeticProductView';
import { CompatibilityBanner, UNVERIFIED_BODY, UNVERIFIED_TITLE } from '../CompatibilityBanner';
import { COSMETIC_UNVERIFIED_BODY } from '../CosmeticResultView';
import { getCosmeticConfidence } from '@/src/lib/api/confidence';
import { cosmeticToScoringInput, normalizeOBFProduct } from '@/src/lib/api/openbeautyfacts';
import { checkCompatibility } from '@/src/lib/scoring/compatibility-engine';
import { calculateCosmeticScore } from '@/src/lib/scoring/cosmetic-engine';
import { findRelevantCards } from '@/src/lib/education/content-database';
import type {
  CompatibilityProfile,
  CosmeticProduct,
  CosmeticScoringResult,
  ProductConfidence,
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
  const ENCEINTE: CompatibilityProfile = { ...DIABETE, conditions: ['enceinte'] };
  const BEBE: CompatibilityProfile = { ...DIABETE, conditions: ['bebe'] };
  /** Le message de sécurité de D11, mot pour mot : il ne doit jamais disparaître. */
  const SECURITE = "Tes allergies et restrictions n'ont pas pu être vérifiées.";

  /** Toute la chaîne de l'écran : OBF → note → compatibilité → cartes. */
  function rendre(
    inci: string,
    profil: CompatibilityProfile,
    confidence: ProductConfidence | null = null,
  ) {
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
        confidence={confidence}
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

  // [cas, profil] — sur une liste vide, D11 répond « Vérification impossible » à chacun.
  const PROFIL_INVERIFIABLE: ReadonlyArray<[string, CompatibilityProfile]> = [
    ['allergie au gluten', GLUTEN],
    ['grossesse', ENCEINTE],
    ['enfant', BEBE],
  ];

  it.each(PROFIL_INVERIFIABLE)(
    '%s, liste vide : un seul « Vérification impossible », qui garde le message de sécurité de D11',
    (_cas, profil) => {
      const { compatibilityResult, queryAllByText, queryByText } = rendre('', profil);
      // D11 inchangé : le profil n'a pas pu être vérifié.
      expect([compatibilityResult.isCompatible, compatibilityResult.verificationStatus]).toEqual([
        true,
        'insufficient_data',
      ]);
      // Un seul bloc sous ce titre…
      expect(queryAllByText(UNVERIFIED_TITLE)).toHaveLength(1);
      // …qui dit le constat S3-3 ET le message de sécurité : rien n'a disparu.
      expect(queryByText(COSMETIC_UNVERIFIED_BODY)).toBeTruthy();
      expect(queryByText(SECURITE)).toBeTruthy();
    },
  );

  it('profil non vérifié, liste non reconnue : son point d’attention reste rendu', () => {
    // « kiwi » : allergène que le moteur ne sait pas chercher, donc D11 dit
    // « Vérification impossible » même avec une liste. « MEL (HONEY) » n'est pas
    // reconnu par la base INCI (non évalué) mais déclenche un point FODMAP.
    const KIWI_FODMAP: CompatibilityProfile = {
      ...DIABETE,
      allergies: ['kiwi'],
      conditions: ['ibs_fodmap'],
    };
    const { compatibilityResult, getByText } = rendre('AQUA (WATER), MEL (HONEY)', KIWI_FODMAP);
    expect(compatibilityResult.verificationStatus).toBe('insufficient_data');
    expect(getByText('Déclencheur FODMAP détecté : honey')).toBeTruthy();
  });

  it('liste évaluée, profil non vérifié : le bandeau D11 garde sa place et son texte', () => {
    const KIWI: CompatibilityProfile = { ...DIABETE, allergies: ['kiwi'], conditions: [] };
    const { compatibilityResult, getByText, getByLabelText, queryAllByText } = rendre(
      'Aqua, Glycerin',
      KIWI,
    );
    expect(compatibilityResult.verificationStatus).toBe('insufficient_data');
    expect(queryAllByText(UNVERIFIED_TITLE)).toHaveLength(1);
    expect(getByText(UNVERIFIED_BODY)).toBeTruthy();
    // La note, elle, a bien été mesurée et reste affichée.
    expect(getByLabelText(/ sur 100\./)).toBeTruthy();
  });

  it('non évalué ET incompatible : le statut et le bandeau « Incompatible » restent deux blocs', () => {
    const { queryAllByText, getByText } = rendre(
      'AQUA (WATER), TRITICUM VULGARE (WHEAT) GERM OIL',
      GLUTEN,
    );
    expect(queryAllByText(UNVERIFIED_TITLE)).toHaveLength(1);
    expect(getByText('Incompatible avec ton profil')).toBeTruthy();
  });

  it('allergène lu dans le texte : « Incompatible avec ton profil » reste rendu', () => {
    const { compatibilityResult, getByText } = rendre(
      'AQUA (WATER), TRITICUM VULGARE (WHEAT) GERM OIL',
      GLUTEN,
    );
    expect(compatibilityResult.isCompatible).toBe(false);
    expect(getByText('Incompatible avec ton profil')).toBeTruthy();
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
    expect(queryByText(/^Incompatible avec/)).toBeNull();
    expect(getByText('Excellent choix !')).toBeTruthy();
  });

  /** Ce que `getCosmeticConfidence` rend quand les cinq champs sont renseignés. */
  const VERIFIE_FABRICANT = getCosmeticConfidence(
    normalizeOBFProduct({
      code: '3401520107313',
      product_name: 'Crème hydratante',
      brands: 'Marque test',
      image_url: 'https://images.openbeautyfacts.org/creme.jpg',
      categories_tags: ['en:moisturizers'],
      ingredients_text: 'AQUA (WATER), PARFUM (FRAGRANCE)',
    }),
  );

  it('ni « Comment ce score est calculé ? » ni « Vérifié fabricant » : il n’y a pas de note', () => {
    // Les cinq champs sont renseignés, la complétude dit « Vérifié fabricant »…
    expect(VERIFIE_FABRICANT.labelFr).toBe('Vérifié fabricant');
    // …mais aucun ingrédient de cette liste n'a été évalué.
    const { queryByText } = rendre('AQUA (WATER), PARFUM (FRAGRANCE)', DIABETE, VERIFIE_FABRICANT);
    expect(queryByText('Comment ce score est calculé ? →')).toBeNull();
    expect(queryByText('Vérifié fabricant')).toBeNull();
  });

  it('un niveau de confiance qui ne contredit rien reste : « À vérifier »', () => {
    const aVerifier = getCosmeticConfidence(
      normalizeOBFProduct({ code: '3401520107313', ingredients_text: '' }),
    );
    expect(aVerifier.labelFr).toBe('À vérifier');
    const { getByText } = rendre('', DIABETE, aVerifier);
    expect(getByText('À vérifier')).toBeTruthy();
  });

  it('contrôle : liste évaluée → le lien de méthode et « Vérifié fabricant » restent', () => {
    const { getByText } = rendre('Aqua, Glycerin', DIABETE, VERIFIE_FABRICANT);
    expect(getByText('Comment ce score est calculé ? →')).toBeTruthy();
    expect(getByText('Vérifié fabricant')).toBeTruthy();
  });
});
