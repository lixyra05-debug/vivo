/**
 * StoreRankingCard — affiche un rang dans le classement des supermarchés.
 */

import { fireEvent, render } from '@testing-library/react-native';
import { StoreRankingCard } from '../StoreRankingCard';
import type { StoreRanking } from '@/src/lib/api/store-ranking';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const sample: StoreRanking = {
  slug: 'carrefour',
  nameFr: 'Carrefour',
  emoji: '🟥',
  avgScore: 78,
  productCount: 42,
  color: 'green',
};

describe('StoreRankingCard', () => {
  it('affiche le rang, le nom, le score et le nombre de produits', () => {
    const { getByText } = render(
      <StoreRankingCard rank={1} ranking={sample} onPress={() => undefined} />,
    );
    expect(getByText('1')).toBeTruthy();
    expect(getByText('Carrefour')).toBeTruthy();
    expect(getByText(/42 produits analysés/)).toBeTruthy();
  });

  it("affiche '0 produit analysé' au singulier quand productCount = 0", () => {
    const empty: StoreRanking = { ...sample, productCount: 0, avgScore: 0 };
    const { getByText } = render(
      <StoreRankingCard rank={5} ranking={empty} onPress={() => undefined} />,
    );
    expect(getByText(/0 produit analysé/)).toBeTruthy();
  });

  it('appelle onPress avec le slug au tap', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <StoreRankingCard rank={2} ranking={sample} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText(/Carrefour/));
    expect(onPress).toHaveBeenCalledWith('carrefour');
  });
});
