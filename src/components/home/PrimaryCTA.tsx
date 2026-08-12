import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Palette, Radius, Spacing, Type } from '@/src/constants/theme';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

/**
 * PrimaryCTA — bouton d'action principal.
 *
 * `variant` suit la convention de `GlassCard` : `default` reproduit à
 * l'identique le rendu d'origine, car ce bouton est posé sur 15 écrans encore
 * hors périmètre. Seule la home demande `hero`, qui applique les tokens v2
 * (dégradé ancré sur `forest`, ombre teintée, libellé plus affirmé).
 */

type CTAVariant = 'default' | 'hero';

interface PrimaryCTAProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  accessibilityHint?: string;
  /** Défaut `default` — rendu v1 strictement préservé pour les autres écrans. */
  variant?: CTAVariant;
}

const SPRING_IN = { damping: 18, stiffness: 260, mass: 0.9 };
const SPRING_OUT = { damping: 16, stiffness: 220, mass: 0.9 };

const GRADIENTS: Record<CTAVariant, readonly [string, string]> = {
  default: ['#587858', '#709770'],
  hero: [Palette.forest, Palette.sageVivid],
};

const SHADOWS: Record<CTAVariant, ViewStyle> = {
  default: {
    borderRadius: 24,
    shadowColor: '#405A40',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  hero: {
    borderRadius: Radius.lg,
    shadowColor: Palette.forest,
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};

const LABELS: Record<CTAVariant, TextStyle> = {
  default: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
  hero: {
    ...Type.h2,
    color: Palette.textOnDark,
  },
};

export function PrimaryCTA({
  label,
  onPress,
  icon,
  disabled,
  accessibilityHint,
  variant = 'default',
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
    <Animated.View style={[animatedStyle, SHADOWS[variant]]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: Boolean(disabled) }}
        style={[styles.pressable, variant === 'hero' && styles.pressableHero]}
      >
        <LinearGradient
          colors={GRADIENTS[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          {icon}
          <Text style={LABELS[variant]}>{label}</Text>
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
  pressableHero: {
    minHeight: 64,
    borderRadius: Radius.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
});
