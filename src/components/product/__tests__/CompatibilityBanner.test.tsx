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

/**
 * S3-3 — un bloc qui porte l'état « Vérification impossible » à la place du
 * bandeau (cosmétique dont aucun ingrédient n'a été évalué) remplace la phrase
 * générique par son propre constat. Le message de sécurité, lui, ne change
 * jamais : il est figé ici mot pour mot.
 */
describe('CompatibilityBanner — S3-3, constat propre au produit', () => {
  const SECURITE = "Vos allergies et restrictions n'ont pas pu être vérifiées.";
  const CONSTAT = "Aucun ingrédient de ce produit n'a pu être évalué.";
  const unverifiedResult: CompatibilityResult = {
    isCompatible: true,
    score: 100,
    incompatibilities: [
      { type: 'condition', labelFr: INSUFFICIENT_DATA_LABEL_FR, severity: 'warning' },
    ],
    compatibilityPercentage: 100,
    verificationStatus: 'insufficient_data',
  };

  it('le corps générique se termine par le message de sécurité, mot pour mot', () => {
    expect(UNVERIFIED_BODY.endsWith(SECURITE)).toBe(true);
  });

  it('avec un constat : il remplace la phrase générique, le message de sécurité reste', () => {
    const { queryAllByText, queryByText } = render(
      <CompatibilityBanner result={unverifiedResult} unverifiedLead={CONSTAT} />,
    );
    expect(queryAllByText(UNVERIFIED_TITLE)).toHaveLength(1);
    expect(queryByText(CONSTAT)).toBeTruthy();
    expect(queryByText(SECURITE)).toBeTruthy();
    expect(queryByText(UNVERIFIED_BODY)).toBeNull();
  });

  it('le constat ne change rien aux états compatible et incompatible', () => {
    for (const result of [compatibleResult, incompatibleResult]) {
      const { queryByText, unmount } = render(
        <CompatibilityBanner result={result} unverifiedLead={CONSTAT} />,
      );
      expect([result.isCompatible, queryByText(CONSTAT)]).toEqual([result.isCompatible, null]);
      unmount();
    }
  });
});
