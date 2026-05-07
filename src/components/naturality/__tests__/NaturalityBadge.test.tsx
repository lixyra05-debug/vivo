import { fireEvent, render } from '@testing-library/react-native';
import { NaturalityBadge } from '../NaturalityBadge';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/src/lib/hooks/usePremium', () => ({
  usePremium: () => ({
    tier: 'expert',
    isPremium: true,
    isExpert: true,
    isLoading: false,
    canAccess: () => true,
  }),
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

describe('NaturalityBadge', () => {
  it('rend null si la liste d\'ingrédients est vide', () => {
    const { toJSON } = render(<NaturalityBadge ingredientsList={null} />);
    expect(toJSON()).toBeNull();
  });

  it('affiche le count singulier quand 1 plante est détectée', () => {
    const { getByText } = render(
      <NaturalityBadge ingredientsList="eau, thym, sucre" />,
    );
    expect(getByText(/1 plante bénéfique détectée/i)).toBeTruthy();
  });

  it('affiche le count pluriel quand plusieurs plantes sont détectées', () => {
    const { getByText } = render(
      <NaturalityBadge ingredientsList="eau, thym, romarin, gingembre" />,
    );
    expect(getByText(/3 plantes bénéfiques détectées/i)).toBeTruthy();
  });

  it('expose la liste expandable au tap pour un Expert', () => {
    const { getByText, queryByText } = render(
      <NaturalityBadge ingredientsList="eau, thym, sucre" />,
    );
    // Pas encore expanded → la fiche plante n'est pas visible
    expect(queryByText('Thym')).toBeNull();

    fireEvent.press(getByText(/1 plante bénéfique détectée/i));
    // Maintenant la liste est expandable
    expect(getByText('Thym')).toBeTruthy();
  });
});
