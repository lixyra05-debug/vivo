import { PROTOCOLS, getProtocolById } from '../protocols';
import { PLANT_ENCYCLOPEDIA } from '../plant-encyclopedia';

describe('PROTOCOLS — Programmes 21 jours', () => {
  it('contient exactement 5 protocoles', () => {
    expect(PROTOCOLS.length).toBe(5);
    const ids = PROTOCOLS.map((p) => p.id).sort();
    expect(ids).toEqual(['digestion', 'energy', 'skin', 'sleep', 'stress']);
  });

  it('chaque protocole a exactement 21 jours uniques (1..21)', () => {
    for (const protocol of PROTOCOLS) {
      expect(protocol.days.length).toBe(21);
      expect(protocol.durationDays).toBe(21);
      const dayNumbers = protocol.days.map((d) => d.day).sort((a, b) => a - b);
      const expected = Array.from({ length: 21 }, (_, i) => i + 1);
      expect(dayNumbers).toEqual(expected);
    }
  });

  it('chaque ProtocolDay.plantId existe dans PLANT_ENCYCLOPEDIA', () => {
    const ids = new Set(PLANT_ENCYCLOPEDIA.map((p) => p.id));
    for (const protocol of PROTOCOLS) {
      for (const day of protocol.days) {
        if (!ids.has(day.plantId)) {
          throw new Error(
            `Protocol ${protocol.id} day ${day.day} référence plantId "${day.plantId}" inexistant dans PLANT_ENCYCLOPEDIA`,
          );
        }
        expect(ids.has(day.plantId)).toBe(true);
      }
    }
  });

  it('aucun recipeFr/tipFr vide ET aucun claim thérapeutique (R5)', () => {
    const FORBIDDEN = /soigne|guérit|guerit|traite |remplace|cure |médicament/i;
    for (const protocol of PROTOCOLS) {
      for (const day of protocol.days) {
        expect(day.recipeFr.trim().length).toBeGreaterThan(20);
        expect(day.tipFr.trim().length).toBeGreaterThan(15);
        if (FORBIDDEN.test(day.recipeFr)) {
          throw new Error(
            `Protocol ${protocol.id} day ${day.day} recipeFr contient un terme interdit R5: "${day.recipeFr}"`,
          );
        }
        if (FORBIDDEN.test(day.tipFr)) {
          throw new Error(
            `Protocol ${protocol.id} day ${day.day} tipFr contient un terme interdit R5: "${day.tipFr}"`,
          );
        }
        expect(day.recipeFr).not.toMatch(FORBIDDEN);
        expect(day.tipFr).not.toMatch(FORBIDDEN);
      }
    }
  });

  it("getProtocolById('sleep') retourne le protocole Sommeil", () => {
    const sleep = getProtocolById('sleep');
    expect(sleep).toBeDefined();
    expect(sleep?.id).toBe('sleep');
    expect(sleep?.emoji).toBe('😴');
    expect(sleep?.titleFr).toBe('Sommeil Naturel');
    expect(getProtocolById('inexistant')).toBeUndefined();
  });
});
