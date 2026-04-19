import { render } from '@testing-library/react-native';
import { ProgressDots } from '../ProgressDots';

describe('ProgressDots', () => {
  it('annonce la progression via accessibilityValue', () => {
    const { getByLabelText } = render(<ProgressDots current={1} total={3} />);
    const bar = getByLabelText('Étape 2 sur 3');
    expect(bar.props.accessibilityValue).toEqual({ min: 1, max: 3, now: 2 });
    expect(bar.props.accessibilityRole).toBe('progressbar');
  });

  it('annonce un label localisé pour la première étape', () => {
    const { getByLabelText } = render(<ProgressDots current={0} total={3} />);
    expect(getByLabelText('Étape 1 sur 3')).toBeTruthy();
  });
});
