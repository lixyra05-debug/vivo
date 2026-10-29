import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import {
  CompatibilityBanner,
  isUnverifiedCompatibility,
  UNVERIFIED_BODY,
  UNVERIFIED_TITLE,
} from '../CompatibilityBanner';
import {
  ALLERGEN_TAG_TO_KEY,
  checkCompatibility,
  INSUFFICIENT_DATA_LABEL_FR,
} from '@/src/lib/scoring/compatibility-engine';
import { isProductCompatible } from '@/src/lib/scoring/profile-filters';
import { normalizeOFFProduct } from '@/src/lib/api/openfoodfacts';
import type { CompatibilityResult, Product, ScoringResult } from '@/src/lib/api/types';
import { Palette } from '@/src/constants/theme';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const compatibleResult: CompatibilityResult = {
  isCompatible: true,
  score: 80,
  incompatibilities: [],
  compatibilityPercentage: 100,
};

const incompatibleResult: CompatibilityResult = {
  isCompatible: false,
  score: 40,
  incompatibilities: [
    {
      type: 'allergy',
      labelFr: 'Contient gluten (allergie déclarée)',
      severity: 'blocker',
    },
    {
      type: 'condition',
      labelFr: 'Sucres élevés (25.0g/100g)',
      severity: 'warning',
    },
  ],
  compatibilityPercentage: 50,
};

/** Nutella sur un profil « fruits à coque » : le motif porte le mot tel que la liste l'écrit. */
const noisettesResult: CompatibilityResult = {
  isCompatible: false,
  score: 80,
  incompatibilities: [
    {
      type: 'allergy',
      labelFr: 'Contient fruits à coque (allergie déclarée)',
      severity: 'blocker',
      matchedText: 'NOISETTES',
    },
  ],
  compatibilityPercentage: 50,
  verificationStatus: 'verified',
  checkedAllergenCount: 1,
};

/** Titres de l'état compatible — recopiés en clair : le test fige la formulation (C5). */
const TITRE_ALLERGENES =
  "Aucun de tes allergènes détecté dans la liste d'ingrédients, vérifie l'étiquette";
const TITRE_GENERIQUE = "Rien de bloquant détecté pour ton profil, vérifie l'étiquette";

