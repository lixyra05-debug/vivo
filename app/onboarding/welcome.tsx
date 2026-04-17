import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { Button } from '@/src/components/ui/Button';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Colors } from '@/src/constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View className="flex-1 justify-between">
        <View className="flex-1 items-center justify-center gap-6">
          <View className="h-28 w-28 items-center justify-center rounded-full bg-sage-100">
            <ScanLine color={Colors.sage} size={56} />
          </View>
          <View className="items-center gap-3">
            <Text className="font-display text-4xl font-bold text-sage-800">
              Scannez.
            </Text>
            <Text className="font-display text-4xl font-bold text-sage-800">
              Comprenez.
            </Text>
            <Text className="font-display text-4xl font-bold text-sage-800">
              Choisissez.
            </Text>
          </View>
          <Text className="text-center text-base leading-6 text-sage-700">
            Un score sur 100 basé sur la toxicologie réelle des ingrédients —
            pas sur le Nutri-Score.
          </Text>
        </View>

        <Button
          label="Commencer"
          onPress={() => router.push('/onboarding/health-profile')}
        />
      </View>
    </ScreenContainer>
  );
}
