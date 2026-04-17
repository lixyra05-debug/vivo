import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';

const ALLERGENS = [
  'Gluten',
  'Lactose',
  'Arachides',
  'Fruits à coque',
  'Œufs',
  'Soja',
];

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
        err instanceof Error ? err.message : 'Erreur inconnue'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="flex-1 gap-6">
        <View className="gap-2">
          <Text className="font-display text-3xl font-bold text-sage-800">
            Allergies & intolérances
          </Text>
          <Text className="text-base leading-5 text-sage-700">
            Vivo t'alertera si un produit contient ces ingrédients.
            Sélection facultative.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {ALLERGENS.map((allergen) => (
            <Chip
              key={allergen}
              label={allergen}
              selected={draftAllergies.includes(allergen)}
              onPress={() => toggleAllergy(allergen)}
            />
          ))}
        </View>

        <View className="mt-auto gap-3">
          <Button
            label="Terminer"
            onPress={handleFinish}
            loading={saving}
          />
          <Button
            label="Passer cette étape"
            onPress={handleFinish}
            variant="ghost"
            disabled={saving}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
