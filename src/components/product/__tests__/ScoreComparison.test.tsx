import { render } from '@testing-library/react-native';
import { ScoreComparison } from '../ScoreComparison';

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

describe('ScoreComparison', () => {
  it('affiche le score clampé', () => {
    const { getByText } = render(<ScoreComparison score={72} />);
    expect(getByText('72')).toBeTruthy();
  });

  it('affiche les légendes Danger et Excellent', () => {
    const { getByText } = render(<ScoreComparison score={45} />);
    expect(getByText('Danger')).toBeTruthy();
    expect(getByText('Excellent')).toBeTruthy();
  });

  it('expose un accessibilityLabel descriptif', () => {
    const { getByLabelText } = render(<ScoreComparison score={30} />);
    expect(
      getByLabelText(/Score 30 sur 100.*échelle de qualité/),
    ).toBeTruthy();
  });
});