describe('CompatibilityBanner', () => {
  it('retourne null si result est null', () => {
    const { toJSON } = render(<CompatibilityBanner result={null} />);
    expect(toJSON()).toBeNull();
  });

  it('parle des allergènes quand au moins une allergie a été cherchée', () => {
    const verifie: CompatibilityResult = {
      ...compatibleResult,
      verificationStatus: 'verified',
      // La frontière : une seule allergie cherchée suffit, c'est le cas le plus courant.
      checkedAllergenCount: 1,
    };
    const { getByText, queryByText } = render(<CompatibilityBanner result={verifie} />);
    expect(getByText(TITRE_ALLERGENES)).toBeTruthy();
    expect(queryByText(TITRE_GENERIQUE)).toBeNull();
  });

  it("affiche les motifs d'incompatibilité quand !isCompatible", () => {
    const { getByText } = render(
      <CompatibilityBanner result={incompatibleResult} />,
    );
    expect(getByText('Incompatible avec ton profil')).toBeTruthy();
    expect(getByText('Contient gluten (allergie déclarée)')).toBeTruthy();
  });

  it("affiche le mot tel que la liste l'écrit sous le motif d'allergie", () => {
    const { getByText } = render(<CompatibilityBanner result={noisettesResult} />);
    // Le libellé du moteur ne change pas : le mot lu s'affiche sur sa propre ligne.
    expect(getByText('Contient fruits à coque (allergie déclarée)')).toBeTruthy();
    expect(getByText('Mot détecté : « NOISETTES »')).toBeTruthy();
  });

  it('« Mot détecté » est écrit en textSecondary : contraste AA sur le fond du bandeau incompatible', () => {
    // textMuted y tombait à 4,10:1 (sous 4,5:1 pour un texte de 12 px) ; textSecondary tient 6,39:1.
    const { getByText } = render(<CompatibilityBanner result={noisettesResult} />);
    const style = StyleSheet.flatten(getByText('Mot détecté : « NOISETTES »').props.style);
    expect(style.color).toBe(Palette.textSecondary);
  });

  it("fait entendre au lecteur d'écran le motif et le mot détecté, pas seulement le verdict", () => {
    const { getByLabelText } = render(<CompatibilityBanner result={noisettesResult} />);
    expect(
      getByLabelText(
        'Incompatible avec ton profil. Contient fruits à coque (allergie déclarée), Mot détecté : « NOISETTES »',
      ),
    ).toBeTruthy();
  });

  it("n'invente aucun mot quand le motif n'en porte pas", () => {
    // Allergène trouvé par un tag seulement (`allergens_tags`, additif) : aucun
    // mot n'a été lu dans la liste, rien ne s'affiche sous le motif.
    const { queryByText } = render(<CompatibilityBanner result={incompatibleResult} />);
    expect(queryByText(/Mot détecté/)).toBeNull();
  });

  it("n'annonce PAS « Compatible » quand la vérification n'a pas pu être faite", () => {
    // Le cas dangereux : allergie déclarée, produit sans liste d'ingrédients.
    // `isCompatible` reste true (aucun blocker levable), mais rien n'a été
    // contrôlé — la bannière doit le dire au lieu de rassurer.
    const unverifiedResult: CompatibilityResult = {
      isCompatible: true,
      score: 100,
      incompatibilities: [
        {
          type: 'condition',
          labelFr: INSUFFICIENT_DATA_LABEL_FR,
          severity: 'warning',
        },
      ],
      compatibilityPercentage: 100,
      verificationStatus: 'insufficient_data',
    };
    const { getByText, queryByText } = render(
      <CompatibilityBanner result={unverifiedResult} />,
    );
    expect(getByText(UNVERIFIED_TITLE)).toBeTruthy();
    expect(getByText(UNVERIFIED_BODY)).toBeTruthy();
    expect(queryByText(TITRE_GENERIQUE)).toBeNull();
    expect(queryByText(TITRE_ALLERGENES)).toBeNull();
  });

  it("« Vérification impossible » l'emporte même quand une allergie a été cherchée", () => {
    // Allergies gluten + une clé inconnue du moteur, liste présente : le gluten a
    // été cherché (checkedAllergenCount 1), l'autre non, et le moteur lève
    // insufficient_data. Le titre rassurant ne doit PAS l'emporter sur
    // « Vérification impossible ». UNVERIFIED_BODY n'est pas figé ici : il parle
    // d'une liste absente, alors qu'elle est présente dans ce cas.
    const partiellementVerifie: CompatibilityResult = {
      isCompatible: true,
      score: 100,
      incompatibilities: [
        { type: 'condition', labelFr: INSUFFICIENT_DATA_LABEL_FR, severity: 'warning' },
      ],
      compatibilityPercentage: 100,
      verificationStatus: 'insufficient_data',
      checkedAllergenCount: 1,
    };
    const { getByText, queryByText } = render(
      <CompatibilityBanner result={partiellementVerifie} />,
    );
    expect(getByText(UNVERIFIED_TITLE)).toBeTruthy();
    expect(queryByText(TITRE_ALLERGENES)).toBeNull();
    expect(queryByText(TITRE_GENERIQUE)).toBeNull();
  });

  it('ne répète pas le motif « données insuffisantes » sous son propre titre', () => {
    const unverifiedResult: CompatibilityResult = {
      isCompatible: true,
      score: 100,
      incompatibilities: [
        { type: 'condition', labelFr: INSUFFICIENT_DATA_LABEL_FR, severity: 'warning' },
      ],
      compatibilityPercentage: 100,
      verificationStatus: 'insufficient_data',
    };
    const { queryByText } = render(<CompatibilityBanner result={unverifiedResult} />);
    expect(queryByText(INSUFFICIENT_DATA_LABEL_FR)).toBeNull();
  });

  it('rend les warnings dans la branche compatible', () => {
    // Diabète seul + 45 g de sucres : aucun blocker, donc état compatible — mais
    // le constat existait et restait invisible. Aucune allergie déclarée : le
    // titre ne doit PAS parler d'allergènes.
    const compatibleWithWarnings: CompatibilityResult = {
      isCompatible: true,
      score: 60,
      incompatibilities: [
        {
          type: 'condition',
          labelFr: 'Sucres élevés (45.0g/100g)',
          severity: 'warning',
        },
      ],
      compatibilityPercentage: 66,
      verificationStatus: 'verified',
      checkedAllergenCount: 0,
    };
    const { getByText, queryByText } = render(
      <CompatibilityBanner result={compatibleWithWarnings} />,
    );
    expect(getByText(TITRE_GENERIQUE)).toBeTruthy();
    expect(queryByText(TITRE_ALLERGENES)).toBeNull();
    expect(getByText('Sucres élevés (45.0g/100g)')).toBeTruthy();
  });

  it('retombe sur le titre générique quand les champs C5 sont absents (données anciennes)', () => {
    const { getByText } = render(<CompatibilityBanner result={compatibleResult} />);
    expect(getByText(TITRE_GENERIQUE)).toBeTruthy();
  });
});

