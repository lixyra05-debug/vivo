/**
 * PremiumPaywall — composant non-aggressif (R3 du brief) :
 *   • toujours précédé d'une preview, jamais affiché seul sans contexte
 *   • CTA unique "Débloquer — 29,99€/an" (D3)
 *   • garantie : "Le scanner et le score restent TOUJOURS gratuits ✅"
 */

import { fireEvent, render } from '@testing-library/react-native';
import { PremiumPaywall } from '../PremiumPaywall';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('PremiumPaywall', () => {
  it("affiche le titre, la description et la garantie 'scanner et score gratuits'", () => {
    const { getByText } = render(
      <PremiumPaywall
        title="Voir le classement complet"
        description="Découvrez les 10 enseignes classées."
        onUnlock={() => undefined}
      />,
    );
    expect(getByText('Voir le classement complet')).toBeTruthy();
    expect(getByText(/Découvrez les 10 enseignes/)).toBeTruthy();
    expect(getByText(/scanner et le score restent.*gratuits/i)).toBeTruthy();
  });

  it("affiche le CTA '29,99€/an' et déclenche onUnlock au tap", () => {
    const onUnlock = jest.fn();
    const { getByText } = render(
      <PremiumPaywall
        title="Top supermarchés"
        description="Bla."
        onUnlock={onUnlock}
      />,
    );
    const cta = getByText(/29,99€\s*\/\s*an/);
    expect(cta).toBeTruthy();
    fireEvent.press(cta);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("expose le label 'Débloquer' dans le bouton", () => {
    const { getByLabelText } = render(
      <PremiumPaywall title="X" description="Y" onUnlock={() => undefined} />,
    );
    expect(getByLabelText(/Débloquer.*29,99/)).toBeTruthy();
  });

  it('liste les 3 features premium dans le composant', () => {
    const { getByText } = render(
      <PremiumPaywall title="Premium" description="D" onUnlock={() => undefined} />,
    );
    // 3 bullets : classement, comparison, alternatives
    expect(getByText(/Classement complet/i)).toBeTruthy();
    expect(getByText(/produits.*enseigne/i)).toBeTruthy();
    expect(getByText(/Alternatives intelligentes/i)).toBeTruthy();
  });
});
