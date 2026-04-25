import { render } from '@testing-library/react-native';
import { WeeklySparkline } from '../WeeklySparkline';

describe('WeeklySparkline', () => {
  it('rend la courbe quand au moins un point > 0', () => {
    const { UNSAFE_getAllByType, getByText } = render(
      <WeeklySparkline points={[50, 60, 70, 65, 80]} />,
    );
    // Path présent
    const Svg = require('react-native-svg');
    expect(UNSAFE_getAllByType(Svg.Path).length).toBeGreaterThan(0);
    // Pas de strokeDasharray (donc pas en mode plat)
    const paths = UNSAFE_getAllByType(Svg.Path);
    const hasDashed = paths.some((p: { props: { strokeDasharray?: string } }) =>
      typeof p.props.strokeDasharray === 'string',
    );
    expect(hasDashed).toBe(false);
    expect(getByText('4 semaines')).toBeTruthy();
  });

  it('rend une ligne plate dashée quand tous les points = 0', () => {
    const { UNSAFE_getAllByType } = render(
      <WeeklySparkline points={[0, 0, 0, 0, 0, 0, 0]} />,
    );
    const Svg = require('react-native-svg');
    const paths = UNSAFE_getAllByType(Svg.Path);
    const hasDashed = paths.some((p: { props: { strokeDasharray?: string } }) =>
      typeof p.props.strokeDasharray === 'string',
    );
    expect(hasDashed).toBe(true);
  });
});