/**
 * Le bandeau tutoie. Tous ses textes — titres, corps, libellés lus par
 * les lecteurs d'écran — dans ses trois états, constat cosmétique compris.
 */
describe('CompatibilityBanner — registre', () => {
  const VOUVOIEMENT = /(?<!\p{L})(vous|votre|vos)(?!\p{L})/iu;
  /** Impératif au vouvoiement (« Vérifiez ») ; « chez », « assez », « nez » n'en sont pas. */
  const IMPERATIF_EZ = /(?<!\p{L})(?!(?:chez|assez|nez)(?!\p{L}))\p{L}+ez(?!\p{L})/iu;

  type Rendu = ReturnType<typeof render>;
  function textesEtLibelles(rendu: Rendu): string[] {
    const out: string[] = [];
    const visit = (node: unknown): void => {
      if (typeof node === 'string') {
        out.push(node);
        return;
      }
      if (!node || typeof node !== 'object') return;
      const n = node as { props?: Record<string, unknown>; children?: unknown[] | null };
      for (const key of ['accessibilityLabel', 'accessibilityHint']) {
        const v = n.props?.[key];
        if (typeof v === 'string') out.push(v);
      }
      n.children?.forEach(visit);
    };
    const tree = rendu.toJSON();
    if (Array.isArray(tree)) tree.forEach(visit);
    else visit(tree);
    return out;
  }

  const unverified: CompatibilityResult = {
    isCompatible: true,
    score: 100,
    incompatibilities: [
      { type: 'condition', labelFr: INSUFFICIENT_DATA_LABEL_FR, severity: 'warning' },
    ],
    compatibilityPercentage: 100,
    verificationStatus: 'insufficient_data',
  };
  const incompatibleCinqMotifs: CompatibilityResult = {
    isCompatible: false,
    score: 40,
    incompatibilities: ['gluten', 'lactose', 'soja', 'sésame', 'moutarde'].map((a) => ({
      type: 'allergy' as const,
      labelFr: `Contient ${a} (allergie déclarée)`,
      severity: 'blocker' as const,
    })),
    compatibilityPercentage: 20,
    verificationStatus: 'verified',
    checkedAllergenCount: 5,
  };
  const compatibleCinqPoints: CompatibilityResult = {
    isCompatible: true,
    score: 60,
    incompatibilities: ['ail', 'oignon', 'miel', 'pomme', 'poire'].map((t) => ({
      type: 'condition' as const,
      labelFr: `Déclencheur FODMAP détecté : ${t}`,
      severity: 'warning' as const,
    })),
    compatibilityPercentage: 50,
    verificationStatus: 'verified',
    checkedAllergenCount: 0,
  };

  it.each<[string, CompatibilityResult, string | undefined]>([
    ['compatible, allergies cherchées', { ...compatibleResult, checkedAllergenCount: 1 }, undefined],
    ['compatible, titre générique', compatibleResult, undefined],
    ['incompatible, mot détecté', noisettesResult, undefined],
    ['vérification impossible', unverified, undefined],
    ['vérification impossible, constat cosmétique', unverified, "Aucun ingrédient de ce produit n'a pu être évalué."],
    ['incompatible, plus de trois motifs', incompatibleCinqMotifs, undefined],
    ['compatible, plus de trois points d’attention', compatibleCinqPoints, undefined],
  ])('%s : aucun texte ne vouvoie', (_cas, result, lead) => {
    const rendu = render(<CompatibilityBanner result={result} unverifiedLead={lead} />);
    const textes = textesEtLibelles(rendu);
    expect(textes.length).toBeGreaterThan(0);
    expect(textes.filter((t) => VOUVOIEMENT.test(t) || IMPERATIF_EZ.test(t))).toEqual([]);
  });

  it('les chemins à plus de trois motifs sont bien rendus, et lus par le garde-fou', () => {
    const incompatible = textesEtLibelles(render(<CompatibilityBanner result={incompatibleCinqMotifs} />));
    expect(incompatible).toContain('Appuyer pour voir tous les motifs');
    expect(incompatible).toContain('+ 2 autres');
    const compatible = textesEtLibelles(render(<CompatibilityBanner result={compatibleCinqPoints} />));
    expect(compatible).toContain("Voir les 2 autres points d'attention");
  });
});

