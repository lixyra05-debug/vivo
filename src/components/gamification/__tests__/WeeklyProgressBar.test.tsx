import { render } from '@testing-library/react-native';
import { WeeklyProgressBar } from '../WeeklyProgressBar';

const days = (counts: number[]) =>
  counts.map((c, i) => ({ date: `2026-04-${10 + i}`, count: c, avgScore: 70 }));

describe('WeeklyProgressBar', () => {
  it('mode complet affiche le score moyen et le delta', () => {
    const { getByText } = render(
      <WeeklyProgressBar
        scansByDayLast7={days([2, 1, 0, 0, 1, 0, 0])}
        averageScore={68}
        deltaVsLastWeek={6}
      />,
    );
    expect(getByText(/Score moyen/)).toBeTruthy();
    expect(getByText('68', { exact: false })).toBeTruthy();
  });

  it('mode compact n\'affiche pas le score moyen', () => {
    const { queryByText } = render(
      <WeeklyProgressBar
        compact
        scansByDayLast7={days([1, 1, 1, 0, 0, 0, 0])}
        averageScore={72}
        deltaVsLastWeek={0}
      />,
    );
    expect(queryByText(/Score moyen/)).toBeNull();
  });
});
