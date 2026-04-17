import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  Baby,
  HeartPulse,
  ShieldAlert,
  Sprout,
  User,
} from 'lucide-react-native';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SelectableCard } from '@/src/components/ui/SelectableCard';
import { Colors } from '@/src/constants/colors';
import { upsertUserProfile } from '@/src/lib/api/auth';
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
  {
    value: 'diabetic',
    title: 'Diabète / Poids',
    description: 'Malus max sur les édulcorants',
    Icon: HeartPulse,
  },
  {
    value: 'athlete',
    title: 'Sportif',
    description: 'Blocage aspartame et MSG',
    Icon: Activity,
  },
  { value: 'child', title: 'Enfant', description: 'Tolérance zéro additifs', Icon: Baby },
  {
    value: 'pregnant',
    title: 'Femme enceinte',
    description: 'Tolérance zéro additifs',
    Icon: Sprout,
  },
  {
    value: 'intolerant',
    title: 'Intolérances',
    description: 'Pénalité lactose / gluten',
    Icon: ShieldAlert,
  },
];

const ALLERGENS = ['Gluten', 'Lactose', 'Arachides', 'Fruits à coque', 'Œufs', 'Soja'];
const INTOLERANCES = ['gluten', 'lactose'];

export default function SettingsHealthProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const loadProfile = useProfileStore((s) => s.loadProfile);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(
    profile?.health_profile ?? 'standard'
  );
  const [allergies, setAllergies] = useState<string[]>(profile?.allergies ?? []);
  const [intolerances, setIntolerances] = useState<string[]>(profile?.intolerances ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setHealthProfile(profile.health_profile);
    setAllergies(profile.allergies ?? []);
    setIntolerances(profile.intolerances ?? []);
  }, [profile]);

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function handleSave() {
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
        err instanceof Error ? err.message : 'Erreur inconnue'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="gap-6">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft color={Colors.text} size={20} />
          </Pressable>
          <Text className="font-display text-2xl font-bold text-sage-800">
            Modifier mon profil
          </Text>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-sage-600">
            Prénom / pseudo
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Ton prénom"
            placeholderTextColor={Colors.textMuted}
            className="rounded-2xl bg-white px-4 py-3 text-base text-sage-800"
            autoCapitalize="words"
          />
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-sage-600">
            Profil santé
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {OPTIONS.map(({ value, title, description, Icon }) => (
              <View key={value} className="w-[48%]">
                <SelectableCard
                  title={title}
                  description={description}
                  selected={healthProfile === value}
                  onPress={() => setHealthProfile(value)}
                  icon={
                    <Icon
                      color={healthProfile === value ? Colors.sage : Colors.textMuted}
                      size={22}
                    />
                  }
                />
              </View>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-sage-600">
            Allergies
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ALLERGENS.map((a) => (
              <Chip
                key={a}
                label={a}
                selected={allergies.includes(a)}
                onPress={() => setAllergies(toggle(allergies, a))}
              />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-sage-600">
            Intolérances
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {INTOLERANCES.map((i) => (
              <Chip
                key={i}
                label={i.charAt(0).toUpperCase() + i.slice(1)}
                selected={intolerances.includes(i)}
                onPress={() => setIntolerances(toggle(intolerances, i))}
              />
            ))}
          </View>
        </View>

        <Button label="Enregistrer" onPress={handleSave} loading={saving} />
      </View>
    </ScreenContainer>
  );
}
