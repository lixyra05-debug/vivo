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

  /**
   * VERROU SANTÉ — bloquant 5 de l'audit. La base de l'app déclare les
   * parties aériennes de bourrache impropres à la consommation interne
   * (alcaloïdes pyrrolizidiniques hépatotoxiques — fiche `borage`, carte
   * `borage_pa_warning`, EFSA pub/4908). Seule l'huile de graines en capsule
   * (jour 10, cycle 2) peut être servie ; les anciens jours d'infusion (3 et
   * 17) sont tenus par la mauve — seule fiche de la base sans
   * contre-indication documentée, usage interne documenté (infusion tiède).
   */
  it("la bourrache n'est jamais servie par voie buvable (EFSA pub/4908)", () => {
    const skin = getProtocolById('skin');
    expect(skin).toBeDefined();
    const borageDays = skin!.days.filter((d) => d.plantId === 'borage');
    expect(borageDays.map((d) => d.day)).toEqual([10]);
    for (const d of borageDays) {
      expect(d.recipeFr).toMatch(/capsule/i);
      expect(d.recipeFr).not.toMatch(/infusion|tisane|décoction|à boire|boire/i);
    }
  });

  it('les jours 3 et 17 du protocole Peau servent la mauve (usage interne documenté)', () => {
    const skin = getProtocolById('skin')!;
    const day3 = skin.days.find((d) => d.day === 3)!;
    const day17 = skin.days.find((d) => d.day === 17)!;
    expect(day3.plantId).toBe('mallow');
    expect(day17.plantId).toBe('mallow');
    // Fidélité à la fiche mauve : mucilages → infusion TIÈDE, pas d'eau bouillante.
    expect(day3.recipeFr).toMatch(/tiède|70\s?°C/i);
    expect(day17.recipeFr).toMatch(/70\s?°C/i);
  });
});
