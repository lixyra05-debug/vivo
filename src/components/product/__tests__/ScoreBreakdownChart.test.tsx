import { render } from '@testing-library/react-native';
import { ScoreBreakdownChart } from '../ScoreBreakdownChart';
import type { PenaltyDetail } from '@/src/lib/api/types';

describe('ScoreBreakdownChart', () => {
  const penalties: PenaltyDetail[] = [
    { code: 'nova4', label: 'Ultra-transformé', points: 20, category: 'nova' },
    { code: 'e951', label: 'Aspartame', points: 15, category: 'additive' },
    { code: 'sugars', label: 'Sucres élevés', points: 8, category: 'macro' },
  ];

  it('affiche le titre et le sous-titre', () => {
    const { getByText } = render(
      <ScoreBreakdownChart penalties={penalties} finalScore={57} />,
    );
    expect(getByText('Décomposition du score')).toBeTruthy();
    expect(getByText('Où sont passés les points')).toBeTruthy();
  });

  it('affiche les labels des catégories actives', () => {
    const { getByText } = render(
      <ScoreBreakdownChart penalties={penalties} finalScore={57} />,
    );
    expect(getByText('NOVA')).toBeTruthy();
    expect(getByText('Additifs')).toBeTruthy();
    expect(getByText('Macros')).toBeTruthy();
  });

  it('retourne null si aucune pénalité active', () => {
    const { toJSON } = render(
      <ScoreBreakdownChart penalties={[]} finalScore={100} />,
    );
    expect(toJSON()).toBeNull();
  });
});
