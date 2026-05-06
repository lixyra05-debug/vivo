export type PlantCategory =
  | 'respiratory'
  | 'digestive'
  | 'nervous'
  | 'circulatory'
  | 'skin'
  | 'urinary'
  | 'general';

export type EvidenceLevel =
  | 'well-established'
  | 'traditional'
  | 'efsa-claim'
  | 'preliminary';

export interface PlantEntry {
  id: string;
  nameFr: string;
  nameLatin: string;
  emoji: string;
  category: PlantCategory;
  properties: string;
  traditionalUse: string;
  partUsed: string;
  preparation: string;
  contraindications: string;
  interactions: string | null;
  evidenceLevel: EvidenceLevel;
  source: string;
  sourceUrl: string;
}

export const PLANT_CATEGORIES: Record<
  PlantCategory,
  { labelFr: string; emoji: string }
> = {
  respiratory: { labelFr: 'Respiratoire', emoji: '🤧' },
  digestive: { labelFr: 'Digestif', emoji: '🫃' },
  nervous: { labelFr: 'Sommeil & Stress', emoji: '😴' },
  circulatory: { labelFr: 'Circulation', emoji: '🫀' },
  skin: { labelFr: 'Peau', emoji: '🧴' },
  urinary: { labelFr: 'Urinaire', emoji: '💧' },
  general: { labelFr: 'Bien-être général', emoji: '⚡' },
};

const EMA_HMPC_BASE =
  'https://www.ema.europa.eu/en/medicines/herbal-medicinal-products';

