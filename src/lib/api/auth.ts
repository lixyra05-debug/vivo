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

/** Version courante des CGU acceptée à l'inscription (RGPD art. 7). */
export const CGU_VERSION = '1.0';

export interface SignUpOptions {
  /** Date ISO de consentement aux CGU/Politique de confidentialité. */
  consentAt: string;
  /** Version des CGU acceptée (ex. '1.0'). */
  cguVersion: string;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  options?: SignUpOptions,
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) throw error;

  // Si on a une session immédiate (confirmation email désactivée) ET un
  // consentement explicite, on stocke la preuve dans user_profiles.
  // Sinon, le consentement sera persisté après la première connexion via
  // saveConsentForUser().
  if (data.session && data.user && options) {
    const consentPayload = {
      id: data.user.id,
      consent_at: options.consentAt,
      cgu_version: options.cguVersion,
      updated_at: new Date().toISOString(),
    };
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(consentPayload, { onConflict: 'id' });
    if (profileError) {
      // Non-bloquant : on logge mais on ne fait pas échouer l'inscription.
      // eslint-disable-next-line no-console
      console.error('[signUpWithEmail] consent upsert failed', profileError);
    }
  }

  return { needsConfirmation: !data.session };
}

/**
 * Persiste la preuve de consentement après confirmation email
 * (cas où data.session est null au moment du signUp).
 */
export async function saveConsentForUser(
  userId: string,
  consentAt: string,
  cguVersion: string,
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: userId,
        consent_at: consentAt,
        cgu_version: cguVersion,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  if (error) throw error;
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
