import { fireEvent, render } from '@testing-library/react-native';
import { NutrientBreakdown } from '../NutrientBreakdown';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

describe('NutrientBreakdown', () => {
  const macros = {
    sugars: 12,
    saturated_fat: 4,
    salt: 1.2,
    proteins: 6,
    fiber: 3,
  };

  it('rend les valeurs nutritionnelles pour 100g par défaut', () => {
    const { getByText } = render(
      <NutrientBreakdown
        macros={macros}
        energyKcal={320}
        portionGrams={40}
      />,
    );
    expect(getByText('Valeurs nutritionnelles')).toBeTruthy();
    expect(getByText('Pour 100g')).toBeTruthy();
    expect(getByText('Énergie')).toBeTruthy();
    expect(getByText('Sucres')).toBeTruthy();
  });

  it("bascule en mode portion après un appui sur le bouton Portion", () => {
    const { getByLabelText, getByText } = render(
      <NutrientBreakdown
        macros={macros}
        energyKcal={320}
        portionGrams={40}
      />,
    );
    fireEvent.press(getByLabelText('Afficher les valeurs par portion'));
    expect(getByText('Pour 40g (portion estimée)')).toBeTruthy();
  });

  it('retourne null quand aucun nutriment nest fourni', () => {
    const { toJSON } = render(
      <NutrientBreakdown
        macros={{}}
        portionGrams={40}
      />,
    );
    expect(toJSON()).toBeNull();
  });
});
