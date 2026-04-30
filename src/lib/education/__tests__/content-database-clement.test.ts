import { EDUCATIONAL_CARDS } from '../content-database';

const CLEMENT_POSITIVE_IDS = [
  'thyme_respiratory',
  'ivy_cough',
  'peppermint_ibs_dyspepsia',
  'willow_aspirin_precursor',
  'horse_chestnut_venous',
  'red_vine_venous',
  'flaxseed_transit',
  'calendula_skin',
  'oat_betaglucan_cholesterol',
  'barley_betaglucan_cholesterol',
  'carrot_vitamin_a',
  'hops_sleep_nervosity',
  'chicory_inulin_transit',
  'anise_digestion_cough',
  'coriander_digestion',
  'caraway_bloating',
  'rosemary_digestion_joints',
  'plantain_throat_insectbites',
  'nettle_joints_urinary',
  'elderflower_cold',
  'mallow_mucous_irritation',
  'marshmallow_dry_cough',
  'dandelion_digestion_diuretic',
  'prunes_transit',
];

const CLEMENT_WARNING_IDS = [
  'sage_thujone_warning',
  'valerian_sleep_interactions',
  'fennel_estragole_warning',
  'juniper_kidney_warning',
  'melilot_anticoagulant_warning',
  'frangula_short_term_laxative',
  'rhubarb_root_short_term_laxative',
  'wormwood_thujone_warning',
  'burdock_diuretic',
  'borage_pa_warning',
];

const CLEMENT_ALL_IDS = [...CLEMENT_POSITIVE_IDS, ...CLEMENT_WARNING_IDS];

