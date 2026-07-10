/**
 * PremiumPaywall — système 2 tiers Premium + Expert, achats RevenueCat in-place.
 *
 * Tests :
 *   • featureKey premium → carte Premium en primary (29,99€/an fallback R5)
 *   • featureKey expert  → carte Expert en primary (49,99€/an + RECOMMANDÉ)
 *   • achats indisponibles (web/Expo Go) → Alert d'indisponibilité, pas de crash
 *   • offerings disponibles → prix localisés priceString (R5)
 *   • achat réussi → Alert de bienvenue ; annulation → AUCUNE alerte (R6)
 *   • restauration sans abonnement → Alert dédiée
 *   • compact : 1 seule carte, pas de teaser cross-sell
 *   • previewContent : rendu au-dessus de la carte
 *   • garantie "scanner et score restent TOUJOURS gratuits" toujours présente
 *   • a11y labels CTAs
 *
 * Le wrapper revenuecat est mocké au complet — par défaut, achats
 * indisponibles + offerings null (comportement réel en Jest).
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert, Text } from 'react-native';
import { PremiumPaywall } from '../PremiumPaywall';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockIsAvailable = jest.fn();
const mockGetVivoPackages = jest.fn();
const mockPurchaseVivoTier = jest.fn();
const mockRestoreVivoPurchases = jest.fn();

jest.mock('@/src/lib/purchases/revenuecat', () => ({
  isPurchasesAvailable: () => mockIsAvailable(),
  getVivoPackages: () => mockGetVivoPackages(),
  purchaseVivoTier: (tier: 'premium' | 'expert') => mockPurchaseVivoTier(tier),
  restoreVivoPurchases: () => mockRestoreVivoPurchases(),
  getTierFromPurchases: jest.fn(async () => null),
  syncTierToSupabase: jest.fn(async () => undefined),
  initPurchases: jest.fn(async () => undefined),
  identifyPurchasesUser: jest.fn(async () => undefined),
  logOutPurchasesUser: jest.fn(async () => undefined),
  __setPurchasesAvailableForTests: jest.fn(),
}));

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  mockIsAvailable.mockReturnValue(false);
  mockGetVivoPackages.mockResolvedValue(null);
});

afterEach(() => {
  alertSpy.mockRestore();
});

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

  it("achats indisponibles (web / Expo Go) : tap CTA Premium → Alert d'indisponibilité, pas d'achat, pas de crash", () => {
    const onUpgrade = jest.fn();
    const { getByLabelText } = render(
      <PremiumPaywall
        featureKey="smart_alternatives"
        onUpgrade={onUpgrade}
      />,
    );
    fireEvent.press(getByLabelText('Débloquer Premium — 29,99€ par an'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Achats indisponibles',
      expect.stringContaining('App Store'),
    );
    expect(mockPurchaseVivoTier).not.toHaveBeenCalled();
    expect(onUpgrade).not.toHaveBeenCalled();
  });

  it("achats indisponibles : tap CTA Expert → Alert d'indisponibilité (aucun achat déclenché)", () => {
    const { getByLabelText } = render(
      <PremiumPaywall
        featureKey="herbal_remedies"
        onUpgrade={() => undefined}
      />,
    );
    fireEvent.press(getByLabelText('Débloquer Expert — 49,99€ par an'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Achats indisponibles',
      expect.any(String),
    );
    expect(mockPurchaseVivoTier).not.toHaveBeenCalled();
  });

  it('offerings App Store disponibles → affiche les prix localisés priceString (R5)', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGetVivoPackages.mockResolvedValue({
      premium: {
        identifier: 'premium_yearly',
        product: {
          identifier: 'vivo_premium_yearly',
          priceString: '24,99 €',
          price: 24.99,
          currencyCode: 'EUR',
        },
      },
      expert: {
        identifier: 'expert_yearly',
        product: {
          identifier: 'vivo_expert_yearly',
          priceString: '44,99 €',
          price: 44.99,
          currencyCode: 'EUR',
        },
      },
    });
    const { findByText } = render(
      <PremiumPaywall
        featureKey="store_full_ranking"
        onUpgrade={() => undefined}
      />,
    );
    expect(await findByText(/Débloquer Premium — 24,99 €\/an/)).toBeTruthy();
    expect(await findByText(/44,99 €\/an/)).toBeTruthy();
  });

  it("achat réussi → purchaseVivoTier('premium') + Alert 'Bienvenue dans Vivo Premium 🌿'", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockPurchaseVivoTier.mockResolvedValue({
      success: true,
      newTier: 'premium',
      cancelled: false,
    });
    const { getByLabelText } = render(
      <PremiumPaywall
        featureKey="store_full_ranking"
        onUpgrade={() => undefined}
      />,
    );
    fireEvent.press(getByLabelText('Débloquer Premium — 29,99€ par an'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Bienvenue dans Vivo Premium 🌿',
        expect.any(String),
      ),
    );
    expect(mockPurchaseVivoTier).toHaveBeenCalledWith('premium');
  });

  it("annulation utilisateur pendant l'achat → AUCUNE alerte (R6)", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockPurchaseVivoTier.mockResolvedValue({
      success: false,
      newTier: null,
      cancelled: true,
    });
    const { getByLabelText } = render(
      <PremiumPaywall
        featureKey="store_full_ranking"
        onUpgrade={() => undefined}
      />,
    );
    fireEvent.press(getByLabelText('Débloquer Premium — 29,99€ par an'));
    await waitFor(() =>
      expect(mockPurchaseVivoTier).toHaveBeenCalledWith('premium'),
    );
    await waitFor(() => expect(alertSpy).not.toHaveBeenCalled());
  });

  it("restauration sans abonnement actif → Alert 'Aucun abonnement à restaurer sur ce compte.'", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockRestoreVivoPurchases.mockResolvedValue({ restored: false, tier: null });
    const { getByLabelText } = render(
      <PremiumPaywall
        featureKey="store_full_ranking"
        onUpgrade={() => undefined}
      />,
    );
    fireEvent.press(getByLabelText('Restaurer les achats'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Restauration',
        'Aucun abonnement à restaurer sur ce compte.',
      ),
    );
  });

  it('compact={true} : affiche le primary uniquement (pas de cross-sell teaser)', () => {
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

  it('previewContent rendu en preview AVANT la carte', () => {
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

  it('expose les a11y labels corrects pour les deux CTAs (mode normal premium → Premium primary + Expert teaser)', () => {
    const { getByLabelText } = render(
      <PremiumPaywall
        featureKey="store_full_ranking"
        onUpgrade={() => undefined}
      />,
    );
    expect(getByLabelText('Débloquer Premium — 29,99€ par an')).toBeTruthy();
    expect(getByLabelText('Débloquer Expert — 49,99€ par an')).toBeTruthy();
  });

  it('featureKey premium en mode normal → affiche aussi le teaser cross-sell Expert', () => {
    const { getByText } = render(
      <PremiumPaywall
        featureKey="store_comparison"
        onUpgrade={() => undefined}
      />,
    );
    expect(getByText(/Aller plus loin — Vivo Expert/)).toBeTruthy();
  });
});
