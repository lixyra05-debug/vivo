/**
 * PremiumPaywall — système 2 tiers Premium + Expert (avril 2026).
 *
 * Tests de la nouvelle props API (featureKey + onUpgrade) :
 *   • featureKey premium → affiche carte Premium en primary (29,99€/an)
 *   • featureKey expert  → affiche carte Expert en primary (49,99€/an + RECOMMANDÉ)
 *   • onUpgrade reçoit 'premium' ou 'expert' selon le CTA tapé
 *   • compact : 1 seule carte, pas de teaser cross-sell
 *   • previewContent : rendu au-dessus de la carte
 *   • garantie "scanner et score restent TOUJOURS gratuits" toujours présente
 *   • a11y labels CTAs
 *   • mode normal premium → affiche aussi un teaser Expert
 */

import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PremiumPaywall } from '../PremiumPaywall';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('PremiumPaywall', () => {
  it("featureKey='store_full_ranking' (premium) → affiche '29,99€/an' comme tier primary", () => {
    const { getByText } = render(
      <PremiumPaywall
        featureKey="store_full_ranking"
        onUpgrade={() => undefined}
      />,
    );
    expect(getByText(/Vivo Premium/)).toBeTruthy();
    expect(getByText(/Débloquer Premium — 29,99€\/an/)).toBeTruthy();
  });

  it("featureKey='plant_database' (expert) → affiche '49,99€/an' comme tier primary + badge RECOMMANDÉ", () => {
    const { getByText } = render(
      <PremiumPaywall
        featureKey="plant_database"
        onUpgrade={() => undefined}
      />,
    );
    expect(getByText(/Vivo Expert/)).toBeTruthy();
    expect(getByText(/Débloquer Expert — 49,99€\/an/)).toBeTruthy();
    expect(getByText(/RECOMMANDÉ/)).toBeTruthy();
  });

  it("onUpgrade est appelé avec 'premium' quand on tape sur le CTA Premium (featureKey premium)", () => {
    const onUpgrade = jest.fn();
    const { getByLabelText } = render(
      <PremiumPaywall
        featureKey="smart_alternatives"
        onUpgrade={onUpgrade}
      />,
    );
    const cta = getByLabelText('Débloquer Premium — 29,99€ par an');
    fireEvent.press(cta);
    expect(onUpgrade).toHaveBeenCalledWith('premium');
  });

  it("onUpgrade est appelé avec 'expert' quand on tape sur le CTA Expert (featureKey expert)", () => {
    const onUpgrade = jest.fn();
    const { getByLabelText } = render(
      <PremiumPaywall
        featureKey="herbal_remedies"
        onUpgrade={onUpgrade}
      />,
    );
    const cta = getByLabelText('Débloquer Expert — 49,99€ par an');
    fireEvent.press(cta);
    expect(onUpgrade).toHaveBeenCalledWith('expert');
  });

  it("compact={true} : affiche le primary uniquement (pas de cross-sell teaser)", () => {
    const { queryByText, getByText } = render(
      <PremiumPaywall
        featureKey="store_full_ranking"
        onUpgrade={() => undefined}
        compact
      />,
    );
    // Carte Premium présente
    expect(getByText(/Vivo Premium/)).toBeTruthy();
    // Pas de teaser cross-sell Expert (mode compact)
    expect(queryByText(/Aller plus loin — Vivo Expert/)).toBeNull();
  });

  it("previewContent rendu en preview AVANT la carte", () => {
    const preview = <Text testID="preview-node">Aperçu masqué</Text>;
    const { getByTestId, getByText } = render(
      <PremiumPaywall
        featureKey="store_full_ranking"
        onUpgrade={() => undefined}
        previewContent={preview}
      />,
    );
    expect(getByTestId('preview-node')).toBeTruthy();
    expect(getByText('Aperçu masqué')).toBeTruthy();
  });

  it("garantie 'scanner et score restent TOUJOURS gratuits' toujours présente", () => {
    const { getByText } = render(
      <PremiumPaywall
        featureKey="store_full_ranking"
        onUpgrade={() => undefined}
      />,
    );
    expect(
      getByText(/scanner et le score restent TOUJOURS gratuits/i),
    ).toBeTruthy();
  });

  it("expose les a11y labels corrects pour les deux CTAs (mode normal premium → Premium primary + Expert teaser)", () => {
    const { getByLabelText } = render(
      <PremiumPaywall
        featureKey="store_full_ranking"
        onUpgrade={() => undefined}
      />,
    );
    expect(getByLabelText('Débloquer Premium — 29,99€ par an')).toBeTruthy();
    expect(getByLabelText('Débloquer Expert — 49,99€ par an')).toBeTruthy();
  });

  it("featureKey premium en mode normal → affiche aussi le teaser cross-sell Expert", () => {
    const { getByText } = render(
      <PremiumPaywall
        featureKey="store_comparison"
        onUpgrade={() => undefined}
      />,
    );
    expect(getByText(/Aller plus loin — Vivo Expert/)).toBeTruthy();
  });
});
