import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Activity,
  ArrowRight,
  Baby,
  HeartPulse,
  ShieldAlert,
  Sprout,
  User,
} from 'lucide-react-native';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { ProgressDots } from '@/src/components/ui/ProgressDots';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { TappableSelectableCard } from '@/src/components/onboarding/TappableSelectableCard';
import { HealthConsentModal } from '@/src/components/health/HealthConsentModal';
import { Colors } from '@/src/constants/colors';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import { hasHealthConsent, saveHealthConsent } from '@/src/lib/api/health-consent';
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

export default function OnboardingHealthProfileScreen() {
  const router = useRouter();
  const selected = useProfileStore((s) => s.draftHealthProfile);
  const setProfile = useProfileStore((s) => s.setDraftHealthProfile);

  const [consentGranted, setConsentGranted] = useState(false);
  const [consentVisible, setConsentVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hasHealthConsent().then((ok) => {
      if (!cancelled) setConsentGranted(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleContinue() {
    if (!consentGranted) {
      setConsentVisible(true);
      return;
    }
    router.push('/onboarding/allergies');
  }

  async function handleAcceptConsent() {
    await saveHealthConsent();
    setConsentGranted(true);
    setConsentVisible(false);
    router.push('/onboarding/allergies');
  }

  return (
    <ScreenContainer scroll>
      <View className="flex-1" style={{ gap: 20 }}>
        <FadeIn delay={0}>
          <View style={{ alignItems: 'center', paddingTop: 4 }}>
            <ProgressDots current={1} total={3} />
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 28,
                color: Colors.text,
                letterSpacing: -0.6,
              }}
            >
              Ton profil santé
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 15,
                color: Colors.textMuted,
                lineHeight: 22,
              }}
            >
              Le score s'adapte à tes besoins. Tu pourras le changer à tout moment.
            </Text>
          </View>
        </FadeIn>

        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {OPTIONS.map(({ value, title, description, Icon }, i) => {
            const isActive = selected === value;
            return (
              <FadeIn key={value} delay={140 + i * 60} style={{ width: '48%' }}>
                <TappableSelectableCard
                  title={title}
                  description={description}
                  selected={isActive}
                  onPress={() => setProfile(value)}
                  icon={<Icon color={isActive ? '#FFFFFF' : Colors.sage} size={22} strokeWidth={2.2} />}
                />
              </FadeIn>
            );
          })}
        </View>

        <FadeIn delay={520} style={{ marginTop: 'auto' }}>
          <PrimaryCTA
            label="Continuer"
            onPress={handleContinue}
            icon={<ArrowRight color="#FFFFFF" size={18} strokeWidth={2.2} />}
            disabled={!selected}
            accessibilityHint="Passe à l'étape des allergies"
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
