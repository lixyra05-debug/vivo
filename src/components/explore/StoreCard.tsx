import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Store } from 'lucide-react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import type { StoreDef } from '@/src/lib/api/types';

interface StoreCardProps {
  store: StoreDef;
  onPress: () => void;
}

export function StoreCard({ store, onPress }: StoreCardProps) {
  function handlePress() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Enseigne ${store.nameFr}`}
      style={styles.pressable}
    >
      <GlassCard style={styles.card}>
        <View style={styles.iconBg} pointerEvents="none">
          <Store color={Colors.sage} size={48} strokeWidth={1.8} />
        </View>
        <View style={styles.topRow}>
          <Text style={styles.emoji} allowFontScaling={false}>
            {store.emoji}
          </Text>
        </View>
        <View style={styles.bottom}>
          <Text style={styles.name} numberOfLines={2}>
            {store.nameFr}
          </Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>Enseigne</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  card: {
    padding: 14,
    borderRadius: 20,
    aspectRatio: 1.05,
    overflow: 'hidden',
  },
  iconBg: {
    position: 'absolute',
    right: -8,
    bottom: -6,
    opacity: 0.08,
  },
  topRow: {
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 36,
    lineHeight: 42,
  },
  bottom: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    gap: 6,
  },
  name: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 14,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.14)',
  },
  typeBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
    color: Colors.sage,
  },
});
