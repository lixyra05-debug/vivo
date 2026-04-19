import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { ProgressDots } from '@/src/components/ui/ProgressDots';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { TappableChip } from '@/src/components/onboarding/TappableChip';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';

const ALLERGENS = ['Gluten', 'Lactose', 'Arachides', 'Fruits à coque', 'Œufs', 'Soja'];

export default function OnboardingAllergiesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const draftAllergies = useProfileStore((s) => s.draftAllergies);
  const toggleAllergy = useProfileStore((s) => s.toggleDraftAllergy);
  const saveOnboarding = useProfileStore((s) => s.saveOnboarding);
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    if (!user) {
      Alert.alert('Session expirée', 'Reconnecte-toi pour continuer.');
      return;
    }
    setSaving(true);
    try {
      await saveOnboarding(user.id);
      router.replace('/(tabs)/scan');
    } catch (err) {
      Alert.alert(
        'Enregistrement impossible',
        err instanceof Error ? err.message : 'Erreur inconnue',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="flex-1" style={{ gap: 20 }}>
        <FadeIn delay={0}>
          <View style={{ alignItems: 'center', paddingTop: 4 }}>
            <ProgressDots current={2} total={3} />
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
              Allergies & intolérances
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 15,
                color: Colors.textMuted,
                lineHeight: 22,
              }}
            >
              Vivo t'alertera si un produit contient ces ingrédients. Sélection facultative.
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={180}>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {ALLERGENS.map((allergen) => (
              <TappableChip
                key={allergen}
                label={allergen}
                selected={draftAllergies.includes(allergen)}
                onPress={() => toggleAllergy(allergen)}
              />
            ))}
          </View>
        </FadeIn>

        <View style={{ marginTop: 'auto', gap: 12 }}>
          <FadeIn delay={280}>
            <PrimaryCTA
              label={saving ? 'Enregistrement…' : 'Terminer'}
              onPress={handleFinish}
              icon={<Check color="#FFFFFF" size={18} strokeWidth={2.4} />}
              disabled={saving}
              accessibilityHint="Finalise ton profil et ouvre l'app"
            />
          </FadeIn>

          <FadeIn delay={340}>
            <Pressable
              onPress={handleFinish}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Passer cette étape"
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 14,
                  color: Colors.textMuted,
                  textDecorationLine: 'underline',
                }}
              >
                Passer cette étape
              </Text>
            </Pressable>
          </FadeIn>
        </View>
      </View>
    </ScreenContainer>
  );
}
