import { fireEvent, render } from '@testing-library/react-native';
import { HistoryTypeTabs } from '../HistoryTypeTabs';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('HistoryTypeTabs', () => {
  const defaultCounts = { all: 5, food: 3, cosmetic: 2 };

  it('affiche les trois pills avec les libellés FR Tous / Alimentation / Cosmétiques', () => {
    const { getByText } = render(
      <HistoryTypeTabs value="all" onChange={() => {}} counts={defaultCounts} />,
    );
    expect(getByText(/Tous/)).toBeTruthy();
    expect(getByText(/Alimentation/)).toBeTruthy();
    expect(getByText(/Cosmétiques/)).toBeTruthy();
  });

  it('affiche le compteur sur chaque pill depuis la prop counts', () => {
    const { getByText } = render(
      <HistoryTypeTabs
        value="all"
        onChange={() => {}}
        counts={{ all: 7, food: 4, cosmetic: 3 }}
      />,
    );
    // Compteurs visibles dans le rendu
    expect(getByText('7')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('appelle onChange("food") quand on tape sur "Alimentation"', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <HistoryTypeTabs value="all" onChange={onChange} counts={defaultCounts} />,
    );
    fireEvent.press(getByLabelText(/Alimentation/));
    expect(onChange).toHaveBeenCalledWith('food');
  });

  it('appelle onChange("cosmetic") quand on tape sur "Cosmétiques"', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <HistoryTypeTabs value="all" onChange={onChange} counts={defaultCounts} />,
    );
    fireEvent.press(getByLabelText(/Cosmétiques/));
    expect(onChange).toHaveBeenCalledWith('cosmetic');
  });

  it('marque la pill active via accessibilityState.selected', () => {
    const { getByLabelText } = render(
      <HistoryTypeTabs value="food" onChange={() => {}} counts={defaultCounts} />,
    );
    const foodPill = getByLabelText(/Alimentation/);
    const allPill = getByLabelText(/^Tous/);
    expect(foodPill.props.accessibilityState).toMatchObject({ selected: true });
    expect(allPill.props.accessibilityState).toMatchObject({ selected: false });
  });

  it("ne rappelle pas onChange quand on tape sur la pill déjà active", () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <HistoryTypeTabs value="all" onChange={onChange} counts={defaultCounts} />,
    );
    fireEvent.press(getByLabelText(/^Tous/));
    expect(onChange).not.toHaveBeenCalled();
  });
});
