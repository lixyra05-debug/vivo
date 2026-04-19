import type { ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GradientHeaderProps {
  children?: ReactNode;
  height?: number;
  colors?: readonly [string, string, ...string[]];
}

const DEFAULT_COLORS = ['#C6D8C6', '#F1F5F1', '#FAFAF7'] as const;

export function GradientHeader({
  children,
  height = 160,
  colors = DEFAULT_COLORS,
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const totalHeight = height + insets.top;

  return (
    <View style={{ height: totalHeight }}>
      <LinearGradient
        colors={colors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ flex: 1, paddingTop: insets.top }}>{children}</View>
    </View>
  );
}
