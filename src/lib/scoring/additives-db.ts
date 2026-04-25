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
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr:
      'Édulcorant intense. Effet possible sur le microbiote et la tolérance au glucose.',
    descriptionDetailedFr:
      'Reclassée groupe 3 par l\'IARC en 1999 (preuves de cancérogénicité humaine insuffisantes). DJA EFSA 5 mg/kg pc/j. Études récentes (Suez 2014) sur impact microbiote et tolérance au glucose.',
    scientificSources: [
      'https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono73.pdf',
      'https://www.efsa.europa.eu/en/topics/topic/sweeteners',
    ],
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

  {
    code: 'e127',
    nameFr: 'Érythrosine',
    category: 'colorant',
    riskLevel: 'high',
    penaltyPoints: 35,
    isBlocker: false,
    descriptionShortFr: 'Colorant rouge iodé suspecté d\'effets sur la thyroïde.',
    descriptionDetailedFr:
      'EFSA 2011 : DJA réduite à 0,1 mg/kg pc/j, usage restreint aux cerises confites/cocktail. Effets thyroïdiens documentés à fortes doses chez le rat.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/1854',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker', pregnant: 'blocker' },
  },
  {
    code: 'e131',
    nameFr: 'Bleu patenté V',
    category: 'colorant',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Colorant bleu, potentiel allergène.',
    descriptionDetailedFr:
      'EFSA 2013 : maintient la DJA à 5 mg/kg pc/j mais reconnaît un potentiel allergène (réactions cutanées et respiratoires documentées).',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/3185',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e142',
    nameFr: 'Vert acide brillant BS',
    category: 'colorant',
    riskLevel: 'moderate',
    penaltyPoints: 20,
    isBlocker: false,
    descriptionShortFr: 'Colorant azoïque vert, usage restreint en UE.',
    descriptionDetailedFr:
      'EFSA 2010 : DJA conservée à 5 mg/kg pc/j, mais usage restreint dans l\'UE. Effets allergènes documentés.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/1631',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e161g',
    nameFr: 'Canthaxanthine',
    category: 'colorant',
    riskLevel: 'moderate',
    penaltyPoints: 30,
    isBlocker: false,
    descriptionShortFr: 'Caroténoïde de synthèse, dépôts rétiniens documentés.',
    descriptionDetailedFr:
      'EFSA 2010 : DJA très basse à 0,03 mg/kg pc/j suite à observation de dépôts cristallins dans la rétine humaine. Usage restreint à la coloration des saucisses de Strasbourg.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/1852',
    ],
    hiddenNames: [],
    profilesExtraPenalty: {},
  },
  {
    code: 'e173',
    nameFr: 'Aluminium (colorant)',
    category: 'colorant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Aluminium métallique de surface. Neurotoxique cumulatif.',
    descriptionDetailedFr:
      'EFSA 2008 : Dose Hebdomadaire Tolérable Provisoire (DHTP) 1 mg/kg pc/sem, dépassée chez les enfants forts consommateurs. Usage en UE restreint à la coloration de surface (dragées).',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/754',
      'https://www.anses.fr/fr/content/exposition-de-la-population-fran%C3%A7aise-laluminium',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e180',
    nameFr: 'Litholrubine BK',
    category: 'colorant',
    riskLevel: 'moderate',
    penaltyPoints: 20,
    isBlocker: false,
    descriptionShortFr: 'Colorant rouge restreint à la croûte de fromage.',
    descriptionDetailedFr:
      'EFSA 2010 : DJA 1,5 mg/kg pc/j, usage restreint à la croûte de certains fromages affinés.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/1586',
    ],
    hiddenNames: [],
    profilesExtraPenalty: {},
  },

  {
    code: 'e210',
    nameFr: 'Acide benzoïque',
    category: 'conservateur',
    riskLevel: 'moderate',
    penaltyPoints: 20,
    isBlocker: false,
    descriptionShortFr:
      'Conservateur autorisé. Risque de formation de benzène si combiné à de la vitamine C.',
    descriptionDetailedFr:
      'EFSA 2016 : DJA 5 mg/kg pc/j. Réaction documentée avec l\'acide ascorbique (vitamine C) formant du benzène (cancérogène groupe 1 IARC) dans les boissons.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4433',
      'https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono100F-24.pdf',
    ],
    hiddenNames: [],
    profilesExtraPenalty: {},
  },
  {
    code: 'e211',
    nameFr: 'Benzoate de sodium',
    category: 'conservateur',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr:
      'Conservateur impliqué dans l\'hyperactivité chez l\'enfant (étude Southampton).',
    descriptionDetailedFr:
      'EFSA 2016 : DJA 5 mg/kg pc/j. McCann et al. (Lancet 2007) : association entre benzoate de sodium combiné à des colorants azoïques et hyperactivité chez l\'enfant.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4433',
      'https://doi.org/10.1016/S0140-6736(07)61306-3',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e214',
    nameFr: 'Éthyl-parabène',
    category: 'conservateur',
    riskLevel: 'high',
    penaltyPoints: 35,
    isBlocker: false,
    descriptionShortFr: 'Parabène, perturbateur endocrinien potentiel.',
    descriptionDetailedFr:
      'EFSA 2004 : DJA 0-10 mg/kg pc/j (groupe parabènes). ANSES : suspicion de perturbation endocrinienne (mime œstrogénique faible documenté in vitro).',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/83',
    ],
    hiddenNames: ['ethyl-paraben', 'ethylparaben'],
    profilesExtraPenalty: { pregnant: 'blocker', child: 'blocker' },
  },
  {
    code: 'e215',
    nameFr: 'Sodium éthylparabène',
    category: 'conservateur',
    riskLevel: 'high',
    penaltyPoints: 35,
    isBlocker: false,
    descriptionShortFr: 'Sel sodique de l\'éthylparabène, perturbateur endocrinien potentiel.',
    descriptionDetailedFr:
      'EFSA 2004 : DJA combinée 0-10 mg/kg pc/j avec E214/E218/E219.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/83',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { pregnant: 'blocker', child: 'blocker' },
  },
  {
    code: 'e216',
    nameFr: 'Propylparabène',
    category: 'conservateur',
    riskLevel: 'blocker',
    penaltyPoints: 0,
    isBlocker: true,
    descriptionShortFr: 'Interdit comme additif alimentaire dans l\'UE depuis 2006.',
    descriptionDetailedFr:
      'Règlement (CE) 2006/52 : retiré de la liste des additifs autorisés en alimentaire suite à des effets sur la fertilité chez le rat (étude Oishi 2002). Reste autorisé en cosmétique sous restriction.',
    scientificSources: [
      'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=celex%3A32006L0052',
      'https://www.efsa.europa.eu/en/efsajournal/pub/83',
    ],
    hiddenNames: ['propyl-paraben', 'propylparaben'],
    profilesExtraPenalty: {},
  },
  {
    code: 'e217',
    nameFr: 'Sodium propylparabène',
    category: 'conservateur',
    riskLevel: 'blocker',
    penaltyPoints: 0,
    isBlocker: true,
    descriptionShortFr: 'Interdit en alimentaire UE depuis 2006 (sel sodique du propylparabène).',
    descriptionDetailedFr:
      'Retiré par le Règlement (CE) 2006/52 en même temps que le propylparabène (E216).',
    scientificSources: [
      'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=celex%3A32006L0052',
    ],
    hiddenNames: [],
    profilesExtraPenalty: {},
  },

  {
    code: 'e220',
    nameFr: 'Anhydride sulfureux (SO₂)',
    category: 'conservateur',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Allergène majeur. Étiquetage obligatoire UE >10 mg/kg.',
    descriptionDetailedFr:
      'EFSA 2016 : DJA réduite à 0,7 mg/kg pc/j. Allergène à étiquetage obligatoire UE (Annexe II Reg 1169/2011). Risque de crise d\'asthme chez les sujets sensibles.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4438',
    ],
    hiddenNames: ['sulfur dioxide', 'so2', 'anhydride sulfureux'],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e221',
    nameFr: 'Sulfite de sodium',
    category: 'conservateur',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Sulfite, allergène majeur, étiquetage obligatoire UE.',
    descriptionDetailedFr: 'Famille des sulfites — DJA combinée EFSA 2016 : 0,7 mg/kg pc/j en SO₂ équivalent.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4438',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e222',
    nameFr: 'Bisulfite de sodium',
    category: 'conservateur',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Sulfite, allergène majeur.',
    descriptionDetailedFr: 'Famille des sulfites — DJA combinée EFSA 2016 : 0,7 mg/kg pc/j en SO₂.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4438',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e223',
    nameFr: 'Métabisulfite de sodium',
    category: 'conservateur',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Sulfite, allergène majeur (vins, fruits secs).',
    descriptionDetailedFr: 'Famille des sulfites — DJA combinée EFSA 2016 : 0,7 mg/kg pc/j en SO₂.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4438',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e224',
    nameFr: 'Métabisulfite de potassium',
    category: 'conservateur',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Sulfite, allergène majeur (vins).',
    descriptionDetailedFr: 'Famille des sulfites — DJA combinée EFSA 2016 : 0,7 mg/kg pc/j en SO₂.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4438',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e226',
    nameFr: 'Sulfite de calcium',
    category: 'conservateur',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Sulfite, allergène majeur.',
    descriptionDetailedFr: 'Famille des sulfites — DJA combinée EFSA 2016 : 0,7 mg/kg pc/j en SO₂.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4438',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e227',
    nameFr: 'Bisulfite de calcium',
    category: 'conservateur',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Sulfite, allergène majeur.',
    descriptionDetailedFr: 'Famille des sulfites — DJA combinée EFSA 2016 : 0,7 mg/kg pc/j en SO₂.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4438',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e228',
    nameFr: 'Bisulfite de potassium',
    category: 'conservateur',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Sulfite, allergène majeur.',
    descriptionDetailedFr: 'Famille des sulfites — DJA combinée EFSA 2016 : 0,7 mg/kg pc/j en SO₂.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4438',
    ],
    hiddenNames: [],
    profilesExtraPenalty: { child: 'blocker' },
  },

  {
    code: 'e230',
    nameFr: 'Diphényle (biphényle)',
    category: 'conservateur',
    riskLevel: 'blocker',
    penaltyPoints: 0,
    isBlocker: true,
    descriptionShortFr: 'Retiré de la liste des additifs alimentaires UE en 2014.',
    descriptionDetailedFr:
      'Règlement UE 1129/2011 : retiré de l\'Annexe II suite à la réévaluation EFSA 2012. N\'est plus autorisé pour le traitement de surface des agrumes.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/2880',
    ],
    hiddenNames: [],
    profilesExtraPenalty: {},
  },
  {
    code: 'e240',
    nameFr: 'Formaldéhyde',
    category: 'conservateur',
    riskLevel: 'blocker',
    penaltyPoints: 0,
    isBlocker: true,
    descriptionShortFr: 'Cancérogène avéré (IARC groupe 1). Interdit en alimentaire UE.',
    descriptionDetailedFr:
      'IARC monographie 100F : groupe 1 (cancérogène avéré pour l\'humain — cancer du nasopharynx, leucémie). Interdit comme additif alimentaire dans l\'UE.',
    scientificSources: [
      'https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono100F-29.pdf',
    ],
    hiddenNames: ['formaldehyde', 'formol'],
    profilesExtraPenalty: {},
  },

  {
    code: 'e310',
    nameFr: 'Gallate de propyle',
    category: 'antioxydant',
    riskLevel: 'high',
    penaltyPoints: 35,
    isBlocker: false,
    descriptionShortFr: 'DJA réduite EFSA 2014. Effets reproduction documentés (rat).',
    descriptionDetailedFr:
      'EFSA 2014 : DJA réduite à 0,5 mg/kg pc/j suite à effets sur la reproduction observés chez le rat.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/3642',
    ],
    hiddenNames: ['propyl gallate'],
    profilesExtraPenalty: { pregnant: 'blocker', child: 'blocker' },
  },
  {
    code: 'e320',
    nameFr: 'BHA (butylhydroxyanisole)',
    category: 'antioxydant',
    riskLevel: 'high',
    penaltyPoints: 40,
    isBlocker: false,
    descriptionShortFr: 'Cancérogène possible (IARC 2B). Perturbateur endocrinien suspecté.',
    descriptionDetailedFr:
      'IARC monographie 40 (1986) : groupe 2B (cancérogène possible pour l\'humain). ANSES : suspecté perturbateur endocrinien dans la stratégie nationale 2019.',
    scientificSources: [
      'https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono40-13.pdf',
      'https://www.anses.fr/fr/content/strat%C3%A9gie-nationale-sur-les-perturbateurs-endocriniens',
    ],
    hiddenNames: ['bha', 'butylated hydroxyanisole'],
    profilesExtraPenalty: { pregnant: 'blocker', child: 'blocker' },
  },
  {
    code: 'e321',
    nameFr: 'BHT (butylhydroxytoluène)',
    category: 'antioxydant',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Antioxydant de synthèse. Suspicion de perturbation endocrinienne.',
    descriptionDetailedFr:
      'IARC groupe 3 (preuves insuffisantes). ANSES : surveillance comme suspecté perturbateur endocrinien dans la stratégie nationale 2019. EFSA 2012 : DJA 0,25 mg/kg pc/j.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/2588',
      'https://www.anses.fr/fr/content/strat%C3%A9gie-nationale-sur-les-perturbateurs-endocriniens',
    ],
    hiddenNames: ['bht', 'butylated hydroxytoluene'],
    profilesExtraPenalty: {},
  },

  {
    code: 'e407',
    nameFr: 'Carraghénanes',
    category: 'emulsifiant',
    riskLevel: 'moderate',
    penaltyPoints: 20,
    isBlocker: false,
    descriptionShortFr: 'Gélifiant. Effet pro-inflammatoire intestinal documenté à fortes doses.',
    descriptionDetailedFr:
      'EFSA 2018 : maintient la DJA à 75 mg/kg pc/j mais reconnaît un effet pro-inflammatoire à fortes doses. JECFA 2014 : retrait recommandé des préparations infantiles <12 mois.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/5238',
    ],
    hiddenNames: ['carrageenan', 'carraghénane'],
    profilesExtraPenalty: {},
  },
  {
    code: 'e433',
    nameFr: 'Polysorbate 80',
    category: 'emulsifiant',
    riskLevel: 'moderate',
    penaltyPoints: 20,
    isBlocker: false,
    descriptionShortFr: 'Émulsifiant. Altération du microbiote documentée chez l\'humain.',
    descriptionDetailedFr:
      'EFSA 2015 : DJA 25 mg/kg pc/j. Étude Chassaing/Gewirtz 2015 (Nature) puis travaux humains : altération du microbiote intestinal et inflammation de bas grade.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/3958',
      'https://doi.org/10.1038/nature14232',
    ],
    hiddenNames: ['polysorbate-80', 'tween 80'],
    profilesExtraPenalty: {},
  },
  {
    code: 'e466',
    nameFr: 'Carboxyméthylcellulose (CMC)',
    category: 'emulsifiant',
    riskLevel: 'moderate',
    penaltyPoints: 20,
    isBlocker: false,
    descriptionShortFr: 'Épaississant. Altération du microbiote intestinal documentée.',
    descriptionDetailedFr:
      'EFSA 2018 : DJA non spécifiée. Étude Chassaing 2021 (Gastroenterology) : altération du microbiote et inflammation de bas grade chez l\'humain.',
    scientificSources: [
      'https://doi.org/10.1053/j.gastro.2021.11.006',
      'https://www.efsa.europa.eu/en/efsajournal/pub/5047',
    ],
    hiddenNames: ['carboxymethylcellulose', 'cmc'],
    profilesExtraPenalty: {},
  },

  {
    code: 'e520',
    nameFr: 'Sulfate d\'aluminium',
    category: 'regulateur',
    riskLevel: 'high',
    penaltyPoints: 35,
    isBlocker: false,
    descriptionShortFr: 'Source d\'aluminium. DHTP EFSA dépassée chez l\'enfant.',
    descriptionDetailedFr:
      'EFSA 2008 : Dose Hebdomadaire Tolérable Provisoire 1 mg/kg pc/sem en aluminium. ANSES 2018 : exposition alimentaire dépasse cette DHTP chez les enfants forts consommateurs.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/754',
      'https://www.anses.fr/fr/content/exposition-de-la-population-fran%C3%A7aise-laluminium',
    ],
    hiddenNames: ['aluminium sulfate'],
    profilesExtraPenalty: { child: 'blocker' },
  },
  {
    code: 'e541',
    nameFr: 'Phosphate d\'aluminium acide',
    category: 'regulateur',
    riskLevel: 'high',
    penaltyPoints: 35,
    isBlocker: false,
    descriptionShortFr: 'Levure chimique aluminée. DHTP EFSA dépassée chez l\'enfant.',
    descriptionDetailedFr:
      'EFSA 2008 : DHTP aluminium 1 mg/kg pc/sem. Usage UE restreint dans les pâtisseries levées.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/754',
    ],
    hiddenNames: ['sodium aluminium phosphate'],
    profilesExtraPenalty: { child: 'blocker' },
  },

  {
    code: 'e551',
    nameFr: 'Dioxyde de silicium',
    category: 'regulateur',
    riskLevel: 'moderate',
    penaltyPoints: 20,
    isBlocker: false,
    descriptionShortFr: 'Anti-agglomérant. Préoccupation EFSA sur la fraction nanoparticulaire.',
    descriptionDetailedFr:
      'EFSA 2018 : impossible de finaliser la réévaluation par manque de données sur la fraction nanoparticulaire. Demande de re-soumission de données.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/5088',
    ],
    hiddenNames: ['silicon dioxide', 'silica'],
    profilesExtraPenalty: {},
  },
  {
    code: 'e553b',
    nameFr: 'Talc',
    category: 'regulateur',
    riskLevel: 'moderate',
    penaltyPoints: 20,
    isBlocker: false,
    descriptionShortFr:
      'Anti-agglomérant. Risque historique de contamination par l\'amiante.',
    descriptionDetailedFr:
      'IARC monographie 93 : talc avec amiante = groupe 1, talc périnée = groupe 2B. Sources EFSA reconnaissent la possibilité de contamination, contrôles requis.',
    scientificSources: [
      'https://publications.iarc.fr/_publications/media/download/2954/0a0b76d4d27a3e3c0a32cba7ddd9f8b3a4ef3e21.pdf',
    ],
    hiddenNames: ['talc'],
    profilesExtraPenalty: {},
  },

  {
    code: 'e627',
    nameFr: 'Guanylate disodique',
    category: 'exhausteur',
    riskLevel: 'low',
    penaltyPoints: 10,
    isBlocker: false,
    descriptionShortFr: 'Exhausteur de goût souvent associé au glutamate (effet cocktail).',
    descriptionDetailedFr:
      'EFSA 2017 : sûr aux doses actuelles. Quasi systématiquement combiné au E621 dans les bouillons et chips, ce qui amplifie l\'effet exhausteur global.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4781',
    ],
    hiddenNames: ['disodium guanylate'],
    profilesExtraPenalty: {},
  },
  {
    code: 'e631',
    nameFr: 'Inosinate disodique',
    category: 'exhausteur',
    riskLevel: 'low',
    penaltyPoints: 10,
    isBlocker: false,
    descriptionShortFr: 'Exhausteur de goût souvent associé au glutamate (effet cocktail).',
    descriptionDetailedFr:
      'EFSA 2017 : sûr aux doses actuelles. Marqueur d\'ultra-transformation lorsqu\'il accompagne le E621.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/4781',
    ],
    hiddenNames: ['disodium inosinate'],
    profilesExtraPenalty: {},
  },

  {
    code: 'e952',
    nameFr: 'Cyclamate',
    category: 'edulcorant',
    riskLevel: 'moderate',
    penaltyPoints: 25,
    isBlocker: false,
    descriptionShortFr: 'Édulcorant interdit aux États-Unis depuis 1969.',
    descriptionDetailedFr:
      'EFSA 2003 : DJA 7 mg/kg pc/j. FDA : interdit aux États-Unis depuis 1969 suite à des études sur le cancer de la vessie chez le rat (controverse non résolue à l\'échelle internationale). Passage placentaire documenté.',
    scientificSources: [
      'https://www.efsa.europa.eu/en/efsajournal/pub/13',
    ],
    hiddenNames: ['cyclamate', 'cyclamic acid'],
    profilesExtraPenalty: { pregnant: 'blocker' },
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
