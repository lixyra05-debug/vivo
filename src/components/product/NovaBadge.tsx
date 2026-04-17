import { View, Text } from 'react-native';

interface Props {
  group: 1 | 2 | 3 | 4;
}

const LABELS = {
  1: 'Brut',
  2: 'Ingrédient culinaire',
  3: 'Transformé',
  4: 'Ultra-transformé',
} as const;

export function NovaBadge({ group }: Props) {
  return (
    <View
      className="self-start rounded-full bg-sage-100 px-3 py-1"
      accessibilityRole="text"
      accessibilityLabel={`Transformation NOVA ${group} : ${LABELS[group]}`}
    >
      <Text className="text-xs font-medium text-sage-800">
        NOVA {group} — {LABELS[group]}
      </Text>
    </View>
  );
}
