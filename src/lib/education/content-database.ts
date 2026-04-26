/**
 * Base de cartes éducatives — 22 cartes avec sources scientifiques.
 *
 * Chaque carte cite EFSA / ANSES / OMS / Inserm / CIRC / FDA / ECHA / ANSM /
 * Santé Publique France / Monteiro 2019. Tonalité contrôlée (informative par défaut,
 * positive pour rassurer, warning réservé aux blockers OMS et NOVA 4).
 */

import type { EducationalCard, EducationalTone } from '../gamification/types';

/**
 * Catalogue ordonné des 22 cartes.
 */
export const EDUCATIONAL_CARDS: EducationalCard[] = [
  // ─── Additifs (5) ─────────────────────────────────────────────────────────
  {
    id: 'e171',
    trigger: { type: 'additive', codes: ['e171'] },
    titleFr: 'Dioxyde de titane (E171) : interdit en France',
    bodyFr:
      "Depuis 2020, le E171 est interdit dans les denrées alimentaires en France suite à un avis ANSES de 2019 sur la génotoxicité. Encore présent dans certains produits importés.",
    source: 'ANSES',
    sourceUrl: 'https://www.anses.fr/fr/content/dioxyde-de-titane-e171',
    tone: 'warning',
  },
  {
    id: 'e950',
    trigger: { type: 'additive', codes: ['e950'] },
    titleFr: 'Acésulfame K (E950) : édulcorant à dose contrôlée',
    bodyFr:
      "L'EFSA a fixé une DJA de 9 mg/kg/jour. Présent dans de nombreux produits 'sans sucre'. Pas de cancérogénicité démontrée mais effet sur le microbiote en cours d'étude.",
    source: 'EFSA',
    sourceUrl: 'https://www.efsa.europa.eu/en/efsajournal/pub/2092',
    tone: 'informative',
  },
  {
    id: 'e621',
    trigger: { type: 'additive', codes: ['e621'] },
    titleFr: 'Glutamate (E621) : exhausteur courant',
    bodyFr:
      "Reconnu sûr par l'OMS dans les usages alimentaires. Certains rapportent des sensibilités personnelles. Recommandé en consommation modérée.",
    source: 'OMS',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    tone: 'informative',
  },
  {
    id: 'e330',
    trigger: { type: 'additive', codes: ['e330'] },
    titleFr: 'Acide citrique (E330) : sans souci',
    bodyFr:
      "Naturellement présent dans les agrumes, l'acide citrique est l'un des additifs les plus sûrs. Utilisé comme acidifiant ou antioxydant. Aucune restriction.",
    source: 'EFSA',
    sourceUrl: 'https://www.efsa.europa.eu/fr',
    tone: 'positive',
  },
  {
    id: 'e322',
    trigger: { type: 'additive', codes: ['e322'] },
    titleFr: 'Lécithine de soja (E322) : émulsifiant courant',
    bodyFr:
      "Extraite du soja, la lécithine est généralement reconnue comme sûre (GRAS, FDA). Présente dans le chocolat, les sauces. Bien tolérée hors allergie au soja.",
    source: 'FDA',
    sourceUrl:
      'https://www.fda.gov/food/food-additives-petitions/food-additive-status-list',
    tone: 'informative',
  },

  // ─── Ingrédients (5) ──────────────────────────────────────────────────────
  {
    id: 'palm_oil',
    trigger: {
      type: 'ingredient',
      keywords: ['huile de palme', 'palme', 'palm'],
    },
    titleFr: 'Huile de palme : ce qu\'il faut savoir',
    bodyFr:
      "Riche en acides gras saturés (50%), elle est associée à la déforestation. L'OMS recommande de limiter les graisses saturées à <10% de l'apport énergétique.",
    source: 'OMS',
    sourceUrl: 'https://www.who.int/fr/news-room/fact-sheets/detail/healthy-diet',
    tone: 'informative',
  },
  {
    id: 'seed_oils',
    trigger: {
      type: 'ingredient',
      keywords: [
        'huile de tournesol',
        'huile de soja',
        'huile de colza',
        'huile de maïs',
      ],
    },
    titleFr: 'Huiles de graines : équilibre oméga-6/3',
    bodyFr:
      "Très riches en oméga-6, elles peuvent déséquilibrer le ratio recommandé (4:1 oméga-6/oméga-3). L'Inserm rappelle l'importance de varier les sources de matières grasses.",
    source: 'Inserm',
    sourceUrl: 'https://www.inserm.fr/dossier/nutrition/',
    tone: 'informative',
  },
  {
    id: 'added_sugars',
    trigger: {
      type: 'ingredient',
      keywords: [
        'sucre',
        'sirop de glucose',
        'sirop de fructose',
        'dextrose',
        'saccharose',
      ],
    },
    titleFr: 'Sucres ajoutés : seuil OMS',
    bodyFr:
      "L'OMS recommande de limiter les sucres libres à moins de 10% de l'apport énergétique (≈25g/jour pour un adulte). Au-delà : risques cariogènes et métaboliques.",
    source: 'OMS',
    sourceUrl: 'https://www.who.int/fr/news-room/fact-sheets/detail/healthy-diet',
    tone: 'informative',
  },
  {
    id: 'salt',
    trigger: { type: 'ingredient', keywords: ['sel', 'sodium'] },
    titleFr: 'Sel : moins de 5g par jour',
    bodyFr:
      "L'OMS préconise <5g de sel/jour (≈2g de sodium). Une réduction même modérée diminue le risque cardiovasculaire selon Santé Publique France.",
    source: 'OMS',
    sourceUrl: 'https://www.who.int/fr/news-room/fact-sheets/detail/salt-reduction',
    tone: 'informative',
  },
  {
    id: 'aspartame',
    trigger: { type: 'ingredient', keywords: ['aspartame', 'e951'] },
    titleFr: 'Aspartame : classification CIRC 2023',
    bodyFr:
      "Le CIRC a classé l'aspartame 'possiblement cancérogène' (groupe 2B) en juillet 2023. La DJA reste fixée à 40 mg/kg/jour par l'EFSA.",
    source: 'CIRC',
    sourceUrl:
      'https://www.iarc.who.int/news-events/aspartame-hazard-and-risk-assessment-results-released/',
    tone: 'informative',
  },

  // ─── Scores (3) ───────────────────────────────────────────────────────────
  {
    id: 'score_low',
    trigger: { type: 'score', max: 30 },
    titleFr: 'Ce produit cumule plusieurs alertes',
    bodyFr:
      "Plusieurs critères pèsent sur ce score (additifs, ultra-transformation, etc.). Lis le détail des pénalités pour comprendre les choix d'amélioration possibles.",
    source: 'Vivo',
    sourceUrl: 'https://www.vivo-app.fr',
    tone: 'informative',
  },
  {
    id: 'score_excellent',
    trigger: { type: 'score', min: 90 },
    titleFr: 'Excellent choix !',
    bodyFr:
      'Score >90 : transformation minimale, peu d\'additifs, profil nutritionnel équilibré. Continue comme ça !',
    source: 'Vivo',
    sourceUrl: 'https://www.vivo-app.fr',
    tone: 'positive',
  },
  {
    id: 'nova_4',
    trigger: {
      type: 'ingredient',
      keywords: ['nova 4', 'ultra-transformé', 'ultra-transforme'],
    },
    titleFr: 'Ultra-transformés (NOVA 4) : c\'est quoi ?',
    bodyFr:
      "La classification NOVA (Monteiro 2019) identifie les produits qui combinent additifs cosmétiques et ingrédients industriels. Une consommation régulière est associée à une moins bonne santé métabolique.",
    source: 'Monteiro 2019',
    sourceUrl:
      'https://www.cambridge.org/core/journals/public-health-nutrition/article/ultraprocessed-foods-what-they-are-and-how-to-identify-them/E6D744D714B1FF09D5BCA3E74D53A185',
    tone: 'informative',
  },

  // ─── Cosmétiques (5) ──────────────────────────────────────────────────────
  {
    id: 'parabens',
    trigger: {
      type: 'ingredient',
      keywords: [
        'paraben',
        'methylparaben',
        'propylparaben',
        'butylparaben',
        'ethylparaben',
      ],
    },
    titleFr: 'Parabènes : perturbateurs suspectés',
    bodyFr:
      "Plusieurs parabènes (notamment butylparaben, propylparaben) sont suspectés d'effet perturbateur endocrinien. L'ANSES recommande de limiter l'exposition, particulièrement chez les jeunes enfants et femmes enceintes.",
    source: 'ANSES',
    sourceUrl: 'https://www.anses.fr/fr/content/perturbateurs-endocriniens',
    tone: 'warning',
  },
  {
    id: 'sls_sles',
    trigger: {
      type: 'ingredient',
      keywords: [
        'sodium lauryl sulfate',
        'sodium laureth sulfate',
        'sls',
        'sles',
      ],
    },
    titleFr: 'SLS / SLES : tensioactifs irritants',
    bodyFr:
      "Le Sodium Lauryl Sulfate peut être irritant à concentration élevée selon le CIR (Cosmetic Ingredient Review). À éviter sur peau sensible ou eczéma.",
    source: 'CIR',
    sourceUrl: 'https://www.cir-safety.org/',
    tone: 'informative',
  },
  {
    id: 'silicones',
    trigger: {
      type: 'ingredient',
      keywords: [
        'dimethicone',
        'cyclopentasiloxane',
        'cyclomethicone',
        'silicone',
      ],
    },
    titleFr: 'Silicones : occlusifs et environnement',
    bodyFr:
      "Les silicones forment un film occlusif sur la peau ou les cheveux. L'ECHA examine certains (D4, D5) pour leur persistance environnementale. Innocuité cutanée OK.",
    source: 'ECHA',
    sourceUrl: 'https://echa.europa.eu/',
    tone: 'informative',
  },
  {
    id: 'phenoxyethanol',
    trigger: { type: 'ingredient', keywords: ['phenoxyethanol'] },
    titleFr: 'Phenoxyethanol : restriction <3 ans',
    bodyFr:
      "Conservateur autorisé jusqu'à 1%, mais l'ANSM recommande de l'éviter dans les produits du siège pour les enfants <3 ans (avis 2012).",
    source: 'ANSM',
    sourceUrl: 'https://ansm.sante.fr/',
    tone: 'informative',
  },
  {
    id: 'natural_not_safer',
    trigger: {
      type: 'ingredient',
      keywords: ['huile essentielle', 'extrait naturel', '100% naturel'],
    },
    titleFr: 'Naturel ≠ toujours plus sûr',
    bodyFr:
      "Les huiles essentielles peuvent être très allergisantes. 'Naturel' n'implique pas innocuité — chaque ingrédient mérite une évaluation, surtout en cosmétique pour bébé ou peau sensible.",
    source: 'ANSES',
    sourceUrl: 'https://www.anses.fr/fr',
    tone: 'informative',
  },

  // ─── Généraux (4) ─────────────────────────────────────────────────────────
  {
    id: 'nutriscore',
    trigger: { type: 'category', slug: 'food' },
    titleFr: 'Comment lire le Nutri-Score',
    bodyFr:
      "Le Nutri-Score (A-E) est un outil officiel de Santé Publique France évaluant la qualité nutritionnelle pour 100g. Il est complémentaire au score Vivo qui prend en compte les additifs et le degré de transformation.",
    source: 'Santé Publique France',
    sourceUrl:
      'https://www.santepubliquefrance.fr/determinants-de-sante/nutrition-et-activite-physique/articles/nutri-score',
    tone: 'informative',
  },
  {
    id: 'nova_classification',
    trigger: { type: 'category', slug: 'food' },
    titleFr: 'Les 4 niveaux de transformation NOVA',
    bodyFr:
      "NOVA 1 : aliments bruts. NOVA 2 : ingrédients culinaires. NOVA 3 : aliments transformés. NOVA 4 : ultra-transformés. Plus le niveau est élevé, plus la santé métabolique en pâtit (Monteiro 2019).",
    source: 'Monteiro 2019',
    sourceUrl:
      'https://www.cambridge.org/core/journals/public-health-nutrition/article/ultraprocessed-foods-what-they-are-and-how-to-identify-them/E6D744D714B1FF09D5BCA3E74D53A185',
    tone: 'informative',
  },
  {
    id: 'e120',
    trigger: { type: 'additive', codes: ['e120'] },
    titleFr: 'Cochenille (E120) : colorant naturel d\'origine animale',
    bodyFr:
      "Colorant rouge issu de cochenilles. Allergisant chez les sujets sensibles. Non vegan. Innocuité validée EFSA mais étiquetage obligatoire.",
    source: 'EFSA',
    sourceUrl: 'https://www.efsa.europa.eu/fr',
    tone: 'informative',
  },
  {
    id: 'palm_certified',
    trigger: {
      type: 'ingredient',
      keywords: ['huile de palme durable', 'rspo'],
    },
    titleFr: 'Huile de palme certifiée : un mieux',
    bodyFr:
      "Certaines huiles de palme certifiées RSPO réduisent l'impact déforestation. Reste un acide gras très saturé : modération recommandée.",
    source: 'RSPO',
    sourceUrl: 'https://rspo.org/',
    tone: 'informative',
  },

  // ─── Ingrédients bénéfiques (4 positives) ─────────────────────────────────
  {
    id: 'garlic_cardio',
    trigger: { type: 'ingredient', keywords: ['ail'] },
    titleFr: 'Ail : un allié cardiovasculaire modeste',
    bodyFr:
      "Méta-analyses Cochrane : effet léger sur la pression artérielle et le cholestérol grâce aux composés soufrés (allicine). Bénéfice modeste, à intégrer dans une alimentation variée — pas un substitut au traitement.",
    source: 'Cochrane',
    sourceUrl:
      'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007653.pub2/full',
    tone: 'positive',
  },
  {
    id: 'cruciferous',
    trigger: {
      type: 'ingredient',
      keywords: ['brocoli', 'chou', 'cresson', 'chou-fleur', 'chou kale'],
    },
    titleFr: 'Légumes crucifères : riches en sulforaphane',
    bodyFr:
      "Brocoli, chou, cresson… Ces légumes apportent fibres, vitamines et glucosinolates (sulforaphane). L'EFSA confirme leur intérêt nutritionnel. PNNS : viser 5 fruits et légumes par jour, dont des crucifères régulièrement.",
    source: 'EFSA',
    sourceUrl: 'https://www.efsa.europa.eu/fr/topics/topic/food-based-dietary-guidelines',
    tone: 'positive',
  },
  {
    id: 'berries_antioxidant',
    trigger: {
      type: 'ingredient',
      keywords: ['myrtille', 'cassis', 'fraise', 'framboise', 'mûre'],
    },
    titleFr: 'Fruits rouges : anthocyanes et fibres',
    bodyFr:
      "Myrtilles, cassis, fraises, framboises sont riches en anthocyanes (antioxydants) et en fibres. L'EFSA reconnaît leur valeur nutritionnelle. Frais ou surgelés — privilégier les versions sans sucre ajouté.",
    source: 'EFSA',
    sourceUrl: 'https://www.efsa.europa.eu/fr',
    tone: 'positive',
  },
  {
    id: 'calming_herbs',
    trigger: {
      type: 'ingredient',
      keywords: ['camomille', 'tilleul', 'mélisse', 'melisse'],
    },
    titleFr: 'Camomille, tilleul, mélisse : effet apaisant léger',
    bodyFr:
      "Les monographies de l'EMA reconnaissent un usage traditionnel pour favoriser le sommeil et apaiser la nervosité légère. Effet modeste, bonne tolérance. Demander conseil pendant la grossesse.",
    source: 'EMA',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal',
    tone: 'positive',
  },

  // ─── Mises en garde (5 warnings) ──────────────────────────────────────────
  {
    id: 'honey_infant_warning',
    trigger: { type: 'ingredient', keywords: ['miel'] },
    titleFr: 'Miel : interdit avant 1 an (botulisme)',
    bodyFr:
      "L'ANSES rappelle de ne pas donner de miel aux nourrissons de moins d'un an : risque de botulisme infantile. Au-delà, méta-analyse Cochrane : utile pour calmer la toux nocturne (>1 an).",
    source: 'Cochrane',
    sourceUrl:
      'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007094.pub5/full',
    tone: 'warning',
  },
  {
    id: 'licorice_bp',
    trigger: {
      type: 'ingredient',
      keywords: ['réglisse', 'reglisse', 'glycyrrhizine', 'glycyrrhizinique'],
    },
    titleFr: 'Réglisse : risque d\'hypertension',
    bodyFr:
      "L'EFSA (avis 2008) limite l'apport en glycyrrhizine à 100 mg/jour : au-delà, risque d'hypertension, rétention d'eau et hypokaliémie. À éviter en cas d'HTA, grossesse, ou traitement cardiovasculaire.",
    source: 'EFSA',
    sourceUrl: 'https://www.efsa.europa.eu/en/efsajournal/pub/728',
    tone: 'warning',
  },
  {
    id: 'st_johns_wort_interactions',
    trigger: {
      type: 'ingredient',
      keywords: ['mille-pertuis', 'millepertuis', 'hypericum'],
    },
    titleFr: 'Mille-pertuis : interactions médicamenteuses majeures',
    bodyFr:
      "L'ANSM met en garde : le mille-pertuis interagit avec contraceptifs oraux, antidépresseurs, anticoagulants, immunosuppresseurs et antirétroviraux. Demander conseil au médecin ou pharmacien avant tout usage.",
    source: 'ANSM',
    sourceUrl:
      'https://ansm.sante.fr/dossiers-thematiques/medicaments-a-base-de-plantes',
    tone: 'warning',
  },
  {
    id: 'wild_mushrooms',
    trigger: {
      type: 'ingredient',
      keywords: [
        'cèpe',
        'cepe',
        'girolle',
        'morille',
        'champignon sauvage',
        'champignon des bois',
      ],
    },
    titleFr: 'Champignons sauvages : risque d\'intoxication',
    bodyFr:
      "L'ANSES rappelle que les champignons sauvages sont la 1ʳᵉ cause d'intoxication alimentaire en France à l'automne. À ne consommer qu'après identification formelle par un mycologue ou un pharmacien.",
    source: 'ANSES',
    sourceUrl: 'https://www.anses.fr/fr/content/champignons-soyez-vigilants',
    tone: 'warning',
  },
  {
    id: 'ultra_processed_risk',
    trigger: {
      type: 'ingredient',
      keywords: ['ultra-transformé', 'ultra-transforme', 'ultratransformé'],
    },
    titleFr: 'Ultra-transformés : risque cardiométabolique',
    bodyFr:
      "L'ANSES et plusieurs cohortes européennes (NutriNet-Santé) associent une consommation élevée d'ultra-transformés (NOVA 4) à un sur-risque cardiovasculaire, métabolique et de cancer. À limiter au quotidien.",
    source: 'ANSES',
    sourceUrl:
      'https://www.anses.fr/fr/content/aliments-ultra-transform%C3%A9s-de-quoi-parle-t-on',
    tone: 'warning',
  },
];

