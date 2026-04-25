import { render } from '@testing-library/react-native';
import { StreakCounter } from '../StreakCounter';

describe('StreakCounter', () => {
  it('mode complet streak=0 affiche le message d\'invitation et pas de chiffre', () => {
    const { getByText, queryByText } = render(<StreakCounter streak={0} />);
    expect(getByText('Scanne un produit pour lancer ton streak !')).toBeTruthy();
    expect(queryByText('0')).toBeNull();
  });

  it('mode complet streak=7 affiche le chiffre et le bon message', () => {
    const { getByText } = render(<StreakCounter streak={7} />);
    expect(getByText('7')).toBeTruthy();
    expect(getByText('1 semaine, impressionnant !')).toBeTruthy();
  });

  it('mode compact affiche "🔥 N" si streak>0 ; null si streak=0', () => {
    const { getByText } = render(<StreakCounter compact streak={3} />);
    expect(getByText('🔥 3')).toBeTruthy();

    const { queryByText } = render(<StreakCounter compact streak={0} />);
    expect(queryByText(/🔥/)).toBeNull();
  });
});
