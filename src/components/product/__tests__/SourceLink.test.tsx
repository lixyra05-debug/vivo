import { fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { SourceLink, formatFrenchDate } from '../SourceLink';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

describe('formatFrenchDate', () => {
  it('formate une date ISO en jour mois année français', () => {
    expect(formatFrenchDate('2026-04-25T10:00:00Z')).toMatch(/25 avr\. 2026/);
  });

  it('renvoie null pour null/undefined/vide/invalide', () => {
    expect(formatFrenchDate(null)).toBeNull();
    expect(formatFrenchDate(undefined)).toBeNull();
    expect(formatFrenchDate('')).toBeNull();
    expect(formatFrenchDate('not-a-date')).toBeNull();
  });
});

describe('SourceLink', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("affiche 'Open Food Facts' et la date pour source=off", () => {
    const { getByText } = render(
      <SourceLink barcode="123" source="off" lastUpdated="2026-04-25T10:00:00Z" />,
    );
    expect(getByText(/Open Food Facts/)).toBeTruthy();
    expect(getByText(/MAJ 25 avr\. 2026/)).toBeTruthy();
  });

  it("affiche 'Open Beauty Facts' pour source=obf, sans date si non fournie", () => {
    const { getByText, queryByText } = render(
      <SourceLink barcode="123" source="obf" lastUpdated={null} />,
    );
    expect(getByText(/Open Beauty Facts/)).toBeTruthy();
    expect(queryByText(/MAJ /)).toBeNull();
  });

  it("ouvre l'URL OFF au tap", () => {
    const { getByLabelText } = render(<SourceLink barcode="3017620422003" source="off" />);
    fireEvent.press(getByLabelText('Voir la fiche sur Open Food Facts'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://world.openfoodfacts.org/product/3017620422003',
    );
  });

  it("ouvre l'URL OBF au tap", () => {
    const { getByLabelText } = render(<SourceLink barcode="abc" source="obf" />);
    fireEvent.press(getByLabelText('Voir la fiche sur Open Beauty Facts'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://world.openbeautyfacts.org/product/abc',
    );
  });
});
