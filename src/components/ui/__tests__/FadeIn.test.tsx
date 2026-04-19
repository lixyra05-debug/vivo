import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { FadeIn } from '../FadeIn';

describe('FadeIn', () => {
  it('rend ses enfants', () => {
    const { getByText } = render(
      <FadeIn>
        <Text>Bienvenue</Text>
      </FadeIn>,
    );
    expect(getByText('Bienvenue')).toBeTruthy();
  });

  it('rend ses enfants même avec un délai', () => {
    const { getByText } = render(
      <FadeIn delay={400}>
        <Text>Étape suivante</Text>
      </FadeIn>,
    );
    expect(getByText('Étape suivante')).toBeTruthy();
  });
});
