import { fireEvent, render } from '@testing-library/react-native';
import { SearchResultCard } from '../SearchResultCard';
import type { SearchResult } from '@/src/lib/api/types';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const foodResult: SearchResult = {
  barcode: '123',
  name: 'Biscuits au chocolat',
  brand: 'Bonneterre',
  image_url: null,
  type: 'food',
};

const cosmeticResult: SearchResult = {
  barcode: '456',
  name: 'Shampoing doux',
  brand: 'Cattier',
  image_url: null,
  type: 'cosmetic',
};

describe('SearchResultCard', () => {
  it('affiche le nom et la marque du produit', () => {
    const { getByText } = render(
      <SearchResultCard result={foodResult} onPress={() => {}} />,
    );
    expect(getByText('Biscuits au chocolat')).toBeTruthy();
    expect(getByText('Bonneterre')).toBeTruthy();
  });

  it('affiche le chip "Cosmétique" quand type est cosmetic', () => {
    const { getByText } = render(
      <SearchResultCard result={cosmeticResult} onPress={() => {}} />,
    );
    expect(getByText('Cosmétique')).toBeTruthy();
  });

  it('appelle onPress au tap', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <SearchResultCard result={foodResult} onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