/**
 * Ordre de tri des tonalités (warning d'abord — on veut alerter en priorité).
 */
const TONE_ORDER: Record<EducationalTone, number> = {
  warning: 0,
  informative: 1,
  positive: 2,
};

/**
 * Normalise un tag d'additif Open Food Facts (`en:e171` → `e171`).
 */
function normalizeAdditiveTag(tag: string): string {
  return tag.toLowerCase().replace(/^[a-z]{2}:/, '');
}

/**
 * Vérifie si une carte matche le contexte produit + score.
 */
function cardMatches(
  card: EducationalCard,
  context: {
    additivesNormalized: Set<string>;
    ingredientsText: string;
    categorySlug: string | null;
    score: number;
  }
): boolean {
  const t = card.trigger;
  switch (t.type) {
    case 'additive':
      return t.codes.some((code) =>
        context.additivesNormalized.has(code.toLowerCase())
      );
    case 'ingredient':
      return t.keywords.some((kw) =>
        context.ingredientsText.includes(kw.toLowerCase())
      );
    case 'category':
      return context.categorySlug !== null && context.categorySlug === t.slug;
    case 'score': {
      const minOk = t.min === undefined || context.score >= t.min;
      const maxOk = t.max === undefined || context.score <= t.max;
      // au moins une borne doit être définie
      if (t.min === undefined && t.max === undefined) return false;
      return minOk && maxOk;
    }
    default:
      return false;
  }
}

