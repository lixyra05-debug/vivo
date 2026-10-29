import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { CosmeticResultView, verdictFromScore } from '../CosmeticResultView';
import { Colors, scoreColor } from '@/src/constants/colors';
import { cosmeticToScoringInput, normalizeOBFProduct } from '@/src/lib/api/openbeautyfacts';
import { checkCompatibility } from '@/src/lib/scoring/compatibility-engine';
import { calculateCosmeticScore } from '@/src/lib/scoring/cosmetic-engine';
import type { CompatibilityProfile, CosmeticProduct } from '@/src/lib/api/types';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

/**
 * Le verdict cosmétique portait des prescriptions (« À limiter », « On cherche
 * un remplaçant ») et des qualificatifs absolus (« Formule irréprochable »,
 * « globalement saine ») sur un score qui ne pèse que les ingrédients INCI
 * identifiés. Ces gardes portent sur les descriptions ; les libellés et les
 * seuils (90 / 70 / 50 / 30) sont l'échelle publique et restent figés.
 */
describe('verdictFromScore — le verdict cosmétique constate', () => {
  const TIERS = [95, 75, 55, 35, 10];

  const PRESCRIPTION =
    /\b(à limiter|limiter|à surveiller|surveiller|évitez|privilégi|remplaç|remplacer|bannir|appliquer)\b/i;

  const ABSOLU = /\b(irréprochables?|sains?|saines?|parfaites?|parfaits?|inoffensifs?|garantis?)\b|sans danger/i;

  it('les seuils et libellés sont inchangés', () => {
    expect(verdictFromScore(90).label).toBe('Excellent');
    expect(verdictFromScore(89).label).toBe('Bon');
    expect(verdictFromScore(70).label).toBe('Bon');
    expect(verdictFromScore(69).label).toBe('Moyen');
    expect(verdictFromScore(50).label).toBe('Moyen');
    expect(verdictFromScore(49).label).toBe('Mauvais');
    expect(verdictFromScore(30).label).toBe('Mauvais');
    expect(verdictFromScore(29).label).toBe('À éviter');
  });

  it("aucune description ne prescrit une conduite", () => {
    for (const score of TIERS) {
      const { description } = verdictFromScore(score);
      expect([score, PRESCRIPTION.test(description)]).toEqual([score, false]);
    }
  });

  it('aucune description ne qualifie la formule en absolu', () => {
    for (const score of TIERS) {
      const { description } = verdictFromScore(score);
      expect([score, ABSOLU.test(description)]).toEqual([score, false]);
    }
  });
});

/**
 * S3-3 — `calculateCosmeticScore` part de 100 et ne retire que les pénalités
 * des ingrédients que la base INCI reconnaît. Sans liste, ou avec une liste
 * dont aucun nom n'est connu, il rend 100 : l'écran en tirait « Excellent »,
 * « Formule propre » et un halo vert, soit un verdict tiré d'une absence de
 * donnée. Le moteur n'est pas modifié ; l'écran cesse de conclure.
 */
