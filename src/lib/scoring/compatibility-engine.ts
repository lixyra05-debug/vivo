import type {
  CompatibilityProfile,
  CompatibilityResult,
  CosmeticProduct,
  CosmeticScoringResult,
  IncompatibilityReason,
  Product,
  ScoringResult,
} from '../api/types';

// === Public exports ===

/**
 * Libellé unique du motif « on n'a pas pu vérifier ».
 *
 * Exporté parce que deux endroits doivent le reconnaître sans le redire :
 * le calcul du pourcentage ici, et la bannière, qui le porte déjà dans son
 * titre et n'a donc pas à le répéter dans sa liste de motifs.
 */
export const INSUFFICIENT_DATA_LABEL_FR =
  'Données insuffisantes pour vérifier la compatibilité';

/**
 * Liste de déclencheurs FODMAP courants (FR + EN).
 * Source : Monash University FODMAP guide (high-FODMAP foods).
 * Volontairement >=20 entrées pour couvrir les déclencheurs principaux.
 */
export const FODMAP_TRIGGERS: string[] = [
  'ail',
  'garlic',
  'oignon',
  'onion',
  'blé',
  'wheat',
  'lactose',
  'lait',
  'milk',
  'sorbitol',
  'mannitol',
  'xylitol',
  'maltitol',
  'isomalt',
  'pomme',
  'apple',
  'poire',
  'pear',
  'miel',
  'honey',
  'champignon',
  'mushroom',
  'artichaut',
  'artichoke',
  'chou-fleur',
  'cauliflower',
];

/**
 * Les paires FR/EN de `FODMAP_TRIGGERS` : le mot anglais → l'aliment, nommé en
 * français. Sert à ne compter qu'une fois un aliment nommé dans les deux
 * langues — dans deux textes, ou dans un seul texte bilingue ; la liste des
 * déclencheurs ne change pas.
 */
const FODMAP_SAME_FOOD = new Map<string, string>([
  ['garlic', 'ail'],
  ['onion', 'oignon'],
  ['wheat', 'blé'],
  ['milk', 'lait'],
  ['apple', 'pomme'],
  ['pear', 'poire'],
  ['honey', 'miel'],
  ['mushroom', 'champignon'],
  ['artichoke', 'artichaut'],
  ['cauliflower', 'chou-fleur'],
]);

// === Internal types & helpers ===

/**
 * Ramène un allergène déclaré à la clé sous laquelle le moteur l'indexe.
 *
 * Les écrans de profil ont stocké des LIBELLÉS d'affichage (« Fruits à coque »,
 * « Œufs ») là où ce fichier indexe des CLÉS (`fruits_a_coque`, `oeufs`). Ces
 * profils sont déjà en base et ne peuvent pas être réécrits : la conversion se
 * fait donc à la LECTURE, ici, au seul point de passage commun à tous les
 * producteurs de profil (adaptateur, presets, Mode Famille).
 *
 * La fonction est IDEMPOTENTE — c'est ce qui la rend sûre : appliquée à une clé
 * déjà canonique, elle la rend telle quelle.
 *
 * `œ` est remplacée explicitement plutôt que via NFKD : cette ligature n'a pas
 * de décomposition canonique (NFD la laisse intacte), et NFKD casserait au
 * passage bien d'autres caractères sans qu'on l'ait demandé.
 */
