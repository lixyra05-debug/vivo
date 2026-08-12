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

  it('mode compact affiche le chiffre si streak>0 ; null si streak=0', () => {
    // L'emoji 🔥 du mode compact est passé en icône lucide (R4) : le pill ne
    // porte plus que le chiffre, l'étiquette a11y restant la source de sens.
    const { getByText, getByLabelText } = render(<StreakCounter compact streak={3} />);
    expect(getByText('3')).toBeTruthy();
    expect(getByLabelText('Streak de 3 jours')).toBeTruthy();

    const { toJSON } = render(<StreakCounter compact streak={0} />);
    expect(toJSON()).toBeNull();
  });
});
