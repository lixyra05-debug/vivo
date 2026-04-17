import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { Colors } from '@/src/constants/colors';

type Variant = 'primary' | 'outline' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-sage-400 active:bg-sage-500',
    text: 'text-white',
  },
  outline: {
    container: 'border-2 border-sage-400 bg-transparent active:bg-sage-50',
    text: 'text-sage-700',
  },
  ghost: {
    container: 'bg-transparent active:bg-sage-50',
    text: 'text-sage-700',
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
}: ButtonProps) {
  const styles = VARIANT_CLASSES[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      className={`min-h-[52px] flex-row items-center justify-center rounded-2xl px-6 py-3 ${styles.container} ${isDisabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.sage} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`text-base font-semibold ${styles.text}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
