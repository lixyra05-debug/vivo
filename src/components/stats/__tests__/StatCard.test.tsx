import { render } from '@testing-library/react-native';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('affiche label uppercase et valeur', () => {
    const { getByText } = render(<StatCard label="Total scans" value={42} />);
    expect(getByText('TOTAL SCANS')).toBeTruthy();
    expect(getByText('42')).toBeTruthy();
  });

  it('affiche le delta positif avec "5"', () => {
    const { getByText } = render(
      <StatCard label="Score moyen" value={68} delta={5} />,
    );
    expect(getByText('5')).toBeTruthy();
  });
});
