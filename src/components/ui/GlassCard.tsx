import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'warning' | 'danger' | 'info';
}

const TONE_STYLES: Record<NonNullable<GlassCardProps['tone']>, ViewStyle> = {
  default: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: '#E2EBE2',
  },
  warning: {
    backgroundColor: 'rgba(255, 152, 0, 0.06)',
    borderColor: 'rgba(255, 152, 0, 0.22)',
  },
  danger: {
    backgroundColor: 'rgba(244, 67, 54, 0.06)',
    borderColor: 'rgba(244, 67, 54, 0.24)',
  },
  info: {
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
};

export function GlassCard({ children, className, style, tone = 'default' }: GlassCardProps) {
  return (
    <View className={className} style={[styles.base, TONE_STYLES[tone], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#587858',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});
