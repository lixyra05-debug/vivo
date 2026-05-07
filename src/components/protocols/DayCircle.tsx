/**
 * DayCircle — pastille jour 36×36 du calendrier protocole.
 *
 * 5 statuts visuels :
 *   • completed-good : sage + checkmark (feeling ≥ 4)
 *   • completed-ok   : sage clair + jour (feeling < 4)
 *   • today          : earth + jour + pulse léger (1500ms)
 *   • future         : cream + border + jour
 *   • missed         : rouge clair + jour
 */

import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

export type DayCircleStatus =
  | 'completed-good'
  | 'completed-ok'
  | 'today'
  | 'future'
  | 'missed';

export interface DayCircleProps {
  day: number;
  status: DayCircleStatus;
  feeling?: number;
  onPress?: () => void;
}

interface StatusVisual {
  background: string;
  textColor: string;
  borderColor?: string;
  borderWidth?: number;
  fontFamily: TextStyle['fontFamily'];
  fontSize: number;
  content: 'check' | 'day';
}

const STATUS_STYLES: Record<DayCircleStatus, StatusVisual> = {
  'completed-good': {
    background: Colors.sage,
    textColor: '#FFFFFF',
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    content: 'check',
  },
  'completed-ok': {
    background: 'rgba(139, 173, 139, 0.25)',
    textColor: Colors.text,
    fontFamily: 'Inter',
    fontSize: 13,
    content: 'day',
  },
  today: {
    background: Colors.earth,
    textColor: '#FFFFFF',
    borderColor: 'rgba(196, 168, 130, 0.5)',
    borderWidth: 2,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    content: 'day',
  },
  future: {
    background: Colors.cream,
    textColor: Colors.textMuted,
    borderColor: Colors.border,
    borderWidth: 1,
    fontFamily: 'Inter',
    fontSize: 13,
    content: 'day',
  },
  missed: {
    background: '#FEE2E2',
    textColor: '#B91C1C',
    fontFamily: 'Inter',
    fontSize: 13,
    content: 'day',
  },
};

export function DayCircle({ day, status, onPress }: DayCircleProps) {
  const visual = STATUS_STYLES[status];
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (status !== 'today' || reduceMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(scale);
    };
  }, [status, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle: ViewStyle = {
    backgroundColor: visual.background,
    borderColor: visual.borderColor,
    borderWidth: visual.borderWidth ?? 0,
  };

  const textStyle: TextStyle = {
    color: visual.textColor,
    fontFamily: visual.fontFamily,
    fontSize: visual.fontSize,
  };

  const a11yLabel = `Jour ${day}, ${labelForStatus(status)}`;
  const content = visual.content === 'check' ? '✓' : String(day);

  const inner = (
    <Animated.View
      testID="day-circle"
      style={[styles.circle, containerStyle, animatedStyle]}
    >
      <Text style={textStyle}>{content}</Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        hitSlop={4}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={a11yLabel} accessible>
      {inner}
    </View>
  );
}

function labelForStatus(status: DayCircleStatus): string {
  switch (status) {
    case 'completed-good':
      return 'jour complété avec un bon ressenti';
    case 'completed-ok':
      return 'jour complété';
    case 'today':
      return "aujourd'hui";
    case 'future':
      return 'à venir';
    case 'missed':
      return 'jour non complété';
  }
}

const styles = StyleSheet.create({
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
