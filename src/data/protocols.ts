/**
 * PROTOCOLS — 5 programmes de 21 jours (tier Expert).
 *
 * Chaque protocole = 21 ProtocolDay (rotation 7 plantes × 3 cycles).
 * Cycle 1 (j1-7) : posologies de base, infusion simple.
 * Cycle 2 (j8-14) : variantes (décoctions, mélanges 2 plantes, dosages ajustés).
 * Cycle 3 (j15-21) : intégration au quotidien (rituels matin/soir, ancrage).
 *
 * Sources : EMA HMPC monographs, ANSES, EFSA, Cochrane.
 * Aucun claim thérapeutique (R5). Vocabulaire "favoriser/contribuer/soutenir".
 */

export interface ProtocolDay {
  /** Jour 1..21 */
  day: number;
  /** ID d'une plante de PLANT_ENCYCLOPEDIA */
  plantId: string;
  /** Posologie exacte (g, ml, °C, durée, moment) */
  recipeFr: string;
  /** Conseil bien-être quotidien actionnable */
  tipFr: string;
}

export interface Protocol {
  id: string;
  titleFr: string;
  emoji: string;
  descriptionFr: string;
  durationDays: 21;
  days: ProtocolDay[];
  disclaimer: string;
}

const DISCLAIMER =
  'Ces informations sont fournies à titre éducatif. Elles ne remplacent pas un avis médical. Consultez un professionnel de santé.';

// ─── Helper interne pour construire les 21 jours d'un protocole ──────────
type DayBuilder = (day: number, plantId: string) => Omit<ProtocolDay, 'day' | 'plantId'>;

interface ProtocolSpec {
  id: string;
  titleFr: string;
  emoji: string;
  descriptionFr: string;
  /** 7 plantIds, répétés en 3 cycles → 21 jours */
  rotation: [string, string, string, string, string, string, string];
  /** Builder qui retourne recipeFr + tipFr pour (day, plantId) */
  build: DayBuilder;
}

function buildDays(spec: ProtocolSpec): ProtocolDay[] {
  const days: ProtocolDay[] = [];
  for (let day = 1; day <= 21; day += 1) {
    const plantIndex = (day - 1) % 7;
    const plantId = spec.rotation[plantIndex];
    const { recipeFr, tipFr } = spec.build(day, plantId);
    days.push({ day, plantId, recipeFr, tipFr });
  }
  return days;
}

// ─── PROTOCOLE 1 — SOMMEIL NATUREL ────────────────────────────────────────
const SLEEP_ROTATION: ProtocolSpec['rotation'] = [
  'chamomile',
  'valerian',
  'linden',
  'melissa',
  'passionflower',
  'hops',
  'lavender',
];

