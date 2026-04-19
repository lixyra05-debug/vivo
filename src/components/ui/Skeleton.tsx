import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 12,
  style,
  className,
}: SkeletonProps) {
  const progress = useSharedValue(-1);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 220 }],
  }));

  return (
    <View
      className={className}
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: '#F3F3EC',
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityElementsHidden
    >
      <AnimatedGradient
        colors={['rgba(243,243,236,0)', 'rgba(226,235,226,0.7)', 'rgba(243,243,236,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFill, animatedStyle]}
      />
    </View>
  );
}
