import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
}

export function ScreenContainer({ children, scroll = false }: ScreenContainerProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, padding: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1 p-6">{children}</View>
  );

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
