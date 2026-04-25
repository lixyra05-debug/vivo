/**
 * BadgeGrid — grille 4 colonnes des 12 badges Vivo.
 *
 * Badges gagnés en couleur, badges non gagnés en gris avec un "?" overlay.
 * Animation FadeIn stagger sur les badges fraîchement débloqués.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import { BADGES } from '@/src/lib/gamification/badge-engine';
import type { BadgeDef } from '@/src/lib/gamification/types';

interface BadgeGridProps {
  earnedIds: string[];
  newlyEarnedIds?: string[];
  onBadgePress?: (badge: BadgeDef) => void;
}

const COLUMNS = 4;

export function BadgeGrid({ earnedIds, newlyEarnedIds = [], onBadgePress }: BadgeGridProps) {
  const earnedSet = new Set(earnedIds);
  const newlySet = new Set(newlyEarnedIds);

  return (
    <View style={styles.grid} accessibilityLabel="Liste des badges">
      {BADGES.map((badge, index) => {
        const isEarned = earnedSet.has(badge.id);
        const isNewly = newlySet.has(badge.id);
        const indexInNewly = newlyEarnedIds.indexOf(badge.id);
        const delay = isNewly && indexInNewly >= 0 ? indexInNewly * 80 : 0;

        const cell = (
          <Pressable
            key={badge.id}
            onPress={() => onBadgePress?.(badge)}
            disabled={!onBadgePress}
            accessibilityRole="button"
            accessibilityLabel={`${badge.nameFr}${isEarned ? ' (gagné)' : ' (verrouillé)'}`}
            accessibilityHint={badge.descriptionFr}
            style={styles.cellPressable}
          >
            {isEarned ? (
              <GlassCard style={styles.cellEarned}>
                <Text style={styles.emoji}>{badge.emoji}</Text>
                <Text
                  style={[styles.name, { color: '#3F5A3F' }]}
                  numberOfLines={2}
                >
                  {badge.nameFr}
                </Text>
              </GlassCard>
            ) : (
              <View style={styles.cellLocked}>
                <View style={styles.emojiWrap}>
                  <Text style={[styles.emoji, { opacity: 0.25 }]}>{badge.emoji}</Text>
                  <Text style={styles.lockOverlay}>?</Text>
                </View>
                <Text
                  style={[styles.name, { color: '#A8B5A8' }]}
                  numberOfLines={2}
                >
                  {badge.nameFr}
                </Text>
              </View>
            )}
          </Pressable>
        );

        return (
          <View key={badge.id} style={styles.cellWrap}>
            {isNewly ? <FadeIn delay={delay}>{cell}</FadeIn> : cell}
          </View>
        );
      })}
      {/* Padding pour aligner sur 4 colonnes en cas de dernier rang incomplet (ici 12 = 3 rangs de 4, OK) */}
      {BADGES.length % COLUMNS !== 0
        ? Array.from({ length: COLUMNS - (BADGES.length % COLUMNS) }).map((_, i) => (
            <View key={`pad-${i}`} style={styles.cellWrap} />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 12,
  },
  cellWrap: {
    width: `${100 / COLUMNS - 2}%`,
  },
  cellPressable: {
    width: '100%',
  },
  cellEarned: {
    width: '100%',
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  cellLocked: {
    width: '100%',
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
    backgroundColor: '#F2F2EB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emoji: {
    fontSize: 36,
    lineHeight: 42,
  },
  emojiWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    fontSize: 14,
    color: '#A8B5A8',
    fontFamily: 'Inter-SemiBold',
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    textAlign: 'center',
  },
});
