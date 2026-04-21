import type { CosmeticIngredientRisk, CosmeticProfile } from '../api/types';

export type CosmeticProfileOverride = 'blocker' | 'double';

export type CosmeticCategory =
  | 'endocrine'
  | 'irritant'
  | 'allergen'
  | 'silicone'
  | 'preservative'
  | 'other';

export interface CosmeticIngredientEntry {
  inci: string;
  aliases: string[];
  nameFr: string;
  risk: CosmeticIngredientRisk;
  category: CosmeticCategory;
  penalty: number;
  reasonFr: string;
  sourceUrl: string;
  profilesExtraPenalty: Partial<Record<CosmeticProfile, CosmeticProfileOverride>>;
}

export const COSMETIC_INGREDIENTS: CosmeticIngredientEntry[] = [
  // ==========================================================================
  // Perturbateurs endocriniens (danger, 20-35 pts)
  // ==========================================================================
  {
    inci: 'methylparaben',
    aliases: ['parabens', 'e218', 'paraben methyl', 'methyl paraben'],
    nameFr: 'Méthylparabène',
    risk: 'danger',
    category: 'endocrine',
    penalty: 25,
    reasonFr:
      'Perturbateur endocrinien soupçonné : mime l\'œstrogène et a été détecté dans des tumeurs du sein.',
    sourceUrl:
      'https://ansm.sante.fr/dossiers-thematiques/parabens',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'ethylparaben',
    aliases: ['e214', 'ethyl paraben'],
    nameFr: 'Éthylparabène',
    risk: 'danger',
    category: 'endocrine',
    penalty: 25,
    reasonFr:
      'Perturbateur endocrinien : activité œstrogénique avérée, s\'accumule dans les tissus adipeux.',
    sourceUrl: 'https://ansm.sante.fr/dossiers-thematiques/parabens',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'propylparaben',
    aliases: ['e216', 'propyl paraben'],
    nameFr: 'Propylparabène',
    risk: 'danger',
    category: 'endocrine',
    penalty: 30,
    reasonFr:
      'Perturbateur endocrinien reprotoxique (CE 1223/2009) : concentration max. 0.14 %.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_132.pdf',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'butylparaben',
    aliases: ['e209', 'butyl paraben'],
    nameFr: 'Butylparabène',
    risk: 'danger',
    category: 'endocrine',
    penalty: 30,
    reasonFr:
      'Perturbateur endocrinien reprotoxique : effet anti-androgénique démontré chez le rat.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_132.pdf',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'isobutylparaben',
    aliases: ['isobutyl paraben'],
    nameFr: 'Isobutylparabène',
    risk: 'danger',
    category: 'endocrine',
    penalty: 30,
    reasonFr:
      'Perturbateur endocrinien interdit en cosmétique sans rinçage dans l\'UE depuis 2015.',
    sourceUrl: 'https://ansm.sante.fr/dossiers-thematiques/parabens',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'isopropylparaben',
    aliases: ['isopropyl paraben'],
    nameFr: 'Isopropylparabène',
    risk: 'danger',
    category: 'endocrine',
    penalty: 30,
    reasonFr:
      'Parabène interdit en UE (règlement 358/2014) en raison du risque endocrinien.',
    sourceUrl: 'https://ansm.sante.fr/dossiers-thematiques/parabens',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'bha',
    aliases: ['butylated hydroxyanisole', 'e320'],
    nameFr: 'BHA (hydroxyanisole butylé)',
    risk: 'danger',
    category: 'endocrine',
    penalty: 30,
    reasonFr:
      'Cancérigène possible (CIRC 2B) et perturbateur endocrinien suspecté par l\'ECHA.',
    sourceUrl: 'https://echa.europa.eu/substance-information/-/substanceinfo/100.041.053',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'bht',
    aliases: ['butylated hydroxytoluene', 'e321'],
    nameFr: 'BHT (hydroxytoluène butylé)',
    risk: 'danger',
    category: 'endocrine',
    penalty: 25,
    reasonFr:
      'Perturbateur endocrinien suspecté, irritant cutané et allergène de contact.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/700865-bht/',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'triclosan',
    aliases: ['irgasan'],
    nameFr: 'Triclosan',
    risk: 'danger',
    category: 'endocrine',
    penalty: 35,
    reasonFr:
      'Perturbateur endocrinien thyroïdien, favorise l\'antibiorésistance. Interdit dans de nombreux produits rincés.',
    sourceUrl: 'https://ansm.sante.fr/dossiers-thematiques/triclosan',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'triclocarban',
    aliases: [],
    nameFr: 'Triclocarban',
    risk: 'danger',
    category: 'endocrine',
    penalty: 30,
    reasonFr:
      'Antibactérien perturbateur endocrinien, effets reprotoxiques observés in vivo.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706703-triclocarban/',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'cyclopentasiloxane',
    aliases: ['d5', 'cyclomethicone 5'],
    nameFr: 'Cyclopentasiloxane (D5)',
    risk: 'danger',
    category: 'endocrine',
    penalty: 20,
    reasonFr:
      'Silicone volatil classé PBT (persistant, bioaccumulable, toxique) par l\'ECHA en 2018.',
    sourceUrl:
      'https://echa.europa.eu/substance-information/-/substanceinfo/100.007.969',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'cyclotetrasiloxane',
    aliases: ['d4', 'cyclomethicone 4'],
    nameFr: 'Cyclotétrasiloxane (D4)',
    risk: 'danger',
    category: 'endocrine',
    penalty: 25,
    reasonFr:
      'Perturbateur endocrinien reprotoxique (CMR 2), classé PBT par l\'ECHA.',
    sourceUrl:
      'https://echa.europa.eu/substance-information/-/substanceinfo/100.004.290',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'cyclohexasiloxane',
    aliases: ['d6'],
    nameFr: 'Cyclohexasiloxane (D6)',
    risk: 'warning',
    category: 'endocrine',
    penalty: 15,
    reasonFr:
      'Silicone cyclique suspecté PBT, profil de sécurité proche du D5.',
    sourceUrl: 'https://echa.europa.eu/substance-information/-/substanceinfo/100.008.117',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'blocker' },
  },
  {
    inci: 'octinoxate',
    aliases: ['ethylhexyl methoxycinnamate', 'octyl methoxycinnamate'],
    nameFr: 'Octinoxate',
    risk: 'danger',
    category: 'endocrine',
    penalty: 30,
    reasonFr:
      'Filtre UV perturbateur endocrinien, impacte la thyroïde et la reproduction (étude INSERM 2019).',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704203-octinoxate/',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'oxybenzone',
    aliases: ['benzophenone-3', 'bp-3'],
    nameFr: 'Oxybenzone',
    risk: 'danger',
    category: 'endocrine',
    penalty: 30,
    reasonFr:
      'Filtre UV perturbateur endocrinien détecté dans le lait maternel, toxique pour les coraux.',
    sourceUrl: 'https://www.ewg.org/sunscreen/report/the-trouble-with-oxybenzone/',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'benzophenone-1',
    aliases: ['bp-1'],
    nameFr: 'Benzophénone-1',
    risk: 'warning',
    category: 'endocrine',
    penalty: 20,
    reasonFr:
      'Perturbateur endocrinien œstrogénique et anti-androgénique (SCCS opinion 2019).',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_223.pdf',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'homosalate',
    aliases: [],
    nameFr: 'Homosalate',
    risk: 'warning',
    category: 'endocrine',
    penalty: 18,
    reasonFr:
      'Filtre UV restreint à 7,34 % par le SCCS en 2021 en raison de l\'activité endocrinienne.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_244.pdf',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'diethyl phthalate',
    aliases: ['dep', 'phthalates'],
    nameFr: 'Phtalate DEP',
    risk: 'danger',
    category: 'endocrine',
    penalty: 30,
    reasonFr:
      'Phtalate perturbateur endocrinien fréquent dans les parfums, reprotoxique suspecté.',
    sourceUrl:
      'https://www.inserm.fr/dossier/perturbateurs-endocriniens/',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'dibutyl phthalate',
    aliases: ['dbp'],
    nameFr: 'Phtalate DBP',
    risk: 'danger',
    category: 'endocrine',
    penalty: 35,
    reasonFr:
      'Phtalate CMR 1B interdit en cosmétique UE depuis 2004 mais encore trouvé dans des produits importés.',
    sourceUrl: 'https://echa.europa.eu/substance-information/-/substanceinfo/100.001.416',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'resorcinol',
    aliases: ['1,3-benzenediol'],
    nameFr: 'Résorcinol',
    risk: 'danger',
    category: 'endocrine',
    penalty: 25,
    reasonFr:
      'Perturbateur endocrinien thyroïdien et sensibilisant cutané de classe B.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_060.pdf',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'retinyl palmitate',
    aliases: ['vitamin a palmitate'],
    nameFr: 'Palmitate de rétinyle',
    risk: 'warning',
    category: 'endocrine',
    penalty: 15,
    reasonFr:
      'Dérivé de la vitamine A tératogène à forte dose, déconseillé pendant la grossesse (ANSM).',
    sourceUrl: 'https://ansm.sante.fr/',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'double' },
  },
  {
    inci: 'retinol',
    aliases: ['vitamin a'],
    nameFr: 'Rétinol',
    risk: 'warning',
    category: 'endocrine',
    penalty: 15,
    reasonFr:
      'Vitamine A tératogène à forte concentration, SCCS recommande une limite à 0,3 %.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_199.pdf',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'retinyl acetate',
    aliases: ['vitamin a acetate'],
    nameFr: 'Acétate de rétinyle',
    risk: 'warning',
    category: 'endocrine',
    penalty: 15,
    reasonFr:
      'Dérivé rétinoïde à éviter chez la femme enceinte : risque tératogène cumulatif.',
    sourceUrl: 'https://ansm.sante.fr/',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'ethylhexyl salicylate',
    aliases: ['octisalate'],
    nameFr: 'Octisalate',
    risk: 'warning',
    category: 'endocrine',
    penalty: 12,
    reasonFr:
      'Filtre UV à faible activité œstrogénique, pénètre la peau et détecté dans le plasma (FDA 2020).',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements/fda-issues-proposed-rule-make-sunscreens-safer-and-more-effective',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'double' },
  },
  {
    inci: 'benzyl salicylate',
    aliases: [],
    nameFr: 'Salicylate de benzyle',
    risk: 'warning',
    category: 'allergen',
    penalty: 12,
    reasonFr:
      'Allergène de parfum réglementé (UE 1223/2009 annexe III), perturbateur endocrinien suspecté.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_073.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'blocker' },
  },

  // ==========================================================================
  // Irritants / allergènes (warning, 10-20 pts)
  // ==========================================================================
  {
    inci: 'methylisothiazolinone',
    aliases: ['mit', 'mi'],
    nameFr: 'Méthylisothiazolinone (MIT)',
    risk: 'warning',
    category: 'allergen',
    penalty: 20,
    reasonFr:
      'Conservateur fortement sensibilisant — allergène de contact n°1 en Europe (ANSM 2016).',
    sourceUrl: 'https://ansm.sante.fr/dossiers-thematiques/methylisothiazolinone',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'blocker' },
  },
  {
    inci: 'methylchloroisothiazolinone',
    aliases: ['mcit', 'cmit'],
    nameFr: 'Méthylchloroisothiazolinone (MCIT)',
    risk: 'warning',
    category: 'allergen',
    penalty: 20,
    reasonFr:
      'Conservateur allergisant, interdit dans les produits sans rinçage (UE 1003/2014).',
    sourceUrl: 'https://ansm.sante.fr/dossiers-thematiques/methylisothiazolinone',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'blocker' },
  },
  {
    inci: 'benzisothiazolinone',
    aliases: ['bit'],
    nameFr: 'Benzisothiazolinone',
    risk: 'warning',
    category: 'allergen',
    penalty: 15,
    reasonFr:
      'Conservateur isothiazolinone allergisant, potentiel de sensibilisation modéré à élevé.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_256.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'blocker' },
  },
  {
    inci: 'sodium lauryl sulfate',
    aliases: ['sls'],
    nameFr: 'Sodium Lauryl Sulfate (SLS)',
    risk: 'warning',
    category: 'irritant',
    penalty: 15,
    reasonFr:
      'Tensioactif très irritant : altère la barrière cutanée et provoque dessèchement et eczéma.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_169.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'sodium laureth sulfate',
    aliases: ['sles'],
    nameFr: 'Sodium Laureth Sulfate (SLES)',
    risk: 'warning',
    category: 'irritant',
    penalty: 12,
    reasonFr:
      'Tensioactif pouvant être contaminé par du 1,4-dioxane cancérigène (résidu d\'éthoxylation).',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706110-sodium-laureth-sulfate/',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'ammonium lauryl sulfate',
    aliases: ['als'],
    nameFr: 'Ammonium Lauryl Sulfate',
    risk: 'warning',
    category: 'irritant',
    penalty: 12,
    reasonFr:
      'Tensioactif sulfaté irritant, altère la couche lipidique de la peau.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/700575-ammonium-lauryl-sulfate/',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'formaldehyde',
    aliases: ['methanal'],
    nameFr: 'Formaldéhyde',
    risk: 'danger',
    category: 'preservative',
    penalty: 35,
    reasonFr:
      'Cancérigène avéré (CIRC 1) et sensibilisant cutané, interdit en cosmétique UE.',
    sourceUrl: 'https://monographs.iarc.who.int/wp-content/uploads/2018/06/mono100F-29.pdf',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker', peau_sensible: 'double' },
  },
  {
    inci: 'quaternium-15',
    aliases: ['quaternium 15'],
    nameFr: 'Quaternium-15',
    risk: 'warning',
    category: 'preservative',
    penalty: 18,
    reasonFr:
      'Libérateur de formaldéhyde (cancérigène avéré), très fort potentiel sensibilisant.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_078.pdf',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker', peau_sensible: 'double' },
  },
  {
    inci: 'dmdm hydantoin',
    aliases: [],
    nameFr: 'DMDM Hydantoïne',
    risk: 'warning',
    category: 'preservative',
    penalty: 15,
    reasonFr:
      'Libérateur de formaldéhyde associé à chute de cheveux et irritations cuir chevelu.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/702037-dmdm-hydantoin/',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker', peau_sensible: 'double' },
  },
  {
    inci: 'imidazolidinyl urea',
    aliases: [],
    nameFr: 'Imidazolidinyl urée',
    risk: 'warning',
    category: 'preservative',
    penalty: 12,
    reasonFr:
      'Libérateur de formaldéhyde à faible dose, sensibilisant cutané reconnu.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/702728-imidazolidinyl-urea/',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'blocker' },
  },
  {
    inci: 'diazolidinyl urea',
    aliases: [],
    nameFr: 'Diazolidinyl urée',
    risk: 'warning',
    category: 'preservative',
    penalty: 12,
    reasonFr:
      'Libérateur de formaldéhyde, allergène de contact fréquent.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701937-diazolidinyl-urea/',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'blocker' },
  },
  {
    inci: 'limonene',
    aliases: ['d-limonene', 'l-limonene'],
    nameFr: 'Limonène',
    risk: 'warning',
    category: 'allergen',
    penalty: 10,
    reasonFr:
      'Allergène réglementé annexe III (UE 1223/2009), s\'oxyde et devient sensibilisant.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'linalool',
    aliases: [],
    nameFr: 'Linalol',
    risk: 'warning',
    category: 'allergen',
    penalty: 10,
    reasonFr:
      'Allergène de parfum réglementé (annexe III UE), sensibilise après oxydation à l\'air.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'geraniol',
    aliases: [],
    nameFr: 'Géraniol',
    risk: 'warning',
    category: 'allergen',
    penalty: 10,
    reasonFr:
      'Allergène de parfum listé annexe III, à signaler obligatoirement au-delà de 0,001 %.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'citronellol',
    aliases: [],
    nameFr: 'Citronellol',
    risk: 'warning',
    category: 'allergen',
    penalty: 10,
    reasonFr:
      'Parfum allergène annexe III du règlement cosmétique européen.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'eugenol',
    aliases: [],
    nameFr: 'Eugénol',
    risk: 'warning',
    category: 'allergen',
    penalty: 12,
    reasonFr:
      'Allergène de parfum réglementé, potentiel sensibilisant modéré à élevé.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'cinnamal',
    aliases: ['cinnamaldehyde'],
    nameFr: 'Cinnamal',
    risk: 'warning',
    category: 'allergen',
    penalty: 15,
    reasonFr:
      'Allergène de parfum à fort pouvoir sensibilisant, interdit pur dans la cosmétique UE.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'blocker' },
  },
  {
    inci: 'coumarin',
    aliases: [],
    nameFr: 'Coumarine',
    risk: 'warning',
    category: 'allergen',
    penalty: 10,
    reasonFr:
      'Allergène de parfum listé annexe III du règlement UE 1223/2009.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'hydroxycitronellal',
    aliases: [],
    nameFr: 'Hydroxycitronellal',
    risk: 'warning',
    category: 'allergen',
    penalty: 12,
    reasonFr:
      'Allergène de parfum à fort taux de sensibilisation en Europe.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'isoeugenol',
    aliases: [],
    nameFr: 'Isoeugénol',
    risk: 'warning',
    category: 'allergen',
    penalty: 15,
    reasonFr:
      'Allergène de parfum à taux de sensibilisation élevé, limité à 0,02 % en UE.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'alpha-isomethyl ionone',
    aliases: ['alpha isomethyl ionone'],
    nameFr: 'Alpha-isométhyl ionone',
    risk: 'warning',
    category: 'allergen',
    penalty: 10,
    reasonFr:
      'Allergène de parfum annexe III, obligation d\'affichage au-delà de 0,001 %.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'benzyl alcohol',
    aliases: [],
    nameFr: 'Alcool benzylique',
    risk: 'caution',
    category: 'preservative',
    penalty: 5,
    reasonFr:
      'Conservateur/solvant pouvant irritér et sensibiliser les peaux réactives.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_099.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'benzyl benzoate',
    aliases: [],
    nameFr: 'Benzoate de benzyle',
    risk: 'warning',
    category: 'allergen',
    penalty: 10,
    reasonFr:
      'Allergène de parfum annexe III, sensibilisant modéré selon le SCCS.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'farnesol',
    aliases: [],
    nameFr: 'Farnésol',
    risk: 'warning',
    category: 'allergen',
    penalty: 10,
    reasonFr:
      'Allergène de parfum annexe III, obligation d\'affichage.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_102.pdf',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'butylphenyl methylpropional',
    aliases: ['lilial'],
    nameFr: 'Lilial (butylphenyl methylpropional)',
    risk: 'danger',
    category: 'endocrine',
    penalty: 30,
    reasonFr:
      'Parfum classé CMR 1B, interdit en cosmétique UE depuis mars 2022.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_237.pdf',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker', peau_sensible: 'double' },
  },
  {
    inci: 'parfum',
    aliases: ['fragrance', 'perfume'],
    nameFr: 'Parfum (mélange non détaillé)',
    risk: 'caution',
    category: 'allergen',
    penalty: 5,
    reasonFr:
      'Mention générique regroupant jusqu\'à 200 molécules, dont des allergènes et phtalates possibles.',
    sourceUrl: 'https://www.60millions-mag.com/',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double', enceinte: 'double' },
  },

  // ==========================================================================
  // Silicones (caution, 3-8 pts)
  // ==========================================================================
  {
    inci: 'dimethicone',
    aliases: ['polydimethylsiloxane', 'pdms'],
    nameFr: 'Diméthicone',
    risk: 'caution',
    category: 'silicone',
    penalty: 5,
    reasonFr:
      'Silicone non biodégradable — forme un film occlusif qui peut asphyxier la peau à long terme.',
    sourceUrl: 'https://www.60millions-mag.com/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'dimethiconol',
    aliases: [],
    nameFr: 'Diméthiconol',
    risk: 'caution',
    category: 'silicone',
    penalty: 5,
    reasonFr:
      'Silicone non volatil, peu biodégradable, effet occlusif sur la peau et cheveux.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/702043-dimethiconol/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'amodimethicone',
    aliases: [],
    nameFr: 'Amodiméthicone',
    risk: 'caution',
    category: 'silicone',
    penalty: 4,
    reasonFr:
      'Silicone cationique persistant dans l\'environnement aquatique.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/700668-amodimethicone/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'phenyl trimethicone',
    aliases: [],
    nameFr: 'Phényl triméthicone',
    risk: 'caution',
    category: 'silicone',
    penalty: 5,
    reasonFr:
      'Silicone occlusif non biodégradable, souvent retrouvé dans les soins capillaires.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704825-phenyl-trimethicone/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'cetyl dimethicone',
    aliases: [],
    nameFr: 'Cétyl diméthicone',
    risk: 'caution',
    category: 'silicone',
    penalty: 3,
    reasonFr:
      'Silicone gras non volatil, effet filmogène et persistance environnementale.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701436-cetyl-dimethicone/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'stearyl dimethicone',
    aliases: [],
    nameFr: 'Stéaryl diméthicone',
    risk: 'caution',
    category: 'silicone',
    penalty: 3,
    reasonFr:
      'Silicone gras persistant, utilisé pour ses propriétés émollientes.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706480-stearyl-dimethicone/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'trisiloxane',
    aliases: [],
    nameFr: 'Trisiloxane',
    risk: 'caution',
    category: 'silicone',
    penalty: 6,
    reasonFr:
      'Silicone volatil de la famille des siloxanes, persistance environnementale.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706770-trisiloxane/',
    profilesExtraPenalty: {},
  },

  // ==========================================================================
  // Conservateurs douteux (warning, 10-15 pts)
  // ==========================================================================
  {
    inci: 'phenoxyethanol',
    aliases: [],
    nameFr: 'Phénoxyéthanol',
    risk: 'warning',
    category: 'preservative',
    penalty: 10,
    reasonFr:
      'Conservateur toxique hépatique à forte dose ; ANSM 2019 déconseille son usage chez les <3 ans sur siège.',
    sourceUrl:
      'https://ansm.sante.fr/actualites/phenoxyethanol-dans-les-produits-cosmetiques',
    profilesExtraPenalty: { bebe: 'blocker', enceinte: 'double' },
  },
  {
    inci: 'sodium benzoate',
    aliases: ['e211'],
    nameFr: 'Benzoate de sodium',
    risk: 'caution',
    category: 'preservative',
    penalty: 5,
    reasonFr:
      'Conservateur qui, combiné à l\'acide ascorbique (vitamine C), peut former du benzène cancérigène.',
    sourceUrl:
      'https://www.anses.fr/fr/content/benzoates-et-benzène',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'potassium sorbate',
    aliases: ['e202'],
    nameFr: 'Sorbate de potassium',
    risk: 'caution',
    category: 'preservative',
    penalty: 3,
    reasonFr:
      'Conservateur toléré mais légèrement irritant pour les peaux réactives.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/705273-potassium-sorbate/',
    profilesExtraPenalty: { peau_sensible: 'double' },
  },
  {
    inci: 'chlorphenesin',
    aliases: [],
    nameFr: 'Chlorphénésine',
    risk: 'warning',
    category: 'preservative',
    penalty: 12,
    reasonFr:
      'Conservateur qui peut causer des troubles neurologiques chez les nourrissons (ANSM).',
    sourceUrl:
      'https://ansm.sante.fr/actualites/chlorphenesine-dans-les-produits-cosmetiques',
    profilesExtraPenalty: { bebe: 'blocker', enceinte: 'double' },
  },
  {
    inci: 'iodopropynyl butylcarbamate',
    aliases: ['ipbc'],
    nameFr: 'Iodopropynyl butylcarbamate (IPBC)',
    risk: 'warning',
    category: 'preservative',
    penalty: 15,
    reasonFr:
      'Conservateur toxique pour la thyroïde à cause de sa teneur en iode, interdit chez <3 ans.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_072.pdf',
    profilesExtraPenalty: { bebe: 'blocker', enceinte: 'blocker' },
  },

  // ==========================================================================
  // Alcools desséchants (caution, 3-5 pts)
  // ==========================================================================
  {
    inci: 'alcohol denat',
    aliases: ['alcohol denatured', 'sd alcohol'],
    nameFr: 'Alcool dénaturé',
    risk: 'caution',
    category: 'irritant',
    penalty: 5,
    reasonFr:
      'Alcool asséchant qui altère la barrière cutanée, à éviter sur peau sensible.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/700511-alcohol-denat/',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'ethanol',
    aliases: ['alcohol', 'ethyl alcohol'],
    nameFr: 'Éthanol',
    risk: 'caution',
    category: 'irritant',
    penalty: 3,
    reasonFr:
      'Alcool solvant asséchant, irritant sur peau fragile à concentration élevée.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/702160-ethanol/',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },
  {
    inci: 'isopropyl alcohol',
    aliases: ['isopropanol'],
    nameFr: 'Alcool isopropylique',
    risk: 'caution',
    category: 'irritant',
    penalty: 4,
    reasonFr:
      'Alcool asséchant utilisé comme solvant, peut irriter les peaux sèches ou réactives.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/703083-isopropyl-alcohol/',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'double' },
  },

  // ==========================================================================
  // Pétrochimiques (caution, 5-10 pts)
  // ==========================================================================
  {
    inci: 'petrolatum',
    aliases: ['petroleum jelly', 'vaseline'],
    nameFr: 'Vaseline (pétrolatum)',
    risk: 'caution',
    category: 'other',
    penalty: 8,
    reasonFr:
      'Dérivé pétrolier occlusif, risque de contamination par des hydrocarbures aromatiques (MOAH) cancérigènes.',
    sourceUrl:
      'https://www.anses.fr/fr/content/saturated-mineral-oil-hydrocarbons-food',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'double' },
  },
  {
    inci: 'mineral oil',
    aliases: ['paraffinum liquidum'],
    nameFr: 'Huile minérale',
    risk: 'caution',
    category: 'other',
    penalty: 8,
    reasonFr:
      'Huile pétrochimique pouvant contenir des MOAH cancérigènes si non raffinée.',
    sourceUrl: 'https://www.anses.fr/fr/content/saturated-mineral-oil-hydrocarbons-food',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'double' },
  },
  {
    inci: 'paraffinum liquidum',
    aliases: ['liquid paraffin'],
    nameFr: 'Paraffine liquide',
    risk: 'caution',
    category: 'other',
    penalty: 8,
    reasonFr:
      'Huile minérale occlusive, contamination possible par hydrocarbures aromatiques (MOSH/MOAH).',
    sourceUrl: 'https://www.anses.fr/',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'double' },
  },
  {
    inci: 'paraffin',
    aliases: ['cera microcristallina', 'microcrystalline wax'],
    nameFr: 'Paraffine',
    risk: 'caution',
    category: 'other',
    penalty: 6,
    reasonFr:
      'Dérivé pétrolier pouvant contenir des MOSH/MOAH à risque cancérogène selon le raffinage.',
    sourceUrl: 'https://www.anses.fr/',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'double' },
  },
  {
    inci: 'ozokerite',
    aliases: [],
    nameFr: 'Ozokérite',
    risk: 'caution',
    category: 'other',
    penalty: 5,
    reasonFr:
      'Cire pétrochimique occlusive utilisée pour la texture, à éviter en usage prolongé.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704298-ozokerite/',
    profilesExtraPenalty: {},
  },

  // ==========================================================================
  // PEG / éthoxylés (caution, 3-8 pts)
  // ==========================================================================
  {
    inci: 'peg-40',
    aliases: ['peg 40', 'peg-40 hydrogenated castor oil'],
    nameFr: 'PEG-40',
    risk: 'caution',
    category: 'other',
    penalty: 6,
    reasonFr:
      'Éthoxylat pouvant contenir des résidus d\'oxyde d\'éthylène et 1,4-dioxane cancérigènes.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704549-peg-40-hydrogenated-castor-oil/',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'double' },
  },
  {
    inci: 'peg-100 stearate',
    aliases: ['peg 100 stearate'],
    nameFr: 'PEG-100 stéarate',
    risk: 'caution',
    category: 'other',
    penalty: 6,
    reasonFr:
      'Émulsifiant éthoxylé potentiellement contaminé par 1,4-dioxane (CIRC 2B).',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704600-peg-100-stearate/',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'double' },
  },
  {
    inci: 'ceteareth-20',
    aliases: ['ceteareth 20'],
    nameFr: 'Ceteareth-20',
    risk: 'caution',
    category: 'other',
    penalty: 5,
    reasonFr:
      'Émulsifiant éthoxylé à risque de contamination 1,4-dioxane.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701425-ceteareth-20/',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'double' },
  },
  {
    inci: 'laureth-7',
    aliases: ['laureth 7'],
    nameFr: 'Laureth-7',
    risk: 'caution',
    category: 'other',
    penalty: 5,
    reasonFr:
      'Tensioactif éthoxylé pouvant contenir des traces de 1,4-dioxane cancérigène.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/703250-laureth-7/',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'double' },
  },
  {
    inci: 'peg-8',
    aliases: ['peg 8'],
    nameFr: 'PEG-8',
    risk: 'caution',
    category: 'other',
    penalty: 4,
    reasonFr:
      'Polyéthylène glycol dont le procédé de fabrication peut laisser des résidus cancérigènes.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704624-peg-8/',
    profilesExtraPenalty: { enceinte: 'double', bebe: 'double' },
  },

  // ==========================================================================
  // Autres préoccupants
  // ==========================================================================
  {
    inci: 'edta',
    aliases: ['disodium edta', 'tetrasodium edta'],
    nameFr: 'EDTA',
    risk: 'caution',
    category: 'other',
    penalty: 3,
    reasonFr:
      'Chélateur non biodégradable, pollue durablement les milieux aquatiques.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701894-edta/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'titanium dioxide',
    aliases: ['ci 77891', 'titanium dioxide nano', 'nano titanium dioxide'],
    nameFr: 'Dioxyde de titane (nano)',
    risk: 'warning',
    category: 'other',
    penalty: 8,
    reasonFr:
      'Classé cancérigène respiratoire possible par l\'ECHA lorsqu\'inhalé — à éviter en sprays et poudres.',
    sourceUrl:
      'https://echa.europa.eu/fr/-/titanium-dioxide-classified-as-possibly-carcinogenic-when-inhaled',
    profilesExtraPenalty: { bebe: 'double', enceinte: 'double' },
  },
  {
    inci: 'aluminum chlorohydrate',
    aliases: ['aluminium chlorohydrate', 'aluminum chloride'],
    nameFr: 'Chlorhydrate d\'aluminium',
    risk: 'warning',
    category: 'other',
    penalty: 15,
    reasonFr:
      'Sel d\'aluminium des déodorants anti-transpirants, ANSM recommande d\'éviter sur peau lésée.',
    sourceUrl:
      'https://ansm.sante.fr/dossiers-thematiques/aluminium-dans-les-produits-cosmetiques',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'aluminum zirconium tetrachlorohydrex gly',
    aliases: [],
    nameFr: 'Aluminium zirconium tétrachlorohydrex',
    risk: 'warning',
    category: 'other',
    penalty: 15,
    reasonFr:
      'Sel d\'aluminium complexe des anti-transpirants ; suspicion d\'accumulation cutanée.',
    sourceUrl:
      'https://ansm.sante.fr/dossiers-thematiques/aluminium-dans-les-produits-cosmetiques',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'talc',
    aliases: [],
    nameFr: 'Talc',
    risk: 'caution',
    category: 'other',
    penalty: 3,
    reasonFr:
      'Poudre minérale pouvant être contaminée par des fibres d\'amiante, cancérigène lorsqu\'inhalée.',
    sourceUrl: 'https://www.anses.fr/fr/content/talc',
    profilesExtraPenalty: { bebe: 'double' },
  },
  {
    inci: 'lanolin',
    aliases: [],
    nameFr: 'Lanoline',
    risk: 'caution',
    category: 'allergen',
    penalty: 3,
    reasonFr:
      'Graisse de laine allergène de contact fréquent, potentiellement contaminée par des pesticides.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/703164-lanolin/',
    profilesExtraPenalty: { peau_sensible: 'double' },
  },
  {
    inci: 'toluene',
    aliases: [],
    nameFr: 'Toluène',
    risk: 'danger',
    category: 'other',
    penalty: 30,
    reasonFr:
      'Solvant neurotoxique et reprotoxique présent dans certains vernis, à proscrire chez la femme enceinte.',
    sourceUrl: 'https://www.anses.fr/fr/content/toluène',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'coal tar',
    aliases: ['ci 77266'],
    nameFr: 'Goudron de houille',
    risk: 'danger',
    category: 'other',
    penalty: 35,
    reasonFr:
      'Cancérigène avéré (CIRC 1), interdit en cosmétique UE mais encore présent dans quelques traitements capillaires.',
    sourceUrl: 'https://monographs.iarc.who.int/',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'hydroquinone',
    aliases: [],
    nameFr: 'Hydroquinone',
    risk: 'danger',
    category: 'other',
    penalty: 35,
    reasonFr:
      'Agent éclaircissant cytotoxique interdit en cosmétique UE (annexe II, entrée 1339).',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_122.pdf',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'mercury',
    aliases: ['thimerosal', 'phenylmercuric acetate'],
    nameFr: 'Mercure',
    risk: 'danger',
    category: 'other',
    penalty: 40,
    reasonFr:
      'Métal lourd neurotoxique et reprotoxique, interdit en cosmétique UE sauf dérogation précises.',
    sourceUrl: 'https://www.who.int/fr/news-room/fact-sheets/detail/mercury-and-health',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'lead acetate',
    aliases: [],
    nameFr: 'Acétate de plomb',
    risk: 'danger',
    category: 'other',
    penalty: 40,
    reasonFr:
      'Sel de plomb neurotoxique cancérigène, interdit en cosmétique UE.',
    sourceUrl: 'https://echa.europa.eu/substance-information/-/substanceinfo/100.010.580',
    profilesExtraPenalty: { enceinte: 'blocker', bebe: 'blocker' },
  },
  {
    inci: 'p-phenylenediamine',
    aliases: ['ppd'],
    nameFr: 'p-Phénylènediamine (PPD)',
    risk: 'warning',
    category: 'allergen',
    penalty: 18,
    reasonFr:
      'Colorant capillaire fortement sensibilisant, allergies sévères documentées par l\'ANSM.',
    sourceUrl: 'https://ansm.sante.fr/',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'blocker' },
  },
  {
    inci: 'toluene-2,5-diamine',
    aliases: [],
    nameFr: 'Toluène-2,5-diamine',
    risk: 'warning',
    category: 'allergen',
    penalty: 18,
    reasonFr:
      'Colorant de coloration capillaire fortement sensibilisant.',
    sourceUrl: 'https://ansm.sante.fr/',
    profilesExtraPenalty: { peau_sensible: 'double', bebe: 'blocker' },
  },

  // ==========================================================================
  // Ingrédients sûrs (0 pts)
  // ==========================================================================
  {
    inci: 'aqua',
    aliases: ['water', 'eau'],
    nameFr: 'Eau',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Eau purifiée, base de la majorité des cosmétiques — totalement inerte.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706110-water/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'glycerin',
    aliases: ['glycerol', 'glycérine'],
    nameFr: 'Glycérine',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr:
      'Humectant naturel très bien toléré, efficace pour hydrater toutes les peaux.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/702437-glycerin/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'tocopherol',
    aliases: ['vitamin e', 'tocophérol'],
    nameFr: 'Tocophérol (vitamine E)',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Antioxydant naturel puissant, protège les lipides cutanés.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706758-tocopherol/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'niacinamide',
    aliases: ['vitamin b3', 'nicotinamide'],
    nameFr: 'Niacinamide (vitamine B3)',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr:
      'Actif anti-inflammatoire, régule la production de sébum et renforce la barrière cutanée.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16029679/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'panthenol',
    aliases: ['d-panthenol', 'provitamin b5'],
    nameFr: 'Panthénol (provitamine B5)',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Apaisant et réparateur, sans risque documenté.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704525-panthenol/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'hyaluronic acid',
    aliases: ['sodium hyaluronate', 'acide hyaluronique'],
    nameFr: 'Acide hyaluronique',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Polysaccharide humectant naturel, hydratation sans risque.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704527-hyaluronic-acid/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'squalane',
    aliases: [],
    nameFr: 'Squalane',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Émollient proche du sébum humain, non comédogène et bien toléré.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706307-squalane/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'aloe barbadensis',
    aliases: ['aloe barbadensis leaf juice', 'aloe vera'],
    nameFr: 'Aloe vera',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Plante apaisante, hydratante et anti-inflammatoire.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/18612836/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'butyrospermum parkii',
    aliases: ['shea butter', 'beurre de karité'],
    nameFr: 'Beurre de karité',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Corps gras végétal nourrissant, riche en acides gras et vitamines.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706236-shea-butter/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'argania spinosa',
    aliases: ['argan oil', 'huile d\'argan'],
    nameFr: 'Huile d\'argan',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Huile végétale pressée à froid, riche en oméga 9 et vitamine E.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/700652-argania-spinosa/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'simmondsia chinensis',
    aliases: ['jojoba oil', 'huile de jojoba'],
    nameFr: 'Huile de jojoba',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Cire liquide végétale proche du sébum, non comédogène.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706234-simmondsia-chinensis/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'bisabolol',
    aliases: ['alpha-bisabolol'],
    nameFr: 'Bisabolol',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Actif apaisant issu de la camomille, bien toléré sur peaux sensibles.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/700833-bisabolol/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'allantoin',
    aliases: [],
    nameFr: 'Allantoïne',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Agent apaisant et kératolytique doux, sans effet indésirable notable.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/700526-allantoin/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'zinc oxide',
    aliases: ['ci 77947'],
    nameFr: 'Oxyde de zinc (non-nano)',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Filtre minéral UV non-nano bien toléré, recommandé pour les peaux sensibles.',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_177.pdf',
    profilesExtraPenalty: {},
  },
  {
    inci: 'xanthan gum',
    aliases: [],
    nameFr: 'Gomme xanthane',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Agent de texture d\'origine microbienne, sans risque.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/707022-xanthan-gum/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'cetearyl alcohol',
    aliases: [],
    nameFr: 'Alcool cétéarylique',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Alcool gras émulsifiant non desséchant (à ne pas confondre avec alcool denat).',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701425-cetearyl-alcohol/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'stearyl alcohol',
    aliases: [],
    nameFr: 'Alcool stéarylique',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Alcool gras émollient, émulsifiant bien toléré.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706483-stearyl-alcohol/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'cetyl alcohol',
    aliases: [],
    nameFr: 'Alcool cétylique',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Alcool gras d\'origine végétale, texturisant doux pour la peau.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701433-cetyl-alcohol/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'glyceryl stearate',
    aliases: [],
    nameFr: 'Stéarate de glycéryle',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Émulsifiant issu du glycérol, bien toléré.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/702454-glyceryl-stearate/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'sodium chloride',
    aliases: ['salt'],
    nameFr: 'Chlorure de sodium',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Sel marin utilisé comme épaississant, inerte.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706109-sodium-chloride/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'cocamidopropyl betaine',
    aliases: [],
    nameFr: 'Cocamidopropyl bétaïne',
    risk: 'caution',
    category: 'irritant',
    penalty: 3,
    reasonFr:
      'Tensioactif doux dérivé de la coco, parfois contaminé par l\'amidoamine (allergène).',
    sourceUrl:
      'https://ec.europa.eu/health/scientific_committees/consumer_safety/docs/sccs_o_171.pdf',
    profilesExtraPenalty: { peau_sensible: 'double' },
  },
  {
    inci: 'decyl glucoside',
    aliases: [],
    nameFr: 'Décyl glucoside',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Tensioactif doux d\'origine végétale, très bien toléré.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701875-decyl-glucoside/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'coco-glucoside',
    aliases: [],
    nameFr: 'Coco-glucoside',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Tensioactif doux biodégradable d\'origine sucre + coco.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701731-coco-glucoside/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'lauryl glucoside',
    aliases: [],
    nameFr: 'Lauryl glucoside',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Tensioactif doux non sulfaté, bien toléré.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/703256-lauryl-glucoside/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'citric acid',
    aliases: ['e330', 'acide citrique'],
    nameFr: 'Acide citrique',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Régulateur de pH naturel sans risque identifié.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701635-citric-acid/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'lactic acid',
    aliases: [],
    nameFr: 'Acide lactique',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'AHA doux régulateur de pH et exfoliant naturel.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/703143-lactic-acid/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'ascorbic acid',
    aliases: ['vitamin c', 'acide ascorbique'],
    nameFr: 'Vitamine C',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Antioxydant puissant ; attention à la combinaison avec benzoates (formation de benzène).',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/23175568/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'caprylic/capric triglyceride',
    aliases: ['caprylic capric triglyceride'],
    nameFr: 'Triglycérides caprylique/caprique',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Lipide issu de la noix de coco, émollient doux.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701336-caprylic-capric-triglyceride/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'helianthus annuus',
    aliases: ['sunflower seed oil', 'huile de tournesol'],
    nameFr: 'Huile de tournesol',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Huile végétale émolliente riche en vitamine E.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/702569-helianthus-annuus-sunflower-seed-oil/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'olea europaea',
    aliases: ['olive oil', 'huile d\'olive'],
    nameFr: 'Huile d\'olive',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Huile végétale émolliente riche en acides gras insaturés.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704382-olea-europaea-olive-fruit-oil/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'cocos nucifera',
    aliases: ['coconut oil', 'huile de coco'],
    nameFr: 'Huile de coco',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Huile végétale nourrissante, comédogène chez certains.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701739-coconut-oil/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'prunus amygdalus dulcis',
    aliases: ['sweet almond oil', 'huile d\'amande douce'],
    nameFr: 'Huile d\'amande douce',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Huile végétale émolliente douce, adaptée aux peaux sensibles.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/705125-prunus-amygdalus-dulcis-sweet-almond-oil/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'camellia sinensis',
    aliases: ['green tea extract'],
    nameFr: 'Extrait de thé vert',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Extrait végétal antioxydant riche en polyphénols.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701296-camellia-sinensis-leaf-extract/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'tocopheryl acetate',
    aliases: [],
    nameFr: 'Acétate de tocophérol',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Ester de vitamine E, antioxydant stable utilisé en cosmétique.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706760-tocopheryl-acetate/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'calcium pantothenate',
    aliases: [],
    nameFr: 'Pantothénate de calcium',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Sel de vitamine B5 apaisant, sans risque documenté.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/701285-calcium-pantothenate/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'stearic acid',
    aliases: [],
    nameFr: 'Acide stéarique',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Acide gras saturé d\'origine végétale, émulsifiant et émollient.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/706463-stearic-acid/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'kaolin',
    aliases: [],
    nameFr: 'Kaolin',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Argile blanche naturelle, absorbante et adoucissante.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/703124-kaolin/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'bentonite',
    aliases: [],
    nameFr: 'Bentonite',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Argile minérale absorbante utilisée comme agent de texture.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/700778-bentonite/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'mica',
    aliases: ['ci 77019'],
    nameFr: 'Mica',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Minéral nacré bien toléré, sans risque toxicologique.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/703642-mica/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'iron oxides',
    aliases: ['ci 77491', 'ci 77492', 'ci 77499'],
    nameFr: 'Oxydes de fer',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Colorants minéraux stables et inertes, tolérés par tous les types de peau.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/703107-iron-oxides/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'panthenyl ethyl ether',
    aliases: [],
    nameFr: 'Panthényl éthyl éther',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Dérivé de la vitamine B5, hydratant cutané et capillaire.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704529-panthenyl-ethyl-ether/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'polyglyceryl-3 polyricinoleate',
    aliases: [],
    nameFr: 'Polyglycéryl-3 polyricinoléate',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Émulsifiant végétal non ionique bien toléré.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/704975-polyglyceryl-3-polyricinoleate/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'rosa canina',
    aliases: ['rosehip oil', 'huile de rose musquée'],
    nameFr: 'Huile de rose musquée',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Huile végétale régénérante riche en acides gras essentiels.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/705772-rosa-canina/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'honey',
    aliases: ['mel', 'miel'],
    nameFr: 'Miel',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Humectant et antibactérien naturel issu des abeilles.',
    sourceUrl: 'https://www.ewg.org/skindeep/ingredients/703768-mel/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'beta-glucan',
    aliases: [],
    nameFr: 'Bêta-glucane',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Polysaccharide apaisant et immuno-modulateur d\'origine naturelle.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/19400721/',
    profilesExtraPenalty: {},
  },
  {
    inci: 'centella asiatica',
    aliases: ['gotu kola', 'cica'],
    nameFr: 'Centella asiatica',
    risk: 'safe',
    category: 'other',
    penalty: 0,
    reasonFr: 'Plante cicatrisante et apaisante, utilisée en dermatologie.',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/24459529/',
    profilesExtraPenalty: {},
  },
];

// Build lookup map for fast resolution
const COSMETIC_INGREDIENTS_MAP = new Map<string, CosmeticIngredientEntry>();
for (const entry of COSMETIC_INGREDIENTS) {
  COSMETIC_INGREDIENTS_MAP.set(entry.inci.toLowerCase(), entry);
  for (const alias of entry.aliases) {
    COSMETIC_INGREDIENTS_MAP.set(alias.toLowerCase(), entry);
  }
}

export function normalizeCosmeticToken(token: string): string {
  return token
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?\s]+$/g, '')
    .replace(/^[.,;:!?\s]+/g, '');
}

export function findCosmeticIngredient(token: string): CosmeticIngredientEntry | null {
  const norm = normalizeCosmeticToken(token);
  if (!norm) return null;
  return COSMETIC_INGREDIENTS_MAP.get(norm) ?? null;
}

export { COSMETIC_INGREDIENTS_MAP };
