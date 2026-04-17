import '../global.css';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AuthGuard } from '@/src/components/common/AuthGuard';
import { ToastProvider } from '@/src/components/common/ToastProvider';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider>
            <ToastProvider>
              <AuthGuard>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: '#FAFAF7' },
                  }}
                >
                  <Stack.Screen name="landing" options={{ animation: 'fade' }} />
                  <Stack.Screen
                    name="product/[barcode]"
                    options={{ animation: 'slide_from_bottom' }}
                  />
                  <Stack.Screen
                    name="swap/[barcode]"
                    options={{ animation: 'slide_from_bottom' }}
                  />
                </Stack>
              </AuthGuard>
            </ToastProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
