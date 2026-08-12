import { verdictFromScore } from '../CosmeticResultView';

/**
 * Le verdict cosmétique portait des prescriptions (« À limiter », « On cherche
 * un remplaçant ») et des qualificatifs absolus (« Formule irréprochable »,
 * « globalement saine ») sur un score qui ne pèse que les ingrédients INCI
 * identifiés. Ces gardes portent sur les descriptions ; les libellés et les
 * seuils (90 / 70 / 50 / 30) sont l'échelle publique et restent figés.
 */
describe('verdictFromScore — le verdict cosmétique constate', () => {
  const TIERS = [95, 75, 55, 35, 10];

  const PRESCRIPTION =
    /\b(à limiter|limiter|à surveiller|surveiller|évitez|privilégi|remplaç|remplacer|bannir|appliquer)\b/i;

  const ABSOLU = /\b(irréprochables?|sains?|saines?|parfaites?|parfaits?|inoffensifs?|garantis?)\b|sans danger/i;

  it('les seuils et libellés sont inchangés', () => {
    expect(verdictFromScore(90).label).toBe('Excellent');
    expect(verdictFromScore(89).label).toBe('Bon');
    expect(verdictFromScore(70).label).toBe('Bon');
    expect(verdictFromScore(69).label).toBe('Moyen');
    expect(verdictFromScore(50).label).toBe('Moyen');
    expect(verdictFromScore(49).label).toBe('Mauvais');
    expect(verdictFromScore(30).label).toBe('Mauvais');
    expect(verdictFromScore(29).label).toBe('À éviter');
  });

  it("aucune description ne prescrit une conduite", () => {
    for (const score of TIERS) {
      const { description } = verdictFromScore(score);
      expect([score, PRESCRIPTION.test(description)]).toEqual([score, false]);
    }
  });

  it('aucune description ne qualifie la formule en absolu', () => {
    for (const score of TIERS) {
      const { description } = verdictFromScore(score);
      expect([score, ABSOLU.test(description)]).toEqual([score, false]);
    }
  });
});
