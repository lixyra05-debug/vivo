import { create } from 'zustand';
import { fetchUserProfile, upsertUserProfile } from '../api/auth';
import type { HealthProfile, UserProfileRow } from '../api/types';

interface ProfileState {
  profile: UserProfileRow | null;
  profileLoaded: boolean;
  isLoading: boolean;
  isSaving: boolean;
  draftDisplayName: string;
  draftHealthProfile: HealthProfile;
  draftAllergies: string[];
  draftIntolerances: string[];
  loadProfile: (userId: string) => Promise<void>;
  setDraftDisplayName: (name: string) => void;
  setDraftHealthProfile: (profile: HealthProfile) => void;
  toggleDraftAllergy: (allergy: string) => void;
  toggleDraftIntolerance: (intolerance: string) => void;
  saveOnboarding: (userId: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_DRAFT = {
  draftDisplayName: '',
  draftHealthProfile: 'standard' as HealthProfile,
  draftAllergies: [] as string[],
  draftIntolerances: [] as string[],
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  profileLoaded: false,
  isLoading: false,
  isSaving: false,
  ...INITIAL_DRAFT,

  loadProfile: async (userId) => {
    set({ isLoading: true });
    try {
      const profile = await fetchUserProfile(userId);
      set({
        profile,
        profileLoaded: true,
        draftDisplayName: profile?.display_name ?? '',
        draftHealthProfile: profile?.health_profile ?? 'standard',
        draftAllergies: profile?.allergies ?? [],
        draftIntolerances: profile?.intolerances ?? [],
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setDraftDisplayName: (draftDisplayName) => set({ draftDisplayName }),
  setDraftHealthProfile: (draftHealthProfile) => set({ draftHealthProfile }),

  toggleDraftAllergy: (allergy) =>
    set((state) => ({
      draftAllergies: state.draftAllergies.includes(allergy)
        ? state.draftAllergies.filter((a) => a !== allergy)
        : [...state.draftAllergies, allergy],
    })),

  toggleDraftIntolerance: (intolerance) =>
    set((state) => ({
      draftIntolerances: state.draftIntolerances.includes(intolerance)
        ? state.draftIntolerances.filter((i) => i !== intolerance)
        : [...state.draftIntolerances, intolerance],
    })),

  saveOnboarding: async (userId) => {
    set({ isSaving: true });
    try {
      const {
        draftDisplayName,
        draftHealthProfile,
        draftAllergies,
        draftIntolerances,
      } = get();
      const profile = await upsertUserProfile({
        userId,
        displayName: draftDisplayName.trim() || null,
        healthProfile: draftHealthProfile,
        allergies: draftAllergies,
        intolerances: draftIntolerances,
      });
      set({ profile, profileLoaded: true });
    } finally {
      set({ isSaving: false });
    }
  },

  reset: () =>
    set({
      profile: null,
      profileLoaded: false,
      isLoading: false,
      isSaving: false,
      ...INITIAL_DRAFT,
    }),
}));
