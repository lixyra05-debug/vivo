/**
 * PACKAGING_RISKS — base de connaissances des risques liés aux emballages alimentaires
 * et cosmétiques.
 *
 * Chaque entrée est sourcée EFSA / ANSES / ECHA / CIRC / OMS / eur-lex.
 * Aucune source non-officielle (test garde-fou anti-source-tierce).
 *
 * Helper : detectPackagingRisk(packagingTags) parse les tags Open Food Facts /
 * Open Beauty Facts (formats `en:pet-bottle`, `fr:plastique`, etc.) et retourne
 * la liste dédupliquée des matériaux détectés, triée par risque décroissant.
 */

export type PackagingRiskLevel = 'low' | 'moderate' | 'high';

export interface PackagingMaterial {
  id: string;
  nameFr: string;
  riskLevel: PackagingRiskLevel;
  concerns: string[];
  recyclable: boolean;
  tip: string;
  sources: string[];
  /** Patterns testés contre les tags normalisés (lowercase, sans préfixe lang, sans accent). */
  tagPatterns: string[];
}

export const PACKAGING_RISKS: PackagingMaterial[] = [
  {
    id: 'pet',
    nameFr: 'PET (Plastique n°1)',
    riskLevel: 'moderate',
    concerns: [
      "Migration possible d'antimoine en cas d'exposition à la chaleur",
      'Microplastiques après réutilisations multiples',
    ],
    recyclable: true,
    tip: 'Ne pas réutiliser ni chauffer. Recyclable dans la plupart des filières.',
    sources: ['EFSA J. 2019', 'ANSES 2012'],
    tagPatterns: [
      'polyethylene-terephthalate',
      'polyethylene-therephthalate',
      'pete',
      '01-pet',
      '1-pet',
      'pet-1',
      'pet-bottle',
      'pet-recycle',
      'plastique-pet',
    ],
  },
  {
    id: 'hdpe',
    nameFr: 'HDPE (Plastique n°2)',
    riskLevel: 'low',
    concerns: ["Considéré comme l'un des plastiques les plus stables au contact alimentaire"],
    recyclable: true,
    tip: 'Plastique stable, recyclable. Ne pas chauffer pour éviter toute migration.',
    sources: ['EFSA J. 2010'],
    tagPatterns: [
      'hdpe',
      'high-density-polyethylene',
      'haute-densite-polyethylene',
      '02-hdpe',
      '2-hdpe',
      'pe-hd',
    ],
  },
  {
    id: 'pvc',
    nameFr: 'PVC (Plastique n°3)',
    riskLevel: 'high',
    concerns: [
      'Migration possible de phtalates classés perturbateurs endocriniens',
      'Chlorure de vinyle classé cancérogène (CIRC groupe 1)',
    ],
    recyclable: false,
    tip: 'À éviter pour le contact alimentaire. Préférer un autre matériau.',
    sources: ['ECHA SVHC', 'ANSES 2019', 'CIRC monogr. Vol. 97'],
    tagPatterns: [
      'pvc',
      'polyvinyl-chloride',
      'polychlorure-de-vinyle',
      '03-pvc',
      '3-pvc',
    ],
  },
  {
    id: 'ldpe',
    nameFr: 'LDPE (Plastique n°4)',
    riskLevel: 'low',
    concerns: ['Plastique relativement inerte au contact alimentaire'],
    recyclable: true,
    tip: 'Stable à température ambiante. Ne pas chauffer.',
    sources: ['EFSA J. 2010'],
    tagPatterns: [
      'ldpe',
      'low-density-polyethylene',
      'basse-densite-polyethylene',
      '04-ldpe',
      '4-ldpe',
      'pe-ld',
    ],
  },
  {
    id: 'pp',
    nameFr: 'PP (Plastique n°5)',
    riskLevel: 'low',
    concerns: ['Plastique le plus stable pour le contact alimentaire à chaud'],
    recyclable: true,
    tip: "Compatible micro-ondes selon la mention sur l'emballage.",
    sources: ['EFSA J. 2018'],
    tagPatterns: [
      'polypropylene',
      'polypropylene-pp',
      '05-pp',
      '5-pp',
      'pp-plastic',
    ],
  },
  {
    id: 'ps',
    nameFr: 'PS (Polystyrène n°6)',
    riskLevel: 'high',
    concerns: [
      'Migration possible de styrène classé cancérogène probable (CIRC groupe 2A)',
      "Risque accru à chaud ou avec aliments gras",
    ],
    recyclable: false,
    tip: 'À éviter pour les boissons chaudes et plats à emporter.',
    sources: ['CIRC monogr. Vol. 121', 'EFSA J. 2018'],
    tagPatterns: [
      'polystyrene',
      'polystyrene-ps',
      '06-ps',
      '6-ps',
      'ps-plastic',
      'expanded-polystyrene',
    ],
  },
  {
    id: 'metal_can',
    nameFr: 'Conserve métallique',
    riskLevel: 'moderate',
    concerns: [
      'Revêtement intérieur souvent à base de bisphénol A ou S (perturbateurs endocriniens)',
      'BPA interdit au contact alimentaire en France depuis 2015 mais BPS encore présent',
    ],
    recyclable: true,
    tip: "Vérifier la mention 'sans BPA' sur l'emballage. Privilégier le verre quand possible.",
    sources: ['EFSA J. 2015', 'eur-lex 2018/213', 'ANSES 2013'],
    tagPatterns: [
      'metal-can',
      'tin-can',
      'steel-can',
      'canned-food',
      'boite-de-conserve',
      'boite-conserve',
      'conserve',
      'canned',
    ],
  },
  {
    id: 'aluminium',
    nameFr: 'Aluminium',
    riskLevel: 'moderate',
    concerns: [
      'Migration possible vers les aliments acides ou salés',
      'Apport hebdomadaire à modérer (PTWI 2 mg/kg pc/sem)',
    ],
    recyclable: true,
    tip: 'Éviter le contact prolongé avec aliments acides (tomate, agrumes, vinaigre).',
    sources: ['ANSES 2016', 'OMS PTWI'],
    tagPatterns: [
      'aluminium',
      'aluminum',
      'alu-foil',
      'aluminium-foil',
      'aluminium-can',
      'aluminum-can',
      'alu-can',
    ],
  },
  {
    id: 'tetra_pak',
    nameFr: 'Brique multicouche (Tetra Pak)',
    riskLevel: 'moderate',
    concerns: [
      'Couche plastique intérieure en polyéthylène au contact direct',
      'Recyclage complexe nécessitant filière dédiée',
    ],
    recyclable: true,
    tip: 'Recyclable dans le bac de tri. Ne pas chauffer au micro-ondes.',
    sources: ['ANSES 2014', 'EFSA J. 2010'],
    tagPatterns: [
      'tetra-pak',
      'tetrapak',
      'tetra-brik',
      'tetrabrik',
      'brique-carton',
      'brique-alimentaire',
      'multilayer',
      'beverage-carton',
    ],
  },
  {
    id: 'plastic_film',
    nameFr: 'Film plastique',
    riskLevel: 'moderate',
    concerns: [
      'Migration possible de plastifiants à chaud',
      'Souvent non recyclable selon la composition',
    ],
    recyclable: false,
    tip: 'Ne pas chauffer au micro-ondes avec le film en place.',
    sources: ['EFSA J. 2018', 'ANSES 2019'],
    tagPatterns: [
      'plastic-film',
      'plastic-wrap',
      'film-plastique',
      'cling-film',
      'sachet-plastique',
      'plastic-pouch',
      'pouch',
      'wrapper',
    ],
  },
  {
    id: 'bioplastic',
    nameFr: 'Bioplastique (PLA, etc.)',
    riskLevel: 'low',
    concerns: ['Considéré sûr au contact alimentaire selon évaluation EFSA'],
    recyclable: true,
    tip: 'Compostable industriellement. Éviter le compost domestique.',
    sources: ['EFSA J. 2010'],
    tagPatterns: [
      'bioplastic',
      'bio-plastic',
      'pla-plastic',
      'plant-based-plastic',
      'compostable-plastic',
      'polylactic-acid',
    ],
  },
  {
    id: 'glass',
    nameFr: 'Verre',
    riskLevel: 'low',
    concerns: ['Matériau inerte, aucune migration documentée'],
    recyclable: true,
    tip: 'Le matériau le plus sûr pour le contact alimentaire. Recyclable à 100%.',
    sources: ['EFSA J. 2009'],
    tagPatterns: [
      'glass',
      'glass-bottle',
      'glass-jar',
      'verre',
      'bouteille-en-verre',
      'pot-en-verre',
      'bocal-verre',
    ],
  },
  {
    id: 'cardboard',
    nameFr: 'Carton',
    riskLevel: 'low',
    concerns: ['Encres et colles présentes mais migration considérée faible'],
    recyclable: true,
    tip: 'Recyclable. Privilégier le carton certifié FSC.',
    sources: ['EFSA J. 2012'],
    tagPatterns: [
      'cardboard',
      'paperboard',
      'corrugated-board',
      'carton-recyclable',
      'paper-and-cardboard',
      'kraft-paper',
    ],
  },
  // ─── Fallback générique : doit rester en DERNIÈRE position ────────────────
  {
    id: 'unknown_plastic',
    nameFr: 'Plastique non spécifié',
    riskLevel: 'moderate',
    concerns: [
      'Type de plastique non précisé sur l\'emballage',
      'Risque variable selon le polymère réel (PVC, PS à éviter ; PP, HDPE plus sûrs)',
    ],
    recyclable: false,
    tip: 'Privilégier les emballages avec le code de recyclage explicite (1-7).',
    sources: ['ANSES 2019'],
    tagPatterns: [], // jamais matché directement, ajouté par fallback dans detectPackagingRisk
  },
];