function buildSleepDay(day: number, plantId: string): { recipeFr: string; tipFr: string } {
  const cycle = Math.ceil(day / 7); // 1, 2 ou 3

  // Recettes par plante × cycle
  const recipes: Record<string, [string, string, string]> = {
    chamomile: [
      "Infusion de camomille : 2g de fleurs séchées dans 200ml d'eau à 90°C, laisser infuser 8 min. À boire 30 min avant le coucher.",
      "Infusion renforcée camomille + miel : 2,5g de fleurs dans 250ml d'eau à 90°C, infusion 10 min, ajouter 1 cuillère à café de miel. 45 min avant le coucher.",
      "Rituel du soir : 2g de camomille dans 200ml d'eau à 90°C, infusion 8 min, déguster lentement assis sans écran. 1h avant le coucher.",
    ],
    valerian: [
      "Infusion de valériane : 1g de racine séchée dans 200ml d'eau à 95°C, laisser infuser 10 min. À boire 30 min avant le coucher.",
      "Décoction de valériane : 1,5g de racine dans 250ml d'eau, porter à frémissement 5 min puis filtrer. 45 min avant le coucher.",
      "Combinaison valériane + tilleul : 1g de valériane + 1g de tilleul dans 250ml d'eau à 95°C, infusion 10 min. 1h avant le coucher.",
    ],
    linden: [
      "Infusion de tilleul : 1,5g de fleurs séchées dans 200ml d'eau à 90°C, laisser infuser 7 min. En soirée vers 21h.",
      "Tilleul + miel d'acacia : 2g de fleurs dans 250ml d'eau à 90°C, infusion 10 min, ajouter 1 cuillère à café de miel. 1h avant le coucher.",
      "Rituel apaisant : 1,5g de tilleul dans 200ml d'eau à 90°C, infusion 7 min, à siroter en lisant un livre papier. 1h avant le coucher.",
    ],
    melissa: [
      "Infusion de mélisse : 2g de feuilles séchées dans 200ml d'eau à 95°C, laisser infuser 10 min. Le soir après le dîner.",
      "Mélisse fraîche + citron : 3g de feuilles dans 250ml d'eau à 95°C, infusion 10 min, 1 quartier de citron. 1h avant le coucher.",
      "Tisane mélisse + verveine : 1,5g de mélisse + 1g de verveine dans 250ml d'eau à 95°C, infusion 10 min. 45 min avant le coucher.",
    ],
    passionflower: [
      "Infusion de passiflore : 1,5g de parties aériennes dans 200ml d'eau à 90°C, infusion 10 min. 30 min avant le coucher.",
      "Mélange passiflore + mélisse : 1g de chaque dans 200ml d'eau à 95°C, infusion 10 min. Le soir après le dîner.",
      "Rituel détente : 1,5g de passiflore dans 200ml d'eau à 90°C, infusion 10 min, accompagné de 5 min de respiration lente. 1h avant le coucher.",
    ],
    hops: [
      "Infusion de houblon : 0,5g de cônes séchés dans 200ml d'eau à 90°C, infusion 5 min. 30 min avant le coucher.",
      "Houblon + valériane : 0,5g de houblon + 0,5g de valériane dans 250ml d'eau à 90°C, infusion 8 min. 45 min avant le coucher.",
      "Tisane du soir : 0,5g de houblon dans 200ml d'eau à 90°C, infusion 5 min, à boire dans une chambre tamisée. 1h avant le coucher.",
    ],
    lavender: [
      "Infusion de lavande : 1g de fleurs séchées dans 200ml d'eau à 90°C, laisser infuser 5 min. En soirée.",
      "Lavande + camomille : 0,5g de chaque dans 200ml d'eau à 90°C, infusion 7 min. 1h avant le coucher.",
      "Bain & infusion : 1g de lavande dans 200ml d'eau à 90°C, infusion 5 min, accompagné d'un bain tiède 15 min. 1h30 avant le coucher.",
    ],
  };

  const tips: string[] = [
    "Éteins les écrans au moins 1h avant de dormir. La lumière bleue perturbe la production de mélatonine.",
    "Maintiens ta chambre entre 17 et 19°C. Une température fraîche favorise un endormissement profond.",
    "Couche-toi à la même heure chaque soir, même le week-end. La régularité ancre ton rythme circadien.",
    "Pratique 5 minutes de respiration 4-7-8 avant de dormir : inspire 4s, retiens 7s, expire 8s.",
    "Évite la caféine après 14h. Sa demi-vie de 5-7h interfère avec le sommeil profond.",
    "Pose ton téléphone hors de la chambre. La proximité d'un écran fragmente le sommeil léger.",
    "Écris 3 choses positives de ta journée avant de dormir. Cela apaise le mental ruminant.",
    "Évite les repas lourds après 20h. Une digestion active retarde l'endormissement.",
    "Prends 10 minutes de marche après le dîner. Cela aide à abaisser le cortisol du soir.",
    "Crée une obscurité totale dans ta chambre. Même une LED faible perturbe la mélatonine.",
    "Limite l'alcool en soirée. Il fragmente la phase de sommeil paradoxal.",
    "Dors les pieds frais et la tête tempérée. Ce gradient thermique facilite l'endormissement.",
    "Réserve la chambre au sommeil et à l'intimité. Ton cerveau associera mieux ce lieu au repos.",
    "Pratique un étirement doux du dos pendant 5 min avant de te coucher. Le corps se relâche.",
    "Pose ton intention du lendemain par écrit. Cela libère ton mental des tâches à venir.",
    "Hydrate-toi en journée mais réduis avant 19h. Cela évite les réveils nocturnes.",
    "Expose-toi 10 min à la lumière naturelle au réveil. Cela cale ton horloge biologique.",
    "Évite les siestes après 16h. Elles repoussent l'endormissement du soir.",
    "Pratique la cohérence cardiaque 5 min : 6 respirations par minute pendant 5 min, 3 fois par jour.",
    "Fais le bilan de ta journée pendant 5 minutes. Les pensées posées libèrent l'esprit avant la nuit.",
    "Célèbre les 21 jours. Continue les rituels qui t'ont apporté du repos pour ancrer durablement.",
  ];

  return {
    recipeFr: recipes[plantId][cycle - 1],
    tipFr: tips[day - 1],
  };
}

// ─── PROTOCOLE 2 — DIGESTION APAISÉE ──────────────────────────────────────
const DIGESTION_ROTATION: ProtocolSpec['rotation'] = [
  'peppermint',
  'fennel',
  'anise',
  'caraway',
  'chicory',
  'artichoke',
  'ginger',
];

