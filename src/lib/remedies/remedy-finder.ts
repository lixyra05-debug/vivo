import {
  PLANT_ENCYCLOPEDIA,
  type PlantEntry,
} from '@/src/data/plant-encyclopedia';

export interface RemedyCategory {
  id: string;
  labelFr: string;
  emoji: string;
  description: string;
  keywords: string[];
  plantIds: string[];
}

export const REMEDY_CATEGORIES: RemedyCategory[] = [
  {
    id: 'sleep',
    labelFr: 'Sommeil',
    emoji: '😴',
    description:
      "Plantes pour favoriser l'endormissement et la qualité du sommeil",
    keywords: ['dormir', 'sommeil', 'insomnie', 'nuit', 'endormissement'],
    plantIds: [
      'chamomile',
      'valerian',
      'linden',
      'passionflower',
      'hops',
      'melissa',
    ],
  },
  {
    id: 'digestion',
    labelFr: 'Digestion',
    emoji: '🫃',
    description: 'Plantes pour le confort digestif',
    keywords: [
      'digérer',
      'digestion',
      'estomac',
      'ballonnements',
      'transit',
      'flatulences',
    ],
    plantIds: [
      'peppermint',
      'fennel',
      'anise',
      'caraway',
      'artichoke',
      'chicory',
    ],
  },
  {
    id: 'stress',
    labelFr: 'Stress & Anxiété',
    emoji: '😰',
    description: "Plantes apaisantes pour le stress et l'anxiété",
    keywords: ['stress', 'anxiété', 'angoisse', 'nervosité', 'détente'],
    plantIds: ['melissa', 'passionflower', 'lavender', 'hops', 'valerian'],
  },
  {
    id: 'cough',
    labelFr: 'Toux & Gorge',
    emoji: '🤧',
    description: 'Plantes pour les voies respiratoires',
    keywords: ['toux', 'gorge', 'rhume', 'bronches', 'respiration'],
    plantIds: [
      'thyme',
      'ivy',
      'plantain',
      'elderflower',
      'mallow',
      'marshmallow',
    ],
  },
  {
    id: 'skin',
    labelFr: 'Peau',
    emoji: '🧴',
    description: 'Plantes pour le soin de la peau',
    keywords: ['peau', 'cutané', 'dermatite', 'eczéma', 'cicatrisation'],
    plantIds: ['calendula', 'burdock', 'borage', 'aloe_vera'],
  },
  {
    id: 'circulation',
    labelFr: 'Circulation',
    emoji: '🫀',
    description: 'Plantes pour la circulation sanguine',
    keywords: [
      'circulation',
      'jambes lourdes',
      'veineux',
      'tension',
      'cardio',
    ],
    plantIds: ['red_vine', 'horse_chestnut', 'garlic'],
  },
  {
    id: 'energy',
    labelFr: 'Énergie & Vitalité',
    emoji: '⚡',
    description: 'Plantes tonifiantes pour la vitalité',
    keywords: ['énergie', 'fatigue', 'vitalité', 'tonus', 'forme'],
    plantIds: ['rosemary', 'nettle', 'ginger', 'turmeric'],
  },
  {
    id: 'immunity',
    labelFr: 'Défenses',
    emoji: '🛡️',
    description: 'Soutien naturel des défenses immunitaires',
    keywords: ['immunité', 'défenses', 'immunitaire', 'résistance'],
    plantIds: ['elderflower', 'thyme', 'garlic', 'rosemary'],
  },
];

export function findRemedies(categoryId: string): PlantEntry[] {
  const cat = REMEDY_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return [];
  return cat.plantIds
    .map((id) => PLANT_ENCYCLOPEDIA.find((p) => p.id === id))
    .filter((p): p is PlantEntry => p !== undefined);
}

export function searchRemedies(query: string): RemedyCategory[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return REMEDY_CATEGORIES.filter(
    (c) =>
      c.labelFr.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.toLowerCase().includes(q)),
  );
}
