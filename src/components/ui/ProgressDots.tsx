import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface ProgressDotsProps {
  current: number;
  total: number;
}

interface DotProps {
  active: boolean;
}

function Dot({ active }: DotProps) {
  const width = useSharedValue(active ? 24 : 8);
  const opacity = useSharedValue(active ? 1 : 0.5);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      width.value = active ? 24 : 8;
      opacity.value = active ? 1 : 0.5;
      return;
    }
    width.value = withSpring(active ? 24 : 8, { damping: 16, stiffness: 180 });
    opacity.value = withSpring(active ? 1 : 0.5, { damping: 18, stiffness: 200 });
  }, [active, width, opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { height: 8, borderRadius: 4, backgroundColor: active ? '#709770' : '#C6D8C6' },
        animatedStyle,
      ]}
    />
  );
}

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <View
      className="flex-row items-center justify-center"
      style={{ gap: 6 }}
      accessibilityRole="progressbar"
      accessibilityLabel={`Étape ${current + 1} sur ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}
    >
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} active={i === current} />
      ))}
    </View>
  );
}