function buildDigestionDay(day: number, plantId: string): { recipeFr: string; tipFr: string } {
  const cycle = Math.ceil(day / 7);

  const recipes: Record<string, [string, string, string]> = {
    peppermint: [
      "Infusion de menthe poivrée : 2g de feuilles séchées dans 200ml d'eau à 90°C, infusion 8 min. Après le déjeuner.",
      "Menthe + fenouil : 1g de chaque dans 200ml d'eau à 90°C, infusion 10 min. Après les deux repas principaux.",
      "Rituel digestif : 2g de menthe dans 200ml d'eau à 90°C, infusion 8 min, à boire en marchant 5 min. Après le dîner.",
    ],
    fennel: [
      "Infusion de fenouil : 2g de graines écrasées dans 200ml d'eau à 95°C, infusion 12 min. Après les repas.",
      "Décoction de fenouil : 2,5g de graines dans 250ml d'eau, frémissement 8 min puis filtrer. Après les repas.",
      "Mélange fenouil + anis : 1g de chaque écrasés dans 200ml d'eau à 95°C, infusion 12 min. Après les repas.",
    ],
    anise: [
      "Infusion d'anis vert : 2g de fruits écrasés dans 200ml d'eau à 95°C, infusion 10 min. Après le dîner.",
      "Anis + carvi : 1g de chaque dans 200ml d'eau à 95°C, infusion 12 min. Après les repas.",
      "Tisane d'anis avec touche de citron : 2g d'anis + 1 zeste de citron dans 200ml d'eau à 95°C, infusion 10 min. Après les repas.",
    ],
    caraway: [
      "Infusion de carvi : 1,5g de fruits écrasés dans 200ml d'eau à 95°C, infusion 10 min. Après les repas lourds.",
      "Carvi + menthe : 1g de chaque dans 200ml d'eau à 95°C, infusion 10 min. Après les repas.",
      "Rituel digestif rapide : 1,5g de carvi dans 200ml d'eau à 95°C, infusion 10 min, à siroter lentement. Après les repas.",
    ],
    chicory: [
      "Décoction de chicorée : 3g de racine torréfiée dans 250ml d'eau, frémissement 12 min puis filtrer. Avant le déjeuner.",
      "Chicorée matinale : 4g de racine dans 250ml d'eau, frémissement 15 min, ajouter 1 cuillère à café de cacao non sucré. Le matin.",
      "Café de chicorée + lait végétal : 3g de racine dans 200ml d'eau frémissante 10 min, ajouter 50ml de lait d'amande. Le matin.",
    ],
    artichoke: [
      "Infusion de feuilles d'artichaut : 2g de feuilles séchées dans 200ml d'eau à 95°C, infusion 12 min. 15 min avant le déjeuner.",
      "Artichaut + chicorée : 2g de feuilles + 1g de racine de chicorée dans 250ml d'eau à 95°C, infusion 15 min. Avant le déjeuner.",
      "Rituel hépatique : 2g de feuilles d'artichaut dans 200ml d'eau à 95°C, infusion 12 min, accompagné d'un demi-citron pressé. Avant le déjeuner.",
    ],
    ginger: [
      "Infusion de gingembre : 3g de racine fraîche râpée dans 250ml d'eau à 90°C, infusion 10 min. Le matin à jeun.",
      "Décoction de gingembre : 3g de racine fraîche dans 250ml d'eau, frémissement 5 min puis filtrer. Le matin à jeun.",
      "Gingembre + citron + miel : 3g de gingembre râpé dans 250ml d'eau à 90°C, infusion 10 min, ajouter le jus d'un demi-citron et 1 cuillère à café de miel. Le matin.",
    ],
  };

  const tips: string[] = [
    "Mâche lentement chaque bouchée 20 fois. Une bonne mastication réduit la charge digestive de 30%.",
    "Bois 1 verre d'eau tiède au réveil avant de manger. Cela réveille en douceur le système digestif.",
    "Évite de boire pendant les repas. L'eau dilue les sucs gastriques nécessaires à la digestion.",
    "Marche 10 min après chaque repas principal. Cela accélère le transit et limite les ballonnements.",
    "Mange ton fruit 30 min avant le repas, pas après. Les fruits fermentent mal en fin de digestion.",
    "Pratique la respiration ventrale 5 min après le repas. Cela masse les organes digestifs.",
    "Réduis les sucres ajoutés. Ils nourrissent les bactéries qui produisent les gaz intestinaux.",
    "Intègre des légumes lacto-fermentés (choucroute, kimchi). Ils enrichissent ton microbiote.",
    "Mange dans le calme, sans écran. Le système digestif a besoin du parasympathique.",
    "Couche-toi sur le côté gauche pour dormir. Cette position favorise la vidange gastrique.",
    "Ajoute 1 cuillère à café de graines de chia trempées le matin. Les fibres solubles favorisent le transit.",
    "Évite les boissons glacées au repas. Le froid contracte les vaisseaux digestifs.",
    "Mange à heures régulières. Ton microbiote suit un rythme circadien comme toi.",
    "Limite les excitants (café, alcool) en cas d'inconfort digestif. Ils irritent la muqueuse.",
    "Inclus des amers dans ton repas (roquette, endive). Ils stimulent les sécrétions digestives.",
    "Bois 1,5L d'eau étalée sur la journée. Une bonne hydratation soutient le transit.",
    "Pratique l'auto-massage du ventre dans le sens des aiguilles d'une montre 3 min le matin.",
    "Évite de manger debout ou en marchant. La position assise détend le diaphragme.",
    "Intègre 1 portion de fibres prébiotiques par jour (poireau, oignon, ail).",
    "Respecte ta sensation de satiété. S'arrêter à 80% allège la digestion.",
    "Fais le bilan : note les aliments qui te conviennent ou non. Tu connais mieux ton corps.",
  ];

  return {
    recipeFr: recipes[plantId][cycle - 1],
    tipFr: tips[day - 1],
  };
}

