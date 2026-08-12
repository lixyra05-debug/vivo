import { render } from '@testing-library/react-native';
import {
  CompatibilityBanner,
  UNVERIFIED_BODY,
  UNVERIFIED_TITLE,
} from '../CompatibilityBanner';
import { INSUFFICIENT_DATA_LABEL_FR } from '@/src/lib/scoring/compatibility-engine';
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

  it("n'annonce PAS « Compatible » quand la vérification n'a pas pu être faite", () => {
    // Le cas dangereux : allergie déclarée, produit sans liste d'ingrédients.
    // `isCompatible` reste true (aucun blocker levable), mais rien n'a été
    // contrôlé — la bannière doit le dire au lieu de rassurer.
    const unverifiedResult: CompatibilityResult = {
      isCompatible: true,
      score: 100,
      incompatibilities: [
        {
          type: 'condition',
          labelFr: INSUFFICIENT_DATA_LABEL_FR,
          severity: 'warning',
        },
      ],
      compatibilityPercentage: 100,
      verificationStatus: 'insufficient_data',
    };
    const { getByText, queryByText } = render(
      <CompatibilityBanner result={unverifiedResult} />,
    );
    expect(getByText(UNVERIFIED_TITLE)).toBeTruthy();
    expect(getByText(UNVERIFIED_BODY)).toBeTruthy();
    expect(queryByText('Compatible avec votre profil')).toBeNull();
  });

  it('ne répète pas le motif « données insuffisantes » sous son propre titre', () => {
    const unverifiedResult: CompatibilityResult = {
      isCompatible: true,
      score: 100,
      incompatibilities: [
        { type: 'condition', labelFr: INSUFFICIENT_DATA_LABEL_FR, severity: 'warning' },
      ],
      compatibilityPercentage: 100,
      verificationStatus: 'insufficient_data',
    };
    const { queryByText } = render(<CompatibilityBanner result={unverifiedResult} />);
    expect(queryByText(INSUFFICIENT_DATA_LABEL_FR)).toBeNull();
  });

  it('rend les warnings dans la branche compatible', () => {
    // Diabète + 45 g de sucres : aucun blocker, donc « Compatible » — mais le
    // constat existait et restait invisible.
    const compatibleWithWarnings: CompatibilityResult = {
      isCompatible: true,
      score: 60,
      incompatibilities: [
        {
          type: 'condition',
          labelFr: 'Sucres élevés (45.0g/100g)',
          severity: 'warning',
        },
      ],
      compatibilityPercentage: 66,
      verificationStatus: 'verified',
    };
    const { getByText } = render(
      <CompatibilityBanner result={compatibleWithWarnings} />,
    );
    expect(getByText('Compatible avec votre profil')).toBeTruthy();
    expect(getByText('Sucres élevés (45.0g/100g)')).toBeTruthy();
  });

  it('reste inchangée quand verificationStatus est absent (données anciennes)', () => {
    const { getByText } = render(<CompatibilityBanner result={compatibleResult} />);
    expect(getByText('Compatible avec votre profil')).toBeTruthy();
  });
});
