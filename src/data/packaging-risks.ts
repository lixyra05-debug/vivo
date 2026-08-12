/**
 * PACKAGING_RISKS — base de connaissances des risques liés aux emballages alimentaires
 * et cosmétiques.
 *
 * Chaque entrée est sourcée EFSA / ANSES / ECHA / CIRC / OMS / eur-lex.
 * Aucune source non-officielle (test garde-fou anti-source-tierce).
 *
 * ── Changement de source ────────────────────────────────────────────────────
 * La détection lisait `packaging_tags`, un champ OFF hérité qui agrège à plat
 * matériaux, formes et mentions de recyclage — sans lien entre eux, et souvent
 * pollué par des contributions erronées. Sur une bouteille Cristaline, ce champ
 * contenait `en:aluminium-can` : la fiche affichait donc « Aluminium — risque
 * modéré » sur une bouteille en PET. Le matching était juste ; la donnée
 * était fausse.
 *
 * `detectPackagingRisk` consomme désormais `packagings[]`, la structure OFF
 * moderne où chaque composant porte son matériau, sa forme et son contact
 * alimentaire. Mesuré sur 100 produits FR : `packagings[]` est présent sur
 * 85 % d'entre eux contre 76 % pour `packaging_tags` — changer de source
 * augmente la couverture en plus de la fiabilité. Un seul produit de
 * l'échantillon avait des tags sans `packagings[]` : c'est le coût, assumé,
 * de ne jamais retomber sur la source corrompue.
 */

export type PackagingRiskLevel = 'low' | 'moderate' | 'high';

/**
 * Un composant d'emballage tel que OFF/OBF le renvoie dans `packagings[]`.
 *
 * Les trois champs sont optionnels côté API : sur ~197 composants observés,
 * `material` est absent 22 fois et `food_contact` 78 fois.
 */
export interface PackagingComponent {
  material?: string | null;
  shape?: string | null;
  /** 1 = contact alimentaire · 0 = pas de contact · absent = inconnu. */
  food_contact?: number | null;
}

export interface PackagingMaterial {
  id: string;
  nameFr: string;
  riskLevel: PackagingRiskLevel;
  concerns: string[];
  /**
   * `true` / `false` = propriété documentée du matériau.
   * `null` = **inconnu** — la recyclabilité dépend de la composition réelle,
   * que la donnée OFF ne précise pas.
   *
   * `false` est une affirmation, pas un défaut. Ne le poser que lorsqu'une
   * source établit l'exclusion des filières (PVC, PS). Traduire une absence de
   * donnée en « Non recyclable » est le défaut que ce champ existe pour éviter.
   */
  recyclable: boolean | null;
  tip: string;
  sources: string[];
  /** Patterns testés contre le `material` normalisé (lowercase, sans préfixe lang, sans accent). */
  tagPatterns: string[];
  /**
   * Pour les entrées qu'un matériau seul ne suffit pas à identifier : `en:metal`
   * ne dit pas « conserve », il faut la forme. L'entrée est validée si
   * `materials` ET `shapes` matchent tous les deux.
   */
  qualifiedBy?: { materials: string[]; shapes: string[] };
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
      'pet-transparent',
      'pet-coloured',
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
    // `conserve` et `canned` ont été retirés : ce sont des FORMES ou des
    // mentions de conditionnement, pas des matériaux. Un bocal en verre étiqueté
    // « conserve » était compté comme boîte métallique.
    tagPatterns: [
      'metal-can',
      'tin-can',
      'steel-can',
      'canned-food',
      'boite-de-conserve',
      'boite-conserve',
    ],
    // `en:metal` est le 8ᵉ matériau le plus fréquent et ne dit rien à lui seul :
    // il ne devient une conserve que combiné à une forme de boîte.
    qualifiedBy: {
      materials: ['metal', 'tin', 'steel', 'fer-blanc'],
      shapes: ['can', 'drink-can', 'beverage-can', 'canned'],
    },
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
      'Recyclabilité variable selon la composition du film',
    ],
    // Le concern ci-dessus dit lui-même que ça dépend de la composition :
    // affirmer « non recyclable » serait une conclusion que la donnée ne porte pas.
    recyclable: null,
    tip: 'Ne pas chauffer au micro-ondes avec le film en place.',
    sources: ['EFSA J. 2018', 'ANSES 2019'],
    // `pouch` et `wrapper` ont été retirés : ce sont des FORMES. Elles arrivent
    // désormais dans `shape`, jamais dans `material`, et matchaient auparavant
    // n'importe quel emballage souple, y compris en papier.
    tagPatterns: [
      'plastic-film',
      'plastic-wrap',
      'film-plastique',
      'cling-film',
      'sachet-plastique',
      'plastic-pouch',
    ],
  },
  {
    id: 'bioplastic',
    nameFr: 'Bioplastique (PLA, etc.)',
    riskLevel: 'low',
    concerns: ['Considéré sûr au contact alimentaire selon évaluation EFSA'],
    // « PLA, etc. » recouvre des polymères au sort opposé : un PLA se composte
    // et n'entre dans aucune filière de recyclage, un bio-PE se recycle comme
    // du PE. Sans le polymère exact, on ne peut pas trancher.
    recyclable: null,
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
    nameFr: 'Carton et papier',
    riskLevel: 'low',
    concerns: ['Encres et colles présentes mais migration considérée faible'],
    recyclable: true,
    tip: 'Recyclable. Privilégier le carton certifié FSC.',
    sources: ['EFSA J. 2012'],
    // `paper` couvre `en:paper` (9ᵉ matériau le plus fréquent), `en:paperboard`
    // et `en:paper-and-plastic` — aucun n'était matché auparavant. Pas de
    // pattern `carton` : `en:beverage-carton` est une FORME (Tetra Pak), et
    // aucun `material` observé ne porte ce mot.
    tagPatterns: ['cardboard', 'paper', 'corrugated-board', 'kraft'],
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
    // Un matériau inconnu par définition ne peut pas être déclaré non
    // recyclable. `en:plastic` représente 42 % des matériaux observés :
    // l'affirmation aurait porté sur une part énorme du catalogue.
    recyclable: null,
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

/** Au-delà, la section devient un inventaire illisible. */
export const MAX_DETECTED_MATERIALS = 3;

function coerceString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

/**
 * `food_contact` ne pouvant valoir que 0 ou 1, toute autre valeur est traitée
 * comme inconnue plutôt que coercée. Une coercition hasardeuse vers 0
 * exclurait le composant du calcul — l'inverse d'un comportement prudent.
 */
function coerceFoodContact(value: unknown): number | null {
  if (value === 0 || value === 1) return value;
  if (value === '0') return 0;
  if (value === '1') return 1;
  return null;
}

/** Normalise le `packagings[]` brut d'OFF/OBF. Tolère tout payload malformé. */
export function normalizePackagings(raw: unknown): PackagingComponent[] {
  if (!Array.isArray(raw)) return [];
  const components: PackagingComponent[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    components.push({
      material: coerceString(entry.material),
      shape: coerceString(entry.shape),
      food_contact: coerceFoodContact(entry.food_contact),
    });
  }
  return components;
}

const CATALOG_INDEX = new Map(PACKAGING_RISKS.map((m, i) => [m.id, i]));
const BY_ID = new Map(PACKAGING_RISKS.map((m) => [m.id, m]));

function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/^[a-z]{2}:/, '') // strip 'en:', 'fr:', 'de:', etc.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // strip accents
}