/**
 * Liste vide + profil allergique : le message de sécurité est garanti MOT POUR
 * MOT, de bout en bout — moteur réel, puis bandeau. Le texte est recopié en
 * clair : changer la phrase doit faire tomber ce test.
 */
describe('CompatibilityBanner — liste vide, profil allergique', () => {
  const sansListe = {
    barcode: '0000000000001',
    name: 'Produit test',
    brand: 'Test',
    image_url: null,
    ingredients_raw: '',
    additives_tags: [],
    nova_group: 1,
    nutriscore_grade: null,
    energy_kcal_100g: null,
    sugars_100g: 0,
    saturated_fat_100g: 0,
    salt_100g: 0,
    proteins_100g: 0,
    fiber_100g: 0,
    oil_types: [],
    portion_grams: 100,
    packaging_material: null,
    is_organic: false,
    off_last_updated: null,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  } satisfies Product;
  const scoring: ScoringResult = {
    score_final: 80,
    score_color: 'green',
    nova_group: 1,
    penalties: [],
    blockers: [],
    seed_oils_detected: [],
    clean_labeling_alerts: [],
    profile_adjustments: [],
  };

  // Filets de hareng (27057148) : OFF sert un texte principal et un texte
  // français vides, sans tag. Le parseur en fait `''`, `null` et `[]`.
  const ficheReelle = normalizeOFFProduct({
    code: '27057148',
    product_name: 'filets de hareng',
    ingredients_text: '',
    ingredients_text_fr: '',
    allergens_tags: [],
  });

  it.each<[string, Product]>([
    ['ligne de cache ancienne, sans les champs S1b', sansListe],
    ['fiche OFF réelle normalisée (27057148)', ficheReelle],
  ])("%s : affiche « Tes allergies et restrictions n'ont pas pu être vérifiées. » mot pour mot", (_forme, produit) => {
    const result = checkCompatibility(produit, scoring, {
      allergies: ['gluten'],
      dietary: [],
      conditions: [],
      avoid: [],
      minScore: 0,
    });
    expect(result.verificationStatus).toBe('insufficient_data');
    const { getByText } = render(<CompatibilityBanner result={result} />);
    expect(getByText(UNVERIFIED_TITLE)).toBeTruthy();
    expect(
      getByText(
        "La liste d'ingrédients de ce produit n'est pas disponible. Tes allergies et restrictions n'ont pas pu être vérifiées.",
      ),
    ).toBeTruthy();
  });

  // Lot S1b, (b2) — garde. Une déclaration ne vaut que pour ce qu'elle nomme :
  // une fiche sans aucun texte qui déclare du lait ne dit rien du gluten. Le
  // tag présent ne doit jamais rendre « compatible » l'allergène qu'il ne nomme
  // pas — ni sur le bandeau, ni dans les listes « Compatibles ».
  it('tags présents, aucun texte, allergène absent des tags : « Vérification impossible », jamais compatible', () => {
    const sansTexte = (tag: string): Product =>
      normalizeOFFProduct({ code: '0000000000002', ingredients_text: '', ingredients_text_fr: '', allergens_tags: [tag] });
    const allergique = (allergie: string) => ({
      allergies: [allergie],
      dietary: [],
      conditions: [],
      avoid: [],
      minScore: 0,
    });

    // Le cas type, de bout en bout : moteur réel, puis bandeau.
    const result = checkCompatibility(sansTexte('en:milk'), scoring, allergique('gluten'));
    expect([result.isCompatible, result.verificationStatus]).toEqual([true, 'insufficient_data']);
    const { getByText, queryByText } = render(<CompatibilityBanner result={result} />);
    expect(getByText(UNVERIFIED_TITLE)).toBeTruthy();
    expect(
      getByText(
        "La liste d'ingrédients de ce produit n'est pas disponible. Tes allergies et restrictions n'ont pas pu être vérifiées.",
      ),
    ).toBeTruthy();
    expect(queryByText(TITRE_ALLERGENES)).toBeNull();
    expect(queryByText(TITRE_GENERIQUE)).toBeNull();

    // Chacun des 14 tags canoniques, face à chacune des 13 autres allergies.
    const ecarts: string[] = [];
    for (const [tag, cle] of Object.entries(ALLERGEN_TAG_TO_KEY)) {
      for (const allergie of Object.values(ALLERGEN_TAG_TO_KEY)) {
        if (allergie === cle) continue;
        const produit = sansTexte(tag);
        const r = checkCompatibility(produit, scoring, allergique(allergie));
        if (!isUnverifiedCompatibility(r) || isProductCompatible(produit, scoring, allergique(allergie))) {
          ecarts.push(`${tag} × ${allergie}`);
        }
      }
    }
    expect(ecarts).toEqual([]);
  });
});

