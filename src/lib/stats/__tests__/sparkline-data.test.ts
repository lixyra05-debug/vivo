import { generateSparklinePoints, generateSparklineColor } from '@/src/lib/stats/sparkline-data';

describe('generateSparklinePoints', () => {
  it('avec 28 entrées et days=28, retourne les 28 valeurs intactes', () => {
    const data = Array.from({ length: 28 }, (_, i) => ({
      date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      avgScore: i + 1,
    }));

    const points = generateSparklinePoints(data, 28);

    expect(points).toHaveLength(28);
    expect(points).toEqual(data.map((d) => d.avgScore));
  });

  it('avec 5 entrées et days=10, retourne 10 valeurs avec 5 zéros au début (padding gauche)', () => {
    const data = [
      { date: '2026-04-20', avgScore: 50 },
      { date: '2026-04-21', avgScore: 60 },
      { date: '2026-04-22', avgScore: 70 },
      { date: '2026-04-23', avgScore: 40 },
      { date: '2026-04-24', avgScore: 80 },
    ];

    const points = generateSparklinePoints(data, 10);

    expect(points).toHaveLength(10);
    expect(points).toEqual([0, 0, 0, 0, 0, 50, 60, 70, 40, 80]);
  });
});

describe('generateSparklineColor', () => {
  it('trend > +3 retourne sage #8BAD8B', () => {
    expect(generateSparklineColor(5)).toBe('#8BAD8B');
    expect(generateSparklineColor(50)).toBe('#8BAD8B');
    expect(generateSparklineColor(3.1)).toBe('#8BAD8B');
  });

  it('trend < -3 retourne orange #FF9800, et trend dans [-3, +3] retourne terre #C4A882', () => {
    expect(generateSparklineColor(-10)).toBe('#FF9800');
    expect(generateSparklineColor(-3.1)).toBe('#FF9800');
    expect(generateSparklineColor(0)).toBe('#C4A882');
    expect(generateSparklineColor(3)).toBe('#C4A882');
    expect(generateSparklineColor(-3)).toBe('#C4A882');
    expect(generateSparklineColor(2)).toBe('#C4A882');
  });
});
