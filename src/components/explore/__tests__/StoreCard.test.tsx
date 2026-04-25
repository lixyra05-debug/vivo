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
  it("affiche l'emoji et le nom de l'enseigne", () => {
    const { getByText } = render(<StoreCard store={store} onPress={() => {}} />);
    expect(getByText('Carrefour')).toBeTruthy();
    expect(getByText('🟥')).toBeTruthy();
  });

  it('appelle onPress au tap', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<StoreCard store={store} onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
