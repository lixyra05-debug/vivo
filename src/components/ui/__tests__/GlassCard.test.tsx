import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { GlassCard } from '../GlassCard';

describe('GlassCard', () => {
  it('rend ses enfants', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Score 82</Text>
      </GlassCard>,
    );
    expect(getByText('Score 82')).toBeTruthy();
  });

  it("accepte une tonalité d'alerte sans casser le rendu", () => {
    const { getByText } = render(
      <GlassCard tone="info">
        <Text>Avertissement</Text>
      </GlassCard>,
    );
    expect(getByText('Avertissement')).toBeTruthy();
  });
});
