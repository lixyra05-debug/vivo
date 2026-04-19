import type { ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface TappableSelectableCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  selected: boolean;
  onPress: () => void;
}

export function TappableSelectableCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: TappableSelectableCardProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (reduceMotion) return;
    scale.value = withSpring(0.97, { damping: 18, stiffness: 260 });
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
        accessibilityLabel={title}
        accessibilityState={{ selected }}
        className={`rounded-3xl border-[1.5px] p-4 ${
          selected ? 'border-sage-500 bg-sage-50' : 'border-cream-300 bg-white'
        }`}
        style={{
          shadowColor: '#587858',
          shadowOpacity: selected ? 0.12 : 0.05,
          shadowRadius: selected ? 14 : 8,
          shadowOffset: { width: 0, height: 6 },
          elevation: selected ? 4 : 1,
        }}
      >
        {icon ? (
          <View
            className={`mb-3 h-11 w-11 items-center justify-center rounded-2xl ${
              selected ? 'bg-sage-500' : 'bg-sage-50'
            }`}
          >
            {icon}
          </View>
        ) : null}
        <Text
          style={{
            fontFamily: 'BricolageGrotesque-SemiBold',
            fontSize: 15,
            color: selected ? '#2B3E2B' : '#405A40',
            letterSpacing: 0.1,
          }}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={{ fontFamily: 'Inter', fontSize: 12, color: '#587858', lineHeight: 16, marginTop: 4 }}
          >
            {description}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