// ─── PROTOCOLE 3 — ANTI-STRESS NATUREL ────────────────────────────────────
const STRESS_ROTATION: ProtocolSpec['rotation'] = [
  'melissa',
  'passionflower',
  'lavender',
  'hops',
  'valerian',
  'chamomile',
  'linden',
];

function buildStressDay(day: number, plantId: string): { recipeFr: string; tipFr: string } {
  const cycle = Math.ceil(day / 7);

  const recipes: Record<string, [string, string, string]> = {
    melissa: [
      "Infusion de mélisse : 2g de feuilles séchées dans 200ml d'eau à 95°C, infusion 10 min. En milieu d'après-midi.",
      "Mélisse + verveine : 1,5g de mélisse + 1g de verveine dans 250ml d'eau à 95°C, infusion 10 min. Après le déjeuner.",
      "Rituel pause sereine : 2g de mélisse dans 200ml d'eau à 95°C, infusion 10 min, à siroter sans téléphone pendant 10 min. L'après-midi.",
    ],
    passionflower: [
      "Infusion de passiflore : 1,5g de parties aériennes dans 200ml d'eau à 90°C, infusion 10 min. En fin de journée.",
      "Passiflore + mélisse : 1g de chaque dans 200ml d'eau à 95°C, infusion 10 min. En fin de journée.",
      "Tisane de transition : 1,5g de passiflore dans 200ml d'eau à 90°C, infusion 10 min, accompagnée de 5 min de respiration carrée. Avant le dîner.",
    ],
    lavender: [
      "Infusion de lavande : 1g de fleurs séchées dans 200ml d'eau à 90°C, infusion 5 min. En milieu de journée.",
      "Lavande + miel : 1g de lavande dans 200ml d'eau à 90°C, infusion 5 min, ajouter 1 cuillère à café de miel. L'après-midi.",
      "Pause aromatique : 1g de lavande dans 200ml d'eau à 90°C, infusion 5 min, accompagnée d'une diffusion 10 min d'huile essentielle.",
    ],
    hops: [
      "Infusion de houblon : 0,5g de cônes séchés dans 200ml d'eau à 90°C, infusion 5 min. En soirée.",
      "Houblon + camomille : 0,5g de chaque dans 200ml d'eau à 90°C, infusion 7 min. En soirée.",
      "Tisane détente : 0,5g de houblon dans 200ml d'eau à 90°C, infusion 5 min, accompagnée d'un étirement doux 5 min. En soirée.",
    ],
    valerian: [
      "Infusion de valériane : 1g de racine séchée dans 200ml d'eau à 95°C, infusion 10 min. En fin de journée.",
      "Décoction de valériane : 1,5g de racine dans 250ml d'eau, frémissement 5 min puis filtrer. En fin de journée.",
      "Combinaison valériane + passiflore : 1g de chaque dans 250ml d'eau à 95°C, infusion 10 min. En soirée.",
    ],
    chamomile: [
      "Infusion de camomille : 2g de fleurs séchées dans 200ml d'eau à 90°C, infusion 8 min. En milieu d'après-midi.",
      "Camomille + tilleul : 1g de chaque dans 200ml d'eau à 90°C, infusion 10 min. L'après-midi.",
      "Pause apaisante : 2g de camomille dans 200ml d'eau à 90°C, infusion 8 min, à boire en pratiquant la cohérence cardiaque 5 min.",
    ],
    linden: [
      "Infusion de tilleul : 1,5g de fleurs séchées dans 200ml d'eau à 90°C, infusion 7 min. En fin d'après-midi.",
      "Tilleul + miel d'acacia : 2g de fleurs dans 250ml d'eau à 90°C, infusion 10 min, 1 cuillère à café de miel. L'après-midi.",
      "Rituel d'ancrage : 1,5g de tilleul dans 200ml d'eau à 90°C, infusion 7 min, accompagné de 5 min d'écriture journalière.",
    ],
  };

  const tips: string[] = [
    "Pratique la cohérence cardiaque 5 min, 3 fois par jour : 6 respirations par minute.",
    "Marche 20 min en plein air sans téléphone. La nature abaisse le cortisol mesurable.",
    "Note 3 gratitudes le soir. Cette pratique augmente l'humeur positive en 21 jours.",
    "Limite tes notifications. Chaque interruption augmente le cortisol pendant 23 minutes.",
    "Pratique la respiration alternée 5 min : narine droite, narine gauche.",
    "Bouge ton corps 30 min par jour. L'exercice modéré abaisse l'anxiété de manière durable.",
    "Évite l'info en boucle. Limite-toi à 15 min de news par jour, à heure fixe.",
    "Pratique le journaling 10 min le matin. Vide ton mental sur le papier avant la journée.",
    "Connecte-toi à un proche aujourd'hui. Le lien social abaisse le stress de manière mesurable.",
    "Fais une pause de 5 min toutes les 90 min de travail. Ton cerveau a besoin de respirer.",
    "Pratique 10 min de méditation guidée. La pleine conscience réduit la rumination.",
    "Mange du chocolat noir >70% (2 carrés). Le magnésium soutient le système nerveux.",
    "Évite la caféine après 14h. La sensibilité au stress augmente avec le café tard.",
    "Étire-toi 10 min le soir. Les tensions du corps amplifient les tensions mentales.",
    "Écoute 20 min de musique apaisante. Les fréquences douces calment le système nerveux.",
    "Identifie tes 3 priorités de la journée. La clarté abaisse la charge mentale.",
    "Pratique le contact avec la nature 15 min : pieds nus dans l'herbe ou sur le sable.",
    "Dis non à 1 demande inutile aujourd'hui. Protéger ton énergie est essentiel.",
    "Respire profondément avant chaque transition (réunion, repas, coucher). Ancrage immédiat.",
    "Prends un bain tiède 15 min en soirée. La chaleur active le système parasympathique.",
    "Célèbre tes 21 jours. Identifie 1 rituel à garder pour toujours dans ton quotidien.",
  ];

  return {
    recipeFr: recipes[plantId][cycle - 1],
    tipFr: tips[day - 1],
  };
}