export function normalizeAllergenKey(allergen: string): string {
  return allergen
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/['’\s-]+/g, '_');
}

/**
 * Carte de mots-clés par allergène (FR + EN).
 * Sources : Annexe II du Règlement (UE) n°1169/2011 (allergènes obligatoires).
 */
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  gluten: ['gluten', 'blé', 'wheat', 'seigle', 'rye', 'orge', 'barley', 'avoine', 'oat', 'épeautre', 'kamut', 'froment'],
  lactose: ['lait', 'milk', 'lactose', 'crème', 'cream', 'beurre', 'butter', 'fromage', 'cheese', 'caséine', 'casein', 'petit-lait', 'whey'],
  arachides: ['arachide', 'peanut', 'cacahuète', 'cacahuete'],
  fruits_a_coque: ['noix', 'almond', 'amande', 'noisette', 'hazelnut', 'pistache', 'pistachio', 'cajou', 'cashew', 'pecan', 'macadamia', 'walnut'],
  soja: ['soja', 'soy', 'soybean', 'lecithine de soja', 'lécithine de soja'],
  oeufs: ['oeuf', 'œuf', 'egg', 'albumine', 'lecithine d\'oeuf', 'lécithine d\'œuf'],
  poisson: ['poisson', 'fish', 'thon', 'tuna', 'saumon', 'salmon', 'hareng', 'herring', 'sardine', 'morue', 'cod'],
  crustaces: ['crustacé', 'crustace', 'shrimp', 'crevette', 'crabe', 'crab', 'homard', 'lobster', 'langouste'],
  celeri: ['céleri', 'celeri', 'celery'],
  moutarde: ['moutarde', 'mustard'],
  sesame: ['sésame', 'sesame'],
  sulfites: [
    'sulfite',
    'dioxyde de soufre',
    'sulfur dioxide',
    'e220',
    'e221',
    'e222',
    'e223',
    'e224',
    'e225',
    'e226',
    'e227',
    'e228',
  ],
  lupin: ['lupin'],
  mollusques: ['mollusque', 'escargot', 'snail', 'huître', 'huitre', 'oyster', 'moule', 'mussel', 'calmar', 'squid', 'pétoncle'],
};

/**
 * Les 14 tags canoniques d'allergènes d'Open Food Facts (`allergens_tags`) ↔
 * les 14 clés de `ALLERGEN_KEYWORDS`, un pour un. Un tag hors de cette table
 * (« nl:Milch », « en:Œufs », « en:banana » : saisis à la main, jamais
 * normalisés par la taxonomie OFF) est ignoré.
 */
export const ALLERGEN_TAG_TO_KEY: Readonly<Record<string, string>> = {
  'en:gluten': 'gluten',
  'en:milk': 'lactose',
  'en:peanuts': 'arachides',
  'en:nuts': 'fruits_a_coque',
  'en:soybeans': 'soja',
  'en:eggs': 'oeufs',
  'en:fish': 'poisson',
  'en:crustaceans': 'crustaces',
  'en:celery': 'celeri',
  'en:mustard': 'moutarde',
  'en:sesame-seeds': 'sesame',
  'en:sulphur-dioxide-and-sulphites': 'sulfites',
  'en:lupin': 'lupin',
  'en:molluscs': 'mollusques',
};

/** Recherche sans détour par le prototype (« constructor » n'est pas un tag). */
const TAG_KEYS = new Map(Object.entries(ALLERGEN_TAG_TO_KEY));

const ALLERGEN_LABELS_FR: Record<string, string> = {
  gluten: 'gluten',
  lactose: 'lactose',
  arachides: 'arachides',
  fruits_a_coque: 'fruits à coque',
  soja: 'soja',
  oeufs: 'œufs',
  poisson: 'poisson',
  crustaces: 'crustacés',
  celeri: 'céleri',
  moutarde: 'moutarde',
  sesame: 'sésame',
  sulfites: 'sulfites',
  lupin: 'lupin',
  mollusques: 'mollusques',
};

/** Mots-clés d'origine animale pour végé/vegan. */
const ANIMAL_KEYWORDS_VEGAN = [
  'viande',
  'meat',
  'lait',
  'milk',
  'oeuf',
  'œuf',
  'egg',
  'miel',
  'honey',
  'gélatine',
  'gelatine',
  'gelatin',
  'présure',
  'rennet',
  'lactose',
  'fromage',
  'cheese',
  'beurre',
  'butter',
  'crème',
  'caséine',
  'casein',
  'petit-lait',
  'whey',
  'poisson',
  'fish',
];

const ANIMAL_KEYWORDS_VEGETARIEN = [
  'viande',
  'meat',
  'poisson',
  'fish',
  'gélatine',
  'gelatine',
  'gelatin',
  'présure',
  'rennet',
  'thon',
  'saumon',
  'jambon',
  'ham',
  'porc',
  'pork',
  'bœuf',
  'beef',
  'volaille',
  'poultry',
];

