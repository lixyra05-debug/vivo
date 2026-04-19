import type { ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { Colors } from '@/src/constants/colors';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}

const SPRING_IN = { damping: 18, stiffness: 260, mass: 0.9 };
const SPRING_OUT = { damping: 16, stiffness: 220, mass: 0.9 };

export function SecondaryButton({
  label,
  onPress,
  icon,
  disabled,
  loading,
  accessibilityHint,
}: SecondaryButtonProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();
  const isDisabled = Boolean(disabled || loading);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (reduceMotion || isDisabled) return;
    scale.value = withSpring(0.97, SPRING_IN);
  }

  function handlePressOut() {
    if (reduceMotion) return;
    scale.value = withSpring(1, SPRING_OUT);
  }

  function handlePress() {
    if (isDisabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress();
  }

  return (
    <Animated.View style={[animatedStyle, isDisabled && { opacity: 0.5 }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled }}
        style={styles.container}
      >
        {loading ? (
          <ActivityIndicator color={Colors.sage} />
        ) : (
          <View className="flex-row items-center justify-center gap-3">
            {icon}
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-SemiBold',
                letterSpacing: 0.2,
                color: Colors.textMuted,
                fontSize: 15,
              }}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#C6D8C6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    justifyContent: 'center',
  },
});
