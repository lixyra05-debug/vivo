import { render } from '@testing-library/react-native';
import { IngredientRiskMap } from '../IngredientRiskMap';

describe('IngredientRiskMap', () => {
  it('affiche le titre et la légende avec des ingrédients valides', () => {
    const { getByText } = render(
      <IngredientRiskMap ingredientsRaw="farine de blé, sucre, sel" />,
    );
    expect(getByText('Carte des ingrédients')).toBeTruthy();
    expect(getByText('Codé par niveau de risque')).toBeTruthy();
    expect(getByText('Safe')).toBeTruthy();
  });

  it('affiche les noms des ingrédients en chips', () => {
    const { getByText } = render(
      <IngredientRiskMap ingredientsRaw="farine de blé, sucre" />,
    );
    expect(getByText('farine de blé')).toBeTruthy();
    expect(getByText('sucre')).toBeTruthy();
  });

  it('retourne null si la chaîne est vide', () => {
    const { toJSON } = render(<IngredientRiskMap ingredientsRaw="" />);
    expect(toJSON()).toBeNull();
  });
});
