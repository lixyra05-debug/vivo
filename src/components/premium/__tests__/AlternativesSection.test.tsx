/**
 * AlternativesSection — section "Alternatives" sur la fiche produit.
 *
 * Règles :
 *   • Affichage piloté par les props (plus de fetch interne)
 *   • Free : preview 1 carte opacity 0.25 + paywall + teaser
 *   • Premium : 5 cartes en stack vertical
 *   • Loading : skeleton, sans paywall
 *   • alternatives === [] && !isLoading → null
 *   • Titre dynamique selon currentScore (3 seuils)
 */

import { render } from '@testing-library/react-native';
import { AlternativesSection } from '../AlternativesSection';
import type { Alternative } from '@/src/lib/api/smart-alternatives';

jest.mock('@/src/lib/api/smart-alternatives', () => ({
  __esModule: true,
  getAlternativesTitle: (score: number): string => {
    if (score < 50) return 'Des alternatives bien meilleures existent';
    if (score < 80) return 'Alternatives plus saines';
    return 'Alternatives dans cette catégorie';
  },
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const samples: Alternative[] = [
  {
    barcode: 'a1',
    name: 'Bio A',
    brand: 'BX',
    imageUrl: 'https://img/a',
    score: 90,
    scoreDelta: 50,
    category: 'en:cookies',
    novaGroup: 1,
    additivesCount: 0,
  },
  {
    barcode: 'b1',
    name: 'Bio B',
    brand: 'BY',
    imageUrl: 'https://img/b',
    score: 85,
    scoreDelta: 45,
    category: 'en:cookies',
    novaGroup: 2,
    additivesCount: 1,
  },
  {
    barcode: 'c1',
    name: 'Bio C',
    brand: 'BZ',
    imageUrl: 'https://img/c',
    score: 80,
    scoreDelta: 40,
    category: 'en:cookies',
    novaGroup: 3,
    additivesCount: 2,
  },
  {
    barcode: 'd1',
    name: 'Bio D',
    brand: 'BW',
    imageUrl: 'https://img/d',
    score: 75,
    scoreDelta: 35,
    category: 'en:cookies',
    novaGroup: 3,
    additivesCount: 3,
  },
  {
    barcode: 'e1',
    name: 'Bio E',
    brand: 'BV',
    imageUrl: 'https://img/e',
    score: 70,
    scoreDelta: 30,
    category: 'en:cookies',
    novaGroup: 4,
    additivesCount: 5,
  },
];

describe('AlternativesSection', () => {
  it('Premium : affiche les 5 cartes sans paywall', () => {
    const { getByText, queryByText } = render(
      <AlternativesSection
        alternatives={samples}
        isPremium={true}
        currentScore={40}
        isLoading={false}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    expect(getByText('Bio A')).toBeTruthy();
    expect(getByText('Bio B')).toBeTruthy();
    expect(getByText('Bio C')).toBeTruthy();
    expect(getByText('Bio D')).toBeTruthy();
    expect(getByText('Bio E')).toBeTruthy();
    expect(queryByText(/Débloquer/i)).toBeNull();
  });

  it('Free : preview 1 carte (opacity 0.25) + paywall + teaser', () => {
    const { getByText, getByTestId, queryByText } = render(
      <AlternativesSection
        alternatives={samples}
        isPremium={false}
        currentScore={40}
        isLoading={false}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    expect(getByText('Bio A')).toBeTruthy();
    // Cartes 2-5 cachées derrière le paywall
    expect(queryByText('Bio B')).toBeNull();
    expect(queryByText('Bio C')).toBeNull();
    expect(queryByText('Bio D')).toBeNull();
    expect(queryByText('Bio E')).toBeNull();
    // Teaser
    expect(getByText(/4 autres alternatives premium/i)).toBeTruthy();
    // Wrapper opacity 0.25 (testID)
    const teaserWrap = getByTestId('alternatives-free-preview');
    expect(teaserWrap.props.style).toEqual(
      expect.objectContaining({ opacity: 0.25 }),
    );
    // Paywall
    expect(getByText(/Débloquer/)).toBeTruthy();
  });

  it('Titre dynamique : score < 50 → "bien meilleures"', () => {
    const { getByText } = render(
      <AlternativesSection
        alternatives={samples}
        isPremium={true}
        currentScore={30}
        isLoading={false}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    expect(getByText(/bien meilleures/i)).toBeTruthy();
  });

  it('Titre dynamique : 50 ≤ score < 80 → "plus saines"', () => {
    const { getByText } = render(
      <AlternativesSection
        alternatives={samples}
        isPremium={true}
        currentScore={65}
        isLoading={false}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    expect(getByText(/plus saines/i)).toBeTruthy();
  });

  it('Titre dynamique : score ≥ 80 → "dans cette catégorie"', () => {
    const { getByText } = render(
      <AlternativesSection
        alternatives={samples}
        isPremium={true}
        currentScore={85}
        isLoading={false}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    expect(getByText(/dans cette catégorie/i)).toBeTruthy();
  });

  it('isLoading=true : rend skeleton, aucune carte visible, pas de paywall', () => {
    const { queryByText, getByTestId } = render(
      <AlternativesSection
        alternatives={[]}
        isPremium={false}
        currentScore={40}
        isLoading={true}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    expect(queryByText('Bio A')).toBeNull();
    expect(queryByText(/Débloquer/i)).toBeNull();
    // Skeleton testID
    expect(getByTestId('alternatives-skeleton')).toBeTruthy();
  });

  it('alternatives vides && !isLoading → renvoie null', () => {
    const { toJSON } = render(
      <AlternativesSection
        alternatives={[]}
        isPremium={false}
        currentScore={40}
        isLoading={false}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it('Free avec une seule alternative : pas de teaser pluriel "et 0 autres"', () => {
    const { getByText, queryByText } = render(
      <AlternativesSection
        alternatives={[samples[0]]}
        isPremium={false}
        currentScore={40}
        isLoading={false}
        onUnlock={() => undefined}
        onPressAlt={() => undefined}
      />,
    );
    expect(getByText('Bio A')).toBeTruthy();
    expect(queryByText(/0 autres/)).toBeNull();
  });
});
