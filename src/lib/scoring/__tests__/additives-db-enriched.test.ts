import {
  ADDITIVES,
  AdditiveEntry,
  findAdditive,
} from '../additives-db';

function get(code: string): AdditiveEntry {
  const e = findAdditive(code);
  if (!e) throw new Error(`Additif ${code} introuvable dans additives-db.ts`);
  return e;
}

describe('additives-db — enrichissement EFSA/ANSES/IARC (Phase 4)', () => {
  describe('Aucune source ne cite Corinne Gouget', () => {
    it("aucune description ni scientificSources ne contient 'Gouget'", () => {
      for (const a of ADDITIVES) {
        const blob = [
          a.descriptionShortFr,
          a.descriptionDetailedFr ?? '',
          ...(a.scientificSources ?? []),
        ]
          .join(' ')
          .toLowerCase();
        expect(blob).not.toContain('gouget');
      }
    });
  });

  describe('E954 saccharine — rétrogradée IARC groupe 3 (1999)', () => {
    it('passe de high/40 à moderate/25', () => {
      const e = get('en:e954');
      expect(e.riskLevel).toBe('moderate');
      expect(e.penaltyPoints).toBe(25);
      expect(e.isBlocker).toBe(false);
    });

    it('cite IARC en source scientifique', () => {
      const e = get('en:e954');
      expect(e.scientificSources?.join(' ').toLowerCase()).toMatch(/iarc|monographs/);
    });
  });

  describe('Colorants ajoutés (E127, E131, E142, E161g, E173, E180)', () => {
    it('E127 érythrosine — DJA EFSA 2011 réduite, blocker enfant/enceinte', () => {
      const e = get('en:e127');
      expect(e.category).toBe('colorant');
      expect(e.riskLevel).toBe('high');
      expect(e.penaltyPoints).toBe(35);
      expect(e.profilesExtraPenalty.child).toBe('blocker');
      expect(e.profilesExtraPenalty.pregnant).toBe('blocker');
      expect(e.scientificSources?.join(' ')).toMatch(/efsa/i);
    });

    it('E131 bleu patenté V — moderate 25, blocker enfant', () => {
      const e = get('en:e131');
      expect(e.riskLevel).toBe('moderate');
      expect(e.penaltyPoints).toBe(25);
      expect(e.profilesExtraPenalty.child).toBe('blocker');
    });

    it('E142 vert acide brillant BS — moderate 20', () => {
      const e = get('en:e142');
      expect(e.riskLevel).toBe('moderate');
      expect(e.penaltyPoints).toBe(20);
    });

    it('E161g canthaxanthine — moderate 30 (DJA très basse EFSA 2010)', () => {
      const e = get('en:e161g');
      expect(e.riskLevel).toBe('moderate');
      expect(e.penaltyPoints).toBe(30);
    });

    it('E173 aluminium colorant — high 40, blocker enfant (DHTP EFSA 2008)', () => {
      const e = get('en:e173');
      expect(e.riskLevel).toBe('high');
      expect(e.penaltyPoints).toBe(40);
      expect(e.profilesExtraPenalty.child).toBe('blocker');
    });

    it('E180 litholrubine BK — moderate', () => {
      const e = get('en:e180');
      expect(e.riskLevel).toBe('moderate');
    });
  });

  describe('Conservateurs interdits ou retirés en UE → blockers', () => {
    it('E216 propylparabène — interdit alimentaire UE depuis 2006 → blocker', () => {
      const e = get('en:e216');
      expect(e.isBlocker).toBe(true);
      expect(e.riskLevel).toBe('blocker');
    });

    it('E217 sodium propylparabène — interdit UE 2006 → blocker', () => {
      const e = get('en:e217');
      expect(e.isBlocker).toBe(true);
    });

    it('E230 diphényle — retiré UE en 2014 → blocker', () => {
      const e = get('en:e230');
      expect(e.isBlocker).toBe(true);
    });

    it('E240 formaldéhyde — IARC groupe 1, interdit alimentaire UE → blocker', () => {
      const e = get('en:e240');
      expect(e.isBlocker).toBe(true);
      expect(e.scientificSources?.join(' ').toLowerCase()).toMatch(/iarc/);
    });
  });

  describe('Conservateurs autorisés mais à surveiller', () => {
    it('E210 acide benzoïque — moderate, mention benzène + vitamine C', () => {
      const e = get('en:e210');
      expect(e.riskLevel).toBe('moderate');
      const txt = (e.descriptionShortFr + (e.descriptionDetailedFr ?? '')).toLowerCase();
      expect(txt).toMatch(/benz[èe]ne|vitamine c/);
    });

    it('E211 benzoate de sodium — moderate 25, blocker enfant (Southampton)', () => {
      const e = get('en:e211');
      expect(e.riskLevel).toBe('moderate');
      expect(e.penaltyPoints).toBe(25);
      expect(e.profilesExtraPenalty.child).toBe('blocker');
    });

    it('E214 éthyl-parabène — high 35, blocker enceinte/enfant (PE potentiel)', () => {
      const e = get('en:e214');
      expect(e.riskLevel).toBe('high');
      expect(e.profilesExtraPenalty.pregnant).toBe('blocker');
      expect(e.profilesExtraPenalty.child).toBe('blocker');
    });

    it('E215 sodium éthylparabène — high', () => {
      const e = get('en:e215');
      expect(e.riskLevel).toBe('high');
    });
  });

  describe('Sulfites E220-E228 — allergène EU, asthme, blocker enfant', () => {
    const sulfites = ['e220', 'e221', 'e222', 'e223', 'e224', 'e226', 'e227', 'e228'];
    sulfites.forEach((code) => {
      it(`${code.toUpperCase()} → moderate 25, blocker enfant`, () => {
        const e = get(`en:${code}`);
        expect(e.category).toBe('conservateur');
        expect(e.riskLevel).toBe('moderate');
        expect(e.penaltyPoints).toBe(25);
        expect(e.profilesExtraPenalty.child).toBe('blocker');
      });
    });
  });

  describe('Antioxydants', () => {
    it('E310 gallate de propyle — high 35, blocker enceinte/enfant (DJA EFSA 2014)', () => {
      const e = get('en:e310');
      expect(e.riskLevel).toBe('high');
      expect(e.penaltyPoints).toBe(35);
      expect(e.profilesExtraPenalty.pregnant).toBe('blocker');
      expect(e.profilesExtraPenalty.child).toBe('blocker');
    });

    it('E320 BHA — high 40, IARC 2B + ANSES PE potentiel', () => {
      const e = get('en:e320');
      expect(e.riskLevel).toBe('high');
      expect(e.penaltyPoints).toBe(40);
      expect(e.profilesExtraPenalty.pregnant).toBe('blocker');
      expect(e.profilesExtraPenalty.child).toBe('blocker');
      expect(e.scientificSources?.join(' ').toLowerCase()).toMatch(/iarc/);
    });

    it('E321 BHT — moderate 25', () => {
      const e = get('en:e321');
      expect(e.riskLevel).toBe('moderate');
      expect(e.penaltyPoints).toBe(25);
    });
  });

  describe('Émulsifiants à risque microbiote', () => {
    it('E407 carraghénanes — moderate 20', () => {
      const e = get('en:e407');
      expect(e.category).toBe('emulsifiant');
      expect(e.riskLevel).toBe('moderate');
      expect(e.penaltyPoints).toBe(20);
    });

    it('E433 polysorbate 80 — moderate 20', () => {
      const e = get('en:e433');
      expect(e.riskLevel).toBe('moderate');
    });

    it('E466 CMC — moderate 20', () => {
      const e = get('en:e466');
      expect(e.riskLevel).toBe('moderate');
    });
  });

  describe('Aluminium alimentaire (DHTP EFSA dépassée chez enfants)', () => {
    it('E520 sulfate aluminium — high 35, blocker enfant', () => {
      const e = get('en:e520');
      expect(e.riskLevel).toBe('high');
      expect(e.penaltyPoints).toBe(35);
      expect(e.profilesExtraPenalty.child).toBe('blocker');
    });

    it('E541 phosphate aluminium acide — high 35, blocker enfant', () => {
      const e = get('en:e541');
      expect(e.riskLevel).toBe('high');
      expect(e.profilesExtraPenalty.child).toBe('blocker');
    });
  });

  describe('Nano et talc', () => {
    it('E551 dioxyde de silicium — moderate 20 (préoccupation nano EFSA 2018)', () => {
      const e = get('en:e551');
      expect(e.riskLevel).toBe('moderate');
      expect(e.penaltyPoints).toBe(20);
    });

    it('E553b talc — moderate 20 (IARC 2B talc périnée)', () => {
      const e = get('en:e553b');
      expect(e.riskLevel).toBe('moderate');
    });
  });

  describe('Exhausteurs cocktail E621', () => {
    it('E627 guanylate disodique — low 10', () => {
      const e = get('en:e627');
      expect(e.category).toBe('exhausteur');
      expect(e.riskLevel).toBe('low');
      expect(e.penaltyPoints).toBe(10);
    });

    it('E631 inosinate disodique — low 10', () => {
      const e = get('en:e631');
      expect(e.riskLevel).toBe('low');
      expect(e.penaltyPoints).toBe(10);
    });
  });

  describe('Édulcorant supplémentaire', () => {
    it('E952 cyclamate — moderate 25, blocker enceinte', () => {
      const e = get('en:e952');
      expect(e.category).toBe('edulcorant');
      expect(e.riskLevel).toBe('moderate');
      expect(e.penaltyPoints).toBe(25);
      expect(e.profilesExtraPenalty.pregnant).toBe('blocker');
    });
  });

  describe('Couverture totale', () => {
    it('la base contient au moins 55 additifs après enrichissement', () => {
      expect(ADDITIVES.length).toBeGreaterThanOrEqual(55);
    });

    it('chaque nouvel additif a au moins une scientificSource', () => {
      const newCodes = [
        'e127', 'e131', 'e142', 'e161g', 'e173', 'e180',
        'e210', 'e211', 'e214', 'e215', 'e216', 'e217',
        'e220', 'e221', 'e222', 'e223', 'e224', 'e226', 'e227', 'e228',
        'e230', 'e240', 'e310', 'e320', 'e321',
        'e407', 'e433', 'e466',
        'e520', 'e541', 'e551', 'e553b',
        'e627', 'e631', 'e952',
      ];
      for (const c of newCodes) {
        const e = get(`en:${c}`);
        expect(Array.isArray(e.scientificSources)).toBe(true);
        expect((e.scientificSources ?? []).length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
