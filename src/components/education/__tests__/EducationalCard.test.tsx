import { fireEvent, render } from '@testing-library/react-native';
import { EducationalCard } from '../EducationalCard';
import type { EducationalCard as EducationalCardData } from '@/src/lib/gamification/types';

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve()),
}));

const positiveCard: EducationalCardData = {
  id: 'positive-card',
  trigger: { type: 'score', min: 90 },
  titleFr: 'Excellent choix !',
  bodyFr: 'Body texte ici expliquant pourquoi ce produit est top.',
  source: 'Vivo',
  sourceUrl: 'https://www.vivo-app.fr',
  tone: 'positive',
};

describe('EducationalCard', () => {
  it('affiche titre, body et source', () => {
    const { getByText } = render(<EducationalCard card={positiveCard} />);
    expect(getByText('Excellent choix !')).toBeTruthy();
    expect(
      getByText('Body texte ici expliquant pourquoi ce produit est top.'),
    ).toBeTruthy();
    expect(getByText('Source : Vivo')).toBeTruthy();
  });

  it('appelle onDismiss au tap sur le bouton ×', () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = render(
      <EducationalCard card={positiveCard} onDismiss={onDismiss} />,
    );
    fireEvent.press(getByLabelText('Fermer cette carte'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('appelle onSourcePress avec sourceUrl au tap sur la source', () => {
    const onSourcePress = jest.fn();
    const { getByText } = render(
      <EducationalCard card={positiveCard} onSourcePress={onSourcePress} />,
    );
    fireEvent.press(getByText('Source : Vivo'));
    expect(onSourcePress).toHaveBeenCalledWith('https://www.vivo-app.fr');
  });
});
