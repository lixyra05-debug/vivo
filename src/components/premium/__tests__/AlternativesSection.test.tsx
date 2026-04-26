/**
 * AlternativesSection — section "Meilleures alternatives" sur la fiche produit.
 *
 * Règles :
 *   • Ne s'affiche que si currentScore < 70 (R3 du brief : preview avant gate)
 *   • Free : preview 1 carte floue + paywall non-aggressif
 *   • Premium : 3 cartes complètes
 *   • Loading skeleton pendant fetch, null si zéro résultat
 */

import { render, waitFor } from '@testing-library/react-native';
import { AlternativesSection } from '../AlternativesSection';
import type { AlternativeProduct } from '@/src/lib/api/smart-alternatives';

jest.mock('@/src/lib/api/smart-alternatives', () => ({
  findAlternatives: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

import { findAlternatives } from '@/src/lib/api/smart-alternatives';

const samples: AlternativeProduct[] = [
  {
    barcode: 'a1',
    name: 'Bio A',
    brand: 'BX',
    imageUrl: 'https://img/a',
    grade: 'a',
    proxyScore: 90,
    scoreDelta: 50,
  },
  {
    barcode: 'b1',
    name: 'Bio B',
    brand: 'BY',
    imageUrl: 'https://img/b',
    grade: 'b',
    proxyScore: 70,
    scoreDelta: 30,
  },
  {
    barcode: 'c1',
    name: 'Bio C',
    brand: 'BZ',
    imageUrl: 'https://img/c',
    grade: 'b',
    proxyScore: 70,
    scoreDelta: 30,
  },
];

describe('AlternativesSection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("ne s'affiche pas si currentScore >= 70 (produit déjà bon)", async () => {
    (findAlternatives as jest.Mock).mockResolvedValue(samples);
    const { queryByText } = render(
      <AlternativesSection
        scannedBarcode="orig"
        categoryTag="en:cookies"
        currentScore={75}
        isPremium={false}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    await waitFor(() => {
      expect(queryByText(/Meilleures alternatives/i)).toBeNull();
    });
    expect(findAlternatives).not.toHaveBeenCalled();
  });

  it('Premium : affiche les 3 cartes sans paywall', async () => {
    (findAlternatives as jest.Mock).mockResolvedValue(samples);
    const { findByText, queryByText } = render(
      <AlternativesSection
        scannedBarcode="orig"
        categoryTag="en:cookies"
        currentScore={40}
        isPremium={true}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    expect(await findByText(/Meilleures alternatives/i)).toBeTruthy();
    expect(await findByText('Bio A')).toBeTruthy();
    expect(await findByText('Bio B')).toBeTruthy();
    expect(await findByText('Bio C')).toBeTruthy();
    expect(queryByText(/Débloquer/i)).toBeNull();
  });

  it('Free : preview 1 carte + paywall (R3 : preview avant paywall)', async () => {
    (findAlternatives as jest.Mock).mockResolvedValue(samples);
    const { findByText, queryByText } = render(
      <AlternativesSection
        scannedBarcode="orig"
        categoryTag="en:cookies"
        currentScore={40}
        isPremium={false}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    expect(await findByText(/Meilleures alternatives/i)).toBeTruthy();
    expect(await findByText('Bio A')).toBeTruthy();
    // 2 et 3 cachés derrière paywall
    expect(queryByText('Bio B')).toBeNull();
    expect(queryByText('Bio C')).toBeNull();
    expect(await findByText(/29,99€\s*\/\s*an/)).toBeTruthy();
  });

  it("ne s'affiche pas si findAlternatives renvoie un tableau vide", async () => {
    (findAlternatives as jest.Mock).mockResolvedValue([]);
    const { queryByText } = render(
      <AlternativesSection
        scannedBarcode="orig"
        categoryTag="en:cookies"
        currentScore={40}
        isPremium={true}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    await waitFor(() => {
      expect(findAlternatives).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(queryByText(/Meilleures alternatives/i)).toBeNull();
    });
  });
});
