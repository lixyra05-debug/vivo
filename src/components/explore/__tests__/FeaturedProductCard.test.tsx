import { fireEvent, render } from '@testing-library/react-native';
import { FeaturedProductCard } from '../FeaturedProductCard';
import type { FeaturedProduct } from '@/src/data/featured-products';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const foodWithGrade: FeaturedProduct = {
  barcode: '3017620422003',
  name: 'Nutella',
  brand: 'Ferrero',
  imageUrl: 'https://example.com/nutella.jpg',
  nutritionGrade: 'e',
  type: 'food',
};

const foodNoGrade: FeaturedProduct = {
  barcode: '0000000000001',
  name: 'Produit sans grade',
  brand: null,
  imageUrl: 'https://example.com/x.jpg',
  type: 'food',
};

const cosmetic: FeaturedProduct = {
  barcode: '3600540123456',
  name: 'Shampooing doux',
  brand: 'Mixa',
  imageUrl: 'https://example.com/shampoo.jpg',
  type: 'cosmetic',
};

describe('FeaturedProductCard', () => {
  it('affiche le nom, la marque et le badge Nutri-Score pour un food avec grade', () => {
    const { getByText, getByLabelText } = render(
      <FeaturedProductCard product={foodWithGrade} onPress={() => {}} />,
    );
    expect(getByText('Nutella')).toBeTruthy();
    expect(getByText('Ferrero')).toBeTruthy();
    expect(getByText('E')).toBeTruthy();
    expect(getByLabelText('Nutri-Score E')).toBeTruthy();
  });

  it("n'affiche aucun badge ni chip pour un food sans grade ni marque", () => {
    const { getByText, queryByText } = render(
      <FeaturedProductCard product={foodNoGrade} onPress={() => {}} />,
    );
    expect(getByText('Produit sans grade')).toBeTruthy();
    expect(queryByText('Cosmétique')).toBeNull();
    // Aucun badge nutritionnel A-E ne doit apparaître
    for (const letter of ['A', 'B', 'C', 'D', 'E']) {
      expect(queryByText(letter)).toBeNull();
    }
  });

  it('affiche le chip "Cosmétique" pour un produit cosmétique (pas de Nutri-Score)', () => {
    const { getByText, queryByText } = render(
      <FeaturedProductCard product={cosmetic} onPress={() => {}} />,
    );
    expect(getByText('Shampooing doux')).toBeTruthy();
    expect(getByText('Cosmétique')).toBeTruthy();
    for (const letter of ['A', 'B', 'C', 'D', 'E']) {
      expect(queryByText(letter)).toBeNull();
    }
  });

  it('appelle onPress au tap', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <FeaturedProductCard product={foodWithGrade} onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
