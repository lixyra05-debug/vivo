/**
 * Greeting — accueil personnalisé en tête de home.
 *
 * Passait par les classes NativeWind `text-sage-800` / `text-sage-600`, qui
 * court-circuitaient la façade `Colors` et gardaient donc les valeurs v1
 * (10,99:1 et 4,73:1). Repassé sur les tokens : le prénom devient l'ancre
 * `ink` (16,05:1), le sous-titre `textMuted`.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Palette, Spacing, Type } from '@/src/constants/theme';
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
    <View style={styles.wrap} accessible accessibilityRole="header">
      <Text style={styles.hello}>Bonjour {firstName}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.xs,
  },
  hello: {
    ...Type.h1,
    color: Palette.ink,
  },
  subtitle: {
    ...Type.body,
    color: Palette.textMuted,
  },
});
