/**
 * wellness-recipes — Catalogue de recettes bien-être (tisanes, décoctions, bains).
 *
 * R5 absolu : aucune allégation thérapeutique. On utilise "favorise",
 * "contribue", "apaisant", "soutient". Jamais "soigne", "guérit", "traite",
 * "remplace", "médicament" (en tant que substitut).
 *
 * Chaque `plantIds[]` doit référencer un id présent dans
 * `src/data/plant-encyclopedia.ts`. Test garde-fou dans
 * `__tests__/wellness-recipes.test.ts`.
 */

export type RecipeCategory =
  | 'sleep'
  | 'digestion'
  | 'stress'
  | 'energy'
  | 'skin'
  | 'immunity'
  | 'detox';

export type RecipeDifficulty = 'easy' | 'medium';

export interface WellnessRecipe {
  id: string;
  titleFr: string;
  emoji: string;
  category: RecipeCategory;
  plantIds: string[];
  ingredientsFr: string[];
  preparationFr: string;
  durationMinutes: number;
  timingFr: string;
  benefitsFr: string;
  difficulty: RecipeDifficulty;
}

export const WELLNESS_RECIPES: WellnessRecipe[] = [
  // ─── SLEEP (5) ─────────────────────────────────────────────────────────
  {
    id: 'tisane-camomille-soir',
    titleFr: 'Tisane camomille du soir',
    emoji: '🌼',
    category: 'sleep',
    plantIds: ['chamomile'],
    ingredientsFr: [
      '1 cuillère à soupe de fleurs de camomille séchées',
      '250 mL d\'eau frémissante',
      '1 cuillère à café de miel (facultatif)',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur les fleurs, couvre la tasse et laisse infuser 8 minutes. Filtre, ajoute le miel si tu veux.',
    durationMinutes: 8,
    timingFr: 'Le soir, 30 minutes avant le coucher',
    benefitsFr:
      'Favorise la détente avant le sommeil et contribue au confort digestif léger.',
    difficulty: 'easy',
  },
  {
    id: 'infusion-melisse-tilleul',
    titleFr: 'Infusion mélisse et tilleul',
    emoji: '🍃',
    category: 'sleep',
    plantIds: ['melissa', 'linden'],
    ingredientsFr: [
      '1 cuillère à café de feuilles de mélisse séchées',
      '1 cuillère à café d\'inflorescences de tilleul séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Mélange mélisse et tilleul dans une boule à thé. Verse l\'eau frémissante, couvre et laisse infuser 7 minutes. Filtre.',
    durationMinutes: 7,
    timingFr: 'Le soir après le dîner, vers 21h',
    benefitsFr:
      'Contribue à apaiser la tension mentale légère et favorise un endormissement serein.',
    difficulty: 'easy',
  },
  {
    id: 'tisane-lavande-detente',
    titleFr: 'Tisane lavande détente',
    emoji: '💜',
    category: 'sleep',
    plantIds: ['lavender'],
    ingredientsFr: [
      '1 cuillère à café de fleurs de lavande vraie séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur les fleurs de lavande. Couvre 6 minutes, filtre soigneusement.',
    durationMinutes: 6,
    timingFr: 'Le soir, 45 minutes avant le coucher',
    benefitsFr:
      'Soutient la détente nerveuse et contribue au bien-être émotionnel en fin de journée.',
    difficulty: 'easy',
  },
  {
    id: 'infusion-valeriane-houblon',
    titleFr: 'Infusion valériane et houblon',
    emoji: '🌿',
    category: 'sleep',
    plantIds: ['valerian', 'hops'],
    ingredientsFr: [
      '1 cuillère à café de racine de valériane séchée',
      '0,5 g de cônes de houblon séchés (environ 1 pincée)',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Place valériane et houblon dans une tasse. Verse l\'eau frémissante, couvre et laisse infuser 10 minutes. Filtre avant de boire.',
    durationMinutes: 10,
    timingFr: 'Le soir, 30 minutes avant le coucher',
    benefitsFr:
      'Favorise la qualité de l\'endormissement et contribue à la détente nerveuse.',
    difficulty: 'medium',
  },
  {
    id: 'tisane-passiflore-coucher',
    titleFr: 'Tisane passiflore avant le coucher',
    emoji: '🌺',
    category: 'sleep',
    plantIds: ['passionflower'],
    ingredientsFr: [
      '1 à 2 g de parties aériennes de passiflore séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur la passiflore. Couvre et laisse infuser 7 minutes. Filtre.',
    durationMinutes: 7,
    timingFr: 'Le soir, juste avant le coucher',
    benefitsFr:
      'Contribue à apaiser la tension mentale légère et favorise l\'endormissement.',
    difficulty: 'easy',
  },

  // ─── DIGESTION (5) ─────────────────────────────────────────────────────
  {
    id: 'tisane-menthe-poivree-repas',
    titleFr: 'Tisane menthe poivrée d\'après-repas',
    emoji: '🌱',
    category: 'digestion',
    plantIds: ['peppermint'],
    ingredientsFr: [
      '1 cuillère à soupe de feuilles de menthe poivrée séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur les feuilles. Couvre et laisse infuser 8 minutes. Filtre.',
    durationMinutes: 8,
    timingFr: 'Après le déjeuner ou le dîner',
    benefitsFr:
      'Contribue au confort digestif après les repas et favorise la diminution des ballonnements légers.',
    difficulty: 'easy',
  },
  {
    id: 'infusion-fenouil-anis',
    titleFr: 'Infusion fenouil-anis carminative',
    emoji: '🌾',
    category: 'digestion',
    plantIds: ['fennel', 'anise'],
    ingredientsFr: [
      '1 cuillère à café de graines de fenouil écrasées',
      '1 cuillère à café de fruits d\'anis vert écrasés',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Écrase légèrement les graines au mortier. Verse l\'eau frémissante, couvre 12 minutes. Filtre.',
    durationMinutes: 12,
    timingFr: 'Après les repas, jusqu\'à 3 fois par jour',
    benefitsFr:
      'Favorise le confort digestif et contribue à la diminution des gaz intestinaux.',
    difficulty: 'easy',
  },
  {
    id: 'decoction-gingembre-frais',
    titleFr: 'Décoction de gingembre frais',
    emoji: '🫚',
    category: 'digestion',
    plantIds: ['ginger'],
    ingredientsFr: [
      '1 à 2 g de rhizome de gingembre frais (environ 5 fines tranches)',
      '300 mL d\'eau',
    ],
    preparationFr:
      'Tranche le gingembre, mets-le dans une casserole avec l\'eau froide. Porte à ébullition puis réduis le feu et laisse frémir 10 minutes. Filtre.',
    durationMinutes: 10,
    timingFr: 'Avant ou après un repas, 1 à 3 fois par jour',
    benefitsFr:
      'Contribue au confort digestif et soutient la diminution des nausées légères.',
    difficulty: 'easy',
  },
  {
    id: 'infusion-artichaut-pre-repas',
    titleFr: 'Infusion d\'artichaut avant repas',
    emoji: '🌿',
    category: 'digestion',
    plantIds: ['artichoke'],
    ingredientsFr: [
      '1 à 2 g de feuilles d\'artichaut séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur les feuilles. Couvre et laisse infuser 12 minutes. Filtre. Le goût est amer.',
    durationMinutes: 12,
    timingFr: '15 minutes avant les repas, 1 à 3 fois par jour',
    benefitsFr:
      'Favorise la digestion des graisses et contribue au confort digestif après les repas lourds.',
    difficulty: 'medium',
  },
  {
    id: 'infusion-carvi-ballonnements',
    titleFr: 'Infusion de carvi anti-ballonnements',
    emoji: '🌿',
    category: 'digestion',
    plantIds: ['caraway'],
    ingredientsFr: [
      '1,5 g de fruits de carvi écrasés',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Écrase les fruits au mortier pour libérer les huiles essentielles. Verse l\'eau frémissante, couvre 10 minutes. Filtre.',
    durationMinutes: 10,
    timingFr: 'Après les repas, 2 à 3 fois par jour',
    benefitsFr:
      'Contribue à la diminution des ballonnements et favorise un confort digestif après le repas.',
    difficulty: 'easy',
  },

  // ─── STRESS (4) ────────────────────────────────────────────────────────
  {
    id: 'tisane-passiflore-melisse-stress',
    titleFr: 'Tisane passiflore-mélisse anti-stress',
    emoji: '🌺',
    category: 'stress',
    plantIds: ['passionflower', 'melissa'],
    ingredientsFr: [
      '1 g de parties aériennes de passiflore séchées',
      '1 cuillère à café de feuilles de mélisse séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Mélange les deux plantes dans une tasse. Verse l\'eau frémissante, couvre 8 minutes. Filtre.',
    durationMinutes: 8,
    timingFr: 'En milieu d\'après-midi ou en fin de journée',
    benefitsFr:
      'Contribue à apaiser la tension mentale légère et favorise un état de détente.',
    difficulty: 'easy',
  },
  {
    id: 'infusion-tilleul-aubepine',
    titleFr: 'Infusion tilleul-aubépine apaisante',
    emoji: '🌸',
    category: 'stress',
    plantIds: ['linden', 'hawthorn'],
    ingredientsFr: [
      '1,5 g d\'inflorescences de tilleul séchées',
      '1 g de sommités fleuries d\'aubépine séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Place les plantes dans une boule à thé. Verse l\'eau frémissante, couvre 10 minutes. Filtre.',
    durationMinutes: 10,
    timingFr: 'En fin d\'après-midi ou avant le coucher',
    benefitsFr:
      'Contribue à apaiser le stress léger et soutient le confort en cas de palpitations bénignes liées à la tension nerveuse.',
    difficulty: 'easy',
  },
  {
    id: 'tisane-lavande-melisse',
    titleFr: 'Tisane lavande-mélisse douceur',
    emoji: '💜',
    category: 'stress',
    plantIds: ['lavender', 'melissa'],
    ingredientsFr: [
      '1 g de fleurs de lavande vraie séchées',
      '1,5 g de feuilles de mélisse séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Mélange lavande et mélisse. Verse l\'eau frémissante, couvre 7 minutes. Filtre soigneusement.',
    durationMinutes: 7,
    timingFr: 'En cas de tension légère dans la journée',
    benefitsFr:
      'Soutient la détente nerveuse et contribue au bien-être émotionnel.',
    difficulty: 'easy',
  },
  {
    id: 'infusion-houblon-passiflore',
    titleFr: 'Infusion houblon-passiflore détente profonde',
    emoji: '🌾',
    category: 'stress',
    plantIds: ['hops', 'passionflower'],
    ingredientsFr: [
      '0,5 g de cônes de houblon séchés',
      '1 g de passiflore séchée',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur le mélange. Couvre 9 minutes. Filtre.',
    durationMinutes: 9,
    timingFr: 'Le soir, en cas de tension nerveuse persistante',
    benefitsFr:
      'Contribue à apaiser la tension nerveuse légère et favorise une détente profonde.',
    difficulty: 'medium',
  },

  // ─── ENERGY (4) ────────────────────────────────────────────────────────
  {
    id: 'infusion-romarin-tonique',
    titleFr: 'Infusion romarin tonique',
    emoji: '🌿',
    category: 'energy',
    plantIds: ['rosemary'],
    ingredientsFr: [
      '1 à 2 g de feuilles de romarin séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur les feuilles. Couvre et laisse infuser 12 minutes. Filtre.',
    durationMinutes: 12,
    timingFr: 'Le matin ou en milieu de matinée',
    benefitsFr:
      'Contribue à la vitalité et soutient le confort digestif au démarrage de la journée.',
    difficulty: 'easy',
  },
  {
    id: 'infusion-ortie-vitalite',
    titleFr: 'Infusion d\'ortie reminéralisante',
    emoji: '🌿',
    category: 'energy',
    plantIds: ['nettle'],
    ingredientsFr: [
      '2 à 4 g de feuilles d\'ortie séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Place les feuilles dans une tasse. Verse l\'eau frémissante, couvre et laisse infuser 12 minutes. Filtre.',
    durationMinutes: 12,
    timingFr: 'Dans la journée, 2 à 3 fois maximum',
    benefitsFr:
      'Soutient la vitalité grâce aux apports en fer et silice, et contribue à la fonction d\'élimination.',
    difficulty: 'easy',
  },
  {
    id: 'decoction-gingembre-curcuma',
    titleFr: 'Décoction gingembre-curcuma vitalité',
    emoji: '🫚',
    category: 'energy',
    plantIds: ['ginger', 'turmeric'],
    ingredientsFr: [
      '1 g de rhizome de gingembre frais',
      '1,5 g de poudre de curcuma',
      '1 pincée de poivre noir',
      '300 mL d\'eau',
    ],
    preparationFr:
      'Tranche le gingembre, ajoute le curcuma et le poivre dans l\'eau froide. Porte à ébullition puis frémis 10 minutes. Filtre.',
    durationMinutes: 10,
    timingFr: 'Le matin ou en début d\'après-midi',
    benefitsFr:
      'Contribue à la vitalité et favorise le confort digestif. Le poivre soutient l\'absorption de la curcumine.',
    difficulty: 'medium',
  },
  {
    id: 'the-vert-matin',
    titleFr: 'Thé vert du matin',
    emoji: '🍵',
    category: 'energy',
    plantIds: ['green_tea'],
    ingredientsFr: [
      '1 à 2 g de feuilles de thé vert',
      '250 mL d\'eau à 70-80 °C',
    ],
    preparationFr:
      'Fais chauffer l\'eau sans la faire bouillir. Verse-la sur les feuilles, couvre 3 minutes. Filtre.',
    durationMinutes: 3,
    timingFr: 'Le matin ou en début d\'après-midi',
    benefitsFr:
      'Contribue à la vigilance grâce à la caféine et apporte des catéchines antioxydantes.',
    difficulty: 'easy',
  },

  // ─── SKIN (4) ──────────────────────────────────────────────────────────
  {
    id: 'compresse-calendula-peau',
    titleFr: 'Compresse de souci pour peau irritée',
    emoji: '🧡',
    category: 'skin',
    plantIds: ['calendula'],
    ingredientsFr: [
      '2 g de capitules floraux de souci séchés',
      '250 mL d\'eau frémissante',
      'Une compresse de coton propre',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur les fleurs. Couvre 10 minutes, filtre. Imbibe la compresse de l\'infusion tiédie et applique sur la zone irritée 10 minutes.',
    durationMinutes: 10,
    timingFr: 'En application locale, 1 à 2 fois par jour',
    benefitsFr:
      'Contribue au confort de la peau irritée superficiellement et soutient l\'apaisement cutané.',
    difficulty: 'easy',
  },
  {
    id: 'decoction-bardane-imperfections',
    titleFr: 'Décoction de bardane',
    emoji: '🌿',
    category: 'skin',
    plantIds: ['burdock'],
    ingredientsFr: [
      '4 g de racine de bardane séchée',
      '300 mL d\'eau',
    ],
    preparationFr:
      'Mets la racine dans une casserole avec l\'eau froide. Porte à ébullition puis frémis 12 minutes. Filtre.',
    durationMinutes: 12,
    timingFr: 'Dans la journée, 2 fois par jour',
    benefitsFr:
      'Soutient la fonction d\'élimination cutanée et contribue au confort de la peau aux imperfections séborrhéiques.',
    difficulty: 'medium',
  },
  {
    id: 'compresse-hamamelis-jambes',
    titleFr: 'Compresse d\'hamamélis pour peau sensibilisée',
    emoji: '🍂',
    category: 'skin',
    plantIds: ['witch_hazel'],
    ingredientsFr: [
      '5 g de feuilles d\'hamamélis séchées',
      '250 mL d\'eau',
      'Une compresse de coton propre',
    ],
    preparationFr:
      'Mets les feuilles dans une casserole avec l\'eau froide. Porte à ébullition, frémis 10 minutes, filtre. Laisse tiédir, puis imbibe la compresse et applique en local.',
    durationMinutes: 10,
    timingFr: 'En application locale, 1 fois par jour',
    benefitsFr:
      'Contribue au confort de la peau et soutient le confort veineux superficiel.',
    difficulty: 'medium',
  },
  {
    id: 'gel-aloe-application',
    titleFr: 'Application locale de gel d\'aloès',
    emoji: '🌵',
    category: 'skin',
    plantIds: ['aloe_vera'],
    ingredientsFr: [
      '1 cuillère à café de gel d\'aloès pur (interne de la feuille)',
    ],
    preparationFr:
      'Récupère le gel d\'aloès pur (sans la sève jaune). Applique en couche fine sur la zone à apaiser. Laisse poser 15 minutes puis rince à l\'eau tiède.',
    durationMinutes: 15,
    timingFr: 'Après l\'exposition au soleil ou en fin de journée',
    benefitsFr:
      'Contribue à hydrater la peau et favorise un effet apaisant cutané superficiel.',
    difficulty: 'easy',
  },

  // ─── IMMUNITY (4) ──────────────────────────────────────────────────────
  {
    id: 'infusion-sureau-rhume',
    titleFr: 'Infusion de sureau noir',
    emoji: '🤍',
    category: 'immunity',
    plantIds: ['elderflower'],
    ingredientsFr: [
      '3 g de fleurs de sureau noir séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur les fleurs. Couvre et laisse infuser 12 minutes. Filtre.',
    durationMinutes: 12,
    timingFr: 'Aux premiers signes de refroidissement, 3 fois par jour',
    benefitsFr:
      'Contribue au confort en cas de rhume léger et favorise la sensation de chaleur.',
    difficulty: 'easy',
  },
  {
    id: 'infusion-thym-gorge',
    titleFr: 'Infusion de thym',
    emoji: '🌿',
    category: 'immunity',
    plantIds: ['thyme'],
    ingredientsFr: [
      '1,5 g de sommités fleuries de thym séchées',
      '250 mL d\'eau frémissante',
      '1 cuillère à café de miel',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur le thym. Couvre 10 minutes (le couvercle retient les huiles essentielles). Filtre, ajoute le miel.',
    durationMinutes: 10,
    timingFr: '3 à 4 fois par jour pendant un épisode de toux légère',
    benefitsFr:
      'Contribue au confort respiratoire en cas de toux légère et soutient les défenses naturelles.',
    difficulty: 'easy',
  },
  {
    id: 'infusion-gingembre-miel-citron',
    titleFr: 'Infusion gingembre-miel-citron réconfortante',
    emoji: '🫚',
    category: 'immunity',
    plantIds: ['ginger'],
    ingredientsFr: [
      '5 fines tranches de gingembre frais',
      '300 mL d\'eau frémissante',
      '1 cuillère à café de miel',
      '1 cuillère à café de jus de citron frais',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur le gingembre, couvre et laisse infuser 8 minutes. Filtre, ajoute miel et jus de citron hors du feu.',
    durationMinutes: 8,
    timingFr: 'Aux premiers signes de fatigue saisonnière, 2 fois par jour',
    benefitsFr:
      'Contribue au confort général en saison froide et soutient la sensation de chaleur intérieure.',
    difficulty: 'easy',
  },
  {
    id: 'preparation-ail-pressé',
    titleFr: 'Préparation d\'ail pressé du quotidien',
    emoji: '🧄',
    category: 'immunity',
    plantIds: ['garlic'],
    ingredientsFr: [
      '1 gousse d\'ail frais',
      '1 cuillère à café d\'huile d\'olive',
      '1 pincée de sel',
    ],
    preparationFr:
      'Écrase la gousse au presse-ail. Laisse reposer 10 minutes (la transformation enzymatique soutient les composés actifs). Mélange à l\'huile et au sel. Consomme sur une tartine ou en assaisonnement.',
    durationMinutes: 10,
    timingFr: 'Au déjeuner, 1 fois par jour',
    benefitsFr:
      'Soutient les défenses naturelles et contribue au maintien d\'un confort cardiovasculaire dans le cadre d\'une alimentation équilibrée.',
    difficulty: 'easy',
  },

  // ─── DETOX (3) ─────────────────────────────────────────────────────────
  {
    id: 'infusion-artichaut-chicoree',
    titleFr: 'Infusion artichaut-chicorée',
    emoji: '🌼',
    category: 'detox',
    plantIds: ['artichoke', 'chicory'],
    ingredientsFr: [
      '2 g de feuilles d\'artichaut séchées',
      '2 g de racine de chicorée séchée',
      '250 mL d\'eau',
    ],
    preparationFr:
      'Mets la chicorée dans l\'eau froide. Porte à ébullition, frémis 8 minutes. Hors du feu, ajoute l\'artichaut et couvre 10 minutes. Filtre. Le goût est franchement amer.',
    durationMinutes: 18,
    timingFr: '15 minutes avant le déjeuner ou le dîner',
    benefitsFr:
      'Soutient la fonction digestive et contribue au confort après les repas riches.',
    difficulty: 'medium',
  },
  {
    id: 'infusion-ortie-elimination',
    titleFr: 'Infusion d\'ortie élimination',
    emoji: '🌿',
    category: 'detox',
    plantIds: ['nettle'],
    ingredientsFr: [
      '3 g de feuilles d\'ortie séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Verse l\'eau frémissante sur les feuilles. Couvre et laisse infuser 12 minutes. Filtre.',
    durationMinutes: 12,
    timingFr: 'En milieu de journée, accompagnée d\'un grand verre d\'eau',
    benefitsFr:
      'Contribue à soutenir la fonction d\'élimination et favorise l\'apport en minéraux.',
    difficulty: 'easy',
  },
  {
    id: 'infusion-bouleau-ortie',
    titleFr: 'Infusion bouleau-ortie drainante',
    emoji: '🌳',
    category: 'detox',
    plantIds: ['birch', 'nettle'],
    ingredientsFr: [
      '2 g de feuilles de bouleau séchées',
      '2 g de feuilles d\'ortie séchées',
      '250 mL d\'eau frémissante',
    ],
    preparationFr:
      'Mélange bouleau et ortie. Verse l\'eau frémissante, couvre et laisse infuser 10 minutes. Filtre. Bois en accompagnant d\'un apport hydrique abondant.',
    durationMinutes: 10,
    timingFr: 'Dans la journée, 2 fois maximum, avec apport hydrique élevé',
    benefitsFr:
      'Soutient la fonction d\'élimination rénale et contribue au confort général.',
    difficulty: 'medium',
  },
  {
    id: 'decoction-chicoree-confort',
    titleFr: 'Décoction de chicorée confort',
    emoji: '🌼',
    category: 'detox',
    plantIds: ['chicory'],
    ingredientsFr: [
      '3 g de racine de chicorée séchée',
      '250 mL d\'eau',
    ],
    preparationFr:
      'Mets la racine dans une casserole avec l\'eau froide. Porte à ébullition puis frémis 12 minutes. Filtre. Le goût est légèrement amer.',
    durationMinutes: 12,
    timingFr: 'Avant le déjeuner ou le dîner',
    benefitsFr:
      'Soutient l\'appétit et contribue au confort digestif après les repas.',
    difficulty: 'medium',
  },
];

export function getRecipeById(id: string): WellnessRecipe | undefined {
  return WELLNESS_RECIPES.find((r) => r.id === id);
}

export function getRecipesByCategory(
  category: RecipeCategory,
): WellnessRecipe[] {
  return WELLNESS_RECIPES.filter((r) => r.category === category);
}

export function searchRecipes(query: string): WellnessRecipe[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return WELLNESS_RECIPES.filter(
    (r) =>
      r.titleFr.toLowerCase().includes(q) ||
      r.benefitsFr.toLowerCase().includes(q) ||
      r.timingFr.toLowerCase().includes(q) ||
      r.preparationFr.toLowerCase().includes(q),
  );
}
