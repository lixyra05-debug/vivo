/**
 * health-consent — RGPD art. 9 + Apple Guideline 5.1.1.
 *
 * Persiste localement (AsyncStorage) le consentement explicite de l'utilisateur
 * pour le traitement de ses données de santé (allergies, conditions, profil).
 * Vérifié avant tout enregistrement de health-profile (onboarding + settings).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const HEALTH_CONSENT_KEY = '@vivo_health_consent';
export const HEALTH_CONSENT_VERSION = '1.0';

export interface HealthConsent {
  accepted: boolean;
  date: string;
  version: string;
}

export async function getHealthConsent(): Promise<HealthConsent | null> {
  try {
    const raw = await AsyncStorage.getItem(HEALTH_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HealthConsent;
    if (!parsed.accepted || parsed.version !== HEALTH_CONSENT_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveHealthConsent(): Promise<void> {
  const payload: HealthConsent = {
    accepted: true,
    date: new Date().toISOString(),
    version: HEALTH_CONSENT_VERSION,
  };
  await AsyncStorage.setItem(HEALTH_CONSENT_KEY, JSON.stringify(payload));
}

export async function hasHealthConsent(): Promise<boolean> {
  const consent = await getHealthConsent();
  return consent !== null && consent.accepted;
}
