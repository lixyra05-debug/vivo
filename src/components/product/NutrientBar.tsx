import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { NutrientStatus } from '@/src/lib/scoring/display-helpers';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface NutrientBarProps {
  label: string;
  value: number;
  unit: string;
  status: NutrientStatus;
  max: number;
  delay?: number;
}

const STATUS_LABEL_FR: Record<NutrientStatus, string> = {
  good: 'bon',
  moderate: 'modéré',
  bad: 'élevé',
};

const STATUS_COLOR: Record<NutrientStatus, string> = {
  good: Colors.score.green,
  moderate: Colors.score.orange,
  bad: Colors.score.red,
};

function formatValue(value: number): string {
  if (Number.isFinite(value)) {
    if (Math.abs(value) >= 100) return String(Math.round(value));
    if (Math.abs(value) >= 10) return value.toFixed(1).replace(/\.0$/, '');
    return value.toFixed(1).replace(/\.0$/, '');
  }
  return '0';
}

export function NutrientBar({
  label,
  value,
  unit,
  status,
  max,
  delay = 0,
}: NutrientBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);
  const reduceMotion = useReduceMotion();

  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const target = ratio * trackWidth;

  useEffect(() => {
    if (trackWidth <= 0) {
      fillWidth.value = 0;
      return;
    }
    if (reduceMotion) {
      fillWidth.value = target;
      return;
    }
    fillWidth.value = withDelay(
      delay,
      withTiming(target, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [trackWidth, target, delay, reduceMotion, fillWidth]);

  const animatedFill = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  function onTrackLayout(event: LayoutChangeEvent) {
    const { width } = event.nativeEvent.layout;
    setTrackWidth(width);
  }

  const color = STATUS_COLOR[status];
  const statusFr = STATUS_LABEL_FR[status];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${label} : ${formatValue(value)} ${unit}, niveau ${statusFr}`}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>
          {formatValue(value)} {unit}
        </Text>
      </View>
      <View style={styles.track} onLayout={onTrackLayout}>
        <Animated.View
          style={[styles.fill, { backgroundColor: color }, animatedFill]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.text,
  },
  value: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3F3EC',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    height: 8,
    borderRadius: 4,
  },
});
