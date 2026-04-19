import { useState, type ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({ label, error, style, leftIcon, rightIcon, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.score.red
    : focused
      ? Colors.sage
      : Colors.border;

  const hasAdornment = Boolean(leftIcon || rightIcon);

  return (
    <View className="gap-1">
      {label ? (
        <Text className="text-sm font-medium text-sage-800">{label}</Text>
      ) : null}
      <View
        style={{
          borderColor,
          borderWidth: 1.5,
          borderRadius: 16,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          gap: 10,
        }}
      >
        {leftIcon ? <View>{leftIcon}</View> : null}
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
              flex: 1,
              paddingVertical: 14,
              fontSize: 16,
              color: Colors.text,
              ...(hasAdornment ? {} : { paddingHorizontal: 2 }),
            },
            style,
          ]}
        />
        {rightIcon ? <View>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text className="text-xs text-score-red">{error}</Text>
      ) : null}
    </View>
  );
}