// ─── PROTOCOLE 4 — ÉNERGIE & VITALITÉ ──────────────────────────────────────
const ENERGY_ROTATION: ProtocolSpec['rotation'] = [
  'rosemary',
  'nettle',
  'ginger',
  'turmeric',
  'ginseng',
  'green_tea',
  'peppermint',
];

function buildEnergyDay(day: number, plantId: string): { recipeFr: string; tipFr: string } {
  const cycle = Math.ceil(day / 7);

  const recipes: Record<string, [string, string, string]> = {
    rosemary: [
      "Infusion de romarin : 2g de feuilles séchées dans 200ml d'eau à 95°C, infusion 8 min. Le matin.",
      "Romarin + citron : 2g de romarin dans 200ml d'eau à 95°C, infusion 8 min, ajouter le jus d'un demi-citron. Le matin.",
      "Boost matinal : 2g de romarin dans 200ml d'eau à 95°C, infusion 8 min, accompagné de 5 min de marche au soleil.",
    ],
    nettle: [
      "Infusion d'ortie : 2g de feuilles séchées dans 200ml d'eau à 95°C, infusion 10 min. Le matin.",
      "Décoction d'ortie : 2,5g de feuilles dans 250ml d'eau, frémissement 8 min puis filtrer. Le matin.",
      "Soupe d'ortie : 30g de feuilles fraîches blanchies dans 500ml de bouillon de légumes 15 min. Au déjeuner.",
    ],
    ginger: [
      "Infusion de gingembre : 3g de racine fraîche râpée dans 250ml d'eau à 90°C, infusion 10 min. Le matin.",
      "Gingembre + citron + cannelle : 3g de gingembre + 1 bâton de cannelle dans 250ml d'eau à 90°C, infusion 10 min, jus d'un demi-citron. Le matin.",
      "Smoothie tonique : 2g de gingembre râpé + 200ml de lait végétal + 1 banane mixés. Au petit-déjeuner.",
    ],
    turmeric: [
      "Latte au curcuma : 2g de curcuma en poudre + 1 pincée de poivre noir dans 200ml de lait végétal chauffé 5 min. Le matin.",
      "Curcuma + gingembre : 2g de curcuma + 2g de gingembre frais dans 200ml de lait végétal chauffé 5 min. Le matin.",
      "Golden milk complet : 2g de curcuma + 1 pincée de cannelle + 1 pincée de poivre dans 250ml de lait végétal chauffé 7 min, miel à part. Le matin.",
    ],
    ginseng: [
      "Décoction de ginseng : 1g de racine séchée dans 200ml d'eau, frémissement 10 min puis filtrer. Le matin, sur une période maximale de 3 semaines.",
      "Ginseng + miel : 1g de racine dans 200ml d'eau, frémissement 10 min, ajouter 1 cuillère à café de miel hors du feu. Le matin.",
      "Rituel de finition : 1g de ginseng dans 200ml d'eau, frémissement 10 min, accompagné de 5 min de mouvement doux. Le matin.",
    ],
    green_tea: [
      "Thé vert : 2g de feuilles dans 200ml d'eau à 70°C (NE PAS bouillir), infusion 3 min. En milieu de matinée.",
      "Matcha doux : 1g de matcha fouetté dans 200ml d'eau à 70°C avec 1 cuillère à café de miel. En milieu de matinée.",
      "Thé vert + menthe : 2g de thé vert + 5 feuilles de menthe fraîche dans 200ml d'eau à 70°C, infusion 3 min. En milieu de matinée.",
    ],
    peppermint: [
      "Infusion de menthe poivrée : 2g de feuilles séchées dans 200ml d'eau à 90°C, infusion 8 min. En milieu de matinée.",
      "Menthe glacée : 2g de feuilles infusées 8 min, refroidies, servies avec glaçons. En après-midi.",
      "Menthe + citron : 2g de menthe dans 200ml d'eau à 90°C, infusion 8 min, ajouter le jus d'un demi-citron. En milieu de matinée.",
    ],
  };

  const tips: string[] = [
    "Expose-toi 10 min à la lumière naturelle dans l'heure suivant le réveil. Cela cale ton horloge.",
    "Bois 500ml d'eau au réveil. La déshydratation matinale fatigue l'organisme.",
    "Bouge 30 min par jour à intensité modérée. L'exercice augmente l'énergie disponible.",
    "Évite le sucre raffiné le matin. Il provoque un crash 90 min plus tard.",
    "Prends un petit-déjeuner riche en protéines (œufs, yaourt grec). Stabilité énergétique.",
    "Sors marcher 15 min après le déjeuner. Cela évite le coup de barre de 14h.",
    "Évalue ton sommeil. Sans 7-8h, aucune plante ne compensera durablement.",
    "Pratique la respiration de Wim Hof 5 min le matin : 30 respirations puis rétention.",
    "Éteins les écrans 1h avant de dormir. Un sommeil de qualité = de l'énergie le lendemain.",
    "Mange des aliments riches en fer (lentilles, épinards). La carence fatigue chroniquement.",
    "Évite le grignotage entre les repas. Stabiliser la glycémie stabilise l'énergie.",
    "Prends une douche froide 30s à la fin. Cela stimule le système nerveux sympathique.",
    "Respire par le nez. La respiration nasale oxygène mieux que la respiration buccale.",
    "Limite l'alcool. Même 1 verre fragmente le sommeil et baisse l'énergie du lendemain.",
    "Bouge toutes les heures. Une pause de 2 min de mouvement réveille la circulation.",
    "Fais le plein de vitamine D (poissons gras, soleil 15 min). Carence = fatigue.",
    "Pratique 10 min de méditation matinale. La clarté mentale économise l'énergie cognitive.",
    "Évite la caféine après 14h. Elle bloque l'adénosine pendant 5-7h.",
    "Inclus 1 portion de magnésium par jour (chocolat noir, oléagineux). Il soutient l'énergie.",
    "Adopte une routine matinale stable. La répétition libère l'énergie pour ce qui compte.",
    "Célèbre les 21 jours. Identifie 1 rituel énergétique à garder dans ton quotidien.",
  ];

  return {
    recipeFr: recipes[plantId][cycle - 1],
    tipFr: tips[day - 1],
  };
}

