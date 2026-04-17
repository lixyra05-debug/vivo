import { View, Text } from 'react-native';

interface Props {
  oils: string[];
}

export function SeedOilAlert({ oils }: Props) {
  if (oils.length === 0) return null;
  return (
    <View
      className="rounded-vivo bg-score-orange/10 p-4"
      accessibilityRole="alert"
      accessibilityLabel={`Alerte : huiles de graines détectées. ${oils.join(', ')}`}
    >
      <Text className="font-semibold text-score-orange">Huiles de graines détectées</Text>
      <Text className="mt-1 text-sm text-sage-800">{oils.join(', ')}</Text>
    </View>
  );
}