/**
 * Trouve les cartes pertinentes pour un produit donné.
 *
 * Tri : warning > informative > positive ; à tonalité égale, ordre du catalogue.
 *
 * @param product       champs minimaux (additives_tags, ingredients, category)
 * @param scoringResult score final (0-100)
 * @param maxCards      nombre max retourné (défaut 2)
 */
export function findRelevantCards(
  product: {
    additives_tags?: string[];
    ingredients_raw?: string | null;
    ingredients_inci?: string | null;
    category_slug?: string | null;
  },
  scoringResult: { score_final: number },
  maxCards: number = 2
): EducationalCard[] {
  const additivesNormalized = new Set<string>(
    (product.additives_tags ?? []).map(normalizeAdditiveTag)
  );
  const ingredientsText = (
    (product.ingredients_raw ?? '') +
    ' ' +
    (product.ingredients_inci ?? '')
  ).toLowerCase();
  const categorySlug = product.category_slug ?? null;
  const score = scoringResult.score_final;

  const matched: Array<{ card: EducationalCard; index: number }> = [];
  EDUCATIONAL_CARDS.forEach((card, index) => {
    if (
      cardMatches(card, {
        additivesNormalized,
        ingredientsText,
        categorySlug,
        score,
      })
    ) {
      matched.push({ card, index });
    }
  });

  matched.sort((a, b) => {
    const ta = TONE_ORDER[a.card.tone];
    const tb = TONE_ORDER[b.card.tone];
    if (ta !== tb) return ta - tb;
    return a.index - b.index;
  });

  return matched.slice(0, maxCards).map((m) => m.card);
}
