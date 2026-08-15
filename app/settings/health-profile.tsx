import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  Baby,
  Check,
  HeartPulse,
  ShieldAlert,
  Sprout,
  User,
} from 'lucide-react-native';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Input } from '@/src/components/ui/Input';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { TappableChip } from '@/src/components/onboarding/TappableChip';
import { TappableSelectableCard } from '@/src/components/onboarding/TappableSelectableCard';
import { HealthConsentModal } from '@/src/components/health/HealthConsentModal';
import { Colors } from '@/src/constants/colors';
import { upsertUserProfile } from '@/src/lib/api/auth';
import { hasHealthConsent, saveHealthConsent } from '@/src/lib/api/health-consent';
import { normalizeAllergenKey } from '@/src/lib/scoring/compatibility-engine';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import type { HealthProfile } from '@/src/lib/api/types';

interface ProfileOption {
  value: HealthProfile;
  title: string;
  description: string;
  Icon: typeof User;
}

const OPTIONS: ProfileOption[] = [
  { value: 'standard', title: 'Standard', description: 'Algorithme par défaut', Icon: User },
  { value: 'diabetic', title: 'Diabète / Poids', description: 'Malus max édulcorants', Icon: HeartPulse },
  { value: 'athlete', title: 'Sportif', description: 'Blocage aspartame & MSG', Icon: Activity },
  { value: 'child', title: 'Enfant', description: 'Tolérance zéro additifs', Icon: Baby },
  { value: 'pregnant', title: 'Femme enceinte', description: 'Tolérance zéro additifs', Icon: Sprout },
  { value: 'intolerant', title: 'Intolérances', description: 'Pénalité lactose / gluten', Icon: ShieldAlert },
];

/**
 * Allergènes — clés canoniques de `compatibility-engine` (modèle :
 * `app/family/edit.tsx`). Le LABEL est affiché, la CLÉ est stockée : contrat
 * verrouillé par `app/__tests__/allergen-key-contract.test.ts`. Doit rester
 * identique à la liste de `app/onboarding/allergies.tsx` (même verrou).
 */
export interface AllergenOption {
  key: string;
  label: string;
}

export const ALLERGENS: readonly AllergenOption[] = [
  { key: 'gluten', label: 'Gluten' },
  { key: 'lactose', label: 'Lactose' },
  { key: 'arachides', label: 'Arachides' },
  { key: 'fruits_a_coque', label: 'Fruits à coque' },
  { key: 'oeufs', label: 'Œufs' },
  { key: 'soja', label: 'Soja' },
];

const INTOLERANCES = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'lactose', label: 'Lactose' },
];

export default function SettingsHealthProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const loadProfile = useProfileStore((s) => s.loadProfile);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(
    profile?.health_profile ?? 'standard',
  );
  // Migration paresseuse : les profils enregistrés avant l'alignement des
  // écrans (août 2026) stockent des libellés (« Gluten », « Œufs »). On les
  // ramène aux clés canoniques À LA LECTURE pour que les chips s'affichent
  // sélectionnées — et l'enregistrement réécrira des clés.
  const [allergies, setAllergies] = useState<string[]>(
    (profile?.allergies ?? []).map(normalizeAllergenKey),
  );
  const [intolerances, setIntolerances] = useState<string[]>(profile?.intolerances ?? []);
  const [saving, setSaving] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [consentVisible, setConsentVisible] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setHealthProfile(profile.health_profile);
    setAllergies((profile.allergies ?? []).map(normalizeAllergenKey));
    setIntolerances(profile.intolerances ?? []);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    hasHealthConsent().then((ok) => {
      if (!cancelled) setConsentGranted(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function persistProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await upsertUserProfile({
        userId: user.id,
        displayName: displayName.trim() || null,
        healthProfile,
        allergies,
        intolerances,
      });
      await loadProfile(user.id);
      router.back();
    } catch (err) {
      Alert.alert(
        'Enregistrement impossible',
        err instanceof Error ? err.message : 'Erreur inconnue',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!user) return;
    if (!consentGranted) {
      setConsentVisible(true);
      return;
    }
    void persistProfile();
  }

  async function handleAcceptConsent() {
    await saveHealthConsent();
    setConsentGranted(true);
    setConsentVisible(false);
    void persistProfile();
  }

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 22 }}>
        <FadeIn delay={0}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={styles.backButton}
            >
              <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
            </Pressable>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 22,
                color: Colors.text,
                letterSpacing: -0.4,
                flex: 1,
              }}
            >
              Mon profil
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionLabel}>Prénom</Text>
            <GlassCard style={{ paddingHorizontal: 6, paddingVertical: 6 }}>
              <Input
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Ton prénom"
                autoCapitalize="words"
                style={{ borderWidth: 0 } as never}
              />
            </GlassCard>
          </View>
        </FadeIn>

        <FadeIn delay={160}>
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionLabel}>Profil santé</Text>
            <View style={styles.gridRow}>
              {OPTIONS.map(({ value, title, description, Icon }) => {
                const isActive = healthProfile === value;
                return (
                  <View key={value} style={{ width: '48%' }}>
                    <TappableSelectableCard
                      title={title}
                      description={description}
                      selected={isActive}
                      onPress={() => setHealthProfile(value)}
                      icon={
                        <Icon
                          color={isActive ? '#FFFFFF' : Colors.sage}
                          size={22}
                          strokeWidth={2.2}
                        />
                      }
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={240}>
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionLabel}>Allergies</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ALLERGENS.map(({ key, label }) => (
                <TappableChip
                  key={key}
                  label={label}
                  selected={allergies.includes(key)}
                  onPress={() => setAllergies(toggle(allergies, key))}
                />
              ))}
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={320}>
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionLabel}>Intolérances</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {INTOLERANCES.map((i) => (
                <TappableChip
                  key={i.value}
                  label={i.label}
                  selected={intolerances.includes(i.value)}
                  onPress={() => setIntolerances(toggle(intolerances, i.value))}
                />
              ))}
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={400}>
          <PrimaryCTA
            label={saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            onPress={handleSave}
            icon={<Check color="#FFFFFF" size={18} strokeWidth={2.4} />}
            disabled={saving}
            accessibilityHint="Met à jour ton profil santé"
          />
        </FadeIn>
      </View>
      <HealthConsentModal
        visible={consentVisible}
        onAccept={handleAcceptConsent}
        onCancel={() => setConsentVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    shadowColor: '#587858',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
