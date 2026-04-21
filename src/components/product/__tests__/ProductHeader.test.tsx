import { render } from '@testing-library/react-native';
import { ProductHeader } from '../ProductHeader';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

describe('ProductHeader', () => {
  it('affiche le nom et la marque du produit', () => {
    const { getByText } = render(
      <ProductHeader
        name="Biscuits au chocolat"
        brand="Bonneterre"
        imageUrl={null}
        score={72}
        isOrganic={true}
      />,
    );
    expect(getByText('Biscuits au chocolat')).toBeTruthy();
    expect(getByText('Bonneterre')).toBeTruthy();
  });

  it('affiche la chip Bio quand isOrganic est vrai', () => {
    const { getByText } = render(
      <ProductHeader
        name="Pomme"
        brand={null}
        imageUrl={null}
        score={95}
        isOrganic={true}
      />,
    );
    expect(getByText('Bio')).toBeTruthy();
  });

  it('utilise le fallback "Produit" quand le nom est absent', () => {
    const { getByText } = render(
      <ProductHeader
        name={null}
        brand={null}
        imageUrl={null}
        score={40}
        isOrganic={false}
      />,
    );
    expect(getByText('Produit')).toBeTruthy();
  });

  it('affiche la catégorie quand fournie', () => {
    const { getByText } = render(
      <ProductHeader
        name="Yaourt"
        brand="La Fermière"
        imageUrl={null}
        score={65}
        isOrganic={false}
        category="Produits laitiers"
      />,
    );
    expect(getByText('Produits laitiers')).toBeTruthy();
  });
});
