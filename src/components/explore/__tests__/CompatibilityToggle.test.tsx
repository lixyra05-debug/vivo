import { fireEvent, render } from '@testing-library/react-native';
import { CompatibilityToggle } from '../CompatibilityToggle';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('CompatibilityToggle', () => {
  it('affiche les deux pills "Tous les produits" et "Mon profil"', () => {
    const { getByText } = render(
      <CompatibilityToggle mode="all" onChange={() => {}} />,
    );
    expect(getByText('Tous les produits')).toBeTruthy();
    expect(getByText('Mon profil')).toBeTruthy();
  });

  it('appelle onChange quand on tape sur l\'autre pill', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <CompatibilityToggle mode="all" onChange={onChange} />,
    );
    fireEvent.press(
      getByLabelText('Afficher uniquement les produits compatibles avec mon profil'),
    );
    expect(onChange).toHaveBeenCalledWith('profile');
  });
});
