import { Text, View } from 'react-native';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import { useUserStats } from '@/src/lib/stores/useProductStore';
import { formatFirstName, formatGreetingSubtitle } from '@/src/lib/home/formatters';

export function Greeting() {
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const { data: stats } = useUserStats(user?.id);

  const firstName = formatFirstName(profile?.display_name, user?.email);
  const subtitle = formatGreetingSubtitle(stats?.total ?? 0);

  return (
    <View className="gap-1" accessible accessibilityRole="header">
      <Text
        className="text-3xl text-sage-800"
        style={{ fontFamily: 'BricolageGrotesque-SemiBold', letterSpacing: -0.5 }}
      >
        Bonjour {firstName}
      </Text>
      <Text className="text-base text-sage-600" style={{ fontFamily: 'Inter' }}>
        {subtitle}
      </Text>
    </View>
  );
}