export const PLANT_ENCYCLOPEDIA: PlantEntry[] = [
  // ─── NERVOUS / SLEEP & STRESS (7) ───────────────────────────────────────
  {
    id: 'chamomile',
    nameFr: 'Camomille matricaire',
    nameLatin: 'Matricaria recutita',
    emoji: '🌼',
    category: 'nervous',
    properties:
      'Propriétés documentées apaisantes et carminatives. Contribue à la détente et au confort digestif léger.',
    traditionalUse:
      "Usage traditionnel reconnu pour favoriser l'endormissement et soulager les troubles digestifs mineurs liés au stress.",
    partUsed: 'Capitules floraux séchés',
    preparation:
      'Infusion 1 cuillère à soupe par tasse, eau frémissante 5-10 min. 1-3 tasses par jour.',
    contraindications:
      'Allergie connue aux Astéracées (marguerite, ambroisie). Prudence en cas de grossesse à fortes doses.',
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2015 (Matricariae flos)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'valerian',
    nameFr: 'Valériane',
    nameLatin: 'Valeriana officinalis',
    emoji: '🌿',
    category: 'nervous',
    properties:
      "Propriétés documentées sédatives légères. Favorise la détente nerveuse et la qualité de l'endormissement.",
    traditionalUse:
      "Usage traditionnel reconnu pour les états de tension nerveuse légère et les difficultés d'endormissement occasionnelles.",
    partUsed: 'Racines et rhizome séchés',
    preparation:
      'Infusion 1 cuillère à café par tasse, 30 min avant le coucher. Ou extrait sec selon notice.',
    contraindications:
      'Déconseillée chez les enfants de moins de 12 ans, en grossesse et allaitement (données insuffisantes).',
    interactions:
      "Effet additif possible avec sédatifs, hypnotiques et alcool. Demander avis si traitement en cours.",
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2016 (Valerianae radix)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'linden',
    nameFr: 'Tilleul',
    nameLatin: 'Tilia cordata',
    emoji: '🌸',
    category: 'nervous',
    properties:
      'Propriétés documentées apaisantes et légèrement sudorifiques. Contribue à la détente avant le coucher.',
    traditionalUse:
      "Usage traditionnel reconnu pour le soulagement des symptômes mineurs de stress mental et l'aide à l'endormissement.",
    partUsed: 'Inflorescences séchées',
    preparation:
      'Infusion 1,5 g par tasse, 5-10 min, 1-3 tasses par jour.',
    contraindications:
      'Aucune contre-indication majeure aux doses recommandées. Prudence en cas de pathologie cardiaque sévère.',
    interactions: null,
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2012 (Tiliae flos)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'passionflower',
    nameFr: 'Passiflore',
    nameLatin: 'Passiflora incarnata',
    emoji: '🌺',
    category: 'nervous',
    properties:
      'Propriétés documentées calmantes. Favorise la détente nerveuse en cas de tension mentale légère.',
    traditionalUse:
      "Usage traditionnel reconnu pour le soulagement des symptômes mineurs de stress et pour favoriser l'endormissement.",
    partUsed: 'Parties aériennes fleuries séchées',
    preparation:
      'Infusion 1-2 g par tasse, 5-10 min, 1-4 tasses par jour. Dernière prise au coucher.',
    contraindications:
      'Déconseillée chez les enfants de moins de 12 ans, en grossesse et allaitement.',
    interactions:
      'Effet additif possible avec sédatifs ou anxiolytiques.',
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2014 (Passiflorae herba)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'hops',
    nameFr: 'Houblon',
    nameLatin: 'Humulus lupulus',
    emoji: '🌾',
    category: 'nervous',
    properties:
      "Propriétés documentées sédatives légères. Contribue à la qualité de l'endormissement, souvent associé à la valériane.",
    traditionalUse:
      "Usage traditionnel reconnu pour les difficultés d'endormissement occasionnelles et la tension nerveuse légère.",
    partUsed: 'Cônes (strobiles) séchés',
    preparation:
      'Infusion 0,5 g par tasse, 5-10 min, le soir.',
    contraindications:
      "Déconseillé chez les enfants de moins de 12 ans, en grossesse et allaitement. Prudence en cas d'antécédents de cancers hormonodépendants.",
    interactions:
      'Effet additif possible avec sédatifs et alcool.',
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2014 (Lupuli flos)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'melissa',
    nameFr: 'Mélisse',
    nameLatin: 'Melissa officinalis',
    emoji: '🍃',
    category: 'nervous',
    properties:
      'Propriétés documentées apaisantes et carminatives. Contribue à la détente et au confort digestif lié au stress.',
    traditionalUse:
      "Usage traditionnel reconnu pour les symptômes de stress mental léger et l'aide à l'endormissement, et pour les troubles digestifs mineurs.",
    partUsed: 'Feuilles séchées',
    preparation:
      'Infusion 1,5-4,5 g par tasse, 5-10 min, jusqu\'à 3 fois par jour.',
    contraindications:
      'Prudence en cas de troubles thyroïdiens (données préliminaires).',
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2013 (Melissae folium)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'lavender',
    nameFr: 'Lavande vraie',
    nameLatin: 'Lavandula angustifolia',
    emoji: '💜',
    category: 'nervous',
    properties:
      'Propriétés documentées calmantes. Favorise la détente nerveuse et le bien-être émotionnel.',
    traditionalUse:
      "Usage traditionnel reconnu pour le soulagement des symptômes mineurs de stress et l'aide à l'endormissement.",
    partUsed: 'Fleurs séchées',
    preparation:
      "Infusion 1-2 g par tasse, 5-10 min, 1-3 fois par jour. Huile essentielle uniquement après avis professionnel.",
    contraindications:
      "Huile essentielle déconseillée chez les enfants de moins de 6 ans et en grossesse. Voie orale strictement encadrée.",
    interactions: null,
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2012 (Lavandulae flos)',
    sourceUrl: EMA_HMPC_BASE,
  },

  // ─── DIGESTIVE (6) ─────────────────────────────────────────────────────
  {
    id: 'peppermint',
    nameFr: 'Menthe poivrée',
    nameLatin: 'Mentha × piperita',
    emoji: '🌱',
    category: 'digestive',
    properties:
      'Propriétés documentées carminatives et antispasmodiques digestives. Contribue au confort digestif après les repas.',
    traditionalUse:
      'Usage traditionnel reconnu pour les troubles digestifs mineurs (ballonnements, flatulences, spasmes intestinaux légers).',
    partUsed: 'Feuilles séchées',
    preparation:
      'Infusion 1,5-3 g par tasse, eau frémissante 5-10 min, 1-3 fois par jour après les repas.',
    contraindications:
      "Déconseillée en cas de reflux gastro-œsophagien, hernie hiatale, lithiase biliaire. Huile essentielle non recommandée chez l'enfant de moins de 8 ans.",
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2020 (Menthae piperitae folium)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'fennel',
    nameFr: 'Fenouil',
    nameLatin: 'Foeniculum vulgare',
    emoji: '🌾',
    category: 'digestive',
    properties:
      'Propriétés documentées carminatives. Contribue à la diminution des ballonnements et flatulences.',
    traditionalUse:
      'Usage traditionnel reconnu pour les troubles digestifs mineurs avec ballonnements et gaz.',
    partUsed: 'Fruits (graines) séchés',
    preparation:
      'Infusion 1,5-2,5 g de graines écrasées par tasse, 10-15 min, 3 fois par jour.',
    contraindications:
      "Déconseillé chez les enfants de moins de 4 ans. Allergie aux Apiacées. Restriction d'usage prolongé en grossesse.",
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2008 (Foeniculi fructus)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'anise',
    nameFr: 'Anis vert',
    nameLatin: 'Pimpinella anisum',
    emoji: '⭐',
    category: 'digestive',
    properties:
      'Propriétés documentées carminatives. Contribue au confort digestif et à la diminution des gaz intestinaux.',
    traditionalUse:
      'Usage traditionnel reconnu pour les troubles digestifs mineurs avec ballonnements et flatulences.',
    partUsed: 'Fruits secs',
    preparation:
      'Infusion 1-3,5 g de fruits écrasés par tasse, 10 min, 3 fois par jour.',
    contraindications:
      "Allergie aux Apiacées. Déconseillé chez l'enfant de moins de 12 ans en infusion prolongée.",
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2013 (Anisi fructus)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'caraway',
    nameFr: 'Carvi',
    nameLatin: 'Carum carvi',
    emoji: '🌿',
    category: 'digestive',
    properties:
      'Propriétés documentées carminatives et antispasmodiques digestives. Contribue à la diminution des ballonnements.',
    traditionalUse:
      'Usage traditionnel reconnu pour les troubles dyspeptiques mineurs et les flatulences.',
    partUsed: 'Fruits secs',
    preparation:
      'Infusion 1,5-6 g par jour répartie en plusieurs prises, fruits écrasés.',
    contraindications:
      'Allergie aux Apiacées. Prudence en grossesse (données limitées).',
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2015 (Carvi fructus)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'artichoke',
    nameFr: 'Artichaut',
    nameLatin: 'Cynara cardunculus',
    emoji: '🌿',
    category: 'digestive',
    properties:
      'Propriétés documentées cholérétiques. Contribue au confort digestif et à la digestion des graisses.',
    traditionalUse:
      'Usage traditionnel reconnu pour les troubles dyspeptiques mineurs (lourdeurs, ballonnements).',
    partUsed: 'Feuilles séchées',
    preparation:
      'Infusion 1-4 g par tasse, 10-15 min, 3 fois par jour avant les repas. Ou extrait sec selon notice.',
    contraindications:
      'Obstruction des voies biliaires, lithiase biliaire, allergie aux Astéracées. Avis professionnel en cas de pathologie hépatique.',
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2018 (Cynarae folium)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'chicory',
    nameFr: 'Chicorée',
    nameLatin: 'Cichorium intybus',
    emoji: '🌼',
    category: 'digestive',
    properties:
      "Propriétés documentées légèrement amères et cholérétiques. Contribue à l'appétit et au confort digestif.",
    traditionalUse:
      "Usage traditionnel reconnu pour stimuler l'appétit et le confort digestif après les repas.",
    partUsed: 'Racine séchée',
    preparation:
      'Décoction 2-4 g de racine par tasse, 10-15 min, 3 fois par jour avant les repas.',
    contraindications:
      'Obstruction des voies biliaires, lithiase biliaire, allergie aux Astéracées.',
    interactions: null,
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2013 (Cichorii radix)',
    sourceUrl: EMA_HMPC_BASE,
  },

  // ─── RESPIRATORY (7) ───────────────────────────────────────────────────
  {
    id: 'thyme',
    nameFr: 'Thym',
    nameLatin: 'Thymus vulgaris',
    emoji: '🌿',
    category: 'respiratory',
    properties:
      'Propriétés documentées expectorantes et antimicrobiennes légères. Contribue au confort respiratoire en cas de toux légère.',
    traditionalUse:
      'Usage traditionnel reconnu pour soulager la toux productive associée au rhume.',
    partUsed: 'Sommités fleuries séchées',
    preparation:
      'Infusion 1,5-2 g par tasse, 10 min, 3-4 fois par jour. Couvrir pendant l\'infusion.',
    contraindications:
      "Allergie aux Lamiacées. Huile essentielle déconseillée chez l'enfant de moins de 6 ans et en grossesse.",
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2014 (Thymi herba)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'ivy',
    nameFr: 'Lierre grimpant',
    nameLatin: 'Hedera helix',
    emoji: '🍀',
    category: 'respiratory',
    properties:
      'Propriétés documentées expectorantes. Contribue au soulagement de la toux productive.',
    traditionalUse:
      'Usage traditionnel reconnu pour la toux productive associée au rhume.',
    partUsed: 'Feuilles séchées (extrait standardisé)',
    preparation:
      'Extrait sec ou sirop standardisé selon la notice du produit (préparation industrielle).',
    contraindications:
      "Déconseillé chez l'enfant de moins de 2 ans. Allergie connue. Les feuilles fraîches sont toxiques.",
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2017 (Hederae folium)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'plantain',
    nameFr: 'Plantain lancéolé',
    nameLatin: 'Plantago lanceolata',
    emoji: '🌿',
    category: 'respiratory',
    properties:
      'Propriétés documentées émollientes des muqueuses respiratoires. Contribue au confort de la gorge irritée.',
    traditionalUse:
      "Usage traditionnel reconnu pour l'irritation buccale et pharyngée et la toux sèche associée.",
    partUsed: 'Feuilles séchées',
    preparation:
      'Infusion 1-2 g par tasse, 10 min, 3-4 fois par jour.',
    contraindications:
      'Aucune contre-indication majeure documentée aux doses traditionnelles.',
    interactions: null,
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2014 (Plantaginis lanceolatae folium)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'elderflower',
    nameFr: 'Sureau noir',
    nameLatin: 'Sambucus nigra',
    emoji: '🤍',
    category: 'respiratory',
    properties:
      'Propriétés documentées sudorifiques. Contribue au confort en cas de rhume, en favorisant la transpiration.',
    traditionalUse:
      'Usage traditionnel reconnu pour les symptômes initiaux de rhume avec sensation de froid.',
    partUsed: 'Fleurs séchées',
    preparation:
      'Infusion 3 g par tasse, eau frémissante 10-15 min, 3 fois par jour.',
    contraindications:
      'Baies crues toxiques (à cuire). Allergie connue.',
    interactions: null,
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2014 (Sambuci flos)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'mallow',
    nameFr: 'Mauve',
    nameLatin: 'Malva sylvestris',
    emoji: '💐',
    category: 'respiratory',
    properties:
      'Propriétés documentées émollientes liées aux mucilages. Contribue au confort des muqueuses irritées.',
    traditionalUse:
      "Usage traditionnel reconnu pour l'irritation buccale et pharyngée et la toux sèche associée.",
    partUsed: 'Fleurs ou feuilles séchées',
    preparation:
      "Macération à froid ou infusion tiède 1,5-2 g par tasse, 1-3 fois par jour.",
    contraindications:
      'Aucune contre-indication majeure documentée aux doses traditionnelles.',
    interactions: null,
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2017 (Malvae folium et Malvae flos)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'marshmallow',
    nameFr: 'Guimauve',
    nameLatin: 'Althaea officinalis',
    emoji: '🌸',
    category: 'respiratory',
    properties:
      'Propriétés documentées émollientes (mucilages). Contribue au confort des muqueuses buccales et pharyngées.',
    traditionalUse:
      "Usage traditionnel reconnu pour l'irritation pharyngée avec toux sèche.",
    partUsed: 'Racine séchée',
    preparation:
      'Macération à froid 0,5-3 g de racine par tasse, 30 min à 1 h, 1-3 fois par jour.',
    contraindications:
      'Peut retarder l\'absorption d\'autres médicaments pris simultanément (espacer les prises de 1-2 h).',
    interactions:
      "Espacer la prise d'autres médicaments oraux d'au moins 1 à 2 heures.",
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2016 (Althaeae radix)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'eucalyptus',
    nameFr: 'Eucalyptus',
    nameLatin: 'Eucalyptus globulus',
    emoji: '🌳',
    category: 'respiratory',
    properties:
      'Propriétés documentées expectorantes et balsamiques. Contribue au confort des voies respiratoires en cas de rhume.',
    traditionalUse:
      'Usage traditionnel reconnu pour les symptômes du rhume avec toux productive.',
    partUsed: 'Feuilles séchées',
    preparation:
      'Infusion 1,5-2 g par tasse, 10 min, 3 fois par jour. Inhalation possible (eau chaude, 5-10 min).',
    contraindications:
      "Huile essentielle déconseillée chez l'enfant de moins de 6 ans, en grossesse et allaitement, en cas d'asthme.",
    interactions:
      "L'huile essentielle peut induire des enzymes hépatiques et modifier l'effet de certains médicaments.",
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2013 (Eucalypti folium)',
    sourceUrl: EMA_HMPC_BASE,
  },

  // ─── SKIN (5) ──────────────────────────────────────────────────────────
  {
    id: 'calendula',
    nameFr: 'Souci',
    nameLatin: 'Calendula officinalis',
    emoji: '🧡',
    category: 'skin',
    properties:
      'Propriétés documentées apaisantes cutanées. Contribue au confort de la peau irritée superficiellement.',
    traditionalUse:
      "Usage traditionnel reconnu en application locale pour les irritations cutanées mineures et l'inflammation muqueuse buccale légère.",
    partUsed: 'Capitules floraux séchés',
    preparation:
      'Application externe (pommade, infusion en compresse). Voie orale possible : infusion 1-2 g par tasse.',
    contraindications:
      'Allergie aux Astéracées (marguerite, ambroisie).',
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2018 (Calendulae flos)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'burdock',
    nameFr: 'Bardane',
    nameLatin: 'Arctium lappa',
    emoji: '🌿',
    category: 'skin',
    properties:
      'Propriétés documentées sudorifiques et favorisant la fonction d\'élimination cutanée. Contribue au confort cutané.',
    traditionalUse:
      'Usage traditionnel reconnu pour les imperfections cutanées séborrhéiques.',
    partUsed: 'Racine séchée',
    preparation:
      'Décoction 2-6 g de racine par tasse, 10-15 min, 2-3 fois par jour.',
    contraindications:
      'Allergie aux Astéracées. Prudence en grossesse et allaitement.',
    interactions: null,
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2010 (Arctii radix)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'borage',
    nameFr: 'Bourrache',
    nameLatin: 'Borago officinalis',
    emoji: '💙',
    category: 'skin',
    properties:
      "Propriétés documentées : huile riche en acide gamma-linolénique. Contribue au confort cutané dans le cadre d'une alimentation équilibrée.",
    traditionalUse:
      'Usage traditionnel de la fleur pour favoriser le confort cutané. Huile en complément alimentaire.',
    partUsed: 'Graines (huile) — éviter les parties aériennes au long cours',
    preparation:
      "Capsules d'huile de bourrache selon notice du fabricant.",
    contraindications:
      "Parties aériennes (alcaloïdes pyrrolizidiniques) déconseillées au long cours, en grossesse, allaitement, chez l'enfant. Privilégier l'huile de graines purifiée.",
    interactions:
      'Prudence avec anticoagulants (effet potentiel sur l\'agrégation plaquettaire).',
    evidenceLevel: 'traditional',
    source: 'ANSES — alcaloïdes pyrrolizidiniques (avis 2019)',
    sourceUrl: 'https://www.anses.fr/',
  },
  {
    id: 'aloe_vera',
    nameFr: 'Aloès',
    nameLatin: 'Aloe vera',
    emoji: '🌵',
    category: 'skin',
    properties:
      'Propriétés documentées hydratantes et apaisantes cutanées (gel). Contribue au confort cutané superficiel.',
    traditionalUse:
      'Usage traditionnel externe du gel pour apaiser la peau (irritations légères, coups de soleil mineurs).',
    partUsed: 'Gel mucilagineux interne des feuilles',
    preparation:
      "Application locale du gel pur. Voie orale du latex (anthraquinones) déconseillée par l'EFSA.",
    contraindications:
      "Le latex (sève jaune) contient des anthraquinones génotoxiques selon l'EFSA — voie orale fortement déconseillée. Grossesse, allaitement.",
    interactions: null,
    evidenceLevel: 'preliminary',
    source: 'EFSA NDA — Hydroxyanthracene derivatives (2017)',
    sourceUrl: 'https://www.efsa.europa.eu/en/efsajournal/pub/5090',
  },
  {
    id: 'witch_hazel',
    nameFr: 'Hamamélis',
    nameLatin: 'Hamamelis virginiana',
    emoji: '🍂',
    category: 'skin',
    properties:
      'Propriétés documentées astringentes (tanins). Contribue au confort cutané et veineux superficiel.',
    traditionalUse:
      "Usage traditionnel reconnu en application locale pour les irritations cutanées mineures et la sensation de jambes lourdes.",
    partUsed: 'Feuilles ou écorce séchées',
    preparation:
      'Décoction 5-10 g par 250 ml en compresse externe. Hydrolat ou pommade selon le produit.',
    contraindications:
      'Allergie connue. Voie orale prolongée non recommandée (tanins).',
    interactions: null,
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2009 (Hamamelidis folium et cortex)',
    sourceUrl: EMA_HMPC_BASE,
  },

  // ─── CIRCULATORY (4) ───────────────────────────────────────────────────
  {
    id: 'red_vine',
    nameFr: 'Vigne rouge',
    nameLatin: 'Vitis vinifera',
    emoji: '🍇',
    category: 'circulatory',
    properties:
      'Propriétés documentées : flavonoïdes vasoprotecteurs. Contribue au confort veineux des jambes lourdes.',
    traditionalUse:
      'Usage traditionnel reconnu pour le soulagement des symptômes liés à une insuffisance veineuse légère (jambes lourdes).',
    partUsed: 'Feuilles séchées',
    preparation:
      'Infusion 2-3 g par tasse, 10 min, 2 fois par jour. Ou extrait sec selon notice.',
    contraindications:
      'Insuffisance veineuse modérée à sévère nécessite un avis médical.',
    interactions: null,
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2010 (Vitis viniferae folium)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'horse_chestnut',
    nameFr: 'Marronnier d\'Inde',
    nameLatin: 'Aesculus hippocastanum',
    emoji: '🌰',
    category: 'circulatory',
    properties:
      "Propriétés documentées : escine vasoprotectrice. Contribue au confort veineux en cas d'insuffisance veineuse légère.",
    traditionalUse:
      "Usage bien établi pour les symptômes d'insuffisance veineuse chronique légère (jambes lourdes, sensations de gonflement).",
    partUsed: 'Graines séchées (extrait standardisé en escine)',
    preparation:
      'Extrait sec standardisé selon notice (250-375 mg, 2 fois par jour).',
    contraindications:
      "Pathologies rénales et hépatiques, grossesse, allaitement, enfant. Graine crue toxique.",
    interactions:
      'Prudence avec anticoagulants et antiagrégants plaquettaires.',
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2009 (Hippocastani semen)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'garlic',
    nameFr: 'Ail',
    nameLatin: 'Allium sativum',
    emoji: '🧄',
    category: 'circulatory',
    properties:
      "Propriétés documentées : composés sulfurés contribuant au maintien de la santé cardiovasculaire dans le cadre d'une alimentation équilibrée.",
    traditionalUse:
      "Usage traditionnel reconnu pour le confort circulatoire et le soutien des défenses naturelles.",
    partUsed: 'Bulbe frais ou poudre',
    preparation:
      "1-2 gousses fraîches par jour ou extrait sec selon notice (300-1200 mg/jour).",
    contraindications:
      'Reflux gastrique, ulcère, intervention chirurgicale prévue (à arrêter 7-10 jours avant).',
    interactions:
      "Prudence avec anticoagulants (warfarine), antiagrégants plaquettaires et certains antirétroviraux.",
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2016 (Allii sativi bulbus)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'hawthorn',
    nameFr: 'Aubépine',
    nameLatin: 'Crataegus monogyna',
    emoji: '🤍',
    category: 'circulatory',
    properties:
      'Propriétés documentées apaisantes nerveuses cardiotropes légères. Contribue au confort en cas de palpitations bénignes liées au stress.',
    traditionalUse:
      "Usage traditionnel reconnu pour le soulagement des symptômes mineurs de stress et des troubles du sommeil légers.",
    partUsed: 'Sommités fleuries séchées',
    preparation:
      'Infusion 1-1,5 g par tasse, 10-15 min, 2-3 fois par jour.',
    contraindications:
      "Pathologies cardiovasculaires diagnostiquées : avis médical obligatoire avant usage.",
    interactions:
      'Effets cardiotropes potentiels : prudence avec digitaliques et antihypertenseurs.',
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2016 (Crataegi folium cum flore)',
    sourceUrl: EMA_HMPC_BASE,
  },

  // ─── URINARY (3) ───────────────────────────────────────────────────────
  {
    id: 'cranberry',
    nameFr: 'Canneberge',
    nameLatin: 'Vaccinium macrocarpon',
    emoji: '🔴',
    category: 'urinary',
    properties:
      "Propriétés documentées : proanthocyanidines de type A. Contribue au confort des voies urinaires.",
    traditionalUse:
      "Usage reconnu pour favoriser le confort urinaire chez la femme adulte sujette aux inconforts récurrents.",
    partUsed: 'Fruits (jus, poudre, extrait standardisé en PAC)',
    preparation:
      "Extrait standardisé apportant 36 mg de proanthocyanidines par jour, selon notice.",
    contraindications:
      'Antécédents de calculs urinaires à oxalate. Diabète (jus sucré).',
    interactions:
      'Effet potentiel sur la warfarine — surveillance INR si traitement anticoagulant.',
    evidenceLevel: 'preliminary',
    source: 'ANSES — avis sur les compléments alimentaires à base de canneberge',
    sourceUrl: 'https://www.anses.fr/',
  },
  {
    id: 'birch',
    nameFr: 'Bouleau',
    nameLatin: 'Betula pendula',
    emoji: '🌳',
    category: 'urinary',
    properties:
      'Propriétés documentées favorisant la fonction d\'élimination rénale. Contribue au confort urinaire.',
    traditionalUse:
      "Usage traditionnel reconnu pour augmenter la quantité d'urine afin de soutenir la fonction d'élimination, en complément d'un apport hydrique suffisant.",
    partUsed: 'Feuilles séchées',
    preparation:
      'Infusion 2-3 g par tasse, 10 min, 3-4 fois par jour avec consommation hydrique abondante.',
    contraindications:
      "Œdème lié à une pathologie cardiaque ou rénale : avis médical obligatoire. Allergie au pollen de bouleau.",
    interactions: null,
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2014 (Betulae folium)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'bearberry',
    nameFr: 'Busserole',
    nameLatin: 'Arctostaphylos uva-ursi',
    emoji: '🍃',
    category: 'urinary',
    properties:
      "Propriétés documentées : arbutoside antibactérien urinaire léger. Contribue au confort urinaire.",
    traditionalUse:
      'Usage traditionnel reconnu pour les inconforts urinaires bas légers chez la femme adulte.',
    partUsed: 'Feuilles séchées',
    preparation:
      'Macération à froid 3 g par tasse, 6-12 h, jusqu\'à 4 fois par jour, max 7 jours consécutifs.',
    contraindications:
      "Grossesse, allaitement, enfant de moins de 12 ans, pathologie rénale. Pas plus de 7 jours d'affilée ni 5 cures par an.",
    interactions:
      "Éviter avec aliments acidifiant l'urine (peut réduire l'efficacité).",
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2018 (Uvae ursi folium)',
    sourceUrl: EMA_HMPC_BASE,
  },

  // ─── GENERAL (energy/vitality + bonus) (8) ─────────────────────────────
  {
    id: 'rosemary',
    nameFr: 'Romarin',
    nameLatin: 'Rosmarinus officinalis',
    emoji: '🌿',
    category: 'general',
    properties:
      "Propriétés documentées tonifiantes et favorisant la fonction digestive. Contribue au confort digestif et à la vitalité.",
    traditionalUse:
      'Usage traditionnel reconnu pour le confort digestif et le soulagement de la fatigue mineure.',
    partUsed: 'Feuilles séchées',
    preparation:
      'Infusion 1-2 g par tasse, 10-15 min, 3 fois par jour.',
    contraindications:
      "Hypertension non contrôlée, lithiase biliaire. Huile essentielle déconseillée chez l'enfant de moins de 6 ans, en grossesse et en cas d'épilepsie.",
    interactions: null,
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2010 (Rosmarini folium)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'nettle',
    nameFr: 'Ortie',
    nameLatin: 'Urtica dioica',
    emoji: '🌿',
    category: 'general',
    properties:
      "Propriétés documentées reminéralisantes (fer, silice) et favorisant la fonction d'élimination. Contribue à la vitalité.",
    traditionalUse:
      "Usage traditionnel reconnu pour soutenir la fonction d'élimination et pour les inconforts articulaires mineurs.",
    partUsed: 'Feuilles ou parties aériennes séchées',
    preparation:
      'Infusion 2-4 g par tasse, 10-15 min, 3 fois par jour.',
    contraindications:
      "Œdème lié à une pathologie cardiaque ou rénale. Prudence chez la femme enceinte (utilisation prolongée).",
    interactions:
      "Effet diurétique léger : prudence avec diurétiques. Peut influencer l'équilibre glycémique.",
    evidenceLevel: 'traditional',
    source: 'EMA HMPC monograph 2010 (Urticae folium)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'ginger',
    nameFr: 'Gingembre',
    nameLatin: 'Zingiber officinale',
    emoji: '🫚',
    category: 'general',
    properties:
      "Propriétés documentées antiémétiques et carminatives. Contribue au confort digestif et au soulagement des nausées légères.",
    traditionalUse:
      "Usage bien établi contre les nausées et le mal des transports, et usage traditionnel pour le confort digestif.",
    partUsed: 'Rhizome frais ou séché',
    preparation:
      "Infusion 0,5-1 g de poudre ou décoction de rhizome frais (1-2 g) par tasse, 3 fois par jour.",
    contraindications:
      "Lithiase biliaire, ulcère gastrique. Prudence avant chirurgie. Grossesse : limiter à 2 g/jour selon avis médical.",
    interactions:
      'Prudence avec anticoagulants (warfarine) : surveillance INR recommandée.',
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2011 (Zingiberis rhizoma)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'turmeric',
    nameFr: 'Curcuma',
    nameLatin: 'Curcuma longa',
    emoji: '🌟',
    category: 'general',
    properties:
      'Propriétés documentées favorisant la fonction digestive (cholérétique). Contribue au confort digestif.',
    traditionalUse:
      'Usage traditionnel reconnu pour le confort digestif (lourdeurs, ballonnements après les repas).',
    partUsed: 'Rhizome séché et poudre',
    preparation:
      "Décoction 1,5-3 g par tasse, 3 fois par jour avant les repas. Ou extrait sec selon notice.",
    contraindications:
      "Obstruction biliaire, lithiase, pathologie hépatique. Surveillance ANSES 2022 sur les compléments alimentaires concentrés (cas d'hépatites).",
    interactions:
      'Prudence avec anticoagulants et hypoglycémiants.',
    evidenceLevel: 'traditional',
    source: 'ANSES — alerte 2022 sur les compléments alimentaires à base de curcuma',
    sourceUrl: 'https://www.anses.fr/',
  },
  {
    id: 'green_tea',
    nameFr: 'Thé vert',
    nameLatin: 'Camellia sinensis',
    emoji: '🍵',
    category: 'general',
    properties:
      "Propriétés documentées : catéchines antioxydantes et caféine. Contribue à la vigilance dans le cadre d'un apport mesuré.",
    traditionalUse:
      'Usage reconnu pour soutenir la vigilance et le confort général.',
    partUsed: 'Feuilles séchées',
    preparation:
      'Infusion 1-2 g par tasse, 2-5 min, eau à 70-80°C, 1-3 fois par jour.',
    contraindications:
      "Fortes doses d'extraits concentrés signalées en pharmacovigilance (ANSES 2018). Limiter en grossesse, allaitement, et chez les jeunes enfants.",
    interactions:
      "Caféine : prudence avec anxiolytiques, antihypertenseurs. Peut réduire l'absorption du fer non héminique (espacer des repas).",
    evidenceLevel: 'traditional',
    source: 'ANSES — extraits de thé vert (avis 2018)',
    sourceUrl: 'https://www.anses.fr/',
  },
  {
    id: 'ginseng',
    nameFr: 'Ginseng',
    nameLatin: 'Panax ginseng',
    emoji: '🌱',
    category: 'general',
    properties:
      "Propriétés documentées tonifiantes adaptogènes. Contribue à la résistance en cas de fatigue.",
    traditionalUse:
      "Usage bien établi pour le soulagement des symptômes de faiblesse et fatigue.",
    partUsed: 'Racine séchée',
    preparation:
      "Décoction ou poudre 0,5-2 g par jour, le matin de préférence. Cure de 4-12 semaines max.",
    contraindications:
      "Hypertension non contrôlée, troubles cardiaques, troubles psychiatriques, grossesse, allaitement, enfant.",
    interactions:
      "Prudence avec anticoagulants (warfarine), hypoglycémiants, antidépresseurs (IMAO), corticoïdes.",
    evidenceLevel: 'well-established',
    source: 'EMA HMPC monograph 2014 (Ginseng radix)',
    sourceUrl: EMA_HMPC_BASE,
  },
  {
    id: 'ashwagandha',
    nameFr: 'Ashwagandha',
    nameLatin: 'Withania somnifera',
    emoji: '🌿',
    category: 'general',
    properties:
      "Propriétés préliminaires adaptogènes. Études en cours sur la contribution au confort en cas de stress.",
    traditionalUse:
      "Usage traditionnel ayurvédique reconnu en Inde. Études cliniques préliminaires en Europe.",
    partUsed: 'Racine séchée',
    preparation:
      'Extrait sec 250-600 mg par jour selon notice.',
    contraindications:
      "Grossesse, allaitement, troubles thyroïdiens, troubles auto-immuns. ANSES a signalé des cas d'hépatotoxicité (vigilance 2024).",
    interactions:
      "Prudence avec sédatifs, antithyroïdiens, immunosuppresseurs.",
    evidenceLevel: 'preliminary',
    source: 'ANSES — vigilance ashwagandha (avis 2024)',
    sourceUrl: 'https://www.anses.fr/',
  },
  {
    id: 'hibiscus',
    nameFr: 'Hibiscus',
    nameLatin: 'Hibiscus sabdariffa',
    emoji: '🌺',
    category: 'general',
    properties:
      "Propriétés documentées rafraîchissantes et antioxydantes (anthocyanes). Contribue à l'hydratation et à un apport en polyphénols.",
    traditionalUse:
      "Usage traditionnel reconnu en boisson rafraîchissante et pour le confort général.",
    partUsed: 'Calices séchés',
    preparation:
      "Infusion 1,5-2 g par tasse, 10 min, 1-3 fois par jour. Boisson froide possible.",
    contraindications:
      "Hypotension. Prudence en grossesse. Peut influencer l'équilibre tensionnel à fortes doses.",
    interactions:
      "Possible interaction avec antihypertenseurs et certains diurétiques.",
    evidenceLevel: 'preliminary',
    source: 'PubMed — Hibiscus sabdariffa and blood pressure (review)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/25875025/',
  },
];

export function getPlantById(id: string): PlantEntry | undefined {
  return PLANT_ENCYCLOPEDIA.find((p) => p.id === id);
}

export function getPlantsByCategory(category: PlantCategory): PlantEntry[] {
  return PLANT_ENCYCLOPEDIA.filter((p) => p.category === category);
}

export function searchPlants(query: string): PlantEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PLANT_ENCYCLOPEDIA.filter(
    (p) =>
      p.nameFr.toLowerCase().includes(q) ||
      p.nameLatin.toLowerCase().includes(q) ||
      p.properties.toLowerCase().includes(q) ||
      p.traditionalUse.toLowerCase().includes(q),
  );
}
