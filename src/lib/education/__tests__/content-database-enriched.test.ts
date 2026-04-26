/**
 * Tests d'enrichissement — 9 nouvelles cartes éducatives ajoutées après lecture
 * du livre "Le médecin des pauvres" (Beauvillard, 1912). Toutes les sources
 * citées sont modernes et officielles (Cochrane, EFSA, ANSES, ANSM, EMA, OMS).
 *
 * Garde-fou : aucune carte ne doit citer Beauvillard ni l'ouvrage source.
 */

import {
  EDUCATIONAL_CARDS,
  findRelevantCards,
} from '../content-database';
import type { EducationalCard } from '../../gamification/types';

const NEW_CARD_IDS = [
  'garlic_cardio',
  'cruciferous',
  'berries_antioxidant',
  'calming_herbs',
  'honey_infant_warning',
  'licorice_bp',
  'st_johns_wort_interactions',
  'wild_mushrooms',
  'ultra_processed_risk',
] as const;

const ALLOWED_SOURCES = [
  'Cochrane',
  'EFSA',
  'ANSES',
  'ANSM',
  'EMA',
  'OMS',
  'Monteiro 2019',
];

function getCard(id: string): EducationalCard {
  const card = EDUCATIONAL_CARDS.find((c) => c.id === id);
  if (!card) throw new Error(`Carte ${id} introuvable`);
  return card;
}

