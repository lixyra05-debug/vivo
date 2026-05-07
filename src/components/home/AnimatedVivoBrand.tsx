import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

let entranceAnimationPlayed = false;

const ENTRANCE_DELAY_LOGO = 200;
const ENTRANCE_DELAY_WORDMARK = 700;
const ENTRANCE_DELAY_TAGLINE = 1000;
const ENTRANCE_FADE_DURATION_LOGO = 300;
const ENTRANCE_FADE_DURATION_TEXT = 500;
const REST_LOOP_START_DELAY = 1300;

const BREATH_DURATION = 1500;
const FLOAT_DURATION = 2000;

const TAP_SPIN_DURATION = 600;
const TAP_COOLDOWN = 700;

const LOGO_SIZE = 100;
const BUBBLE_SIZE = 130;
const GLOW_SIZE = 200;

export interface AnimatedVivoBrandProps {
  onAnimationComplete?: () => void;
}

export function AnimatedVivoBrand({
  onAnimationComplete,
}: AnimatedVivoBrandProps) {
  const reduceMotion = useReduceMotion();

  const entranceOpacity = useSharedValue(entranceAnimationPlayed ? 1 : 0);
  const entranceScale = useSharedValue(entranceAnimationPlayed ? 1 : 0.3);
  const rotation = useSharedValue(entranceAnimationPlayed ? 0 : 0);
  const breathScale = useSharedValue(1);
  const bounceScale = useSharedValue(1);
  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.18);
  const glowScale = useSharedValue(1);

  const wordOpacity = useSharedValue(entranceAnimationPlayed ? 1 : 0);
  const wordTranslate = useSharedValue(entranceAnimationPlayed ? 0 : 30);
  const taglineOpacity = useSharedValue(entranceAnimationPlayed ? 1 : 0);
  const taglineTranslate = useSharedValue(entranceAnimationPlayed ? 0 : 12);

  const rotationCounterRef = useRef(0);
  const tapInProgressRef = useRef(false);

  useEffect(() => {
    if (!entranceAnimationPlayed) {
      entranceOpacity.value = withDelay(
        ENTRANCE_DELAY_LOGO,
        withTiming(1, { duration: ENTRANCE_FADE_DURATION_LOGO }),
      );
      entranceScale.value = withDelay(
        ENTRANCE_DELAY_LOGO,
        withSpring(1, { damping: 12, stiffness: 80 }),
      );
      rotation.value = withDelay(
        ENTRANCE_DELAY_LOGO,
        withSpring(360, { damping: 12, stiffness: 80 }),
      );
      rotationCounterRef.current = 360;

      wordOpacity.value = withDelay(
        ENTRANCE_DELAY_WORDMARK,
        withTiming(1, { duration: ENTRANCE_FADE_DURATION_TEXT }),
      );
      wordTranslate.value = withDelay(
        ENTRANCE_DELAY_WORDMARK,
        withSpring(0, { damping: 15, stiffness: 90 }),
      );
      taglineOpacity.value = withDelay(
        ENTRANCE_DELAY_TAGLINE,
        withTiming(1, { duration: ENTRANCE_FADE_DURATION_TEXT }),
      );
      taglineTranslate.value = withDelay(
        ENTRANCE_DELAY_TAGLINE,
        withSpring(0, { damping: 16, stiffness: 95 }),
      );
      entranceAnimationPlayed = true;

      const completeTimer = setTimeout(() => {
        onAnimationComplete?.();
      }, ENTRANCE_DELAY_TAGLINE + ENTRANCE_FADE_DURATION_TEXT);

      return () => clearTimeout(completeTimer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      breathScale.value = 1;
      floatY.value = 0;
      glowOpacity.value = 0.22;
      glowScale.value = 1;
      return;
    }

    const startDelay = entranceAnimationPlayed ? 0 : REST_LOOP_START_DELAY;

    breathScale.value = withDelay(
      startDelay,
      withRepeat(
        withTiming(1.04, {
          duration: BREATH_DURATION,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
    floatY.value = withDelay(
      startDelay,
      withRepeat(
        withTiming(-8, {
          duration: FLOAT_DURATION,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
    glowOpacity.value = withDelay(
      startDelay,
      withRepeat(
        withTiming(0.35, {
          duration: BREATH_DURATION,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
    glowScale.value = withDelay(
      startDelay,
      withRepeat(
        withTiming(1.06, {
          duration: BREATH_DURATION,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
  }, [reduceMotion, breathScale, floatY, glowOpacity, glowScale]);

  function handlePress() {
    if (tapInProgressRef.current) return;
    tapInProgressRef.current = true;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (reduceMotion) {
      bounceScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
    } else {
      rotationCounterRef.current += 360;
      rotation.value = withTiming(rotationCounterRef.current, {
        duration: TAP_SPIN_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      bounceScale.value = withSequence(
        withSpring(0.9, { damping: 8, stiffness: 220, mass: 0.5 }),
        withSpring(1.1, { damping: 8, stiffness: 220, mass: 0.5 }),
        withSpring(1, { damping: 10, stiffness: 200, mass: 0.5 }),
      );
    }

    setTimeout(() => {
      tapInProgressRef.current = false;
    }, TAP_COOLDOWN);
  }

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [
      { scale: entranceScale.value * breathScale.value * bounceScale.value },
    ],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordTranslate.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslate.value }],
  }));

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Vivo, scanner intelligent"
    >
      <Animated.View style={[styles.logoZone, floatStyle]}>
        <Animated.View
          style={[styles.glowOuter, glowStyle]}
          pointerEvents="none"
        />
        <Animated.View
          style={[styles.glowInner, glowStyle]}
          pointerEvents="none"
        />
        <Animated.View style={[styles.bubble, bubbleStyle]}>
          <Pressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel="Animer le logo Vivo"
            hitSlop={12}
          >
            <Animated.Image
              source={require('@/assets/images/vivo-logo.png')}
              style={[styles.logo, logoStyle]}
              resizeMode="contain"
            />
          </Pressable>
        </Animated.View>
      </Animated.View>

      <Animated.Text
        accessibilityRole="text"
        style={[styles.wordmark, wordStyle]}
      >
        Vivo
      </Animated.Text>

      <Animated.Text
        accessibilityRole="text"
        style={[styles.tagline, taglineStyle]}
      >
        Scanner intelligent
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  logoZone: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  glowOuter: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: '#8BAD8B',
  },
  glowInner: {
    position: 'absolute',
    width: GLOW_SIZE * 0.78,
    height: GLOW_SIZE * 0.78,
    borderRadius: (GLOW_SIZE * 0.78) / 2,
    backgroundColor: '#A8C4A8',
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 2,
    borderColor: 'rgba(139, 173, 139, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8BAD8B',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  wordmark: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 36,
    color: Colors.sage,
    letterSpacing: -1.2,
    textAlign: 'center',
    lineHeight: 40,
  },
  tagline: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.sage,
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: -8,
    opacity: 0.78,
  },
});
