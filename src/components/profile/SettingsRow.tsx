import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors } from '@/src/constants/colors';

interface SettingsRowProps {
  icon: ReactNode;
  label: string;
  description?: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  showChevron?: boolean;
}

export function SettingsRow({
  icon,
  label,
  description,
  onPress,
  tone = 'default',
  showChevron = true,
}: SettingsRowProps) {
  const isDanger = tone === 'danger';
  const iconBg = isDanger ? 'rgba(244, 67, 54, 0.1)' : '#E7EFE7';
  const labelColor = isDanger ? Colors.score.red : Colors.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={description}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Inter-Medium',
            fontSize: 15,
            color: labelColor,
          }}
        >
          {label}
        </Text>
        {description ? (
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              color: Colors.textMuted,
              marginTop: 2,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {showChevron ? (
        <ChevronRight color={Colors.textMuted} size={18} strokeWidth={2.2} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pressed: { backgroundColor: 'rgba(139, 173, 139, 0.08)' },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
