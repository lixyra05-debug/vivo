import { View, Text } from 'react-native';

interface Props {
  code: string;
  nameFr: string;
  penalty: number;
  descriptionShort: string;
}

export function AdditiveCard({ code, nameFr, penalty, descriptionShort }: Props) {
  return (
    <View
      className="rounded-vivo bg-cream p-4"
      accessibilityRole="text"
      accessibilityLabel={`Additif ${code.toUpperCase()}, ${nameFr}. Pénalité ${penalty} points. ${descriptionShort}`}
    >
      <Text className="font-semibold text-sage-800">
        {code.toUpperCase()} — {nameFr}
      </Text>
      <Text className="text-xs text-sage-600">-{penalty} pts</Text>
      <Text className="mt-1 text-sm text-sage-700">{descriptionShort}</Text>
    </View>
  );
}
