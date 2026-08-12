/**
 * StreakCounter — affiche le streak (série de jours consécutifs avec scan).
 *
 * Deux modes :
 *  - complet (défaut) : carte centrée avec emoji 🔥, nombre, libellé et message
 *  - compact          : pill inline `<Flame> N`, retourne null si streak === 0
 *
 * Le mode compact n'apparaît que sur la home : son emoji d'interface est passé
 * en icône lucide (R4). Le mode complet est rendu par l'écran profil, hors
 * périmètre de cette phase — il garde son 🔥 jusqu'à la phase 2.
 */

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Icon } from '@/src/components/ui/Icon';
import { Colors } from '@/src/constants/colors';
import { Palette, Radius, Spacing, Type, withAlpha } from '@/src/constants/theme';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { getStreakMessage } from '@/src/lib/gamification/streak-engine';

interface StreakCounterProps {
  streak: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function StreakCounter({ streak, compact = false, style }: StreakCounterProps) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion || compact || streak <= 0) {
      scale.value = 1;
      return;
    }
    scale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(0.9, { duration: 150 }),
      withSpring(1, { damping: 8, stiffness: 220 }),
    );
  }, [streak, compact, reduceMotion, scale]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (compact) {
    if (streak <= 0) return null;
    return (
      <View
        style={[styles.compactPill, style]}
        accessibilityLabel={`Streak de ${streak} jours`}
      >
        <Icon name="Flame" size="sm" color="scorePoor" />
        <Text style={styles.compactText}>{streak}</Text>
      </View>
    );
  }

  if (streak <= 0) {
    return (
      <GlassCard style={[styles.card, style]}>
        <Text style={[styles.flame, { opacity: 0.45 }]}>🔥</Text>
        <Text style={styles.invitation}>
          Scanne un produit pour lancer ton streak !
        </Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={[styles.card, style]}>
      <Animated.Text style={[styles.flame, flameStyle]}>🔥</Animated.Text>
      <View style={styles.row}>
        <Text style={styles.number}>{streak}</Text>
        <Text style={styles.label}>{streak > 1 ? 'jours' : 'jour'}</Text>
      </View>
      <Text style={styles.message}>{getStreakMessage(streak)}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
  },
  flame: {
    fontSize: 36,
    lineHeight: 42,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  number: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 32,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textMuted,
  },
  message: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  invitation: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: withAlpha(Palette.scorePoor, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(Palette.scorePoor, 0.28),
    alignSelf: 'flex-start',
  },
  compactText: {
    ...Type.h2,
    color: Palette.ink,
  },
});
