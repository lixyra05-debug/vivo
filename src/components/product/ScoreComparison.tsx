import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Colors, scoreColor } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface ScoreComparisonProps {
  score: number;
  delay?: number;
}

const MARKER_SIZE = 22;
const MARKER_HALF = MARKER_SIZE / 2;

export function ScoreComparison({ score, delay = 0 }: ScoreComparisonProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const markerLeft = useSharedValue(0);
  const reduceMotion = useReduceMotion();

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const color = scoreColor(clampedScore);

  useEffect(() => {
    if (trackWidth <= 0) return;
    const target = (clampedScore / 100) * trackWidth - MARKER_HALF;
    if (reduceMotion) {
      markerLeft.value = target;
      return;
    }
    markerLeft.value = withDelay(
      delay,
      withSpring(target, { damping: 15, stiffness: 180 }),
    );
  }, [trackWidth, clampedScore, delay, reduceMotion, markerLeft]);

  function onTrackLayout(event: LayoutChangeEvent) {
    const { width } = event.nativeEvent.layout;
    setTrackWidth(width);
  }

  const markerStyle = useAnimatedStyle(() => ({
    left: markerLeft.value,
  }));

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`Score ${clampedScore} sur 100, positionné sur l'échelle de qualité`}
    >
      <View style={styles.markerRow}>
        <Animated.View style={[styles.markerWrap, markerStyle]}>
          <Text style={[styles.markerLabel, { color }]}>{clampedScore}</Text>
          <View style={styles.markerDot} />
        </Animated.View>
      </View>

      <View style={styles.trackWrap} onLayout={onTrackLayout}>
        <LinearGradient
          colors={['#F44336', '#FF9800', '#FFC107', '#4CAF50']}
          locations={[0, 0.25, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.trackGradient}
        />
        <View style={styles.midTick} pointerEvents="none" />
      </View>

      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Danger</Text>
        <Text style={styles.legendText}>Excellent</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 4,
  },
  markerRow: {
    height: 30,
    width: '100%',
    position: 'relative',
  },
  markerWrap: {
    position: 'absolute',
    width: MARKER_SIZE,
    alignItems: 'center',
  },
  markerLabel: {
    position: 'absolute',
    top: -26,
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  markerDot: {
    position: 'absolute',
    top: 4,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#405A40',
    shadowColor: '#587858',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  trackWrap: {
    position: 'relative',
    width: '100%',
    height: 10,
  },
  trackGradient: {
    width: '100%',
    height: 10,
    borderRadius: 5,
  },
  midTick: {
    position: 'absolute',
    left: '50%',
    top: -5,
    height: 20,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#A9C4A9',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
