import { View, Text } from 'react-native';

interface Props {
  ingredientsRaw: string;
}

export function IngredientsList({ ingredientsRaw }: Props) {
  return (
    <View className="rounded-vivo bg-cream-200 p-4">
      <Text className="text-sm text-sage-800">{ingredientsRaw}</Text>
    </View>
  );
}
