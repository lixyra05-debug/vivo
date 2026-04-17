import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import type { HealthProfile, UserProfileRow } from './types';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

function parseTokensFromUrl(url: string): {
  access_token: string | null;
  refresh_token: string | null;
} {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return { access_token: null, refresh_token: null };
  const params = new URLSearchParams(url.substring(hashIndex + 1));
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
  };
}

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('URL OAuth Google manquante');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) return;

  const { access_token, refresh_token } = parseTokensFromUrl(result.url);
  if (!access_token || !refresh_token) {
    throw new Error('Tokens Google introuvables dans la redirection');
  }
  const { error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw sessionError;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchUserProfile(userId: string): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserProfileRow | null) ?? null;
}

export interface UpsertProfileInput {
  userId: string;
  displayName: string | null;
  healthProfile: HealthProfile;
  allergies: string[];
  intolerances: string[];
}

export async function upsertUserProfile(input: UpsertProfileInput): Promise<UserProfileRow> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: input.userId,
      display_name: input.displayName,
      health_profile: input.healthProfile,
      allergies: input.allergies,
      intolerances: input.intolerances,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as UserProfileRow;
}
