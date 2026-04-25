import { fireEvent, render } from '@testing-library/react-native';
import { UltraTransformedTag } from '../UltraTransformedTag';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('UltraTransformedTag', () => {
  it('rend la chip quand novaGroup === 4', () => {
    const { getByText } = render(<UltraTransformedTag novaGroup={4} />);
    expect(getByText('Ultra-transformé (NOVA 4)')).toBeTruthy();
  });

  it('ne rend rien pour NOVA 1, 2, 3 ou null', () => {
    const { queryByText: q1 } = render(<UltraTransformedTag novaGroup={1} />);
    expect(q1('Ultra-transformé (NOVA 4)')).toBeNull();
    const { queryByText: q2 } = render(<UltraTransformedTag novaGroup={2} />);
    expect(q2('Ultra-transformé (NOVA 4)')).toBeNull();
    const { queryByText: q3 } = render(<UltraTransformedTag novaGroup={3} />);
    expect(q3('Ultra-transformé (NOVA 4)')).toBeNull();
    const { queryByText: qn } = render(<UltraTransformedTag novaGroup={null} />);
    expect(qn('Ultra-transformé (NOVA 4)')).toBeNull();
  });

  it('ouvre le tooltip explicatif au tap avec le contenu attendu', () => {
    const { getByLabelText, queryByText } = render(<UltraTransformedTag novaGroup={4} />);
    expect(queryByText(/procédés industriels/)).toBeNull();
    fireEvent.press(getByLabelText('Détails ultra-transformé'));
    expect(queryByText(/procédés industriels/)).toBeTruthy();
    expect(queryByText(/Monteiro et al\., 2019/)).toBeTruthy();
  });
});
