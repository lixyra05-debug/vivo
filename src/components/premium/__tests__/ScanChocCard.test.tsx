/**
 * ScanChocCard — carte choc partageable au format portrait 9:16.
 * Affiche le produit mal noté, son score, jusqu'à 3 problèmes détectés
 * et éventuellement une alternative mieux notée.
 */

import { render } from '@testing-library/react-native';
import { ScanChocCard } from '../ScanChocCard';

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

describe('ScanChocCard', () => {
  const baseProps = {
    productName: 'Coca-Cola Original',
    productImage: 'https://example.com/img.jpg',
    score: 25,
    problems: [
      { emoji: '💀', label: "Cocktail d'additifs (7)" },
      { emoji: '🍳', label: 'Ultra-transformé (NOVA 4)' },
      { emoji: '🍬', label: 'Excès de sucres' },
    ],
    alternative: {
      name: 'Coca-Cola Zéro Sucre',
      score: 38,
      imageUrl: 'https://example.com/alt.jpg',
    },
  };

  it('affiche le nom du produit et les 3 problèmes détectés', () => {
    const { getByText } = render(<ScanChocCard {...baseProps} />);
    expect(getByText('Coca-Cola Original')).toBeTruthy();
    expect(getByText("Cocktail d'additifs (7)")).toBeTruthy();
    expect(getByText('Ultra-transformé (NOVA 4)')).toBeTruthy();
    expect(getByText('Excès de sucres')).toBeTruthy();
  });

  it('affiche le score 25 du produit', () => {
    const { getByText } = render(<ScanChocCard {...baseProps} />);
    expect(getByText('25')).toBeTruthy();
  });
});
