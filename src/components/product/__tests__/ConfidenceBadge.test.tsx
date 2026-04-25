import { render } from '@testing-library/react-native';
import { ConfidenceBadge } from '../ConfidenceBadge';
import type { ProductConfidence } from '@/src/lib/api/types';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const verified: ProductConfidence = {
  level: 'verified',
  labelFr: 'Vérifié fabricant',
  color: '#4CAF50',
  reasons: ['Toutes les données essentielles renseignées'],
};

const community: ProductConfidence = {
  level: 'community',
  labelFr: 'Contribution communautaire',
  color: '#C4A882',
  reasons: ['Informations partielles'],
};

const unverified: ProductConfidence = {
  level: 'unverified',
  labelFr: 'À vérifier',
  color: '#FF9800',
  reasons: ['À vérifier avant usage'],
};

describe('ConfidenceBadge', () => {
  it('affiche le label "Vérifié fabricant"', () => {
    const { getByText } = render(<ConfidenceBadge confidence={verified} />);
    expect(getByText('Vérifié fabricant')).toBeTruthy();
  });

  it('affiche le label "Contribution communautaire"', () => {
    const { getByText } = render(<ConfidenceBadge confidence={community} />);
    expect(getByText('Contribution communautaire')).toBeTruthy();
  });

  it('affiche le label "À vérifier"', () => {
    const { getByText } = render(<ConfidenceBadge confidence={unverified} />);
    expect(getByText('À vérifier')).toBeTruthy();
  });
});
