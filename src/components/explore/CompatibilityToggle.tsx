import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

export type CompatibilityMode = 'all' | 'profile';

interface CompatibilityToggleProps {
  mode: CompatibilityMode;
  onChange: (next: CompatibilityMode) => void;
  compatibleCount?: number;
  totalCount?: number;
  disabled?: boolean;
}

export function CompatibilityToggle({
  mode,
  onChange,
  compatibleCount,
  totalCount,
  disabled,
}: CompatibilityToggleProps) {
  const [allWidth, setAllWidth] = useState(0);
  const [allX, setAllX] = useState(0);
  const [profileWidth, setProfileWidth] = useState(0);
  const [profileX, setProfileX] = useState(0);
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    const targetLeft = mode === 'all' ? allX : profileX;
    const targetWidth = mode === 'all' ? allWidth : profileWidth;
    if (targetWidth <= 0) return;
    if (reduceMotion) {
      indicatorLeft.value = targetLeft;
      indicatorWidth.value = targetWidth;
      return;
    }
    indicatorLeft.value = withSpring(targetLeft, { damping: 18, stiffness: 220 });
    indicatorWidth.value = withSpring(targetWidth, { damping: 18, stiffness: 220 });
  }, [
    mode,
    allX,
    allWidth,
    profileX,
    profileWidth,
    reduceMotion,
    indicatorLeft,
    indicatorWidth,
  ]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorLeft.value,
    width: indicatorWidth.value,
  }));

  if (disabled) {
    return null;
  }

  function handleSelect(next: CompatibilityMode) {
    if (next === mode) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    onChange(next);
  }

  function onAllLayout(event: LayoutChangeEvent) {
    const { x, width } = event.nativeEvent.layout;
    setAllX(x);
    setAllWidth(width);
  }

  function onProfileLayout(event: LayoutChangeEvent) {
    const { x, width } = event.nativeEvent.layout;
    setProfileX(x);
    setProfileWidth(width);
  }

  const showCounter =
    mode === 'profile' &&
    typeof compatibleCount === 'number' &&
    typeof totalCount === 'number';

  return (
    <View style={styles.row}>
      <View style={styles.pillContainer}>
        <Animated.View
          style={[styles.pillIndicator, indicatorStyle]}
          accessibilityElementsHidden
        />
        <Pressable
          onLayout={onAllLayout}
          onPress={() => handleSelect('all')}
          style={styles.pillButton}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'all' }}
          accessibilityLabel="Afficher tous les produits"
        >
          <Text
            style={[styles.pillText, mode === 'all' ? styles.pillTextActive : undefined]}
          >
            Tous les produits
          </Text>
        </Pressable>
        <Pressable
          onLayout={onProfileLayout}
          onPress={() => handleSelect('profile')}
          style={styles.pillButton}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'profile' }}
          accessibilityLabel="Afficher uniquement les produits compatibles avec mon profil"
        >
          <Text
            style={[
              styles.pillText,
              mode === 'profile' ? styles.pillTextActive : undefined,
            ]}
          >
            Mon profil
          </Text>
        </Pressable>
      </View>

      {showCounter ? (
        <View style={styles.counterChip}>
          <Text style={styles.counterText}>
            {compatibleCount} / {totalCount} compatibles
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pillContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F3EC',
    borderRadius: 999,
    padding: 4,
  },
  pillIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    shadowColor: '#587858',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    zIndex: 1,
  },
  pillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
  pillTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.text,
  },
  counterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.14)',
  },
  counterText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.sageVivid,
    letterSpacing: 0.2,
  },
});
