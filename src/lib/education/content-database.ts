/**
 * Base de cartes éducatives — 65 cartes avec sources scientifiques.
 *
 * Chaque carte cite EFSA / ANSES / OMS / Inserm / CIRC / FDA / ECHA / ANSM /
 * Santé Publique France / Monteiro 2019 / EMA HMPC / Cochrane / Règlement UE.
 * Tonalité contrôlée (informative par défaut, positive pour rassurer, warning
 * réservé aux blockers OMS, NOVA 4 et phytothérapie à risque).
 */

import type { EducationalCard, EducationalTone } from '../gamification/types';

/**
 * Catalogue ordonné des 65 cartes (22 originales + 9 Beauvillard + 34 phytothérapie Premium).
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

  // ─── Phytothérapie Premium — positives & informatives (24) ────────────────
  {
    id: 'thyme_respiratory',
    trigger: {
      type: 'ingredient',
      keywords: ['thym', 'thyme', 'thymol', 'thymus vulgaris'],
    },
    titleFr: 'Thym — antiseptique respiratoire reconnu',
    bodyFr:
      "Le thym contient du thymol et du carvacrol. L'EMA reconnaît un usage médical bien établi pour la toux productive associée au rhume. Huile essentielle déconseillée chez l'enfant <6 ans, en grossesse et allaitement.",
    source: 'EMA/HMPC/342334/2013',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/thymi-herba',
    tone: 'positive',
  },
  {
    id: 'ivy_cough',
    trigger: {
      type: 'ingredient',
      keywords: ['lierre', 'hedera helix', 'ivy'],
    },
    titleFr: 'Lierre grimpant — toux grasse productive',
    bodyFr:
      "Les feuilles de lierre grimpant contiennent des saponines (hédéragénine). L'EMA reconnaît un usage médical bien établi pour la toux productive du rhume, y compris chez l'enfant. Baies toxiques — préparations pharmaceutiques uniquement.",
    source: 'EMA/HMPC/289430/2009',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/hederae-helicis-folium',
    tone: 'positive',
  },
  {
    id: 'peppermint_ibs_dyspepsia',
    trigger: {
      type: 'ingredient',
      keywords: ['menthe poivrée', 'menthe poivree', 'mentha piperita', 'peppermint'],
    },
    titleFr: 'Menthe poivrée — digestion et SII',
    bodyFr:
      "L'EMA reconnaît un usage médical bien établi pour les troubles digestifs (ballonnements, dyspepsie) et le syndrome de l'intestin irritable, en huile gastro-résistante. Déconseillée en cas de reflux, calculs biliaires, grossesse et chez l'enfant <8 ans.",
    source: 'EMA/HMPC/522409/2013',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/menthae-piperitae-folium',
    tone: 'positive',
  },
  {
    id: 'willow_aspirin_precursor',
    trigger: {
      type: 'ingredient',
      keywords: ['saule', 'salix', 'salicine'],
    },
    titleFr: 'Saule blanc — précurseur naturel de l\'aspirine',
    bodyFr:
      "L'écorce de saule blanc contient de la salicine, précurseur naturel de l'acide acétylsalicylique. L'EMA reconnaît un usage médical bien établi pour les douleurs articulaires mineures et les états fébriles légers. Déconseillé chez l'enfant <18 ans (syndrome de Reye) et sous anticoagulants.",
    source: 'EMA/HMPC/80628/2007',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/salicis-cortex',
    tone: 'positive',
  },
  {
    id: 'horse_chestnut_venous',
    trigger: {
      type: 'ingredient',
      keywords: ['marronnier', 'aesculus', 'escine', 'horse chestnut'],
    },
    titleFr: 'Marronnier d\'Inde — jambes lourdes',
    bodyFr:
      "La graine de marronnier d'Inde contient de l'escine. L'EMA reconnaît un usage médical bien établi pour les symptômes d'insuffisance veineuse chronique : jambes lourdes, sensation d'œdème. Déconseillé en grossesse, allaitement et chez l'enfant <18 ans.",
    source: 'EMA/HMPC/225319/2008',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/hippocastani-semen',
    tone: 'positive',
  },
  {
    id: 'red_vine_venous',
    trigger: {
      type: 'ingredient',
      keywords: ['vigne rouge', 'vitis vinifera', 'red vine'],
    },
    titleFr: 'Vigne rouge — jambes lourdes',
    bodyFr:
      "La feuille de vigne rouge contient des proanthocyanidines (OPC). L'EMA reconnaît un usage médical bien établi pour les symptômes d'insuffisance veineuse chronique : jambes lourdes, sensation de tension. Déconseillée en grossesse et chez l'enfant <18 ans.",
    source: 'EMA/HMPC/16635/2009',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/vitis-viniferae-folium',
    tone: 'positive',
  },
  {
    id: 'flaxseed_transit',
    trigger: {
      type: 'ingredient',
      keywords: ['lin', 'linum', 'flaxseed', 'graines de lin'],
    },
    titleFr: 'Graines de lin — transit intestinal',
    bodyFr:
      "Les graines de lin sont riches en mucilages et fibres. L'EMA reconnaît un usage médical bien établi pour la constipation. À consommer avec un grand verre d'eau (150-200 mL par cuillerée). Déconseillé en cas d'occlusion intestinale ou sténose œsophagienne.",
    source: 'EMA/HMPC/377674/2013',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/lini-semen',
    tone: 'positive',
  },
  {
    id: 'calendula_skin',
    trigger: {
      type: 'ingredient',
      keywords: ['calendula', 'souci', 'calendula officinalis'],
    },
    titleFr: 'Calendula — peau et cicatrisation',
    bodyFr:
      "La fleur de calendula bénéficie d'un usage médical bien établi reconnu par l'EMA pour les inflammations cutanées légères et la cicatrisation des plaies superficielles. Allergie aux Astéracées : à éviter. Plaies étendues : avis médical.",
    source: 'EMA/HMPC/603409/2007',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/calendulae-flos',
    tone: 'positive',
  },
  {
    id: 'oat_betaglucan_cholesterol',
    trigger: {
      type: 'ingredient',
      keywords: ['avoine', 'oat', 'oats', 'beta-glucan', 'avena sativa'],
    },
    titleFr: 'Avoine — bêta-glucane et cholestérol',
    bodyFr:
      "Le bêta-glucane d'avoine bénéficie d'une allégation santé autorisée par la Commission européenne : contribue au maintien d'une cholestérolémie normale (≥3 g/jour) et à la diminution de la glycémie postprandiale.",
    source: 'Règlement UE 432/2012 — Health claim ID 754/757',
    sourceUrl:
      'https://ec.europa.eu/food/safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-nutrition-and-health-claims_en',
    tone: 'positive',
  },
  {
    id: 'barley_betaglucan_cholesterol',
    trigger: {
      type: 'ingredient',
      keywords: ['orge', 'barley', 'hordeum vulgare'],
    },
    titleFr: 'Orge — bêta-glucane et cholestérol',
    bodyFr:
      "Le bêta-glucane d'orge bénéficie d'allégations santé autorisées par la Commission européenne : maintien d'un cholestérol normal (≥3 g/jour) et glycémie postprandiale. Maladie cœliaque : à éviter (gluten d'orge).",
    source: 'Règlement UE 432/2012 — Health claim ID 753/821/824',
    sourceUrl:
      'https://ec.europa.eu/food/safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-nutrition-and-health-claims_en',
    tone: 'positive',
  },
  {
    id: 'carrot_vitamin_a',
    trigger: {
      type: 'ingredient',
      keywords: ['carotte', 'carrot', 'beta-carotene', 'bêta-carotène', 'daucus carota'],
    },
    titleFr: 'Carotte — bêta-carotène et vision',
    bodyFr:
      "La carotte est riche en bêta-carotène, précurseur de la vitamine A. Allégation santé autorisée par l'UE : la vitamine A contribue au maintien d'une vision normale et au fonctionnement normal du système immunitaire.",
    source: 'Règlement UE 432/2012 — Health claim ID 16/17',
    sourceUrl:
      'https://ec.europa.eu/food/safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-nutrition-and-health-claims_en',
    tone: 'positive',
  },
  {
    id: 'hops_sleep_nervosity',
    trigger: {
      type: 'ingredient',
      keywords: ['houblon', 'humulus', 'hops', 'hop'],
    },
    titleFr: 'Houblon — sommeil et nervosité légère',
    bodyFr:
      "Les cônes de houblon sont reconnus par l'EMA pour un usage traditionnel : nervosité légère et troubles du sommeil mineurs. Déconseillé en grossesse, allaitement et chez l'enfant <12 ans. Prudence chez les conducteurs (somnolence).",
    source: 'EMA/HMPC/418902/2005',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/lupuli-flos',
    tone: 'positive',
  },
  {
    id: 'chicory_inulin_transit',
    trigger: {
      type: 'ingredient',
      keywords: ['chicorée', 'chicoree', 'cichorium', 'inuline', 'chicory', 'inulin'],
    },
    titleFr: 'Chicorée — transit et digestion',
    bodyFr:
      "La racine de chicorée est reconnue par l'EMA pour un usage digestif traditionnel. Son inuline (fibre prébiotique) bénéficie d'une allégation EFSA pour le transit intestinal (≥12 g/jour). Allergie aux Astéracées : à éviter.",
    source: 'EMA/HMPC/113041/2010 + EFSA Health Claim ID 4226',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/cichorii-radix',
    tone: 'informative',
  },
  {
    id: 'anise_digestion_cough',
    trigger: {
      type: 'ingredient',
      keywords: ['anis', 'anise', 'pimpinella anisum'],
    },
    titleFr: 'Anis vert — digestion et toux légère',
    bodyFr:
      "Les graines d'anis vert sont reconnues par l'EMA pour un usage traditionnel : ballonnements, flatulences et toux légère du rhume. Déconseillé en grossesse, allaitement et chez l'enfant <12 ans. Allergie aux Apiacées : à éviter.",
    source: 'EMA/HMPC/137744/2013',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/anisi-fructus',
    tone: 'informative',
  },
  {
    id: 'coriander_digestion',
    trigger: {
      type: 'ingredient',
      keywords: ['coriandre', 'coriander', 'coriandrum sativum'],
    },
    titleFr: 'Coriandre — digestion légère',
    bodyFr:
      "Les graines de coriandre sont reconnues par l'EMA pour un usage traditionnel : ballonnements, flatulences et perte d'appétit légère. Déconseillé en grossesse, allaitement et chez l'enfant <12 ans. Allergie aux Apiacées : à éviter.",
    source: 'EMA/HMPC/176440/2017',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/coriandri-fructus',
    tone: 'informative',
  },
  {
    id: 'caraway_bloating',
    trigger: {
      type: 'ingredient',
      keywords: ['carvi', 'caraway', 'carum carvi'],
    },
    titleFr: 'Carvi — ballonnements et flatulences',
    bodyFr:
      "Les graines de carvi sont reconnues par l'EMA pour un usage traditionnel dans les troubles digestifs légers : ballonnements, flatulences, gaz. Déconseillé en grossesse, allaitement et chez l'enfant <12 ans (faute de données).",
    source: 'EMA/HMPC/715094/2013',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/carvi-fructus',
    tone: 'informative',
  },
  {
    id: 'rosemary_digestion_joints',
    trigger: {
      type: 'ingredient',
      keywords: ['romarin', 'rosemary', 'rosmarinus officinalis'],
    },
    titleFr: 'Romarin — digestion et confort articulaire',
    bodyFr:
      "Le romarin est reconnu par l'EMA pour un usage traditionnel : troubles dyspeptiques légers (ballonnements, flatulences) et douleurs articulaires mineures en usage cutané. Huile essentielle déconseillée en grossesse, en cas d'épilepsie ou d'HTA.",
    source: 'EMA/HMPC/13631/2009',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/rosmarini-folium',
    tone: 'informative',
  },
  {
    id: 'plantain_throat_insectbites',
    trigger: {
      type: 'ingredient',
      keywords: ['plantain', 'plantago lanceolata'],
    },
    titleFr: 'Plantain — gorge et piqûres d\'insectes',
    bodyFr:
      "Le plantain lancéolé est reconnu par l'EMA pour un usage traditionnel : irritation de la gorge et toux du rhume, et apaisement des piqûres d'insectes en usage cutané. Pas de contre-indication majeure aux doses traditionnelles.",
    source: 'EMA/HMPC/437858/2010',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/plantaginis-lanceolatae-folium',
    tone: 'informative',
  },
  {
    id: 'nettle_joints_urinary',
    trigger: {
      type: 'ingredient',
      keywords: ['ortie', 'urtica dioica', 'nettle'],
    },
    titleFr: 'Ortie — articulations et confort urinaire',
    bodyFr:
      "L'EMA reconnaît la feuille d'ortie pour un usage traditionnel dans les douleurs articulaires mineures et la diurèse adjuvante. Déconseillée en grossesse, allaitement, chez l'enfant <12 ans et en cas d'œdèmes nécessitant un avis médical.",
    source: 'EMA/HMPC/508017/2007',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/urticae-folium',
    tone: 'informative',
  },
  {
    id: 'elderflower_cold',
    trigger: {
      type: 'ingredient',
      keywords: ['sureau', 'sambucus nigra', 'elderflower', 'elderberry'],
    },
    titleFr: 'Sureau noir — symptômes du rhume',
    bodyFr:
      "La fleur de sureau noir est reconnue par l'EMA pour un usage traditionnel : rhume et états fiévreux légers. Action diaphorétique. Attention : baies vertes et écorce toxiques — ne consommer que les fleurs et les baies bien mûres cuites.",
    source: 'EMA/HMPC/611504/2007',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/sambuci-flos',
    tone: 'informative',
  },
  {
    id: 'mallow_mucous_irritation',
    trigger: {
      type: 'ingredient',
      keywords: ['mauve', 'malva sylvestris', 'mallow'],
    },
    titleFr: 'Mauve — muqueuses irritées',
    bodyFr:
      "La fleur de mauve est reconnue par l'EMA pour un usage traditionnel : adoucissement des inflammations légères de la bouche, de la gorge et toux sèche associée. Espacer la prise d'autres médicaments (>30 min, mucilage).",
    source: 'EMA/HMPC/749512/2016',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/malvae-flos',
    tone: 'informative',
  },
  {
    id: 'marshmallow_dry_cough',
    trigger: {
      type: 'ingredient',
      keywords: ['guimauve', 'althaea officinalis', 'marshmallow'],
    },
    titleFr: 'Guimauve — gorge et toux sèche',
    bodyFr:
      "La racine de guimauve est reconnue par l'EMA pour un usage traditionnel : irritation de la gorge, toux sèche et inflammation légère des muqueuses buccales (mucilages). Espacer la prise d'autres médicaments (>30 min).",
    source: 'EMA/HMPC/436680/2014',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/althaeae-radix',
    tone: 'informative',
  },
  {
    id: 'dandelion_digestion_diuretic',
    trigger: {
      type: 'ingredient',
      keywords: ['pissenlit', 'taraxacum officinale', 'dandelion'],
    },
    titleFr: 'Pissenlit — digestion et diurèse',
    bodyFr:
      "Le pissenlit est reconnu par l'EMA pour un usage traditionnel : troubles digestifs légers (ballonnements, perte d'appétit) et augmentation du débit urinaire en complément d'une bonne hydratation. Allergie aux Astéracées et calculs biliaires : à éviter.",
    source: 'EMA/HMPC/212895/2008',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/taraxaci-radix',
    tone: 'informative',
  },
  {
    id: 'prunes_transit',
    trigger: {
      type: 'ingredient',
      keywords: ['pruneau', 'pruneaux', 'prune', 'prunes'],
    },
    titleFr: 'Pruneaux — transit intestinal',
    bodyFr:
      "Les pruneaux apportent fibres et sorbitol contribuant au transit intestinal. L'EFSA a documenté l'effet laxatif modéré (≥50 g/jour). Option naturelle pour la constipation occasionnelle. Sorbitol fermentescible : prudence en cas de SII.",
    source: 'EFSA Journal 2012;10(6):2712 — Scientific Opinion ID 1149',
    sourceUrl: 'https://www.efsa.europa.eu/en/efsajournal/pub/2712',
    tone: 'informative',
  },

  // ─── Phytothérapie Premium — warnings (10) ────────────────────────────────
  {
    id: 'sage_thujone_warning',
    trigger: {
      type: 'ingredient',
      keywords: ['sauge', 'salvia officinalis', 'sage', 'thuyone'],
    },
    titleFr: 'Sauge — limitation par la thuyone',
    bodyFr:
      "L'EMA reconnaît la sauge en usage médical bien établi (bouffées de chaleur, digestion, inflammations buccales). Elle contient de la thuyone, neurotoxique à fortes doses. Contre-indications : grossesse, allaitement, enfants <12 ans, épilepsie. Pas plus de 2 semaines. HE interdite en automédication.",
    source: 'EMA',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/salviae-officinalis-folium',
    tone: 'warning',
  },
  {
    id: 'valerian_sleep_interactions',
    trigger: {
      type: 'ingredient',
      keywords: ['valériane', 'valeriana officinalis', 'valerian'],
    },
    titleFr: 'Valériane — sommeil avec précautions',
    bodyFr:
      "L'EMA reconnaît la valériane en usage médical bien établi (nervosité légère, aide à l'endormissement). Action GABA — interactions avec sédatifs, hypnotiques, anxiolytiques, alcool. Contre-indications : grossesse, allaitement, enfants <12 ans, conducteurs (somnolence). À éviter avant chirurgie.",
    source: 'EMA',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/valerianae-radix',
    tone: 'warning',
  },
  {
    id: 'fennel_estragole_warning',
    trigger: {
      type: 'ingredient',
      keywords: ['fenouil', 'foeniculum vulgare', 'fennel', 'estragole'],
    },
    titleFr: 'Fenouil — limitation par l\'estragole',
    bodyFr:
      "L'EMA reconnaît le fenouil en usage traditionnel (digestion, toux), mais il contient de l'estragole, génotoxique à fortes doses. Usage culinaire courant sans risque. Contre-indications : grossesse, allaitement, enfants <4 ans (HE, infusions concentrées), Apiacées. Pas plus de 2 semaines en continu.",
    source: 'EMA',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/foeniculi-amari-fructus',
    tone: 'warning',
  },
  {
    id: 'juniper_kidney_warning',
    trigger: {
      type: 'ingredient',
      keywords: ['genévrier', 'genevrier', 'juniperus communis', 'juniper', 'baies de genévrier'],
    },
    titleFr: 'Genévrier — usage limité par néphrotoxicité',
    bodyFr:
      "L'EMA reconnaît les baies de genévrier en usage traditionnel pour la digestion et la diurèse, mais l'usage est strictement limité dans le temps en raison du risque de toxicité rénale. Contre-indications : grossesse, allaitement, enfants <18 ans, maladie rénale. Pas plus de 4 semaines de cure.",
    source: 'EMA',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/juniperi-pseudo-fructus',
    tone: 'warning',
  },
  {
    id: 'melilot_anticoagulant_warning',
    trigger: {
      type: 'ingredient',
      keywords: ['mélilot', 'melilot', 'melilotus officinalis', 'coumarine'],
    },
    titleFr: 'Mélilot — interactions anticoagulants',
    bodyFr:
      "L'EMA reconnaît le mélilot en usage traditionnel (circulation veineuse), mais sa coumarine peut interagir avec les anticoagulants (warfarine, AVK). Contre-indications : grossesse, allaitement, enfants <18 ans, anticoagulants, insuffisance hépatique, avant chirurgie. Avis médical recommandé.",
    source: 'EMA',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/meliloti-herba',
    tone: 'warning',
  },
  {
    id: 'frangula_short_term_laxative',
    trigger: {
      type: 'ingredient',
      keywords: ['bourdaine', 'rhamnus frangula', 'nerprun', 'frangula'],
    },
    titleFr: 'Bourdaine — constipation court terme',
    bodyFr:
      "L'EMA reconnaît l'écorce de bourdaine en usage médical bien établi (constipation occasionnelle court terme). Pas plus de 1 à 2 semaines : risque de troubles électrolytiques et dépendance. Contre-indications : grossesse, allaitement, enfants <12 ans, occlusion intestinale, MICI, douleurs abdominales inexpliquées.",
    source: 'EMA',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/frangulae-cortex',
    tone: 'warning',
  },
  {
    id: 'rhubarb_root_short_term_laxative',
    trigger: {
      type: 'ingredient',
      keywords: ['rhubarbe racine', 'rheum palmatum', 'rheum officinale', 'rhei radix'],
    },
    titleFr: 'Rhubarbe (racine) — constipation court terme',
    bodyFr:
      "L'EMA reconnaît la racine de rhubarbe en usage médical bien établi (constipation occasionnelle). Pas plus de 1-2 semaines : troubles électrolytiques, dépendance, coloration urinaire. À distinguer de la tige (légume). Contre-indications : grossesse, allaitement, enfants <12 ans, MICI, calculs rénaux (oxalates).",
    source: 'EMA',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/rhei-radix',
    tone: 'warning',
  },
  {
    id: 'wormwood_thujone_warning',
    trigger: {
      type: 'ingredient',
      keywords: ['absinthe', 'artemisia absinthium', 'wormwood', 'thuyone'],
    },
    titleFr: 'Absinthe — neurotoxicité (thuyone)',
    bodyFr:
      "L'EMA reconnaît l'absinthe en usage traditionnel pour les troubles digestifs légers, mais elle contient de la thuyone, neurotoxique à dose élevée. Contre-indications : grossesse, allaitement, enfants <18 ans, épilepsie, troubles neurologiques. Pas plus de 2 semaines en cure. Interactions avec antiépileptiques.",
    source: 'EMA',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/absinthii-herba',
    tone: 'warning',
  },
  {
    id: 'burdock_diuretic',
    trigger: {
      type: 'ingredient',
      keywords: ['bardane', 'arctium lappa', 'burdock'],
    },
    titleFr: 'Bardane — usage traditionnel diurétique',
    bodyFr:
      "L'EMA reconnaît la bardane en usage traditionnel diurétique (boire abondamment) et digestif léger. Usages dermatologiques (acné, dartres) non validés par l'EMA. Contre-indications : grossesse, allaitement, enfants <18 ans, Astéracées, diabète (effet hypoglycémiant), insuffisance cardiaque/rénale.",
    source: 'EMA',
    sourceUrl: 'https://www.ema.europa.eu/en/medicines/herbal/bardanae-radix',
    tone: 'warning',
  },
  {
    id: 'borage_pa_warning',
    trigger: {
      type: 'ingredient',
      keywords: ['bourrache', 'borago officinalis', 'borage', 'alcaloïdes pyrrolizidiniques'],
    },
    titleFr: 'Bourrache — alcaloïdes hépatotoxiques',
    bodyFr:
      "Selon l'EFSA, la bourrache (feuilles, fleurs) contient des alcaloïdes pyrrolizidiniques hépatotoxiques et potentiellement cancérogènes. Consommation interne déconseillée. Contre-indications : grossesse, allaitement, enfants <18 ans, maladie hépatique. L'huile de pépins (sans PA) reste sans allégation santé validée.",
    source: 'EFSA',
    sourceUrl: 'https://www.efsa.europa.eu/en/efsajournal/pub/4908',
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
