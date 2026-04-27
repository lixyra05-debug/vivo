import { fireEvent, render } from '@testing-library/react-native';
import { StoreCard } from '../StoreCard';
import type { StoreDef } from '@/src/lib/api/types';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const store: StoreDef = {
  slug: 'carrefour',
  nameFr: 'Carrefour',
  emoji: '🟥',
  country: 'FR',
  offStoreTag: 'carrefour',
  displayOrder: 0,
};

describe('StoreCard', () => {
  it("affiche le logo (image) et le nom de l'enseigne pour un slug mappé", () => {
    const { getByText, getByLabelText } = render(<StoreCard store={store} onPress={() => {}} />);
    expect(getByText('Carrefour')).toBeTruthy();
    expect(getByLabelText('Logo carrefour')).toBeTruthy();
  });

  it("affiche l'emoji fallback pour un slug non mappé", () => {
    const unmapped: StoreDef = { ...store, slug: 'inconnu', nameFr: 'Inconnu', emoji: '🛒' };
    const { getByText } = render(<StoreCard store={unmapped} onPress={() => {}} />);
    expect(getByText('🛒')).toBeTruthy();
  });

  it('appelle onPress au tap', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<StoreCard store={store} onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
