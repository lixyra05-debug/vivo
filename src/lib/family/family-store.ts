/**
 * Family store — CRUD des profils familiaux (Mode Famille, Premium tier).
 *
 * Source de vérité : table `family_profiles` (migration 014).
 * Contraintes DB :
 *   - max 4 profils par user (trigger `enforce_max_family_profiles`)
 *   - un seul `is_active=true` par user (trigger `enforce_single_active_family_profile`)
 *   - le trigger `set_updated_at_family_profiles` met à jour `updated_at` automatiquement
 *
 * Côté client on n'a donc PAS à désactiver les autres profils manuellement.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { supabase } from '../api/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type FamilyAgeGroup = 'adult' | 'child' | 'baby' | 'pregnant';

export interface FamilyProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_emoji: string;
  age_group: FamilyAgeGroup;
  allergies: string[];
  conditions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFamilyProfileInput {
  name: string;
  avatar_emoji: string;
  age_group: FamilyAgeGroup;
  allergies?: string[];
  conditions?: string[];
  is_active?: boolean;
}

export interface UpdateFamilyProfileInput {
  id: string;
  name?: string;
  avatar_emoji?: string;
  age_group?: FamilyAgeGroup;
  allergies?: string[];
  conditions?: string[];
}

export const MAX_FAMILY_PROFILES = 4;

const ONE_MINUTE_MS = 60_000;

// ─── Helpers internes (testables sans React Query) ──────────────────────────

/**
 * Lit les profils familiaux d'un user, triés par created_at ascendant.
 * Renvoie [] si userId vide ou si erreur Supabase.
 */
export async function fetchFamilyProfiles(
  userId: string | null | undefined,
): Promise<FamilyProfile[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('family_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data ?? []) as FamilyProfile[];
}

/**
 * Crée un profil familial. Le trigger DB plafonne à 4 par user.
 * Le trigger `enforce_single_active_family_profile` désactive automatiquement
 * les autres profils si `is_active = true`.
 */
export async function createFamilyProfile(
  userId: string,
  input: CreateFamilyProfileInput,
): Promise<FamilyProfile> {
  const payload = {
    user_id: userId,
    name: input.name,
    avatar_emoji: input.avatar_emoji,
    age_group: input.age_group,
    allergies: input.allergies ?? [],
    conditions: input.conditions ?? [],
    is_active: input.is_active ?? false,
  };
  const { data, error } = await supabase
    .from('family_profiles')
    .insert(payload)
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Création du profil familial impossible');
  }
  return data as FamilyProfile;
}

/**
 * Met à jour un profil familial existant.
 */
export async function updateFamilyProfile(
  input: UpdateFamilyProfileInput,
): Promise<FamilyProfile> {
  const { id, ...patch } = input;
  const { data, error } = await supabase
    .from('family_profiles')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Mise à jour du profil familial impossible');
  }
  return data as FamilyProfile;
}

/**
 * Supprime un profil familial.
 */
export async function deleteFamilyProfile(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('family_profiles')
    .delete()
    .eq('id', profileId);
  if (error) {
    throw new Error(error.message ?? 'Suppression du profil familial impossible');
  }
}

/**
 * Active un profil familial. Le trigger DB désactive automatiquement les autres.
 */
export async function setActiveFamilyProfile(
  profileId: string,
): Promise<FamilyProfile> {
  const { data, error } = await supabase
    .from('family_profiles')
    .update({ is_active: true })
    .eq('id', profileId)
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Activation du profil familial impossible');
  }
  return data as FamilyProfile;
}

// ─── Hooks React Query ──────────────────────────────────────────────────────

/**
 * Query hook : liste des profils familiaux d'un user.
 * `enabled` faux si userId vide pour éviter l'appel Supabase.
 */
export function useFamilyProfiles(
  userId: string | null | undefined,
): UseQueryResult<FamilyProfile[]> {
  return useQuery({
    queryKey: ['family_profiles', userId ?? null] as const,
    queryFn: () => fetchFamilyProfiles(userId),
    enabled: Boolean(userId),
    staleTime: ONE_MINUTE_MS,
  });
}

/**
 * Sélecteur dérivé : profil familial actif courant, ou `null`.
 * Pas de query séparée — on lit `useFamilyProfiles` côté React.
 */
export function useActiveFamilyProfile(
  userId: string | null | undefined,
): FamilyProfile | null {
  const { data } = useFamilyProfiles(userId);
  return data?.find((p) => p.is_active) ?? null;
}

/**
 * Mutation : crée un nouveau profil familial.
 * Invalide la query `['family_profiles', userId]` à la fin.
 */
export function useCreateFamilyProfile(
  userId: string | null | undefined,
): UseMutationResult<FamilyProfile, Error, CreateFamilyProfileInput> {
  const queryClient = useQueryClient();
  return useMutation<FamilyProfile, Error, CreateFamilyProfileInput>({
    mutationFn: (input: CreateFamilyProfileInput) => {
      if (!userId) {
        return Promise.reject(new Error('Non authentifié'));
      }
      return createFamilyProfile(userId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['family_profiles', userId ?? null] });
    },
  });
}

/**
 * Mutation : met à jour un profil familial existant.
 */
export function useUpdateFamilyProfile(
  userId: string | null | undefined,
): UseMutationResult<FamilyProfile, Error, UpdateFamilyProfileInput> {
  const queryClient = useQueryClient();
  return useMutation<FamilyProfile, Error, UpdateFamilyProfileInput>({
    mutationFn: (input: UpdateFamilyProfileInput) => updateFamilyProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['family_profiles', userId ?? null] });
    },
  });
}

/**
 * Mutation : supprime un profil familial.
 */
export function useDeleteFamilyProfile(
  userId: string | null | undefined,
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (profileId: string) => deleteFamilyProfile(profileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['family_profiles', userId ?? null] });
    },
  });
}

/**
 * Mutation : active un profil familial. Le trigger DB désactive les autres.
 */
export function useSetActiveFamilyProfile(
  userId: string | null | undefined,
): UseMutationResult<FamilyProfile, Error, string> {
  const queryClient = useQueryClient();
  return useMutation<FamilyProfile, Error, string>({
    mutationFn: (profileId: string) => setActiveFamilyProfile(profileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['family_profiles', userId ?? null] });
    },
  });
}
