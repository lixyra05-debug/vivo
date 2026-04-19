import { fireEvent, render } from '@testing-library/react-native';
import { PrimaryCTA } from '../PrimaryCTA';

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('PrimaryCTA', () => {
  it('affiche le label fourni', () => {
    const { getByText } = render(
      <PrimaryCTA label="Lancer le scan" onPress={() => undefined} />,
    );
    expect(getByText('Lancer le scan')).toBeTruthy();
  });

  it('appelle onPress lors du tap', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<PrimaryCTA label="Lancer le scan" onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onPress quand disabled", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <PrimaryCTA label="Lancer le scan" onPress={onPress} disabled />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
