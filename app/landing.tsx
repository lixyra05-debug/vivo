import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf, ScanLine, Shield, UserCheck } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/constants/colors';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <View
      className="flex-1 items-center gap-3 rounded-vivo bg-white p-5"
      style={{
        shadowColor: '#8BAD8B',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      }}
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-sage-50">
        {icon}
      </View>
      <Text className="text-center font-display text-lg font-bold text-sage-800">
        {title}
      </Text>
      <Text className="text-center text-sm leading-5 text-sage-700">{description}</Text>
    </View>
  );
}

function StoreBadge({ store }: { store: 'ios' | 'android' }) {
  const label = store === 'ios' ? 'App Store' : 'Google Play';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Télécharger sur ${label}`}
      onPress={() => {
        // Placeholder — remplacer par les vrais liens
      }}
      className="flex-row items-center gap-2 rounded-xl bg-sage-800 px-5 py-3"
    >
      <Text className="text-sm font-semibold text-white">
        {store === 'ios' ? '🍎 App Store' : '▶️ Google Play'}
      </Text>
    </Pressable>
  );
}

export default function LandingScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll>
      <View className="gap-10 pb-10">
        <View className="items-center gap-4 pt-6">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-sage-400">
            <Leaf color="#fff" size={40} />
          </View>
          <Text className="font-display text-4xl font-bold text-sage-800">Vivo</Text>
          <Text className="text-center text-xl leading-7 text-sage-700">
            Scannez. Comprenez.{'\n'}Choisissez.
          </Text>
          <Text className="max-w-md text-center text-base leading-6 text-sage-600">
            Le scanner nutritionnel qui ne ment pas. Score de santé 0-100 basé sur la toxicologie
            réelle — pas le Nutri-Score. Aucune compensation : un poison reste un poison.
          </Text>
        </View>

        <View className="gap-4">
          <View className="flex-row gap-3">
            <Feature
              icon={<ScanLine color={Colors.sage} size={28} />}
              title="Score transparent"
              description="100 - pénalités. Chaque point retiré est expliqué avec sa source scientifique."
            />
          </View>
          <View className="flex-row gap-3">
            <Feature
              icon={<Shield color={Colors.sage} size={28} />}
              title="Détection additifs"
              description="700+ additifs analysés. Aspartame, MSG, nitrites : alerté en un scan."
            />
          </View>
          <View className="flex-row gap-3">
            <Feature
              icon={<UserCheck color={Colors.sage} size={28} />}
              title="Personnalisé"
              description="Diabétique, sportif, enfant, enceinte : le score s'adapte à ton profil."
            />
          </View>
        </View>

        <View className="items-center gap-4">
          <Text className="text-xs uppercase tracking-widest text-sage-600">
            Bientôt disponible sur
          </Text>
          <View className="flex-row gap-3">
            <StoreBadge store="ios" />
            <StoreBadge store="android" />
          </View>
        </View>

        <View className="gap-3">
          <Button
            label="Créer mon compte"
            onPress={() => router.push('/auth/register')}
          />
          <Button
            label="J'ai déjà un compte"
            variant="outline"
            onPress={() => router.push('/auth/login')}
          />
        </View>

        <Text className="text-center text-xs text-sage-500">
          Le scan est gratuit et illimité — toujours.{'\n'}
          Vivo fournit des informations, pas des conseils médicaux.
        </Text>
      </View>
    </ScreenContainer>
  );
}
