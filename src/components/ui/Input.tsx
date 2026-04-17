import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.score.red
    : focused
      ? Colors.sage
      : Colors.border;

  return (
    <View className="gap-1">
      {label ? (
        <Text className="text-sm font-medium text-sage-800">{label}</Text>
      ) : null}
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor={Colors.textMuted}
        style={[
          {
            borderColor,
            borderWidth: 1.5,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            color: Colors.text,
            backgroundColor: '#FFFFFF',
          },
          style,
        ]}
      />
      {error ? (
        <Text className="text-xs text-score-red">{error}</Text>
      ) : null}
    </View>
  );
}