/** Halal : interdit porc + alcool. */
const HALAL_FORBIDDEN = [
  'porc',
  'pork',
  'lard',
  'jambon',
  'ham',
  'bacon',
  'alcool',
  'alcohol',
  'vin',
  'wine',
  'gélatine de porc',
  'charcuterie',
];

/** Sans porc (charcuterie). */
const SANS_PORC_KEYWORDS = ['porc', 'pork', 'lard', 'jambon', 'ham', 'bacon', 'charcuterie'];

/** Casher : porc + crustacés + mélange viande/lait simplifié. */
const CASHER_FORBIDDEN = [
  'porc',
  'pork',
  'lard',
  'jambon',
  'ham',
  'bacon',
  'crustacé',
  'crustace',
  'crevette',
  'crabe',
  'homard',
];

/** Mots-clés pour grossesse (en plus de l'alcool). */
const PREGNANT_FORBIDDEN_FOOD = [
  'alcool',
  'alcohol',
  'vin',
  'wine',
  'lait cru',
  'fromage au lait cru',
  'raw milk',
];

/** INCI / ingrédients cosmétiques interdits pendant la grossesse. */
const PREGNANT_FORBIDDEN_COSMETIC = ['retinol', 'rétinol', 'retinyl', 'rétinyl'];

/** Cosmétique bébé : fragrance, alcool denat. */
const BABY_FORBIDDEN_COSMETIC = ['fragrance', 'parfum', 'alcohol denat', 'alcool denat'];

/** Huiles de graines détectables via oil_types. */
const SEED_OIL_TYPES = ['sunflower', 'rapeseed', 'soy', 'corn', 'cottonseed', 'grapeseed'];

/** Match palme dans ingrédients. */
const PALM_OIL_KEYWORDS = ['palme', 'palm oil', 'palmiste'];

function normalize(text: string): string {
  return text.toLowerCase();
}

/**
 * Échappe les caractères spéciaux RegExp pour pouvoir les utiliser comme
 * littéral dans une expression régulière. Référence : MDN — Regular_Expressions.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Match d'un mot-clé sur frontière de mots Unicode. Évite "amande" matchant
 * "amandine" ou "gluten" matchant "glutenfree". On ne peut pas utiliser
 * `\b…\b` natif : il est ASCII-only et casserait les mots accentués
 * ("blé", "céleri", "sésame"). On utilise donc des lookarounds Unicode
 * (`\p{L}` : toute lettre).
 */
function matchesWord(text: string, keyword: string): boolean {
  if (!keyword) return false;
  return new RegExp(
    `(?<!\\p{L})${escapeRegExp(keyword)}(?!\\p{L})`,
    'iu',
  ).test(text);
}

/** Type guard : produit cosmétique vs alimentaire. */
function isCosmetic(p: Product | CosmeticProduct): p is CosmeticProduct {
  return 'ingredients_inci' in p;
}

/**
 * Recherche d'un mot-clé dans un texte : insensible à la casse,
 * et tolérant aux variations de ponctuation.
 */
function textContainsAny(text: string, keywords: string[]): string | null {
  for (const kw of keywords) {
    if (!kw) continue;
    if (matchesWord(text, kw)) return kw;
  }
  return null;
}

/**
 * Accents qu'une étiquette peut omettre (« BLE », « CREME », « CRUSTACES ») :
 * dans un mot-clé d'allergène, chacun devient FACULTATIF dans le texte. Le sens
 * est unique — un accent présent dans le texte n'est jamais ignoré — sans quoi
 * « moulé » (fromage moulé à la louche) se lirait « moule », le mollusque.
 */
const OPTIONAL_ACCENTS: Record<string, string> = {
  à: '[aà]',
  â: '[aâ]',
  é: '[eé]',
  è: '[eè]',
  ê: '[eê]',
  ë: '[eë]',
  î: '[iî]',
  ï: '[iï]',
  ô: '[oô]',
  ù: '[uù]',
  û: '[uû]',
  ü: '[uü]',
  ç: '[cç]',
};

