import { Platform, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface TappableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function TappableChip({ label, selected, onPress }: TappableChipProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (reduceMotion) return;
    scale.value = withSpring(0.95, { damping: 18, stiffness: 280 });
  }

  function handlePressOut() {
    if (reduceMotion) return;
    scale.value = withSpring(1, { damping: 16, stiffness: 220 });
  }

  function handlePress() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress();
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        className={`rounded-full border-[1.5px] px-5 py-2.5 ${
          selected ? 'border-sage-500 bg-sage-500' : 'border-cream-300 bg-white'
        }`}
      >
        <Text
          style={{
            fontFamily: 'Inter-Medium',
            fontSize: 14,
            color: selected ? '#FFFFFF' : '#405A40',
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
