import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

// Module-level flag — persiste à travers les unmount/remount du composant pour
// que l'animation d'entrée ne se rejoue pas à chaque retour sur l'onglet Home.
let entranceAnimationPlayed = false;

const ENTRANCE_DELAY_WORDMARK = 400;
const ENTRANCE_DELAY_TAGLINE = 700;
const ENTRANCE_FADE_DURATION = 500;

const BREATH_DURATION = 1500;
const FLOAT_DURATION = 2000;

const BRAND_MARK_SIZE = 120;
const GLOW_SIZE = 200;

export interface AnimatedVivoBrandProps {
  onAnimationComplete?: () => void;
}

export function AnimatedVivoBrand({
  onAnimationComplete,
}: AnimatedVivoBrandProps) {
  const reduceMotion = useReduceMotion();

  const breathScale = useSharedValue(1);
  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.18);
  const glowScale = useSharedValue(1);

  const wordOpacity = useSharedValue(entranceAnimationPlayed ? 1 : 0);
  const wordTranslate = useSharedValue(entranceAnimationPlayed ? 0 : 30);
  const taglineOpacity = useSharedValue(entranceAnimationPlayed ? 1 : 0);
  const taglineTranslate = useSharedValue(entranceAnimationPlayed ? 0 : 12);

  useEffect(() => {
    // Animation d'entrée — une seule fois par session.
    if (!entranceAnimationPlayed) {
      wordOpacity.value = withDelay(
        ENTRANCE_DELAY_WORDMARK,
        withTiming(1, { duration: ENTRANCE_FADE_DURATION }),
      );
      wordTranslate.value = withDelay(
        ENTRANCE_DELAY_WORDMARK,
        withSpring(0, { damping: 15, stiffness: 90 }),
      );
      taglineOpacity.value = withDelay(
        ENTRANCE_DELAY_TAGLINE,
        withTiming(1, { duration: ENTRANCE_FADE_DURATION }),
      );
      taglineTranslate.value = withDelay(
        ENTRANCE_DELAY_TAGLINE,
        withSpring(0, { damping: 16, stiffness: 95 }),
      );
      entranceAnimationPlayed = true;
      const completeTimer = setTimeout(() => {
        onAnimationComplete?.();
      }, ENTRANCE_DELAY_TAGLINE + ENTRANCE_FADE_DURATION);

      // On cleanup quand même au cas où le composant unmount avant la fin.
      return () => clearTimeout(completeTimer);
    }
    return undefined;
    // L'effet ne dépend que du flag module — exécution unique au mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      // Position de repos : on garde tout statique.
      breathScale.value = 1;
      floatY.value = 0;
      glowOpacity.value = 0.22;
      glowScale.value = 1;
      return;
    }

    breathScale.value = withRepeat(
      withTiming(1.04, {
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    floatY.value = withRepeat(
      withTiming(-8, {
        duration: FLOAT_DURATION,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    glowOpacity.value = withRepeat(
      withTiming(0.35, {
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    glowScale.value = withRepeat(
      withTiming(1.06, {
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [reduceMotion, breathScale, floatY, glowOpacity, glowScale]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
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
        <Animated.View style={breatheStyle}>
          <VivoBrandMark />
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

function VivoBrandMark() {
  return (
    <View style={brandStyles.outer}>
      <View style={brandStyles.innerSheen} pointerEvents="none" />
      <Text allowFontScaling={false} style={brandStyles.letter}>
        V
      </Text>
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

const brandStyles = StyleSheet.create({
  outer: {
    width: BRAND_MARK_SIZE,
    height: BRAND_MARK_SIZE,
    borderRadius: BRAND_MARK_SIZE / 2,
    backgroundColor: Colors.cream,
    borderWidth: 2,
    borderColor: Colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#587858',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  innerSheen: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: BRAND_MARK_SIZE - 16,
    height: BRAND_MARK_SIZE - 16,
    borderRadius: (BRAND_MARK_SIZE - 16) / 2,
    backgroundColor: 'rgba(139, 173, 139, 0.07)',
  },
  letter: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 64,
    color: Colors.sage,
    letterSpacing: -2,
    lineHeight: 72,
    includeFontPadding: false,
  },
});
