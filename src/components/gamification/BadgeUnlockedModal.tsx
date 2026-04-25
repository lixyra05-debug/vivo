/**
 * BadgeUnlockedModal — animation de déblocage d'un badge.
 *
 * Modal RN avec backdrop, particules Reanimated maison (12),
 * scale spring sur l'emoji, haptic Success. Skip si reduceMotion.
 */

import { useEffect, useMemo } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import type { BadgeDef } from '@/src/lib/gamification/types';

interface BadgeUnlockedModalProps {
  badge: BadgeDef | null;
  onClose: () => void;
}

const PARTICLE_COUNT = 12;
const PARTICLE_COLORS = [Colors.sage, Colors.earth, Colors.score.orange, Colors.score.green];

interface ParticleProps {
  index: number;
  active: boolean;
  reduceMotion: boolean;
}

function Particle({ index, active, reduceMotion }: ParticleProps) {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Position X aléatoire mais déterministe par index (spread autour du centre)
  const offsetX = useMemo(() => {
    const seed = (index * 37) % 200;
    return seed - 100; // -100..+100 px autour du centre
  }, [index]);
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
  const startDelay = (index % 6) * 60;

  useEffect(() => {
    if (!active || reduceMotion) {
      ty.value = 0;
      opacity.value = 0;
      return;
    }
    ty.value = 0;
    opacity.value = 0;
    ty.value = withDelay(
      startDelay,
      withTiming(-200, { duration: 1500 }),
    );
    opacity.value = withDelay(
      startDelay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(800, withTiming(0, { duration: 700 })),
      ),
    );
  }, [active, reduceMotion, ty, opacity, startDelay]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { translateX: offsetX }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        { backgroundColor: color },
        style,
      ]}
    />
  );
}

export function BadgeUnlockedModal({ badge, onClose }: BadgeUnlockedModalProps) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(0);

  useEffect(() => {
    if (!badge) {
      scale.value = 0;
      return;
    }
    if (reduceMotion) {
      scale.value = 1;
      return;
    }
    scale.value = 0;
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withTiming(1, { duration: 200 }),
    );
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
  }, [badge, reduceMotion, scale]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const visible = badge !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer">
        <View style={styles.cardWrap}>
          <Pressable style={styles.cardBody}>
            <View style={styles.particlesLayer} pointerEvents="none">
              {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
                <Particle key={i} index={i} active={visible} reduceMotion={reduceMotion} />
              ))}
            </View>
            <Animated.Text style={[styles.emoji, emojiStyle]}>
              {badge?.emoji ?? ''}
            </Animated.Text>
            <Text style={styles.title}>Nouveau badge débloqué ! 🎉</Text>
            {badge ? (
              <>
                <Text style={styles.name}>{badge.nameFr}</Text>
                <Text style={styles.description}>{badge.descriptionFr}</Text>
              </>
            ) : null}
            <View style={{ width: '100%', marginTop: 12 }}>
              <PrimaryCTA
                label="Super !"
                onPress={onClose}
                accessibilityHint="Ferme la fenêtre du badge"
              />
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardWrap: {
    width: 320,
    height: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.cream,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  particlesLayer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emoji: {
    fontSize: 80,
    lineHeight: 92,
  },
  title: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  name: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});
