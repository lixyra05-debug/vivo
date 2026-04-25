/**
 * WeeklyProgressBar — visualise les 7 derniers jours civils.
 *
 * - Layout horizontal : 7 cercles L M M J V S D (plein si count>0, vide sinon)
 * - Bar de progression sage : largeur = scansThisWeek / 7
 * - Score moyen + delta vs semaine d'avant (mode complet uniquement)
 */

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface WeeklyProgressBarProps {
  scansByDayLast7: Array<{ date: string; count: number; avgScore: number }>;
  averageScore: number;
  deltaVsLastWeek: number;
  compact?: boolean;
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function WeeklyProgressBar({
  scansByDayLast7,
  averageScore,
  deltaVsLastWeek,
  compact = false,
}: WeeklyProgressBarProps) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);

  // Toujours 7 entrées (padding si moins)
  const days = scansByDayLast7.length === 7
    ? scansByDayLast7
    : [
        ...Array.from({ length: Math.max(0, 7 - scansByDayLast7.length) }, () => ({
          date: '',
          count: 0,
          avgScore: 0,
        })),
        ...scansByDayLast7,
      ];

  const scansThisWeek = days.reduce((acc, d) => acc + (d.count > 0 ? 1 : 0), 0);
  const ratio = Math.min(scansThisWeek / 7, 1);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = ratio;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(ratio, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [ratio, reduceMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  let DeltaIcon: typeof Minus = Minus;
  let deltaColor: string = Colors.textMuted;
  if (deltaVsLastWeek >= 5) {
    DeltaIcon = TrendingUp;
    deltaColor = Colors.score.green;
  } else if (deltaVsLastWeek <= -5) {
    DeltaIcon = TrendingDown;
    deltaColor = Colors.score.orange;
  }

  return (
    <View style={styles.container} accessibilityLabel="Progression hebdomadaire">
      <View style={styles.dotsRow}>
        {days.map((d, i) => {
          const filled = d.count > 0;
          return (
            <View key={i} style={styles.dotCell}>
              <View
                style={[
                  styles.dot,
                  filled ? styles.dotFilled : styles.dotEmpty,
                ]}
              />
              <Text style={styles.dotLabel}>{DAY_LABELS[i]}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, fillStyle]} />
      </View>
      {!compact ? (
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>
            Score moyen : {averageScore || '—'}
          </Text>
          {averageScore > 0 ? (
            <View style={styles.deltaRow}>
              <DeltaIcon color={deltaColor} size={12} strokeWidth={2.4} />
              <Text style={[styles.deltaText, { color: deltaColor }]}>
                {Math.abs(deltaVsLastWeek)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingVertical: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  dotCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotFilled: {
    backgroundColor: Colors.sage,
  },
  dotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#C6D8C6',
  },
  dotLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.textMuted,
  },
  barTrack: {
    height: 6,
    width: '100%',
    backgroundColor: '#E7EFE7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    backgroundColor: Colors.sage,
    borderRadius: 3,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  scoreText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deltaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
});
