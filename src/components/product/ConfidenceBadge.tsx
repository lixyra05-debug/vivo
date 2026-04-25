import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, ShieldCheck, Users } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ProductConfidence } from '@/src/lib/api/types';

interface ConfidenceBadgeProps {
  confidence: ProductConfidence;
  size?: 'small' | 'medium';
  onPress?: () => void;
}

const ICON_BY_LEVEL: Record<ProductConfidence['level'], LucideIcon> = {
  verified: ShieldCheck,
  community: Users,
  unverified: AlertTriangle,
};

export function ConfidenceBadge({
  confidence,
  size = 'small',
  onPress,
}: ConfidenceBadgeProps) {
  const Icon = ICON_BY_LEVEL[confidence.level];
  const isMedium = size === 'medium';
  const iconSize = isMedium ? 14 : 12;
  const fontSize = isMedium ? 13 : 11;
  const paddingH = isMedium ? 10 : 8;
  const paddingV = isMedium ? 5 : 4;

  // Couleurs : background ~8% opacité, border ~20% opacité.
  const background = `${confidence.color}14`;
  const border = `${confidence.color}33`;

  function handlePress() {
    if (!onPress) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress();
  }

  const content = (
    <>
      <Icon color={confidence.color} size={iconSize} strokeWidth={2.2} />
      <Text
        style={[
          styles.label,
          { color: confidence.color, fontSize },
        ]}
        numberOfLines={1}
      >
        {confidence.labelFr}
      </Text>
    </>
  );

  const containerStyle = [
    styles.base,
    {
      backgroundColor: background,
      borderColor: border,
      paddingHorizontal: paddingH,
      paddingVertical: paddingV,
    },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Niveau de confiance : ${confidence.labelFr}`}
        accessibilityHint="Voir les détails"
        style={containerStyle}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={`Niveau de confiance : ${confidence.labelFr}`}
      style={containerStyle}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.1,
  },
});
