import type { HealthProfile } from '../api/types';

export type RiskLevel = 'blocker' | 'high' | 'moderate' | 'low' | 'safe';

export type ProfileOverride = 'blocker' | 'double';

export interface AdditiveEntry {
  code: string;
  nameFr: string;
  category: string;
  riskLevel: RiskLevel;
  penaltyPoints: number;
  isBlocker: boolean;
  descriptionShortFr: string;
  descriptionDetailedFr?: string;
  scientificSources?: string[];
  hiddenNames: string[];
  profilesExtraPenalty: Partial<Record<HealthProfile, ProfileOverride>>;
}

export const ADDITIVES: AdditiveEntry[] = [
  {
    code: 'e951',
    nameFr: 'Aspartame',
    category: 'edulcorant',
    riskLevel: 'blocker',
    penaltyPoints: 0,
    isBlocker: true,
    descriptionShortFr: 'Neurotoxique métabolisé en méthanol puis formaldéhyde.',
    descriptionDetailedFr:
      'Édulcorant intense métabolisé en phénylalanine, acide aspartique et méthanol. Le méthanol se transforme en formaldéhyde dans le corps, un cancérigène probable (IARC 2B, 2023).',
    scientificSources: [
      'https://www.iarc.who.int/news-events/aspartame-hazard-and-risk-assessment-results-released/',
    ],
    hiddenNames: ['arôme artificiel', 'édulcorant aspartame'],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker', athlete: 'blocker' },
  },
  {
    code: 'e621',
    nameFr: 'Glutamate monosodique',
    category: 'exhausteur',
    riskLevel: 'blocker',
    penaltyPoints: 0,
    isBlocker: true,
    descriptionShortFr: 'Excitotoxine. Noms cachés fréquents sur les étiquettes.',
    descriptionDetailedFr:
      'Exhausteur de goût classé excitotoxine : stimule à l\'excès les neurones. Souvent dissimulé sous des noms "naturels".',
    hiddenNames: [
      'extrait de levure',
      'arôme naturel',
      'protéines hydrolysées',
      'protéine végétale hydrolysée',
      'maltodextrine',
      'bouillon',
      'caséinate',
    ],
    profilesExtraPenalty: { child: 'blocker', athlete: 'blocker' },
  },
  {
    code: 'e171',
    nameFr: 'Dioxyde de titane',
    category: 'colorant',
    riskLevel: 'blocker',
    penaltyPoints: 0,
    isBlocker: true,
    descriptionShortFr: 'Nanoparticule génotoxique. Interdit en France depuis 2020.',
    descriptionDetailedFr:
      'Colorant blanc en nanoparticules capable de traverser la barrière intestinale. Génotoxicité démontrée par l\'EFSA (2021).',
    hiddenNames: ['dioxyde de titane', 'titanium dioxide'],
    profilesExtraPenalty: {},
  },
  {
    code: 'e955',
    nameFr: 'Sucralose',
    category: 'edulcorant',
    riskLevel: 'high',
    penaltyPoints: 50,
    isBlocker: false,
    descriptionShortFr: 'Organochloré mutagène perturbant le microbiote.',
    hiddenNames: [],
    profilesExtraPenalty: { diabetic: 'blocker' },
  },
  {
    code: 'e249',
    nameFr: 'Nitrite de potassium',
    category: 'conservateur',
    riskLevel: 'high',
    penaltyPoints: 50,
    isBlocker: false,
    descriptionShortFr: 'Forme des nitrosamines cancérogènes.',
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e250',
    nameFr: 'Nitrite de sodium',
    category: 'conservateur',
    riskLevel: 'high',
    penaltyPoints: 50,
    isBlocker: false,
    descriptionShortFr: 'Forme des nitrosamines cancérogènes (cancer colorectal).',
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e251',
    nameFr: 'Nitrate de sodium',
    category: 'conservateur',
    riskLevel: 'high',
    penaltyPoints: 50,
    isBlocker: false,
    descriptionShortFr: 'Se transforme en nitrites puis nitrosamines cancérogènes.',
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e252',
    nameFr: 'Nitrate de potassium',
    category: 'conservateur',
    riskLevel: 'high',
    penaltyPoints: 50,
    isBlocker: false,
    descriptionShortFr: 'Se transforme en nitrites puis nitrosamines cancérogènes.',
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e120',
    nameFr: 'Cochenille',
    category: 'colorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Allergène sévère. Risque de choc anaphylactique.',
    hiddenNames: ['carmin', 'acide carminique'],
    profilesExtraPenalty: {},
  },
  {
    code: 'e102',
    nameFr: 'Tartrazine',
    category: 'colorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Colorant azoïque, hyperactivité chez l\'enfant (étude Southampton).',
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e104',
    nameFr: 'Jaune de quinoléine',
    category: 'colorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Colorant azoïque, hyperactivité chez l\'enfant.',
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e110',
    nameFr: 'Jaune orangé S',
    category: 'colorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Colorant azoïque, hyperactivité chez l\'enfant.',
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e122',
    nameFr: 'Azorubine',
    category: 'colorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Colorant azoïque, hyperactivité chez l\'enfant.',
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e124',
    nameFr: 'Rouge cochenille A',
    category: 'colorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Colorant azoïque, hyperactivité chez l\'enfant.',
    hiddenNames: ['ponceau 4R'],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e129',
    nameFr: 'Rouge allura AC',
    category: 'colorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Colorant azoïque, hyperactivité chez l\'enfant.',
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e133',
    nameFr: 'Bleu brillant FCF',
    category: 'colorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Colorant azoïque, hyperactivité chez l\'enfant.',
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e150c',
    nameFr: 'Caramel ammoniacal',
    category: 'colorant',
    riskLevel: 'moderate',
    penaltyPoints: 30,
    isBlocker: false,
    descriptionShortFr: 'Contient du 4-MEI, immunotoxique.',
    hiddenNames: [],
    profilesExtraPenalty: {},
  },
  {
    code: 'e150d',
    nameFr: 'Caramel au sulfite ammoniacal',
    category: 'colorant',
    riskLevel: 'moderate',
    penaltyPoints: 30,
    isBlocker: false,
    descriptionShortFr: 'Contient du 4-MEI, cancérogène possible (CIRC 2B).',
    hiddenNames: [],
    profilesExtraPenalty: {},
  },
  {
    code: 'e330',
    nameFr: 'Acide citrique',
    category: 'acidifiant',
    riskLevel: 'moderate',
    penaltyPoints: 20,
    isBlocker: false,
    descriptionShortFr:
      'Issu de moisissures Aspergillus niger. Facilite le passage de l\'aluminium au cerveau.',
    hiddenNames: [],
    profilesExtraPenalty: {},
  },
  {
    code: 'e338',
    nameFr: 'Acide phosphorique',
    category: 'acidifiant',
    riskLevel: 'moderate',
    penaltyPoints: 20,
    isBlocker: false,
    descriptionShortFr: 'Déminéralisation osseuse, hyperphosphatémie.',
    hiddenNames: [],
    profilesExtraPenalty: {},
  },
  {
    code: 'e954',
    nameFr: 'Saccharine',
    category: 'edulcorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Perturbe le microbiote et la tolérance au glucose.',
    hiddenNames: [],
    profilesExtraPenalty: { diabetic: 'double', pregnant: 'blocker' },
  },
  {
    code: 'e950',
    nameFr: 'Acésulfame K',
    category: 'edulcorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Édulcorant intense, perturbe le microbiote.',
    hiddenNames: [],
    profilesExtraPenalty: { diabetic: 'double', child: 'blocker' },
  },
];

export const ADDITIVES_MAP: Map<string, AdditiveEntry> = new Map(
  ADDITIVES.map((entry) => [entry.code, entry])
);

export function normalizeAdditiveTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/^en:/, '').replace(/\s+/g, '');
}

export function findAdditive(tag: string): AdditiveEntry | undefined {
  return ADDITIVES_MAP.get(normalizeAdditiveTag(tag));
}

export const AZO_COLORANTS = ['e102', 'e104', 'e110', 'e122', 'e124', 'e129', 'e133'];
