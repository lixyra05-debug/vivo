import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarRange,
  Check,
  Sparkles,
  SwatchBook,
} from 'lucide-react-native';
import { Button } from '@/src/components/ui/Button';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Colors } from '@/src/constants/colors';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: <SwatchBook color={Colors.earth} size={20} />,
    title: 'Smart Swaps produits',
    description: 'Découvre des alternatives scannables avec leur score, dispo en rayon.',
  },
  {
    icon: <CalendarRange color={Colors.earth} size={20} />,
    title: 'Historique illimité',
    description: 'Tous tes scans conservés, sans limite de 30 derniers.',
  },
  {
    icon: <BookOpen color={Colors.earth} size={20} />,
    title: 'Journal alimentaire',
    description: 'Suivi quotidien et score moyen de la journée.',
  },
  {
    icon: <BarChart3 color={Colors.earth} size={20} />,
    title: 'Comparateur',
    description: 'Compare deux produits côte à côte, pénalité par pénalité.',
  },
];

const FREE_FEATURES = [
  'Scans illimités',
  'Score 0-100 complet',
  'Alertes allergènes',
  'Smart Swaps bruts',
  '30 derniers scans',
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const isPremium = profile?.subscription_tier === 'premium';

  function handleUpgrade() {
    Alert.alert(
      'Bientôt disponible',
      "Les abonnements Premium arrivent dans les prochaines semaines. Merci de ta patience !"
    );
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
          <Text className="font-display text-2xl font-bold text-sage-800">Abonnement</Text>
        </View>

        <View
          className="rounded-vivo bg-white p-5 gap-3"
          style={{
            shadowColor: '#8BAD8B',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xs uppercase tracking-wider text-sage-600">Plan actuel</Text>
            <View
              className={`rounded-full px-3 py-1 ${
                isPremium ? 'bg-earth/20' : 'bg-sage-50'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isPremium ? 'text-earth' : 'text-sage-700'
                }`}
              >
                {isPremium ? 'Premium actif' : 'Gratuit'}
              </Text>
            </View>
          </View>
          <Text className="font-display text-2xl font-bold text-sage-800">
            {isPremium ? 'Merci pour ton soutien !' : 'Tu es sur le plan gratuit'}
          </Text>
          <View className="gap-1">
            {FREE_FEATURES.map((f) => (
              <View key={f} className="flex-row items-center gap-2">
                <Check color={Colors.sage} size={16} />
                <Text className="text-sm text-sage-700">{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Sparkles color={Colors.earth} size={20} />
            <Text className="font-display text-xl font-bold text-sage-800">
              Passe à Premium
            </Text>
          </View>
          <Text className="text-sage-700">
            Libère toutes les fonctionnalités pour 3,99 €/mois ou 29,99 €/an (~2,50 €/mois).
          </Text>
          <View className="gap-3">
            {BENEFITS.map((b) => (
              <View
                key={b.title}
                className="flex-row gap-3 rounded-vivo bg-white p-4"
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-earth/10">
                  {b.icon}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-sage-800">{b.title}</Text>
                  <Text className="mt-0.5 text-sm text-sage-700">{b.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {!isPremium ? (
          <View className="gap-3">
            <Button
              label="Bientôt disponible"
              onPress={handleUpgrade}
              disabled
              icon={<Sparkles color="#fff" size={18} />}
            />
            <Text className="text-center text-xs text-sage-600">
              Le scan restera toujours gratuit et illimité.
            </Text>
          </View>
        ) : (
          <Button
            label="Gérer l'abonnement"
            variant="outline"
            onPress={handleUpgrade}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
