import { fireEvent, render } from '@testing-library/react-native';
import { PlantListCard } from '../PlantListCard';
import type { PlantEntry } from '@/src/data/plant-encyclopedia';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockPlant: PlantEntry = {
  id: 'chamomile',
  nameFr: 'Camomille',
  nameLatin: 'Matricaria recutita',
  emoji: '🌼',
  category: 'nervous',
  properties: 'Apaisante, anti-inflammatoire douce.',
  traditionalUse: "Favorise l'endormissement et calme les digestions difficiles.",
  partUsed: 'Fleurs séchées',
  preparation: 'Infusion 5 minutes, 1 c. à café par tasse.',
  contraindications: 'Allergie aux Astéracées.',
  interactions: null,
  evidenceLevel: 'well-established',
  source: 'EMA',
  sourceUrl: 'https://www.ema.europa.eu/en',
};

describe('PlantListCard', () => {
  it('affiche le nameFr, nameLatin, emoji et badge evidenceLevel', () => {
    const { getByText, getByLabelText } = render(
      <PlantListCard plant={mockPlant} onPress={() => undefined} />,
    );
    expect(getByText('Camomille')).toBeTruthy();
    expect(getByText('Matricaria recutita')).toBeTruthy();
    expect(getByText('🌼')).toBeTruthy();
    expect(getByText('Preuve solide')).toBeTruthy();
    expect(
      getByLabelText(
        'Camomille, Matricaria recutita, niveau de preuve Preuve solide',
      ),
    ).toBeTruthy();
  });

  it('appelle onPress au tap', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <PlantListCard plant={mockPlant} onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
