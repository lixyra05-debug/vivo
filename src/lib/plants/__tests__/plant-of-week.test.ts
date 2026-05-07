import { getPlantOfWeek } from '../plant-of-week';
import { PLANT_ENCYCLOPEDIA } from '@/src/data/plant-encyclopedia';

describe('plant-of-week', () => {
  it('retourne une PlantEntry valide de PLANT_ENCYCLOPEDIA', () => {
    const plant = getPlantOfWeek(new Date('2026-05-07T12:00:00Z'));
    expect(plant).toBeDefined();
    expect(PLANT_ENCYCLOPEDIA.some((p) => p.id === plant.id)).toBe(true);
  });

  it('retourne la même plante pour 7 jours consécutifs (déterminisme)', () => {
    // 1er janvier 2026 = jeudi. Du jeudi 1er au mercredi 7 → même weekIndex (0 à 6 / 7 = 0).
    const days = [
      new Date('2026-01-01T08:00:00Z'),
      new Date('2026-01-02T08:00:00Z'),
      new Date('2026-01-03T08:00:00Z'),
      new Date('2026-01-04T08:00:00Z'),
      new Date('2026-01-05T08:00:00Z'),
      new Date('2026-01-06T08:00:00Z'),
      new Date('2026-01-07T08:00:00Z'),
    ];
    const ids = days.map((d) => getPlantOfWeek(d).id);
    expect(new Set(ids).size).toBe(1);

    // Le 8 janvier doit changer (weekIndex passe de 0 à 1).
    const day8 = getPlantOfWeek(new Date('2026-01-08T08:00:00Z'));
    expect(day8.id).not.toBe(ids[0]);
  });
});
