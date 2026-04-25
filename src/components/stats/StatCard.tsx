/**
 * StatCard — petite carte de statistique (label + valeur + delta optionnel).
 *
 * Animation count-up sur les valeurs numériques. Delta avec icône TrendingUp/Down.
 */

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import { useCountUp } from '@/src/hooks/useCountUp';

interface StatCardProps {
  label: string;
  value: number | string;
  delta?: number;
  color?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, delta, color = Colors.text, icon }: StatCardProps) {
  const numericTarget = typeof value === 'number' ? value : 0;
  const animated = useCountUp({ target: numericTarget, enabled: typeof value === 'number' });
  const display = typeof value === 'number' ? animated : value;

  let DeltaIcon = Minus;
  let deltaColor = '#A8B5A8';
  if (typeof delta === 'number') {
    if (delta > 0) {
      DeltaIcon = TrendingUp;
      deltaColor = Colors.score.green;
    } else if (delta < 0) {
      DeltaIcon = TrendingDown;
      deltaColor = Colors.score.orange;
    }
  }

  return (
    <GlassCard style={styles.card}>
      {icon ? <View style={styles.iconRow}>{icon}</View> : null}
      <Text style={[styles.value, { color }]} numberOfLines={1}>
        {display}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      {typeof delta === 'number' ? (
        <View style={styles.deltaRow}>
          <DeltaIcon color={deltaColor} size={12} strokeWidth={2.4} />
          <Text style={[styles.deltaText, { color: deltaColor }]}>
            {Math.abs(delta)}
          </Text>
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 4,
    alignItems: 'flex-start',
    minHeight: 86,
    flex: 1,
  },
  iconRow: {
    marginBottom: 2,
  },
  value: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  deltaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
});
