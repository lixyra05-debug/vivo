import { fireEvent, render } from '@testing-library/react-native';
import { CategoryRankCard } from '../CategoryRankCard';
import type { SearchResult } from '@/src/lib/api/types';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const result: SearchResult = {
  barcode: '789',
  name: 'Pomme bio',
  brand: 'Bio Village',
  image_url: null,
  type: 'food',
};

describe('CategoryRankCard', () => {
  it('affiche la médaille or quand medal="gold"', () => {
    const { getByText } = render(
      <CategoryRankCard
        result={result}
        score={88}
        rank={1}
        medal="gold"
        onPress={() => {}}
      />,
    );
    expect(getByText('🥇')).toBeTruthy();
  });

  it('affiche #4 quand rank=4 sans médaille', () => {
    const { getByText } = render(
      <CategoryRankCard result={result} score={52} rank={4} onPress={() => {}} />,
    );
    expect(getByText('#4')).toBeTruthy();
  });

  it('affiche la valeur du score', () => {
    const { getByLabelText } = render(
      <CategoryRankCard
        result={result}
        score={77}
        rank={2}
        medal="silver"
        onPress={() => {}}
      />,
    );
    expect(getByLabelText('Score 77 sur 100')).toBeTruthy();
  });

  it('appelle onPress au tap', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <CategoryRankCard
        result={result}
        score={60}
        rank={5}
        onPress={onPress}
      />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