describe('S3-3 — aucun ingrédient évalué : « Vérification impossible »', () => {
  const CORPS =
    "Aucun ingrédient de ce produit n'a pu être évalué : la liste INCI est absente ou n'est pas reconnue par Vivo. Vérifie la composition sur l'emballage.";

  /** Le produit tel que l'app le construit : réponse OBF → `normalizeOBFProduct`. */
  function produitDepuis(inci: string | null | undefined): CosmeticProduct {
    const produit = normalizeOBFProduct({
      code: '3401520107313',
      product_name: 'Crème hydratante',
      brands: 'Marque test',
      ingredients_text: inci ?? undefined,
    });
    if (inci != null) return produit;
    // Liste absente : le cache Supabase rend `null` malgré le type (colonnes
    // nullables, migration 008), une ligne partielle peut omettre le champ.
    return {
      ...produit,
      ingredients_inci: inci as unknown as string,
      ingredients_list: inci as unknown as string[],
    };
  }

  function rendre(inci: string | null | undefined) {
    const product = produitDepuis(inci);
    const result = calculateCosmeticScore(cosmeticToScoringInput(product), 'standard');
    const ecran = render(
      <CosmeticResultView product={product} result={result} profile="standard" />,
    );
    return { result, ...ecran };
  }

  /** Tous les fonds de l'arbre rendu — c'est là que vit le halo. */
  interface NoeudRendu {
    props: { style?: unknown };
    children: Array<NoeudRendu | string> | null;
  }
  function fonds(noeud: NoeudRendu | NoeudRendu[] | null): string[] {
    if (noeud === null) return [];
    if (Array.isArray(noeud)) return noeud.flatMap(fonds);
    const style = StyleSheet.flatten(noeud.props.style as never) as
      | Record<string, unknown>
      | undefined;
    const ici = typeof style?.backgroundColor === 'string' ? [style.backgroundColor] : [];
    const enfants = (noeud.children ?? []).filter(
      (c): c is NoeudRendu => typeof c !== 'string',
    );
    return [...ici, ...enfants.flatMap(fonds)];
  }
  const COULEURS_DE_VERDICT = Object.values(Colors.score);
  function fondsDeVerdict(arbre: unknown): string[] {
    return fonds(arbre as NoeudRendu | NoeudRendu[] | null).filter((fond) =>
      COULEURS_DE_VERDICT.some((couleur) => fond.startsWith(couleur)),
    );
  }

  // [cas, texte INCI]
  const SANS_EVALUATION: ReadonlyArray<[string, string | null | undefined]> = [
    ['vide', ''],
    ['blanche', '   '],
    ['absente (null en cache)', null],
    ['absente (undefined)', undefined],
    ['non reconnue', 'AQUA (WATER), PARFUM (FRAGRANCE)'],
  ];

  it.each(SANS_EVALUATION)(
    'liste %s : ni « Excellent » ni « Formule propre », mais « Vérification impossible »',
    (_cas, inci) => {
      const { result, queryByText, queryByLabelText, getByText } = rendre(inci);
      // Le moteur n'est pas touché : il rend toujours 100…
      expect(result.score_final).toBe(100);
      // …mais l'écran n'en tire plus aucun verdict, ni à l'œil ni à l'oreille.
      expect(queryByText('Excellent')).toBeNull();
      expect(queryByText(/Formule propre/)).toBeNull();
      expect(queryByLabelText(/Excellent/)).toBeNull();
      // Pas de cercle de score : son libellé vocal annonçait « … sur 100. Excellent. »
      expect(queryByLabelText(/sur 100/)).toBeNull();
      expect(getByText('Vérification impossible')).toBeTruthy();
      expect(getByText(CORPS)).toBeTruthy();
    },
  );

  it.each(SANS_EVALUATION)(
    'liste %s : aucun fond ne prend la couleur d’un verdict (halo neutre)',
    (_cas, inci) => {
      const { toJSON } = rendre(inci);
      expect(fondsDeVerdict(toJSON())).toEqual([]);
    },
  );

  // Contrôle : dès qu'un ingrédient est reconnu, l'évaluation a eu lieu et la
  // note garde son verdict — y compris « Excellent » quand il est mérité.
  const EVALUEES: ReadonlyArray<string> = [
    'Aqua, Glycerin, Sodium Laureth Sulfate',
    'Aqua, Glycerin',
  ];

  it.each(EVALUEES)('liste reconnue « %s » : la note garde son verdict', (inci) => {
    const { result, getByText, getByLabelText, queryByText, toJSON } = rendre(inci);
    expect(getByText(verdictFromScore(result.score_final).label)).toBeTruthy();
    expect(getByLabelText(new RegExp(`: ${result.score_final} sur 100\\.`))).toBeTruthy();
    expect(queryByText('Vérification impossible')).toBeNull();
    // Le détecteur de halo n'est pas aveugle : ici, le halo prend bien la couleur de la note.
    expect(fondsDeVerdict(toJSON())).toContain(`${scoreColor(result.score_final)}14`);
  });

  // Le statut ne masque jamais un contenu de sécurité.
  it('liste non reconnue : la « Liste INCI complète » reste lisible, pour comparer avec l’emballage', () => {
    const { getByText } = rendre('AQUA (WATER), PARFUM (FRAGRANCE)');
    expect(getByText('Liste INCI complète')).toBeTruthy();
  });

  it('texte INCI absent mais ingrédients à risque relevés : ils restent affichés, sans « Formule propre »', () => {
    // Ligne de cache incohérente (texte vide, liste remplie) : le statut dit
    // « non vérifié », et la liste à risque que le moteur a relevée reste visible.
    const product: CosmeticProduct = { ...produitDepuis('Aqua, Methylparaben'), ingredients_inci: '' };
    const result = calculateCosmeticScore(cosmeticToScoringInput(product), 'standard');
    expect(result.risky_ingredients.map((r) => r.inci)).toContain('methylparaben');
    const { getByText, queryByText } = render(
      <CosmeticResultView product={product} result={result} profile="standard" />,
    );
    expect(getByText('Vérification impossible')).toBeTruthy();
    expect(getByText('METHYLPARABEN')).toBeTruthy();
    expect(queryByText(/Formule propre/)).toBeNull();
  });
});