const RISK_ORDER: Record<PackagingRiskLevel, number> = {
  high: 0,
  moderate: 1,
  low: 2,
};

const PLASTIC_IDS = new Set([
  'pet',
  'hdpe',
  'pvc',
  'ldpe',
  'pp',
  'ps',
  'plastic_film',
  'bioplastic',
  'unknown_plastic',
]);

function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/^[a-z]{2}:/, '') // strip 'en:', 'fr:', 'de:', etc.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // strip accents
}

/**
 * Détecte les matériaux d'emballage à partir des tags OFF/OBF.
 * Renvoie la liste dédupliquée triée par risque décroissant (high → moderate → low).
 * Stable : préserve l'ordre du catalogue PACKAGING_RISKS au sein d'un même niveau de risque.
 */
export function detectPackagingRisk(packagingTags: string[]): PackagingMaterial[] {
  if (!Array.isArray(packagingTags) || packagingTags.length === 0) return [];

  const normalized = packagingTags.map(normalizeTag).filter((t) => t.length > 0);
  if (normalized.length === 0) return [];

  const found: PackagingMaterial[] = [];
  const seen = new Set<string>();

  for (const material of PACKAGING_RISKS) {
    if (material.id === 'unknown_plastic') continue;
    if (seen.has(material.id)) continue;
    if (material.tagPatterns.length === 0) continue;

    const matched = normalized.some((tag) =>
      material.tagPatterns.some((pattern) => tag.includes(pattern)),
    );
    if (matched) {
      found.push(material);
      seen.add(material.id);
    }
  }

  // Fallback : si aucun plastique spécifique trouvé mais tag plastique générique présent
  const hasAnyPlastic = found.some((m) => PLASTIC_IDS.has(m.id));
  if (!hasAnyPlastic) {
    const hasPlasticTag = normalized.some(
      (tag) => tag.includes('plastic') || tag.includes('plastique'),
    );
    if (hasPlasticTag) {
      const unknown = PACKAGING_RISKS.find((m) => m.id === 'unknown_plastic');
      if (unknown) found.push(unknown);
    }
  }

  found.sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]);
  return found;
}