/**
 * S3-3 — un bloc qui porte l'état « Vérification impossible » à la place du
 * bandeau (cosmétique dont aucun ingrédient n'a été évalué) remplace la phrase
 * générique par son propre constat. Le message de sécurité, lui, ne change
 * jamais : il est figé ici mot pour mot.
 */
describe('CompatibilityBanner — S3-3, constat propre au produit', () => {
  const SECURITE = "Tes allergies et restrictions n'ont pas pu être vérifiées.";
  const CONSTAT = "Aucun ingrédient de ce produit n'a pu être évalué.";
  const unverifiedResult: CompatibilityResult = {
    isCompatible: true,
    score: 100,
    incompatibilities: [
      { type: 'condition', labelFr: INSUFFICIENT_DATA_LABEL_FR, severity: 'warning' },
    ],
    compatibilityPercentage: 100,
    verificationStatus: 'insufficient_data',
  };

  it('le corps générique se termine par le message de sécurité, mot pour mot', () => {
    expect(UNVERIFIED_BODY.endsWith(SECURITE)).toBe(true);
  });

  it('avec un constat : il remplace la phrase générique, le message de sécurité reste', () => {
    const { queryAllByText, queryByText } = render(
      <CompatibilityBanner result={unverifiedResult} unverifiedLead={CONSTAT} />,
    );
    expect(queryAllByText(UNVERIFIED_TITLE)).toHaveLength(1);
    expect(queryByText(CONSTAT)).toBeTruthy();
    expect(queryByText(SECURITE)).toBeTruthy();
    expect(queryByText(UNVERIFIED_BODY)).toBeNull();
  });

  it('le constat ne change rien aux états compatible et incompatible', () => {
    for (const result of [compatibleResult, incompatibleResult]) {
      const { queryByText, unmount } = render(
        <CompatibilityBanner result={result} unverifiedLead={CONSTAT} />,
      );
      expect([result.isCompatible, queryByText(CONSTAT)]).toEqual([result.isCompatible, null]);
      unmount();
    }
  });
});
