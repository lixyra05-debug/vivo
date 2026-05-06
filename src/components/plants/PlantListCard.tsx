import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { Colors } from '@/src/constants/colors';
import type { EvidenceLevel, PlantEntry } from '@/src/data/plant-encyclopedia';

interface PlantListCardProps {
  plant: PlantEntry;
  onPress: () => void;
  delay?: number;
}

export const EVIDENCE_STYLES: Record<
  EvidenceLevel,
  { bg: string; text: string; labelFr: string }
> = {
  'well-established': {
    bg: 'rgba(46, 125, 50, 0.12)',
    text: '#2E7D32',
    labelFr: 'Preuve solide',
  },
  traditional: {
    bg: 'rgba(139, 173, 139, 0.18)',
    text: '#587858',
    labelFr: 'Usage traditionnel',
  },
  'efsa-claim': {
    bg: 'rgba(91, 123, 158, 0.14)',
    text: '#5B7B9E',
    labelFr: 'Allégation EFSA',
  },
  preliminary: {
    bg: 'rgba(196, 168, 130, 0.16)',
    text: '#8B7B5E',
    labelFr: 'Préliminaire',
  },
};

export function PlantListCard({ plant, onPress, delay = 0 }: PlantListCardProps) {
  const evidence = EVIDENCE_STYLES[plant.evidenceLevel];
  const a11y = `${plant.nameFr}, ${plant.nameLatin}, niveau de preuve ${evidence.labelFr}`;

  return (
    <FadeIn delay={delay}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{plant.emoji}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.nameFr} numberOfLines={1}>
            {plant.nameFr}
          </Text>
          <Text style={styles.nameLatin} numberOfLines={1}>
            {plant.nameLatin}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: evidence.bg }]}>
          <Text style={[styles.badgeText, { color: evidence.text }]}>
            {evidence.labelFr}
          </Text>
        </View>
      </Pressable>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 70,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: 'rgba(139, 173, 139, 0.06)',
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 173, 139, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  center: {
    flex: 1,
    gap: 2,
  },
  nameFr: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.text,
    letterSpacing: -0.1,
  },
  nameLatin: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