function matchesComponent(
  entry: PackagingMaterial,
  material: string,
  shape: string,
): boolean {
  if (entry.tagPatterns.some((p) => material.includes(p))) return true;
  const q = entry.qualifiedBy;
  if (!q) return false;
  // La forme est comparée en ÉGALITÉ, pas en inclusion : `can` ne doit pas
  // matcher `canister`.
  return q.materials.some((p) => material.includes(p)) && q.shapes.includes(shape);
}

/**
 * Détecte les matériaux d'emballage à partir des composants `packagings[]`.
 *
 * Deux règles portent l'essentiel de la correction :
 *
 *   • Contact alimentaire — seul un `food_contact` EXPLICITEMENT à 0 exclut un
 *     composant. Le champ est absent sur ~40 % des composants observés :
 *     traiter l'absence comme « pas de contact » en supprimerait la moitié.
 *     Absent = inconnu = conservé.
 *
 *   • Priorité — les matériaux au contact de l'aliment passent devant, puis le
 *     risque décroissant, puis l'ordre du catalogue (tri stable). Un revêtement
 *     à risque élevé sur un suremballage ne doit pas masquer le matériau que
 *     l'aliment touche réellement.
 *
 * Renvoie `[]` si `packagings[]` est absent ou vide : la section disparaît,
 * elle ne retombe jamais sur `packaging_tags`.
 */
export function detectPackagingRisk(
  components: PackagingComponent[],
): PackagingMaterial[] {
  if (!Array.isArray(components) || components.length === 0) return [];

  // id → au moins un composant matché est au contact alimentaire
  const hits = new Map<string, boolean>();
  let genericPlastic: { seen: boolean; foodContact: boolean } = {
    seen: false,
    foodContact: false,
  };

  for (const component of components) {
    if (!component || typeof component !== 'object') continue;
    if (component.food_contact === 0) continue;

    const material = normalizeTag(component.material ?? '');
    if (material.length === 0) continue;
    const shape = normalizeTag(component.shape ?? '');
    const foodContact = component.food_contact === 1;

    for (const entry of PACKAGING_RISKS) {
      if (entry.id === 'unknown_plastic') continue;
      if (!matchesComponent(entry, material, shape)) continue;
      hits.set(entry.id, (hits.get(entry.id) ?? false) || foodContact);
    }

    if (material.includes('plastic') || material.includes('plastique')) {
      genericPlastic = {
        seen: true,
        foodContact: genericPlastic.foodContact || foodContact,
      };
    }
  }

  // Fallback : un plastique générique n'est signalé que si AUCUN plastique
  // précis n'a été identifié — sinon on afficherait « non spécifié » à côté
  // du polymère qu'on vient justement de nommer.
  const hasSpecificPlastic = [...hits.keys()].some((id) => PLASTIC_IDS.has(id));
  if (genericPlastic.seen && !hasSpecificPlastic) {
    hits.set('unknown_plastic', genericPlastic.foodContact);
  }

  return [...hits.entries()]
    .map(([id, foodContact]) => ({ entry: BY_ID.get(id), foodContact }))
    .filter((d): d is { entry: PackagingMaterial; foodContact: boolean } =>
      Boolean(d.entry),
    )
    .sort((a, b) => {
      if (a.foodContact !== b.foodContact) return a.foodContact ? -1 : 1;
      const byRisk =
        RISK_ORDER[a.entry.riskLevel] - RISK_ORDER[b.entry.riskLevel];
      if (byRisk !== 0) return byRisk;
      return (
        (CATALOG_INDEX.get(a.entry.id) ?? 0) - (CATALOG_INDEX.get(b.entry.id) ?? 0)
      );
    })
    .slice(0, MAX_DETECTED_MATERIALS)
    .map((d) => d.entry);
}