// ─── PROTOCOLE 5 — PEAU SAINE ─────────────────────────────────────────────
const SKIN_ROTATION: ProtocolSpec['rotation'] = [
  'calendula',
  'burdock',
  'borage',
  'aloe_vera',
  'chamomile',
  'nettle',
  'witch_hazel',
];

function buildSkinDay(day: number, plantId: string): { recipeFr: string; tipFr: string } {
  const cycle = Math.ceil(day / 7);

  const recipes: Record<string, [string, string, string]> = {
    calendula: [
      "Infusion de souci : 2g de fleurs séchées dans 200ml d'eau à 95°C, infusion 10 min. À boire le matin.",
      "Compresse de souci : 3g de fleurs dans 250ml d'eau à 95°C, infusion 10 min, refroidir, appliquer sur peau propre 10 min.",
      "Infusion + soin externe : 2g de souci dans 200ml d'eau à 95°C, infusion 10 min, à boire ; et compresse tiède 5 min sur le visage.",
    ],
    burdock: [
      "Décoction de bardane : 2g de racine séchée dans 250ml d'eau, frémissement 10 min puis filtrer. À boire le matin.",
      "Bardane + chicorée : 2g de bardane + 1g de chicorée dans 250ml d'eau, frémissement 12 min. Le matin à jeun.",
      "Rituel d'ancrage : 2g de bardane dans 250ml d'eau, frémissement 10 min, accompagnée d'un demi-citron pressé. Le matin.",
    ],
    borage: [
      "Infusion de bourrache : 1,5g de fleurs séchées dans 200ml d'eau à 95°C, infusion 8 min. Le matin (max 4 semaines).",
      "Huile de bourrache (capsule) : 500mg matin et soir au repas selon notice. Période maximale 3 semaines.",
      "Bourrache + souci : 1g de chaque dans 200ml d'eau à 95°C, infusion 10 min. Le matin.",
    ],
    aloe_vera: [
      "Gel d'aloe vera externe : 1 cuillère à café de gel pur sur peau propre, laisser 15 min puis rincer.",
      "Smoothie aloe : 30ml de gel d'aloe vera (qualité alimentaire) + 200ml de jus de pomme. Le matin, période maximale de 2 semaines.",
      "Soin aloe + camomille : 1 cuillère à café de gel + 5 gouttes d'infusion de camomille appliqués sur peau propre 10 min.",
    ],
    chamomile: [
      "Infusion de camomille : 2g de fleurs séchées dans 200ml d'eau à 90°C, infusion 8 min. À boire le matin.",
      "Vapeur de camomille : 5g de fleurs dans 1L d'eau frémissante, exposer le visage à la vapeur 5 min sous une serviette.",
      "Compresse + boisson : compresse de 3g de camomille dans 250ml d'eau à 90°C 10 min, refroidie, appliquée 5 min ; boire l'infusion à part.",
    ],
    nettle: [
      "Infusion d'ortie : 2g de feuilles séchées dans 200ml d'eau à 95°C, infusion 10 min. À boire le matin.",
      "Décoction d'ortie : 2,5g de feuilles dans 250ml d'eau, frémissement 8 min puis filtrer. À boire le matin.",
      "Rituel ortie + fruits : 2g d'ortie dans 200ml d'eau à 95°C, infusion 10 min, accompagnée de fruits rouges au petit-déjeuner.",
    ],
    witch_hazel: [
      "Hydrolat d'hamamélis : appliquer 5ml en lotion sur peau propre matin et soir au coton.",
      "Compresse d'hamamélis : 5ml d'hydrolat sur compresse appliquée 5 min sur les zones sensibles, matin et soir.",
      "Soin combiné : 5ml d'hydrolat d'hamamélis suivi d'1 cuillère à café de gel d'aloe vera, matin et soir.",
    ],
  };

  const tips: string[] = [
    "Bois 1,5L d'eau par jour. La peau bien hydratée respire et régénère mieux.",
    "Évite le sucre raffiné. Il favorise la glycation et accélère le vieillissement cutané.",
    "Lave-toi le visage à l'eau tiède, jamais brûlante. La chaleur dilate et fragilise les capillaires.",
    "Démaquille-toi tous les soirs. Les résidus obstruent les pores et créent des inflammations.",
    "Mange des oméga-3 (poissons gras, lin, chia). Ils nourrissent le film hydrolipidique.",
    "Dors 7-8h par nuit. La régénération cellulaire culmine entre 23h et 4h du matin.",
    "Protège-toi du soleil avec SPF 30 minimum, même en hiver. Les UV accélèrent les rides.",
    "Évite les douches >5 min très chaudes. Elles décapent le manteau lipidique.",
    "Inclus des aliments riches en zinc (huîtres, graines de courge). Le zinc soutient la peau.",
    "Limite les laitages si peau sujette à imperfections. Lien démontré dans plusieurs études.",
    "Pratique le drainage du visage : massage doux 5 min matin et soir. Stimule la microcirculation.",
    "Mange 1 portion de fruits rouges par jour. Les antioxydants protègent du stress oxydatif.",
    "Évite de toucher ton visage dans la journée. Les bactéries des mains aggravent les imperfections.",
    "Change ta taie d'oreiller 2 fois par semaine. Les microbes s'y accumulent.",
    "Inclus 1 portion de légumes verts par jour. La chlorophylle soutient le renouvellement.",
    "Limite l'alcool. Il déshydrate et dilate les vaisseaux du visage.",
    "Bouge 30 min par jour. La transpiration draine les toxines via la peau.",
    "Évite les cosmétiques avec parabènes longs (E216-E217 interdits). Privilégie le clean.",
    "Pratique la respiration profonde 5 min. L'oxygénation nourrit chaque cellule cutanée.",
    "Réduis le stress. Le cortisol chronique amincit l'épiderme et favorise les imperfections.",
    "Célèbre les 21 jours. Garde le rituel de soin qui t'a apporté le plus de mieux-être.",
  ];

  return {
    recipeFr: recipes[plantId][cycle - 1],
    tipFr: tips[day - 1],
  };
}

