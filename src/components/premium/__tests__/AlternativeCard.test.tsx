/**
 * AlternativeCard — affiche un produit alternatif avec son score, son delta,
 * son badge NOVA contextuel et un compteur d'additifs.
 */

import { fireEvent, render } from '@testing-library/react-native';
import { AlternativeCard } from '../AlternativeCard';
import type { Alternative } from '@/src/lib/api/smart-alternatives';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

function makeAlt(overrides: Partial<Alternative> = {}): Alternative {
  return {
    barcode: '3017624010701',
    name: 'Bio Cookie Avoine',
    brand: 'BrandX',
    imageUrl: 'https://img/1.jpg',
    score: 90,
    scoreDelta: 40,
    category: 'en:cookies',
    novaGroup: 1,
    additivesCount: 0,
    ...overrides,
  };
}

describe('AlternativeCard', () => {
  it('affiche le nom, la marque et le delta +Δ', () => {
    const { getByText } = render(
      <AlternativeCard alt={makeAlt()} onPress={() => undefined} />,
    );
    expect(getByText('Bio Cookie Avoine')).toBeTruthy();
    expect(getByText('BrandX')).toBeTruthy();
    expect(getByText('+40')).toBeTruthy();
  });

  it('rend les badges NOVA selon novaGroup (1, 4, null)', () => {
    const { getByText, queryByText, rerender } = render(
      <AlternativeCard
        alt={makeAlt({ novaGroup: 1 })}
        onPress={() => undefined}
      />,
    );
    expect(getByText('NOVA 1')).toBeTruthy();

    rerender(
      <AlternativeCard
        alt={makeAlt({ novaGroup: 4 })}
        onPress={() => undefined}
      />,
    );
    expect(getByText('NOVA 4')).toBeTruthy();

    rerender(
      <AlternativeCard
        alt={makeAlt({ novaGroup: null })}
        onPress={() => undefined}
      />,
    );
    expect(queryByText(/NOVA/)).toBeNull();
  });

  it('rend le compteur additifs en 3 états (0, 2, 5)', () => {
    const { getByText, rerender } = render(
      <AlternativeCard
        alt={makeAlt({ additivesCount: 0 })}
        onPress={() => undefined}
      />,
    );
    expect(getByText(/0 additif/)).toBeTruthy();

    rerender(
      <AlternativeCard
        alt={makeAlt({ additivesCount: 2 })}
        onPress={() => undefined}
      />,
    );
    expect(getByText(/2 additif/)).toBeTruthy();

    rerender(
      <AlternativeCard
        alt={makeAlt({ additivesCount: 5 })}
        onPress={() => undefined}
      />,
    );
    expect(getByText(/5 additifs/)).toBeTruthy();
  });

  it('appelle onPress avec le barcode au tap', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <AlternativeCard alt={makeAlt()} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText(/Bio Cookie Avoine/));
    expect(onPress).toHaveBeenCalledWith('3017624010701');
  });
});
