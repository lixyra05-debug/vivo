import { Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';

interface SelectableCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  selected: boolean;
  onPress: () => void;
}

export function SelectableCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: SelectableCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl border-2 p-4 ${
        selected
          ? 'border-sage-500 bg-sage-50'
          : 'border-cream-300 bg-white'
      }`}
    >
      {icon ? <View className="mb-2">{icon}</View> : null}
      <Text
        className={`text-base font-semibold ${
          selected ? 'text-sage-800' : 'text-sage-700'
        }`}
      >
        {title}
      </Text>
      {description ? (
        <Text className="mt-1 text-xs leading-4 text-sage-600">
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}
