import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { PenaltyDetail } from '@/src/lib/api/types';
import {
  getScoreVerdict,
  groupPenaltiesByCategory,
} from '@/src/lib/scoring/display-helpers';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { MiniScoreCircle } from '@/src/components/product/MiniScoreCircle';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface ScoreBreakdownChartProps {
  penalties: PenaltyDetail[];
  finalScore: number;
  delay?: number;
}

type CategoryKey = 'nova' | 'additives' | 'macros' | 'oils' | 'bonus';

interface CategoryDef {
  key: CategoryKey;
  label: string;
  color: string;
}

const CATEGORIES: CategoryDef[] = [
  { key: 'nova', label: 'NOVA', color: '#C4A882' },
  { key: 'additives', label: 'Additifs', color: Colors.score.red },
  { key: 'macros', label: 'Macros', color: Colors.score.orange },
  { key: 'oils', label: 'Huiles', color: '#866B46' },
  { key: 'bonus', label: 'Bonus', color: Colors.sage },
];

const MAX_BAR_HEIGHT = 120;

interface BarColumnProps {
  label: string;
  color: string;
  value: number;
  isBonus: boolean;
  index: number;
  baseDelay: number;
  reduceMotion: boolean;
}

function BarColumn({
  label,
  color,
  value,
  isBonus,
  index,
  baseDelay,
  reduceMotion,
}: BarColumnProps) {
  const clamped = Math.min(Math.max(Math.abs(value), 0), 100);
  const targetHeight = (clamped / 100) * MAX_BAR_HEIGHT;
  const barHeight = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      barHeight.value = targetHeight;
      return;
    }
    barHeight.value = withDelay(
      baseDelay + index * 120,
      withTiming(targetHeight, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [targetHeight, baseDelay, index, reduceMotion, barHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  const rounded = Math.round(Math.abs(value));
  const valueText = isBonus ? `+${rounded}` : `-${rounded}`;

  return (
    <View style={styles.column}>
      <Text style={[styles.columnValue, { color }]}>{valueText}</Text>
      <Animated.View
        style={[
          styles.bar,
          { backgroundColor: color },
          animatedStyle,
        ]}
      />
      <Text style={styles.columnLabel}>{label}</Text>
    </View>
  );
}

export function ScoreBreakdownChart({
  penalties,
  finalScore,
  delay = 0,
}: ScoreBreakdownChartProps) {
  const reduceMotion = useReduceMotion();
  const grouped = groupPenaltiesByCategory(penalties);

  const activeColumns = CATEGORIES.map((cat) => ({
    ...cat,
    value: Math.abs(grouped[cat.key] ?? 0),
    isBonus: cat.key === 'bonus',
  })).filter((col) => col.value > 0);

  if (activeColumns.length === 0) {
    return null;
  }

  const verdict = getScoreVerdict(finalScore);
  const a11yLabel = `Décomposition du score. ${activeColumns
    .map(
      (c) =>
        `${c.label} ${c.isBonus ? 'bonus' : 'pénalité'} ${Math.round(c.value)} points`,
    )
    .join(', ')}. Score final ${Math.round(finalScore)} sur 100.`;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.root} accessibilityLabel={a11yLabel}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Décomposition du score</Text>
          <Text style={styles.subtitle}>Où sont passés les points</Text>
        </View>

        <View style={styles.chartRow}>
          <View style={styles.barsRow}>
            {activeColumns.map((col, i) => (
              <BarColumn
                key={col.key}
                label={col.label}
                color={col.color}
                value={col.value}
                isBonus={col.isBonus}
                index={i}
                baseDelay={delay}
                reduceMotion={reduceMotion}
              />
            ))}
          </View>

          <View style={styles.finalBlock}>
            <MiniScoreCircle score={finalScore} size={72} />
            <Text style={styles.verdict}>{verdict.label}</Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
  },
  root: {
    gap: 16,
  },
  headerBlock: {
    gap: 2,
  },
  title: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  barsRow: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-end',
    height: 140,
  },
  column: {
    alignItems: 'center',
    gap: 6,
  },
  columnValue: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 11,
  },
  bar: {
    width: 28,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  columnLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.textMuted,
  },
  finalBlock: {
    alignItems: 'center',
    gap: 6,
  },
  verdict: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
});