/**
 * Motif d'un mot-clé d'ALLERGÈNE, tolérant aux seules graphies d'étiquette du
 * même mot : casse, accent omis, ligature œ ↔ oe, pluriel en -s (« ŒUFS »,
 * « NOISETTES », « (SULFITES) »). Un mot-clé terminé par s, x ou z est
 * invariable (« noix ») et un code (« e220 ») ne prend pas de pluriel. Les
 * frontières sont celles de `matchesWord` : « bœuf » ne contient pas « œuf »,
 * ni « laitue » « lait ».
 */
function allergenPattern(keyword: string): RegExp {
  let body = '';
  for (let i = 0; i < keyword.length; i += 1) {
    const c = keyword[i];
    if (c === 'œ') {
      body += '(?:œ|oe)';
    } else if (c === 'o' && keyword[i + 1] === 'e') {
      body += '(?:oe|œ)';
      i += 1;
    } else {
      body += OPTIONAL_ACCENTS[c] ?? escapeRegExp(c);
    }
  }
  const plural = /[sxz\d]$/.test(keyword) ? '' : 's?';
  return new RegExp(`(?<!\\p{L})${body}${plural}(?!\\p{L})`, 'iu');
}

/**
 * Premier mot-clé d'allergène présent dans les textes, AVEC la graphie sous
 * laquelle il y figure : `matched` vaut « NOISETTES » quand le mot-clé est
 * `noisette`. Les textes sont lus dans leur ordre — le français d'abord —, et
 * dans chacun l'ordre de `keywords`. Le motif n'a ni `g` ni `y` : `exec`
 * répond exactement comme `test`, sans état.
 */
function findAllergen(
  texts: readonly string[],
  keywords: string[],
): { keyword: string; matched: string } | null {
  for (const text of texts) {
    for (const kw of keywords) {
      if (!kw) continue;
      const match = allergenPattern(kw).exec(text);
      if (match) return { keyword: kw, matched: match[0] };
    }
  }
  return null;
}

/** `textContainsAny` réservée aux mots-clés d'allergènes (motif tolérant). */
function textContainsAllergen(text: string, keywords: string[]): string | null {
  return findAllergen([text], keywords)?.keyword ?? null;
}

