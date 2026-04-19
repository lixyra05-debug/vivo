import { useEffect, type ReactNode } from 'react';
import type { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 420,
  offsetY = 12,
  style,
  className,
}: FadeInProps) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(offsetY);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translate.value = 0;
      return;
    }
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
    translate.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, duration, opacity, translate, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  return (
    <Animated.View className={className} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
