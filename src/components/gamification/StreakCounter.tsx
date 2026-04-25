/**
 * StreakCounter — affiche le streak (série de jours consécutifs avec scan).
 *
 * Deux modes :
 *  - complet (défaut) : carte centrée avec emoji 🔥, nombre, libellé et message
 *  - compact          : pill inline horizontal "🔥 N", retourne null si streak === 0
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
import { Colors } from '@/src/constants/colors';
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
        <Text style={styles.compactText}>🔥 {streak}</Text>
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,152,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
    alignSelf: 'flex-start',
  },
  compactText: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
  },
});
