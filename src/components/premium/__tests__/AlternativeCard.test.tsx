/**
 * AlternativeCard — affiche un produit alternatif avec son proxy score,
 * son delta, et navigue vers la fiche produit au tap.
 */

import { fireEvent, render } from '@testing-library/react-native';
import { AlternativeCard } from '../AlternativeCard';
import type { AlternativeProduct } from '@/src/lib/api/smart-alternatives';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const sample: AlternativeProduct = {
  barcode: '3017624010701',
  name: 'Bio Cookie Avoine',
  brand: 'BrandX',
  imageUrl: 'https://img/1.jpg',
  grade: 'a',
  proxyScore: 90,
  scoreDelta: 40,
};

describe('AlternativeCard', () => {
  it("affiche le nom, la marque et le badge +Δ", () => {
    const { getByText } = render(
      <AlternativeCard alt={sample} onPress={() => undefined} />,
    );
    expect(getByText('Bio Cookie Avoine')).toBeTruthy();
    expect(getByText('BrandX')).toBeTruthy();
    expect(getByText('+40')).toBeTruthy();
  });

  it('appelle onPress avec le barcode au tap', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <AlternativeCard alt={sample} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText(/Bio Cookie Avoine/));
    expect(onPress).toHaveBeenCalledWith('3017624010701');
  });
});