/**
 * S3-3 — quand le profil n'a pas pu être vérifié non plus (D11), le statut
 * « Vérification impossible » porte le bandeau : un seul bloc sous ce titre,
 * qui dit le constat S3-3 et garde le message de sécurité, mot pour mot.
 */
describe('S3-3 — statut et bandeau « Vérification impossible » ne font qu’un', () => {
  const CORPS =
    "Aucun ingrédient de ce produit n'a pu être évalué : la liste INCI est absente ou n'est pas reconnue par Vivo. Vérifie la composition sur l'emballage.";
  const SECURITE = "Vos allergies et restrictions n'ont pas pu être vérifiées.";
  const ALLERGIQUE: CompatibilityProfile = {
    allergies: ['gluten'],
    dietary: [],
    conditions: [],
    avoid: [],
    minScore: 50,
  };

  function rendreAvecProfil(inci: string) {
    const product = normalizeOBFProduct({ code: '3401520107313', ingredients_text: inci });
    const result = calculateCosmeticScore(cosmeticToScoringInput(product), 'standard');
    const compatibilityResult = checkCompatibility(product, result, ALLERGIQUE);
    const ecran = render(
      <CosmeticResultView
        product={product}
        result={result}
        profile="standard"
        compatibilityResult={compatibilityResult}
      />,
    );
    return { compatibilityResult, ...ecran };
  }

  it('liste vide, allergie déclarée : un seul titre, le constat et le message de sécurité', () => {
    const { compatibilityResult, queryAllByText, queryByText } = rendreAvecProfil('');
    expect(compatibilityResult.verificationStatus).toBe('insufficient_data');
    expect(queryAllByText('Vérification impossible')).toHaveLength(1);
    expect(queryByText(CORPS)).toBeTruthy();
    expect(queryByText(SECURITE)).toBeTruthy();
  });

  it('allergène lu dans une liste non reconnue : le statut reste celui de S3-3, le verdict reste au bandeau', () => {
    const { compatibilityResult, getByText, queryByText } = rendreAvecProfil(
      'AQUA (WATER), TRITICUM VULGARE (WHEAT) GERM OIL',
    );
    expect(compatibilityResult.isCompatible).toBe(false);
    expect(getByText(CORPS)).toBeTruthy();
    // « Incompatible » n'est pas absorbé : la fiche le rend plus bas, à sa place.
    expect(queryByText('Incompatible avec votre profil')).toBeNull();
    expect(queryByText(SECURITE)).toBeNull();
  });
});