describe('Cartes éducatives Clément (34 nouvelles)', () => {
  describe('Positives & informatives (24)', () => {
    it('thyme_respiratory : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'thyme_respiratory');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Thym/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('ivy_cough : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'ivy_cough');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Lierre/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('peppermint_ibs_dyspepsia : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'peppermint_ibs_dyspepsia');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Menthe poivrée/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('willow_aspirin_precursor : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'willow_aspirin_precursor');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Saule/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('horse_chestnut_venous : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'horse_chestnut_venous');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Marronnier/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('red_vine_venous : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'red_vine_venous');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Vigne rouge/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('flaxseed_transit : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'flaxseed_transit');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/lin/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('calendula_skin : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'calendula_skin');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Calendula/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('oat_betaglucan_cholesterol : carte présente avec source UE 432/2012 valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'oat_betaglucan_cholesterol');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Avoine/i);
      expect(card?.source).toMatch(/Règlement UE|432\/2012/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('barley_betaglucan_cholesterol : carte présente avec source UE 432/2012 valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'barley_betaglucan_cholesterol');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Orge/i);
      expect(card?.source).toMatch(/Règlement UE|432\/2012/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('carrot_vitamin_a : carte présente avec source UE 432/2012 valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'carrot_vitamin_a');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Carotte/i);
      expect(card?.source).toMatch(/Règlement UE|432\/2012/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('hops_sleep_nervosity : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'hops_sleep_nervosity');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Houblon/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('positive');
    });

    it('chicory_inulin_transit : carte présente avec source EMA/EFSA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'chicory_inulin_transit');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Chicorée/i);
      expect(card?.source).toMatch(/EMA|HMPC|EFSA/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('anise_digestion_cough : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'anise_digestion_cough');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Anis/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('coriander_digestion : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'coriander_digestion');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Coriandre/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('caraway_bloating : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'caraway_bloating');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Carvi/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('rosemary_digestion_joints : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'rosemary_digestion_joints');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Romarin/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('plantain_throat_insectbites : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'plantain_throat_insectbites');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Plantain/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('nettle_joints_urinary : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'nettle_joints_urinary');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Ortie/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('elderflower_cold : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'elderflower_cold');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Sureau/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('mallow_mucous_irritation : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'mallow_mucous_irritation');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Mauve/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('marshmallow_dry_cough : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'marshmallow_dry_cough');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Guimauve/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('dandelion_digestion_diuretic : carte présente avec source EMA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'dandelion_digestion_diuretic');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Pissenlit/i);
      expect(card?.source).toMatch(/EMA|HMPC/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });

    it('prunes_transit : carte présente avec source EFSA valide', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'prunes_transit');
      expect(card).toBeDefined();
      expect(card?.titleFr).toMatch(/Pruneaux/i);
      expect(card?.source).toMatch(/EFSA/);
      expect(card?.sourceUrl).toMatch(/^https?:\/\//);
      expect(card?.tone).toBe('informative');
    });
  });

  describe('Warnings (10)', () => {
    it('sage_thujone_warning : carte warning présente avec contre-indications et thuyone', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'sage_thujone_warning');
      expect(card).toBeDefined();
      expect(card?.tone).toBe('warning');
      expect(card?.bodyFr).toMatch(/thuyone/i);
      expect(card?.bodyFr).toMatch(/grossesse|allaitement|épilepsie|<\d+ ans/i);
      expect(card?.source).toMatch(/EMA|EFSA|ANSES|Cochrane|OMS|PubMed/);
      expect(card?.sourceUrl).toMatch(
        /^https:\/\/(www\.)?(ema|efsa|anses|cochrane|who|ncbi|ansm)/i
      );
    });

    it('valerian_sleep_interactions : warning + interactions sédatifs', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'valerian_sleep_interactions');
      expect(card).toBeDefined();
      expect(card?.tone).toBe('warning');
      expect(card?.bodyFr).toMatch(/sédatif|hypnotique|anxiolytique|alcool|conducteur/i);
      expect(card?.bodyFr).toMatch(/grossesse|allaitement|<\d+ ans/i);
      expect(card?.source).toMatch(/EMA|EFSA|ANSES|Cochrane|OMS|PubMed/);
    });

    it('fennel_estragole_warning : warning + estragole + grossesse/allaitement/<4 ans', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'fennel_estragole_warning');
      expect(card).toBeDefined();
      expect(card?.tone).toBe('warning');
      expect(card?.bodyFr).toMatch(/estragole/i);
      expect(card?.bodyFr).toMatch(/grossesse|allaitement|<4 ans/i);
      expect(card?.source).toMatch(/EMA|EFSA|ANSES|Cochrane|OMS|PubMed/);
    });

    it('juniper_kidney_warning : warning + néphrotoxicité + durée limitée', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'juniper_kidney_warning');
      expect(card).toBeDefined();
      expect(card?.tone).toBe('warning');
      expect(card?.bodyFr).toMatch(/rénale?|néphro/i);
      expect(card?.bodyFr).toMatch(/grossesse|allaitement|<\d+ ans/i);
      expect(card?.source).toMatch(/EMA|EFSA|ANSES|Cochrane|OMS|PubMed/);
    });

    it('melilot_anticoagulant_warning : warning + interactions anticoagulants/coumarine', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'melilot_anticoagulant_warning');
      expect(card).toBeDefined();
      expect(card?.tone).toBe('warning');
      expect(card?.bodyFr).toMatch(/anticoagulant|coumarine|warfarine|AVK/i);
      expect(card?.bodyFr).toMatch(/grossesse|allaitement|<\d+ ans/i);
      expect(card?.source).toMatch(/EMA|EFSA|ANSES|Cochrane|OMS|PubMed/);
    });

    it('frangula_short_term_laxative : warning + court terme + contre-indications', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'frangula_short_term_laxative');
      expect(card).toBeDefined();
      expect(card?.tone).toBe('warning');
      expect(card?.bodyFr).toMatch(/1\s?(à|-)?\s?2 semaines|court terme|électrolytique|dépendance/i);
      expect(card?.bodyFr).toMatch(/grossesse|allaitement|<\d+ ans/i);
      expect(card?.source).toMatch(/EMA|EFSA|ANSES|Cochrane|OMS|PubMed/);
    });

    it('rhubarb_root_short_term_laxative : warning + oxalates + court terme', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'rhubarb_root_short_term_laxative');
      expect(card).toBeDefined();
      expect(card?.tone).toBe('warning');
      expect(card?.bodyFr).toMatch(/oxalate|électrolytique|dépendance|1\s?-?\s?2 semaines/i);
      expect(card?.bodyFr).toMatch(/grossesse|allaitement|<\d+ ans/i);
      expect(card?.source).toMatch(/EMA|EFSA|ANSES|Cochrane|OMS|PubMed/);
    });

    it('wormwood_thujone_warning : warning + thuyone + épilepsie', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'wormwood_thujone_warning');
      expect(card).toBeDefined();
      expect(card?.tone).toBe('warning');
      expect(card?.bodyFr).toMatch(/thuyone|neurotoxique/i);
      expect(card?.bodyFr).toMatch(/grossesse|allaitement|épilepsie|<\d+ ans/i);
      expect(card?.source).toMatch(/EMA|EFSA|ANSES|Cochrane|OMS|PubMed/);
    });

    it('burdock_diuretic : warning + diurétique EMA validé + dermato NON validé', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'burdock_diuretic');
      expect(card).toBeDefined();
      expect(card?.tone).toBe('warning');
      // Disclaimer dermato : usage cutané non validé EMA
      expect(card?.bodyFr).toMatch(/(acné|dartres|dermato).*(pas|non).*validé/i);
      expect(card?.bodyFr).toMatch(/diurétique/i);
      expect(card?.bodyFr).toMatch(/Astéracées|hypoglycémi|grossesse|<\d+ ans/i);
      expect(card?.source).toMatch(/EMA|EFSA|ANSES|Cochrane|OMS|PubMed/);
    });

    it('borage_pa_warning : warning + alcaloïdes pyrrolizidiniques + hépatotoxique', () => {
      const card = EDUCATIONAL_CARDS.find((c) => c.id === 'borage_pa_warning');
      expect(card).toBeDefined();
      expect(card?.tone).toBe('warning');
      expect(card?.bodyFr).toMatch(/alcaloïdes pyrrolizidiniques|hépatotoxique|hépatique/i);
      expect(card?.bodyFr).toMatch(/grossesse|allaitement|<\d+ ans/i);
      expect(card?.source).toMatch(/EMA|EFSA|ANSES|Cochrane|OMS|PubMed/);
    });
  });

  describe('Garde-fous globaux Clément', () => {
    it('aucune carte nouvelle ne mentionne "Jules Clément" ou "La Santé par les Plantes"', () => {
      const newCards = EDUCATIONAL_CARDS.filter((c) => CLEMENT_ALL_IDS.includes(c.id));
      expect(newCards.length).toBe(34);
      newCards.forEach((card) => {
        const text =
          `${card.titleFr} ${card.bodyFr} ${card.source} ${card.sourceUrl}`.toLowerCase();
        expect(text).not.toMatch(/jules\s*cl[ée]ment/);
        expect(text).not.toMatch(/sant[ée]\s+par\s+les\s+plantes/);
      });
    });

    it('toutes les nouvelles cartes citent une source officielle (EMA, HMPC, EFSA, Cochrane, ANSES, OMS, PubMed, Règlement UE)', () => {
      const newCards = EDUCATIONAL_CARDS.filter((c) => CLEMENT_ALL_IDS.includes(c.id));
      expect(newCards.length).toBe(34);
      newCards.forEach((card) => {
        expect(card.source).toMatch(/EMA|HMPC|EFSA|Cochrane|ANSES|OMS|WHO|PubMed|Règlement UE/i);
      });
    });

    it('toutes les nouvelles cartes ont une sourceUrl HTTPS valide', () => {
      const newCards = EDUCATIONAL_CARDS.filter((c) => CLEMENT_ALL_IDS.includes(c.id));
      expect(newCards.length).toBe(34);
      newCards.forEach((card) => {
        expect(card.sourceUrl).toMatch(/^https:\/\//);
      });
    });

    it('toutes les 10 cartes Clément warnings ont une URL EMA/EFSA/ANSES officielle', () => {
      const cards = EDUCATIONAL_CARDS.filter((c) => CLEMENT_WARNING_IDS.includes(c.id));
      expect(cards).toHaveLength(10);
      for (const card of cards) {
        expect(card.sourceUrl).toMatch(
          /^https:\/\/(www\.)?(ema|efsa|anses)\.europa\.eu|^https:\/\/(www\.)?(ema|efsa|anses)\./i
        );
        expect(card.tone).toBe('warning');
        expect(card.trigger.type).toBe('ingredient');
      }
    });
  });
});