// ─── EXPORT FINAL ──────────────────────────────────────────────────────────
const SLEEP_PROTOCOL: Protocol = {
  id: 'sleep',
  titleFr: 'Sommeil Naturel',
  emoji: '😴',
  descriptionFr:
    'Programme de 21 jours pour favoriser un sommeil réparateur grâce à 7 plantes traditionnellement reconnues.',
  durationDays: 21,
  days: buildDays({
    id: 'sleep',
    titleFr: 'Sommeil Naturel',
    emoji: '😴',
    descriptionFr: '',
    rotation: SLEEP_ROTATION,
    build: buildSleepDay,
  }),
  disclaimer: DISCLAIMER,
};

const DIGESTION_PROTOCOL: Protocol = {
  id: 'digestion',
  titleFr: 'Digestion Apaisée',
  emoji: '🫃',
  descriptionFr:
    'Programme de 21 jours pour soutenir le confort digestif au quotidien.',
  durationDays: 21,
  days: buildDays({
    id: 'digestion',
    titleFr: 'Digestion Apaisée',
    emoji: '🫃',
    descriptionFr: '',
    rotation: DIGESTION_ROTATION,
    build: buildDigestionDay,
  }),
  disclaimer: DISCLAIMER,
};

const STRESS_PROTOCOL: Protocol = {
  id: 'stress',
  titleFr: 'Anti-Stress Naturel',
  emoji: '😰',
  descriptionFr:
    'Programme de 21 jours pour favoriser la détente et la sérénité.',
  durationDays: 21,
  days: buildDays({
    id: 'stress',
    titleFr: 'Anti-Stress Naturel',
    emoji: '😰',
    descriptionFr: '',
    rotation: STRESS_ROTATION,
    build: buildStressDay,
  }),
  disclaimer: DISCLAIMER,
};