/** Extrait le numéro E d'un tag OFF (en:e150d → 150). Retourne null sinon. */
function parseEcode(tag: string): number | null {
  const match = /e(\d+)/i.exec(tag);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Textes d'ingrédients à inspecter, dans leur ordre de lecture.
 *
 * Alimentaire : le texte FRANÇAIS d'abord (`ingredients_text_fr`), puis celui
 * de la langue principale de la fiche (`ingredients_raw`, qui seul nourrit la
 * note). Les deux sont lus : le français est celui de l'étiquette vendue en
 * France, mais une fiche OFF peut porter deux versions de recette, et le texte
 * principal garde tout ce que la lecture d'avant voyait — aucune alerte n'est
 * perdue. Un texte vide, ou identique au précédent, est sauté. Une ligne de
 * cache antérieure à la migration 017 n'a que le texte principal.
 */
function getIngredientTexts(product: Product | CosmeticProduct): string[] {
  const candidates = isCosmetic(product)
    ? [product.ingredients_inci]
    : [product.ingredients_text_fr, product.ingredients_raw];
  const texts: string[] = [];
  for (const text of candidates) {
    if (typeof text === 'string' && text.trim().length > 0 && !texts.includes(text)) {
      texts.push(text);
    }
  }
  return texts;
}

/**
 * Les textes, joints pour les lecteurs qui n'en cherchent qu'un : un retour à
 * la ligne n'est pas une lettre, les frontières de mots tiennent, et aucun
 * mot-clé ne peut se former à cheval sur deux textes.
 */
function getIngredientText(product: Product | CosmeticProduct): string | null {
  const texts = getIngredientTexts(product);
  return texts.length > 0 ? texts.join('\n') : null;
}

/**
 * Clés des allergènes que la source DÉCLARE (`allergens_tags`, alimentaire
 * seulement). Un allergène déclaré est lu comme « contient » — la déclaration,
 * saisie par la communauté, peut se tromper (traces recopiées, châtaigne
 * déclarée « fruit à coque », tag sans appui) : une alerte de trop plutôt
 * qu'une manquée. Un allergène absent de
 * la déclaration n'est pas pour autant absent du produit — d'où l'union avec
 * le texte, jamais l'intersection.
 */
function declaredAllergenKeys(product: Product | CosmeticProduct): Set<string> {
  const keys = new Set<string>();
  if (isCosmetic(product)) return keys;
  for (const tag of product.allergens_tags ?? []) {
    const key = TAG_KEYS.get(tag);
    if (key) keys.add(key);
  }
  return keys;
}

// === Core logic ===

export function checkCompatibility(
  product: Product | CosmeticProduct,
  scoringResult: ScoringResult | CosmeticScoringResult,
  profile: CompatibilityProfile
): CompatibilityResult {
  const incompatibilities: IncompatibilityReason[] = [];
  const ingredientTexts = getIngredientTexts(product);
  const ingredientText = getIngredientText(product) ?? '';
  const hasText = ingredientTexts.length > 0;
  const declaredAllergens = declaredAllergenKeys(product);

  // Si on a besoin d'inspecter les ingrédients (allergies / certains conditions)
  // mais qu'ils sont absents → un seul warning "données insuffisantes" suffit.
  let dataInsufficientFlagged = false;
  function flagInsufficientData(): void {
    if (dataInsufficientFlagged) return;
    dataInsufficientFlagged = true;
    incompatibilities.push({
      type: 'condition',
      labelFr: INSUFFICIENT_DATA_LABEL_FR,
      severity: 'warning',
    });
  }

  // === 1. Allergies (texte + allergènes déclarés, blockers) ===
  function pushAllergy(allergy: string, matchedText?: string): void {
    const labelFr = `Contient ${ALLERGEN_LABELS_FR[allergy] ?? allergy} (allergie déclarée)`;
    const reason: IncompatibilityReason = { type: 'allergy', labelFr, severity: 'blocker' };
    // Une graphie n'existe que si le mot a été LU dans un texte : un tag —
    // additif (`en:e220`) ou allergène déclaré (`en:milk`) — ne dit pas comment
    // la liste l'écrit.
    if (matchedText) reason.matchedText = matchedText;
    incompatibilities.push(reason);
  }
  // Allergies réellement CHERCHÉES dans un texte (clé connue + liste présente).
  // Le bandeau en a besoin pour ne parler d'« allergènes » qu'à qui en a déclaré.
  let checkedAllergenCount = 0;
  for (const rawAllergy of profile.allergies) {
    // Les profils enregistrés avant l'alignement des écrans portent des
    // libellés (« Œufs ») et non des clés (`oeufs`) : on les ramène ici.
    const allergy = normalizeAllergenKey(rawAllergy);
    const keywords = ALLERGEN_KEYWORDS[allergy];
    // Un allergène que le moteur ne sait pas chercher n'est pas une bonne
    // nouvelle : c'est une vérification qui n'a pas eu lieu, et elle doit se
    // dire. Sortir en silence ici est précisément ce qui faisait annoncer
    // « Compatible avec votre profil » à un allergique jamais contrôlé.
    if (!keywords) {
      flagInsufficientData();
      continue;
    }
    const declared = declaredAllergens.has(allergy);
    if (!hasText) {
      // Sans liste, une déclaration est lue comme « contient » ; son absence
      // ne conclut rien.
      if (declared) pushAllergy(allergy);
      else flagInsufficientData();
      continue;
    }
    checkedAllergenCount += 1;
    const inText = findAllergen(ingredientTexts, keywords);
    let found = inText !== null || declared;
    // Cas spécial sulfites : on regarde aussi additives_tags pour les produits food
    if (!found && !isCosmetic(product) && allergy === 'sulfites') {
      for (const tag of product.additives_tags ?? []) {
        const code = parseEcode(tag);
        if (code !== null && code >= 220 && code <= 228) {
          found = true;
          break;
        }
      }
    }
    if (found) pushAllergy(allergy, inText?.matched);
  }

  // === 2. Dietary (blockers) ===
  for (const diet of profile.dietary) {
    if (!hasText) {
      flagInsufficientData();
      continue;
    }
    const txt = ingredientText;
    if (diet === 'vegan') {
      const hit = textContainsAny(txt, ANIMAL_KEYWORDS_VEGAN);
      if (hit) {
        incompatibilities.push({
          type: 'dietary',
          labelFr: `Non végan (contient ${hit})`,
          severity: 'blocker',
        });
      }
    } else if (diet === 'vegetarien') {
      const hit = textContainsAny(txt, ANIMAL_KEYWORDS_VEGETARIEN);
      if (hit) {
        incompatibilities.push({
          type: 'dietary',
          labelFr: `Non végétarien (contient ${hit})`,
          severity: 'blocker',
        });
      }
    } else if (diet === 'halal') {
      const hit = textContainsAny(txt, HALAL_FORBIDDEN);
      if (hit) {
        incompatibilities.push({
          type: 'dietary',
          labelFr: `Non halal (contient ${hit})`,
          severity: 'blocker',
        });
      }
    } else if (diet === 'casher') {
      const hit = textContainsAny(txt, CASHER_FORBIDDEN);
      if (hit) {
        incompatibilities.push({
          type: 'dietary',
          labelFr: `Non casher (contient ${hit})`,
          severity: 'blocker',
        });
      }
    } else if (diet === 'sans_porc') {
      const hit = textContainsAny(txt, SANS_PORC_KEYWORDS);
      if (hit) {
        incompatibilities.push({
          type: 'dietary',
          labelFr: `Contient du porc (${hit})`,
          severity: 'blocker',
        });
      }
    }
  }

  // === 3. Conditions ===
  for (const condition of profile.conditions) {
    if (condition === 'diabete') {
      // food only
      if (!isCosmetic(product)) {
        // Teneur INCONNUE ≠ teneur nulle. Le `?? 0` d'avant transformait un
        // produit non renseigné en produit sans sucres, donc « compatible ».
        const sugars = product.sugars_100g;
        if (sugars == null) {
          flagInsufficientData();
        } else if (sugars > 20) {
          incompatibilities.push({
            type: 'condition',
            labelFr: `Sucres élevés (${sugars.toFixed(1)}g/100g)`,
            severity: 'warning',
          });
        }
        // Le contrôle de score ne dépend d'aucune donnée nutritionnelle : il
        // reste évalué même quand la teneur en sucres est absente.
        if (scoringResult.score_final < 40) {
          incompatibilities.push({
            type: 'condition',
            labelFr: 'Score nutritionnel insuffisant pour profil diabète',
            severity: 'warning',
          });
        }
      }
    } else if (condition === 'enceinte') {
      if (isCosmetic(product)) {
        if (!hasText) {
          flagInsufficientData();
          continue;
        }
        const hit = textContainsAny(ingredientText, PREGNANT_FORBIDDEN_COSMETIC);
        if (hit) {
          incompatibilities.push({
            type: 'condition',
            labelFr: `Rétinol/dérivés interdits pendant la grossesse (${hit})`,
            severity: 'blocker',
          });
        }
      } else {
        if (!hasText) {
          flagInsufficientData();
          continue;
        }
        const hit = textContainsAny(ingredientText, PREGNANT_FORBIDDEN_FOOD);
        if (hit) {
          incompatibilities.push({
            type: 'condition',
            labelFr: `Interdit pendant la grossesse (contient ${hit})`,
            severity: 'blocker',
          });
        }
      }
    } else if (condition === 'bebe') {
      if (isCosmetic(product)) {
        if (!hasText) {
          flagInsufficientData();
          continue;
        }
        const hit = textContainsAny(ingredientText, BABY_FORBIDDEN_COSMETIC);
        if (hit) {
          incompatibilities.push({
            type: 'condition',
            labelFr: `Cosmétique non adapté bébé (${hit})`,
            severity: 'blocker',
          });
        }
      } else {
        // Trois contrôles indépendants : chacun avoue sa propre absence de
        // donnée. `flagInsufficientData` étant idempotente, plusieurs manques
        // ne produisent qu'un seul avertissement.
        const salt = product.salt_100g;
        const sugars = product.sugars_100g;
        if (salt == null) {
          flagInsufficientData();
        } else if (salt > 1) {
          incompatibilities.push({
            type: 'condition',
            labelFr: `Sel trop élevé pour bébé (${salt.toFixed(2)}g/100g)`,
            severity: 'warning',
          });
        }
        if (sugars == null) {
          flagInsufficientData();
        } else if (sugars > 10) {
          incompatibilities.push({
            type: 'condition',
            labelFr: `Sucres trop élevés pour bébé (${sugars.toFixed(1)}g/100g)`,
            severity: 'warning',
          });
        }
        // `nova_group === 4` sur un NOVA absent valait `false`, soit exactement
        // la réponse rassurante — pour un profil bébé.
        if (product.nova_group == null) {
          flagInsufficientData();
        } else if (product.nova_group === 4) {
          incompatibilities.push({
            type: 'condition',
            labelFr: 'Aliment ultra-transformé non recommandé pour bébé (NOVA 4)',
            severity: 'warning',
          });
        }
        // ScoringResult.blockers is on food only
        if (
          'blockers' in scoringResult &&
          Array.isArray(scoringResult.blockers) &&
          scoringResult.blockers.length > 0
        ) {
          incompatibilities.push({
            type: 'condition',
            labelFr: 'Produit contient un ingrédient bloquant pour bébé',
            severity: 'blocker',
          });
        }
      }
    } else if (condition === 'coeliaque') {
      // Mêmes sources que l'allergie au gluten : les deux concluent pareil.
      const declared = declaredAllergens.has('gluten');
      if (!hasText && !declared) {
        flagInsufficientData();
        continue;
      }
      const hit = hasText ? textContainsAllergen(ingredientText, ALLERGEN_KEYWORDS.gluten) : null;
      if (hit || declared) {
        incompatibilities.push({
          type: 'condition',
          labelFr: hit
            ? `Contient du gluten (${hit}) — interdit pour cœliaque`
            : 'Contient du gluten — interdit pour cœliaque',
          severity: 'blocker',
        });
      }
    } else if (condition === 'ibs_fodmap') {
      if (!hasText) {
        flagInsufficientData();
        continue;
      }
      // Une incompatibilité par ALIMENT trouvé : le texte français et le texte
      // principal sont lus tous les deux, et « oignon » puis « onion » ne font
      // qu'un déclencheur, nommé en français (FR avant EN dans la liste).
      // Utilise frontières de mots pour éviter "ail" matchant "ailerons".
      const matched = new Set<string>();
      for (const trig of FODMAP_TRIGGERS) {
        const food = FODMAP_SAME_FOOD.get(trig) ?? trig;
        if (!matched.has(food) && matchesWord(ingredientText, trig)) {
          matched.add(food);
          incompatibilities.push({
            type: 'condition',
            labelFr: `Déclencheur FODMAP détecté : ${trig}`,
            severity: 'warning',
          });
        }
      }
    } else if (condition === 'hypertension') {
      if (!isCosmetic(product)) {
        const salt = product.salt_100g;
        if (salt == null) {
          flagInsufficientData();
        } else if (salt > 1.5) {
          incompatibilities.push({
            type: 'condition',
            labelFr: `Sel trop élevé pour hypertension (${salt.toFixed(2)}g/100g)`,
            severity: 'warning',
          });
        }
      }
    } else if (condition === 'cholesterol') {
      if (!isCosmetic(product)) {
        const sat = product.saturated_fat_100g;
        if (sat == null) {
          flagInsufficientData();
        } else if (sat > 5) {
          incompatibilities.push({
            type: 'condition',
            labelFr: `Graisses saturées élevées (${sat.toFixed(1)}g/100g)`,
            severity: 'warning',
          });
        }
      }
    }
  }

  // === 4. Avoid (warnings) ===
  for (const item of profile.avoid) {
    if (item === 'seed_oils') {
      if (!isCosmetic(product)) {
        const oils = product.oil_types ?? [];
        const found = oils.find((o) => SEED_OIL_TYPES.includes(o.toLowerCase()));
        if (found) {
          incompatibilities.push({
            type: 'avoid',
            labelFr: 'Contient des huiles de graines',
            severity: 'warning',
          });
        }
      }
    } else if (item === 'additifs_controverses') {
      const flagged = scoringResult.penalties.some((p) => {
        const cat = p.category;
        const isControversial =
          cat === 'additive' || cat === 'preservative' || cat === 'endocrine';
        return isControversial && p.points >= 10;
      });
      if (flagged) {
        incompatibilities.push({
          type: 'avoid',
          labelFr: 'Contient des additifs controversés',
          severity: 'warning',
        });
      }
    } else if (item === 'colorants') {
      if (!isCosmetic(product)) {
        const tags = product.additives_tags ?? [];
        const colorant = tags.find((t) => {
          const code = parseEcode(t);
          return code !== null && code >= 100 && code <= 199;
        });
        if (colorant) {
          incompatibilities.push({
            type: 'avoid',
            labelFr: `Contient un colorant (${colorant.toUpperCase()})`,
            severity: 'warning',
          });
        }
      }
    } else if (item === 'edulcorants') {
      if (!isCosmetic(product)) {
        const tags = product.additives_tags ?? [];
        const edulc = tags.find((t) => {
          const code = parseEcode(t);
          return code !== null && code >= 950 && code <= 969;
        });
        if (edulc) {
          incompatibilities.push({
            type: 'avoid',
            labelFr: `Contient un édulcorant (${edulc.toUpperCase()})`,
            severity: 'warning',
          });
        }
      }
    } else if (item === 'huile_palme') {
      if (!isCosmetic(product)) {
        if (!hasText) {
          flagInsufficientData();
          continue;
        }
        const hit = textContainsAny(ingredientText, PALM_OIL_KEYWORDS);
        if (hit) {
          incompatibilities.push({
            type: 'avoid',
            labelFr: 'Contient de l\'huile de palme',
            severity: 'warning',
          });
        }
      }
    }
  }

  // === 5. Score gate ===
  if (scoringResult.score_final < profile.minScore) {
    incompatibilities.push({
      type: 'score',
      labelFr: `Score (${scoringResult.score_final}) sous le seuil (${profile.minScore})`,
      severity: 'blocker',
    });
  }

  // === Tri : blockers d'abord, puis warnings — ordre d'insertion préservé. ===
  const blockers = incompatibilities.filter((i) => i.severity === 'blocker');
  const warnings = incompatibilities.filter((i) => i.severity === 'warning');
  const sorted = [...blockers, ...warnings];

  const isCompatible = blockers.length === 0;

  // === Compatibility percentage ===
  const totalCriteria =
    profile.allergies.length +
    profile.dietary.length +
    profile.conditions.length +
    profile.avoid.length +
    1; // +1 pour le score
  const failedCriteria = sorted.length;
  let compatibilityPercentage: number;
  if (totalCriteria === 0) {
    compatibilityPercentage = 100;
  } else {
    const passed = Math.max(0, totalCriteria - failedCriteria);
    compatibilityPercentage = Math.round((passed / totalCriteria) * 100);
  }
  // Cas limite : rien n'a pu être vérifié, et rien d'autre n'a échoué → 100 %.
  // `flagInsufficientData` est le seul producteur de ce motif, et la condition
  // `sorted.length === 1` dit que ce motif est la SEULE incompatibilité — donc
  // qu'aucun critère réellement évalué n'est en échec.
  //
  // Ce drapeau ne se limite plus au texte d'ingrédients manquant : il couvre
  // aussi un allergène inconnu du moteur et une donnée nutritionnelle absente.
  // La condition reste la bonne pour autant, puisqu'elle porte sur le décompte
  // et non sur la cause.
  if (dataInsufficientFlagged && sorted.length === 1) {
    compatibilityPercentage = 100;
  }

  return {
    isCompatible,
    score: scoringResult.score_final,
    incompatibilities: sorted,
    compatibilityPercentage,
    verificationStatus: dataInsufficientFlagged ? 'insufficient_data' : 'verified',
    checkedAllergenCount,
  };
}
