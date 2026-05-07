import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { DayCircle } from '../DayCircle';
import { Colors } from '@/src/constants/colors';

function flatStyle(node: { props: { style: unknown } }) {
  return StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;
}

describe('DayCircle', () => {
  it('rend un check ✓ et fond sage en status completed-good', () => {
    const { getByTestId, getByText } = render(
      <DayCircle day={3} status="completed-good" />,
    );

    expect(getByText('✓')).toBeTruthy();
    const wrapper = getByTestId('day-circle');
    const style = flatStyle(wrapper);
    expect(style.backgroundColor).toBe(Colors.sage);
  });

  it('rend le numéro du jour avec fond earth en status today', () => {
    const { getByTestId, getByText } = render(
      <DayCircle day={7} status="today" />,
    );

    expect(getByText('7')).toBeTruthy();
    const wrapper = getByTestId('day-circle');
    const style = flatStyle(wrapper);
    expect(style.backgroundColor).toBe(Colors.earth);
  });
});
