import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Circle, Clock, Heart, Home, ScanLine, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { Colors } from '@/src/constants/colors';

interface RouteMeta {
  label: string;
  Icon: LucideIcon;
  hint: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
  index: { label: 'Accueil', Icon: Home, hint: 'Onglet Accueil' },
  scan: { label: 'Scanner', Icon: ScanLine, hint: 'Onglet Scanner' },
  history: { label: 'Historique', Icon: Clock, hint: 'Onglet Historique' },
  favorites: { label: 'Favoris', Icon: Heart, hint: 'Onglet Favoris' },
  profile: { label: 'Profil', Icon: User, hint: 'Onglet Profil' },
};

const PILL_SIZE = 52;
const PILL_RADIUS = 18;
const BAR_HORIZONTAL_PADDING = 6;
const INACTIVE_COLOR = '#A8BCA8';
const ACTIVE_COLOR = Colors.text;

export const BOTTOM_TAB_BAR_VISUAL_HEIGHT = 72;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [containerWidth, setContainerWidth] = useState(0);
  const pillX = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const mountedRef = useRef(false);

  const tabCount = state.routes.length;
  const innerWidth = containerWidth > 0 ? containerWidth - 2 * BAR_HORIZONTAL_PADDING : 0;
  const tabWidth = innerWidth / tabCount;
  const pillOffset = tabWidth > 0 ? (tabWidth - PILL_SIZE) / 2 : 0;
  const targetX = state.index * tabWidth + pillOffset;

  useEffect(() => {
    if (containerWidth === 0) return;
    if (!mountedRef.current) {
      pillX.value = targetX;
      pillOpacity.value = 1;
      mountedRef.current = true;
      return;
    }
    if (reduceMotion) {
      pillX.value = targetX;
    } else {
      pillX.value = withSpring(targetX, { damping: 18, stiffness: 220, mass: 0.9 });
    }
  }, [containerWidth, targetX, reduceMotion, pillX, pillOpacity]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    opacity: pillOpacity.value,
  }));

  function handleLayout(e: LayoutChangeEvent) {
    const width = e.nativeEvent.layout.width;
    if (width !== containerWidth) setContainerWidth(width);
  }

  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View
        accessibilityRole="tablist"
        onLayout={handleLayout}
        style={[styles.bar, { marginBottom: 12 }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            {
              width: PILL_SIZE,
              height: PILL_SIZE,
              borderRadius: PILL_RADIUS,
              top: (BOTTOM_TAB_BAR_VISUAL_HEIGHT - PILL_SIZE) / 2,
            },
            pillStyle,
          ]}
        />
        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const meta = ROUTE_META[route.name] ?? {
            label: descriptors[route.key]?.options.title ?? route.name,
            Icon: Circle,
            hint: `Onglet ${descriptors[route.key]?.options.title ?? route.name}`,
          };

          function onPress() {
            if (isActive) return;
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          }

          return (
            <TabItem
              key={route.key}
              label={meta.label}
              hint={meta.hint}
              Icon={meta.Icon}
              isActive={isActive}
              onPress={onPress}
              reduceMotion={reduceMotion}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabItemProps {
  label: string;
  hint: string;
  Icon: LucideIcon;
  isActive: boolean;
  onPress: () => void;
  reduceMotion: boolean;
}

function TabItem({ label, hint, Icon, isActive, onPress, reduceMotion }: TabItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    if (!reduceMotion && !isActive) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 12, stiffness: 220, mass: 0.9 }),
        withSpring(1, { damping: 14, stiffness: 200, mass: 0.9 }),
      );
    }
    onPress();
  }

  const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={6}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabItemInner, animatedStyle]}>
        <Icon color={color} size={22} strokeWidth={2.2} />
        <Text
          style={{
            fontFamily: 'Inter-Medium',
            fontSize: 10,
            marginTop: 2,
            color,
            letterSpacing: 0.1,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    height: BOTTOM_TAB_BAR_VISUAL_HEIGHT,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 28,
    backgroundColor: 'rgba(250, 250, 247, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(139, 173, 139, 0.15)',
    shadowColor: '#587858',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  pill: {
    position: 'absolute',
    left: BAR_HORIZONTAL_PADDING,
    backgroundColor: 'rgba(139, 173, 139, 0.2)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
