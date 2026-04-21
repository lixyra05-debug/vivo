import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as LucideIcons from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import type { CategoryDef } from '@/src/lib/api/types';

interface CategoryCardProps {
  category: CategoryDef;
  onPress: () => void;
}

function resolveIcon(iconName: string): LucideIcon {
  const dict = LucideIcons as unknown as Record<string, LucideIcon | undefined>;
  return dict[iconName] ?? LucideIcons.Package;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const Icon = resolveIcon(category.icon);
  const isFood = category.type === 'food';
  const typeLabel = isFood ? 'Alimentation' : 'Cosmétique';
  const typeColor = isFood ? Colors.sage : Colors.earth;
  const typeBg = isFood ? 'rgba(139, 173, 139, 0.14)' : 'rgba(196, 168, 130, 0.18)';

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
      accessibilityLabel={`Catégorie ${category.name}, ${typeLabel}`}
      style={styles.pressable}
    >
      <GlassCard style={styles.card}>
        <View style={styles.iconBg} pointerEvents="none">
          <Icon color={typeColor} size={48} strokeWidth={1.8} />
        </View>
        <View style={styles.topRow}>
          <Text style={styles.emoji} allowFontScaling={false}>
            {category.emoji}
          </Text>
        </View>
        <View style={styles.bottom}>
          <Text style={styles.name} numberOfLines={2}>
            {category.name}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: typeBg }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
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
  },
  typeBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
