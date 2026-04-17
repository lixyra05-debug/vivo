import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        selected
          ? 'border-sage-500 bg-sage-400'
          : 'border-cream-300 bg-white'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          selected ? 'text-white' : 'text-sage-700'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
