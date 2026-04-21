import { render } from '@testing-library/react-native';
import { NutrientBar } from '../NutrientBar';

describe('NutrientBar', () => {
  it('rend sans crasher avec des props minimales', () => {
    const { getByText } = render(
      <NutrientBar
        label="Sucres"
        value={5}
        unit="g"
        status="good"
        max={30}
      />,
    );
    expect(getByText('Sucres')).toBeTruthy();
  });

  it("affiche la valeur et l'unité", () => {
    const { getByText } = render(
      <NutrientBar
        label="Sel"
        value={2.4}
        unit="g"
        status="bad"
        max={3}
      />,
    );
    expect(getByText(/2\.4 g/)).toBeTruthy();
  });

  it("expose un accessibilityLabel descriptif", () => {
    const { getByLabelText } = render(
      <NutrientBar
        label="Graisses sat."
        value={8}
        unit="g"
        status="moderate"
        max={10}
      />,
    );
    expect(getByLabelText(/Graisses sat\..*niveau modéré/)).toBeTruthy();
  });
});
