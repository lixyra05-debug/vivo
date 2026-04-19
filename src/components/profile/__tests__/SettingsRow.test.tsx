import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SettingsRow } from '../SettingsRow';

describe('SettingsRow', () => {
  it('affiche le label et la description', () => {
    const { getByText } = render(
      <SettingsRow
        icon={<Text>icon</Text>}
        label="Mon profil"
        description="Allergies, intolérances"
        onPress={() => undefined}
      />,
    );
    expect(getByText('Mon profil')).toBeTruthy();
    expect(getByText('Allergies, intolérances')).toBeTruthy();
  });

  it('appelle onPress lors du tap', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <SettingsRow
        icon={<Text>icon</Text>}
        label="Mentions légales"
        onPress={onPress}
      />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
