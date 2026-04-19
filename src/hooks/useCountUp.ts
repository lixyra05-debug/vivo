import { useEffect, useState } from 'react';
import {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface UseCountUpOptions {
  target: number;
  duration?: number;
  enabled?: boolean;
}

export function useCountUp({ target, duration = 900, enabled = true }: UseCountUpOptions): number {
  const [value, setValue] = useState(target);
  const progress = useSharedValue(target);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!enabled || reduceMotion) {
      cancelAnimation(progress);
      progress.value = target;
      setValue(target);
      return;
    }
    progress.value = 0;
    progress.value = withTiming(target, { duration, easing: Easing.out(Easing.cubic) });
  }, [target, duration, enabled, reduceMotion, progress]);

  useAnimatedReaction(
    () => Math.round(progress.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setValue)(current);
      }
    },
    [],
  );

  return value;
}