describe('content-database — enrichissement (Phase 5)', () => {
  describe('Garde-fou anti-Beauvillard', () => {
    it("aucune carte ne mentionne Beauvillard ou 'médecin des pauvres'", () => {
      for (const card of EDUCATIONAL_CARDS) {
        const blob = (
          card.titleFr +
          ' ' +
          card.bodyFr +
          ' ' +
          card.source +
          ' ' +
          card.sourceUrl
        ).toLowerCase();
        expect(blob).not.toContain('beauvillard');
        expect(blob).not.toContain('médecin des pauvres');
        expect(blob).not.toContain('medecin des pauvres');
      }
    });
  });

  describe('Cartes positives — ingrédients bénéfiques', () => {
    it('garlic_cardio — ail, ton positive, source Cochrane', () => {
      const c = getCard('garlic_cardio');
      expect(c.tone).toBe('positive');
      expect(c.source).toBe('Cochrane');
      expect(c.trigger.type).toBe('ingredient');
      if (c.trigger.type === 'ingredient') {
        expect(c.trigger.keywords).toEqual(
          expect.arrayContaining(['ail']),
        );
      }
    });

    it('cruciferous — brocoli/chou/cresson, ton positive, source EFSA', () => {
      const c = getCard('cruciferous');
      expect(c.tone).toBe('positive');
      expect(c.source).toBe('EFSA');
      if (c.trigger.type === 'ingredient') {
        expect(c.trigger.keywords).toEqual(
          expect.arrayContaining(['brocoli', 'chou', 'cresson']),
        );
      }
    });

    it('berries_antioxidant — myrtille/cassis/fraise, ton positive, source EFSA', () => {
      const c = getCard('berries_antioxidant');
      expect(c.tone).toBe('positive');
      expect(c.source).toBe('EFSA');
      if (c.trigger.type === 'ingredient') {
        expect(c.trigger.keywords).toEqual(
          expect.arrayContaining(['myrtille', 'cassis', 'fraise']),
        );
      }
    });

    it('calming_herbs — camomille/tilleul/mélisse, ton positive, source EMA', () => {
      const c = getCard('calming_herbs');
      expect(c.tone).toBe('positive');
      expect(c.source).toBe('EMA');
      if (c.trigger.type === 'ingredient') {
        expect(c.trigger.keywords).toEqual(
          expect.arrayContaining(['camomille', 'tilleul', 'mélisse']),
        );
      }
    });
  });

  describe('Cartes warning — mises en garde', () => {
    it('honey_infant_warning — miel, ton warning, mention botulisme < 1 an', () => {
      const c = getCard('honey_infant_warning');
      expect(c.tone).toBe('warning');
      expect(c.source).toBe('Cochrane');
      const txt = (c.titleFr + c.bodyFr).toLowerCase();
      expect(txt).toMatch(/botulisme/);
      expect(txt).toMatch(/1 an|<1 an|moins d'un an|nourrisson/);
      if (c.trigger.type === 'ingredient') {
        expect(c.trigger.keywords).toEqual(expect.arrayContaining(['miel']));
      }
    });

    it('licorice_bp — réglisse, ton warning, source EFSA, hypertension', () => {
      const c = getCard('licorice_bp');
      expect(c.tone).toBe('warning');
      expect(c.source).toBe('EFSA');
      const txt = (c.titleFr + c.bodyFr).toLowerCase();
      expect(txt).toMatch(/hypertension|tension/);
      expect(txt).toMatch(/glycyrrhizine|glycyrrhizinique/);
      if (c.trigger.type === 'ingredient') {
        expect(c.trigger.keywords).toEqual(
          expect.arrayContaining(['réglisse', 'glycyrrhizine']),
        );
      }
    });

    it('st_johns_wort_interactions — mille-pertuis, ton warning, source ANSM', () => {
      const c = getCard('st_johns_wort_interactions');
      expect(c.tone).toBe('warning');
      expect(c.source).toBe('ANSM');
      const txt = (c.titleFr + c.bodyFr).toLowerCase();
      expect(txt).toMatch(/interaction/);
      if (c.trigger.type === 'ingredient') {
        expect(c.trigger.keywords).toEqual(
          expect.arrayContaining(['mille-pertuis', 'millepertuis']),
        );
      }
    });

    it('wild_mushrooms — champignons sauvages, ton warning, source ANSES', () => {
      const c = getCard('wild_mushrooms');
      expect(c.tone).toBe('warning');
      expect(c.source).toBe('ANSES');
      const txt = (c.titleFr + c.bodyFr).toLowerCase();
      expect(txt).toMatch(/intoxication|empoisonnement/);
      if (c.trigger.type === 'ingredient') {
        expect(c.trigger.keywords).toEqual(
          expect.arrayContaining(['cèpe', 'girolle']),
        );
      }
    });

    it('ultra_processed_risk — NOVA 4, ton warning, source ANSES', () => {
      const c = getCard('ultra_processed_risk');
      expect(c.tone).toBe('warning');
      expect(c.source).toBe('ANSES');
      const txt = (c.titleFr + c.bodyFr).toLowerCase();
      expect(txt).toMatch(/ultra.?transform/);
      if (c.trigger.type === 'ingredient') {
        expect(c.trigger.keywords).toEqual(
          expect.arrayContaining(['ultra-transformé']),
        );
      }
    });
  });

  describe('Sources et URL', () => {
    it.each(NEW_CARD_IDS)('%s : source dans la liste autorisée', (id) => {
      const c = getCard(id);
      expect(ALLOWED_SOURCES).toContain(c.source);
    });

    it.each(NEW_CARD_IDS)('%s : sourceUrl https valide', (id) => {
      const c = getCard(id);
      expect(c.sourceUrl).toMatch(/^https:\/\/[a-z0-9.\-]+\.[a-z]{2,}/i);
    });

    it.each(NEW_CARD_IDS)('%s : titleFr et bodyFr non vides, body ≤ 320', (id) => {
      const c = getCard(id);
      expect(c.titleFr.length).toBeGreaterThan(0);
      expect(c.bodyFr.length).toBeGreaterThan(0);
      expect(c.bodyFr.length).toBeLessThanOrEqual(320);
    });
  });

  describe('Intégration findRelevantCards', () => {
    it("produit avec 'réglisse' → licorice_bp matche en premier (warning)", () => {
      const cards = findRelevantCards(
        {
          additives_tags: [],
          ingredients_raw: 'sucre, extrait de réglisse, arômes',
          ingredients_inci: null,
          category_slug: 'confiseries',
        },
        { score_final: 50 },
        2,
      );
      expect(cards.map((c) => c.id)).toContain('licorice_bp');
      expect(cards[0].id).toBe('licorice_bp');
    });

    it("produit avec 'miel' → honey_infant_warning matche", () => {
      const cards = findRelevantCards(
        {
          additives_tags: [],
          ingredients_raw: 'miel de fleurs, gelée royale',
          ingredients_inci: null,
          category_slug: 'miels',
        },
        { score_final: 75 },
        3,
      );
      expect(cards.map((c) => c.id)).toContain('honey_infant_warning');
    });

    it('Nutella-like NOVA 4 → ultra_processed_risk peut matcher', () => {
      const cards = findRelevantCards(
        {
          additives_tags: ['en:e322'],
          ingredients_raw:
            'sucre, huile de palme, ultra-transformé, lécithine de soja',
          ingredients_inci: null,
          category_slug: 'pates-a-tartiner',
        },
        { score_final: 25 },
        4,
      );
      expect(cards.map((c) => c.id)).toContain('ultra_processed_risk');
    });
  });

  describe('Couverture totale', () => {
    it('catalogue ≥ 31 cartes après enrichissement', () => {
      expect(EDUCATIONAL_CARDS.length).toBeGreaterThanOrEqual(31);
    });

    it('les 9 nouvelles cartes sont toutes présentes', () => {
      for (const id of NEW_CARD_IDS) {
        expect(EDUCATIONAL_CARDS.find((c) => c.id === id)).toBeDefined();
      }
    });
  });
});
