import { render } from '@testing-library/react-native';
import { CategoryCard } from '../CategoryCard';
import type { CategoryDef } from '@/src/lib/api/types';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const foodCategory: CategoryDef = {
  slug: 'biscuits-sucres',
  name: 'Biscuits sucrés',
  emoji: '🍪',
  icon: 'Cookie',
  off_tag: 'biscuits',
  obf_tag: null,
  type: 'food',
};

const cosmeticCategory: CategoryDef = {
  slug: 'shampoings',
  name: 'Shampoings',
  emoji: '🧴',
  icon: 'Droplet',
  off_tag: null,
  obf_tag: 'shampoos',
  type: 'cosmetic',
};

describe('CategoryCard', () => {
  it('affiche l\'emoji et le nom', () => {
    const { getByText } = render(
      <CategoryCard category={foodCategory} onPress={() => {}} />,
    );
    expect(getByText('🍪')).toBeTruthy();
    expect(getByText('Biscuits sucrés')).toBeTruthy();
  });

  it('affiche le label "Alimentation" pour les catégories food', () => {
    const { getByText } = render(
      <CategoryCard category={foodCategory} onPress={() => {}} />,
    );
    expect(getByText('Alimentation')).toBeTruthy();
  });

  it('affiche le label "Cosmétique" pour les catégories cosmetic', () => {
    const { getByText } = render(
      <CategoryCard category={cosmeticCategory} onPress={() => {}} />,
    );
    expect(getByText('Cosmétique')).toBeTruthy();
  });
});
