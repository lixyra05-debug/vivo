import '../global.css';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';

import { AuthGuard } from '@/src/components/common/AuthGuard';
import { ErrorBoundary } from '@/src/components/common/ErrorBoundary';
import { ToastProvider } from '@/src/components/common/ToastProvider';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    BricolageGrotesque: BricolageGrotesque_500Medium,
    'BricolageGrotesque-SemiBold': BricolageGrotesque_600SemiBold,
    'BricolageGrotesque-Bold': BricolageGrotesque_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider>
            <ToastProvider>
              <AuthGuard>
                <ErrorBoundary>
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
                </ErrorBoundary>
              </AuthGuard>
            </ToastProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
