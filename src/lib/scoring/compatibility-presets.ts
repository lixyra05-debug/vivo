import type { CompatibilityProfile } from '../api/types';

export interface CompatibilityPreset {
  id: string;
  nameFr: string;
  descriptionFr: string;
  profile: CompatibilityProfile;
}

/**
 * 6 presets prêts-à-l'emploi pour les cas d'usage les plus fréquents.
 * Le préset "sportif" est volontairement simplifié : il n'existe pas de condition
 * "protéines élevées" intégrée, on encode l'intention via minScore=60 + avoid
 * des édulcorants/huile de palme. Une condition dédiée pourra être ajoutée plus
 * tard si besoin.
 */
export const COMPATIBILITY_PRESETS: Record<string, CompatibilityPreset> = {
  enceinte: {
    id: 'enceinte',
    nameFr: 'Femme enceinte',
    descriptionFr: 'Bloque alcool, listeria, rétinol et fromages au lait cru',
    profile: {
      allergies: [],
      dietary: [],
      conditions: ['enceinte'],
      avoid: [],
      minScore: 50,
    },
  },
  bebe: {
    id: 'bebe',
    nameFr: 'Bébé (6-12 mois)',
    descriptionFr: 'Sel <0.4g, pas de miel, pas de fruits à coque, score >60',
    profile: {
      allergies: [],
      dietary: [],
      conditions: ['bebe'],
      avoid: [],
      minScore: 60,
    },
  },
  diabete_t2: {
    id: 'diabete_t2',
    nameFr: 'Diabète type 2',
    descriptionFr: 'Sucres bas, IG bas prioritaire, score >50',
    profile: {
      allergies: [],
      dietary: [],
      conditions: ['diabete'],
      avoid: ['edulcorants'],
      minScore: 50,
    },
  },
  coeliaque: {
    id: 'coeliaque',
    nameFr: 'Cœliaque strict',
    descriptionFr: 'Zéro gluten, traces incluses',
    profile: {
      allergies: ['gluten'],
      dietary: [],
      conditions: ['coeliaque'],
      avoid: [],
      minScore: 0,
    },
  },
  ibs_fodmap: {
    id: 'ibs_fodmap',
    nameFr: 'IBS / FODMAP',
    descriptionFr: 'Bloque les 20+ déclencheurs FODMAP courants',
    profile: {
      allergies: [],
      dietary: [],
      conditions: ['ibs_fodmap'],
      avoid: [],
      minScore: 0,
    },
  },
  // Sportif : pas de condition "protéines hautes" — encodé via minScore + avoid.
  sportif: {
    id: 'sportif',
    nameFr: 'Sportif sèche',
    descriptionFr: 'Protéines >15g, sucres bas, score >60',
    profile: {
      allergies: [],
      dietary: [],
      conditions: [],
      avoid: ['edulcorants', 'huile_palme'],
      minScore: 60,
    },
  },
};

export function getPreset(id: string): CompatibilityProfile | null {
  const preset = COMPATIBILITY_PRESETS[id];
  return preset ? preset.profile : null;
}
