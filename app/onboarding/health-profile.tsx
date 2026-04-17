import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Activity,
  Baby,
  HeartPulse,
  ShieldAlert,
  Sprout,
  User,
} from 'lucide-react-native';
import { Button } from '@/src/components/ui/Button';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SelectableCard } from '@/src/components/ui/SelectableCard';
import { Colors } from '@/src/constants/colors';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import type { HealthProfile } from '@/src/lib/api/types';

interface ProfileOption {
  value: HealthProfile;
  title: string;
  description: string;
  Icon: typeof User;
}

const OPTIONS: ProfileOption[] = [
  {
    value: 'standard',
    title: 'Standard',
    description: 'Algorithme par défaut',
    Icon: User,
  },
  {
    value: 'diabetic',
    title: 'Diabète / Poids',
    description: 'Malus max sur les édulcorants',
    Icon: HeartPulse,
  },
  {
    value: 'athlete',
    title: 'Sportif',
    description: 'Blocage strict aspartame et MSG',
    Icon: Activity,
  },
  {
    value: 'child',
    title: 'Enfant',
    description: 'Tolérance zéro additifs',
    Icon: Baby,
  },
  {
    value: 'pregnant',
    title: 'Femme enceinte',
    description: 'Tolérance zéro additifs',
    Icon: Sprout,
  },
  {
    value: 'intolerant',
    title: 'Intolérances',
    description: 'Lourde pénalité lactose / gluten',
    Icon: ShieldAlert,
  },
];

export default function OnboardingHealthProfileScreen() {
  const router = useRouter();
  const selected = useProfileStore((s) => s.draftHealthProfile);
  const setProfile = useProfileStore((s) => s.setDraftHealthProfile);

  return (
    <ScreenContainer scroll>
      <View className="flex-1 gap-6">
        <View className="gap-2">
          <Text className="font-display text-3xl font-bold text-sage-800">
            Ton profil santé
          </Text>
          <Text className="text-base leading-5 text-sage-700">
            Le score s'adapte à tes besoins. Tu pourras le changer à tout moment.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {OPTIONS.map(({ value, title, description, Icon }) => (
            <View key={value} className="w-[48%]">
              <SelectableCard
                title={title}
                description={description}
                selected={selected === value}
                onPress={() => setProfile(value)}
                icon={
                  <Icon
                    color={selected === value ? Colors.sage : Colors.textMuted}
                    size={24}
                  />
                }
              />
            </View>
          ))}
        </View>

        <View className="mt-auto">
          <Button
            label="Continuer"
            onPress={() => router.push('/onboarding/allergies')}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
