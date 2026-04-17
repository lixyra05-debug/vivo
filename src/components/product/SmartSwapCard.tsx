import { View, Text } from 'react-native';

interface Props {
  name: string;
  why: string;
}

export function SmartSwapCard({ name, why }: Props) {
  return (
    <View className="rounded-vivo bg-sage-50 p-4">
      <Text className="font-semibold text-sage-800">{name}</Text>
      <Text className="mt-1 text-sm text-sage-700">{why}</Text>
    </View>
  );
}
