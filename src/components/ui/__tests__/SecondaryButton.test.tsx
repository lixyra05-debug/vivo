import { fireEvent, render } from '@testing-library/react-native';
import { SecondaryButton } from '../SecondaryButton';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('SecondaryButton', () => {
  it('affiche le label fourni', () => {
    const { getByText } = render(
      <SecondaryButton label="Continuer avec Google" onPress={() => undefined} />,
    );
    expect(getByText('Continuer avec Google')).toBeTruthy();
  });

  it('appelle onPress lors du tap', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <SecondaryButton label="Retenter" onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onPress quand disabled", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <SecondaryButton label="Retenter" onPress={onPress} disabled />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('affiche un spinner et bloque le press en loading', () => {
    const onPress = jest.fn();
    const { queryByText, getByRole } = render(
      <SecondaryButton label="Retenter" onPress={onPress} loading />,
    );
    expect(queryByText('Retenter')).toBeNull();
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
