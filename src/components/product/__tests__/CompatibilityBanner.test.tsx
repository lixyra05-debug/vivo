import { render } from '@testing-library/react-native';
import { CompatibilityBanner } from '../CompatibilityBanner';
import type { CompatibilityResult } from '@/src/lib/api/types';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const compatibleResult: CompatibilityResult = {
  isCompatible: true,
  score: 80,
  incompatibilities: [],
  compatibilityPercentage: 100,
};

const incompatibleResult: CompatibilityResult = {
  isCompatible: false,
  score: 40,
  incompatibilities: [
    {
      type: 'allergy',
      labelFr: 'Contient gluten (allergie déclarée)',
      severity: 'blocker',
    },
    {
      type: 'condition',
      labelFr: 'Sucres élevés (25.0g/100g)',
      severity: 'warning',
    },
  ],
  compatibilityPercentage: 50,
};

describe('CompatibilityBanner', () => {
  it('retourne null si result est null', () => {
    const { toJSON } = render(<CompatibilityBanner result={null} />);
    expect(toJSON()).toBeNull();
  });

  it('affiche "Compatible avec votre profil" quand isCompatible', () => {
    const { getByText } = render(<CompatibilityBanner result={compatibleResult} />);
    expect(getByText('Compatible avec votre profil')).toBeTruthy();
  });

  it("affiche les motifs d'incompatibilité quand !isCompatible", () => {
    const { getByText } = render(
      <CompatibilityBanner result={incompatibleResult} />,
    );
    expect(getByText('Incompatible avec votre profil')).toBeTruthy();
    expect(getByText('Contient gluten (allergie déclarée)')).toBeTruthy();
  });
});
