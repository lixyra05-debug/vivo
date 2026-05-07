import { render } from '@testing-library/react-native';
import { FamilyProfilePills } from '../FamilyProfilePills';
import type { FamilyProfile } from '@/src/lib/family/family-store';

// ─── Mocks paramétrables (réinitialisés via beforeEach + mockReturnValue) ─────

let mockTier: 'free' | 'premium' | 'expert' = 'premium';
let mockProfiles: FamilyProfile[] = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('@/src/lib/hooks/usePremium', () => ({
  usePremium: () => ({
    tier: mockTier,
    isPremium: mockTier !== 'free',
    isExpert: mockTier === 'expert',
    isLoading: false,
    canAccess: () => mockTier !== 'free',
  }),
}));

jest.mock('@/src/lib/family/family-store', () => ({
  useFamilyProfiles: () => ({ data: mockProfiles, isLoading: false }),
  useSetActiveFamilyProfile: () => ({ mutate: jest.fn(), isPending: false }),
}));

function makeProfile(id: string, name: string, isActive = false): FamilyProfile {
  return {
    id,
    user_id: 'user-1',
    name,
    avatar_emoji: '🧑',
    age_group: 'adult',
    allergies: [],
    conditions: [],
    is_active: isActive,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  };
}

describe('FamilyProfilePills', () => {
  beforeEach(() => {
    mockTier = 'premium';
    mockProfiles = [];
  });

  it("rend null quand tier='free' même avec des profils", () => {
    mockTier = 'free';
    mockProfiles = [makeProfile('p1', 'Léa', true)];
    const { toJSON } = render(<FamilyProfilePills />);
    expect(toJSON()).toBeNull();
  });

  it("rend null quand tier='premium' mais aucune liste de profils", () => {
    mockTier = 'premium';
    mockProfiles = [];
    const { toJSON } = render(<FamilyProfilePills />);
    expect(toJSON()).toBeNull();
  });

  it('affiche le nom de chaque profil + la pill Gérer en mode premium', () => {
    mockTier = 'premium';
    mockProfiles = [
      makeProfile('p1', 'Léa', true),
      makeProfile('p2', 'Tom', false),
    ];
    const { getByText } = render(<FamilyProfilePills />);
    expect(getByText('Léa')).toBeTruthy();
    expect(getByText('Tom')).toBeTruthy();
    expect(getByText('Gérer')).toBeTruthy();
  });
});
