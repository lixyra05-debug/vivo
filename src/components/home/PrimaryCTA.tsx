import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface PrimaryCTAProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  accessibilityHint?: string;
}

const SPRING_IN = { damping: 18, stiffness: 260, mass: 0.9 };
const SPRING_OUT = { damping: 16, stiffness: 220, mass: 0.9 };

export function PrimaryCTA({
  label,
  onPress,
  icon,
  disabled,
  accessibilityHint,
}: PrimaryCTAProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (reduceMotion) return;
    scale.value = withSpring(0.96, SPRING_IN);
  }

  function handlePressOut() {
    if (reduceMotion) return;
    scale.value = withSpring(1, SPRING_OUT);
  }

  function handlePress() {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress();
  }

  return (
    <Animated.View style={[animatedStyle, styles.shadow]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: Boolean(disabled) }}
        style={styles.pressable}
      >
        <LinearGradient
          colors={['#587858', '#709770']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View className="flex-row items-center justify-center gap-3 px-6 py-4">
          {icon}
          <Text
            className="text-base text-white"
            style={{ fontFamily: 'BricolageGrotesque-SemiBold', letterSpacing: 0.2 }}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: 60,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  shadow: {
    borderRadius: 24,
    shadowColor: '#405A40',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
});
