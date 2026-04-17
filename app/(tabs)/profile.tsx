import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  FileText,
  HeartPulse,
  LogOut,
  Sparkles,
  User as UserIcon,
} from 'lucide-react-native';
import { Button } from '@/src/components/ui/Button';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Colors } from '@/src/constants/colors';
import { signOut } from '@/src/lib/api/auth';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import { useUserStats } from '@/src/lib/stores/useProductStore';

const HEALTH_LABELS = {
  standard: 'Standard',
  diabetic: 'Diabète / Poids',
  athlete: 'Sportif',
  child: 'Enfant',
  pregnant: 'Femme enceinte',
  intolerant: 'Intolérances',
} as const;

interface RowProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

function SettingsRow({ icon, label, onPress }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-vivo bg-white px-4 py-4 active:bg-cream-200"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-sage-50">
        {icon}
      </View>
      <Text className="flex-1 text-base font-medium text-sage-800">{label}</Text>
      <ChevronRight color={Colors.textMuted} size={20} />
    </Pressable>
  );
}

interface StatProps {
  value: string | number;
  label: string;
  tone?: 'default' | 'warning';
}

function StatCard({ value, label, tone = 'default' }: StatProps) {
  const valueColor = tone === 'warning' ? Colors.score.red : Colors.text;
  return (
    <View className="flex-1 rounded-vivo bg-white p-4">
      <Text className="font-display text-2xl font-bold" style={{ color: valueColor }}>
        {value}
      </Text>
      <Text className="mt-1 text-xs uppercase tracking-wider text-sage-600">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const stats = useUserStats(user?.id);

  const displayName = profile?.display_name?.trim() || user?.email?.split('@')[0] || 'Toi';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      Alert.alert('Déconnexion', err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }

  const allergies = profile?.allergies ?? [];
  const isPremium = profile?.subscription_tier === 'premium';

  return (
    <ScreenContainer scroll>
      <View className="gap-6">
        <View className="items-center gap-3 pt-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-sage-400">
            <Text className="font-display text-2xl font-bold text-white">{initials}</Text>
          </View>
          <View className="items-center">
            <Text className="font-display text-2xl font-bold text-sage-800">{displayName}</Text>
            <Text className="text-sage-700">{user?.email ?? ''}</Text>
          </View>
          <View
            className={`rounded-full px-3 py-1 ${
              isPremium ? 'bg-earth/20' : 'bg-sage-50'
            }`}
          >
            <Text className={`text-xs font-semibold ${isPremium ? 'text-earth' : 'text-sage-700'}`}>
              {isPremium ? '✨ Premium' : 'Gratuit'}
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-sage-600">
            Mon profil santé
          </Text>
          <View className="gap-3 rounded-vivo bg-white p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs uppercase tracking-wider text-sage-600">Profil actif</Text>
                <Text className="mt-0.5 text-lg font-semibold text-sage-800">
                  {profile ? HEALTH_LABELS[profile.health_profile] : '—'}
                </Text>
              </View>
              <HeartPulse color={Colors.sage} size={28} />
            </View>
            <View className="h-px bg-cream-300" />
            <View>
              <Text className="text-xs uppercase tracking-wider text-sage-600">Allergies</Text>
              <Text className="mt-1 text-sm text-sage-800">
                {allergies.length > 0 ? allergies.join(', ') : 'Aucune'}
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-sage-600">
            Statistiques
          </Text>
          <View className="flex-row gap-3">
            <StatCard value={stats.data?.total ?? 0} label="Scans" />
            <StatCard value={stats.data?.avg ?? 0} label="Score moyen" />
            <StatCard
              value={stats.data?.bad ?? 0}
              label="À éviter"
              tone={(stats.data?.bad ?? 0) > 0 ? 'warning' : 'default'}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-sage-600">
            Paramètres
          </Text>
          <View className="gap-2">
            <SettingsRow
              icon={<UserIcon color={Colors.sage} size={18} />}
              label="Modifier mon profil"
              onPress={() => router.push('/settings/health-profile')}
            />
            <SettingsRow
              icon={<Sparkles color={Colors.sage} size={18} />}
              label="Gérer mon abonnement"
              onPress={() => router.push('/settings/subscription')}
            />
            <SettingsRow
              icon={<FileText color={Colors.sage} size={18} />}
              label="Mentions légales"
              onPress={() => router.push('/settings/legal')}
            />
          </View>
        </View>

        <Button
          label="Se déconnecter"
          onPress={handleSignOut}
          variant="outline"
          icon={<LogOut color={Colors.sage} size={18} />}
        />
      </View>
    </ScreenContainer>
  );
}
