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

  it('les jours 3, 11 et 17 du protocole Peau servent la mauve (usage interne documenté)', () => {
    const skin = getProtocolById('skin')!;
    const day3 = skin.days.find((d) => d.day === 3)!;
    const day11 = skin.days.find((d) => d.day === 11)!;
    const day17 = skin.days.find((d) => d.day === 17)!;
    expect(day3.plantId).toBe('mallow');
    expect(day11.plantId).toBe('mallow');
    expect(day17.plantId).toBe('mallow');
    // Fidélité à la fiche mauve : mucilages → infusion TIÈDE, pas d'eau
    // bouillante ; le jour 11 emploie l'autre route documentée par la fiche,
    // la macération à froid.
    expect(day3.recipeFr).toMatch(/tiède|70\s?°C/i);
    expect(day11.recipeFr).toMatch(/macération à froid/i);
    expect(day17.recipeFr).toMatch(/70\s?°C/i);
  });

  /**
   * VERROU SANTÉ GÉNÉRAL — aucun protocole ne sert par voie buvable une
   * plante dont la fiche encyclopédie déconseille la voie orale. Deux cas en
   * deux jours (bourrache, aloès) : ce verrou couvre TOUTES les plantes, pas
   * la dernière tombée.
   *
   * Critère « fiche déconseille la voie orale » : /voie orale[^.]*(déconseillée|
   * non recommandée)/i sur `preparation` + `contraindications`. Calibré sur
   * les 40 fiches : attrape aloe_vera (:535, :537) et witch_hazel (:557) ;
   * exclut à raison calendula (« Voie orale possible », :474) et la lavande
   * (:188 — « strictement encadrée » vise la forme huile essentielle, la
   * fiche documente l'infusion). L'ancre ci-dessous fige ce calibrage : si
   * elle tombe après l'ajout d'une fiche, vérifier chaque usage de la
   * nouvelle plante AVANT d'ajuster quoi que ce soit.
   *
   * Critère « recette buvable » (repris du verrou bourrache, documenté) :
   * explicitement bue (boire|boisson|smoothie|jus) OU forme infusée
   * (infusion|tisane|décoction|macération) sans marqueur externe
   * (appliqu|compresse|externe|rincer|vapeur|lotion|sur peau).
   * LIMITES ASSUMÉES : « avaler », « consommer », ou une huile essentielle
   * prise par voie orale passeraient sous le radar — aucune recette actuelle
   * n'emploie ces formes (seule huile essentielle du fichier : en diffusion,
   * protocole stress). Élargir le critère exigera un recalibrage documenté,
   * pas un patch aveugle.
   */
  const ORAL_DISCOURAGED = /voie orale[^.]*(déconseillée|non recommandée)/i;
  function oralDiscouragedIds(): string[] {
    return PLANT_ENCYCLOPEDIA.filter(
      (p) =>
        ORAL_DISCOURAGED.test(p.preparation) ||
        ORAL_DISCOURAGED.test(p.contraindications),
    ).map((p) => p.id);
  }

  const DRINKABLE_EXPLICIT = /\bboire\b|boisson|smoothie|\bjus\b/i;
  const INFUSION_LIKE = /infusion|tisane|décoction|macération/i;
  const EXTERNAL_MARKERS = /appliqu|compresse|externe|rincer|vapeur|lotion|sur peau/i;
  function isDrinkable(recipe: string): boolean {
    return (
      DRINKABLE_EXPLICIT.test(recipe) ||
      (INFUSION_LIKE.test(recipe) && !EXTERNAL_MARKERS.test(recipe))
    );
  }

  it("le prédicat fiche est calibré : exactement aloe_vera et witch_hazel aujourd'hui", () => {
    expect(oralDiscouragedIds().sort()).toEqual(['aloe_vera', 'witch_hazel']);
  });

  it('aucune recette buvable ne sert une plante dont la fiche déconseille la voie orale', () => {
    const flagged = new Set(oralDiscouragedIds());
    const offenders: string[] = [];
    for (const protocol of PROTOCOLS) {
      for (const d of protocol.days) {
        if (flagged.has(d.plantId) && isDrinkable(d.recipeFr)) {
          offenders.push(`${protocol.id} jour ${d.day} (${d.plantId}) : ${d.recipeFr}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