const ENERGY_PROTOCOL: Protocol = {
  id: 'energy',
  titleFr: 'Énergie & Vitalité',
  emoji: '⚡',
  descriptionFr:
    'Programme de 21 jours pour contribuer à la vitalité et au tonus.',
  durationDays: 21,
  days: buildDays({
    id: 'energy',
    titleFr: 'Énergie & Vitalité',
    emoji: '⚡',
    descriptionFr: '',
    rotation: ENERGY_ROTATION,
    build: buildEnergyDay,
  }),
  disclaimer: DISCLAIMER,
};

const SKIN_PROTOCOL: Protocol = {
  id: 'skin',
  titleFr: 'Peau Saine',
  emoji: '🧴',
  descriptionFr:
    "Programme de 21 jours pour favoriser une peau saine de l'intérieur.",
  durationDays: 21,
  days: buildDays({
    id: 'skin',
    titleFr: 'Peau Saine',
    emoji: '🧴',
    descriptionFr: '',
    rotation: SKIN_ROTATION,
    build: buildSkinDay,
  }),
  disclaimer: DISCLAIMER,
};

export const PROTOCOLS: Protocol[] = [
  SLEEP_PROTOCOL,
  DIGESTION_PROTOCOL,
  STRESS_PROTOCOL,
  ENERGY_PROTOCOL,
  SKIN_PROTOCOL,
];

export function getProtocolById(id: string): Protocol | undefined {
  return PROTOCOLS.find((p) => p.id === id);
}
