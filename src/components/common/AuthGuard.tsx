import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/src/lib/api/supabase';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import { Colors } from '@/src/constants/colors';

function useAuthInit() {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setInitialized]);
}

function useProfileSync() {
  const session = useAuthStore((s) => s.session);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const resetProfile = useProfileStore((s) => s.reset);

  useEffect(() => {
    if (session?.user?.id) {
      void loadProfile(session.user.id);
    } else {
      resetProfile();
    }
  }, [session?.user?.id, loadProfile, resetProfile]);
}

function useAuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const profileLoaded = useProfileStore((s) => s.profileLoaded);
  const profile = useProfileStore((s) => s.profile);

  useEffect(() => {
    if (!initialized) return;
    if (session && !profileLoaded) return;

    const first = segments[0] as string | undefined;
    const inAuth = first === 'auth';
    const inOnboarding = first === 'onboarding';
    const inLanding = first === 'landing';
    const onboardingComplete = profile !== null;

    if (!session) {
      if (!inAuth && !inLanding) {
        router.replace(Platform.OS === 'web' ? '/landing' : '/auth/login');
      }
      return;
    }
    if (!onboardingComplete) {
      if (!inOnboarding) router.replace('/onboarding/welcome');
      return;
    }
    if (inAuth || inOnboarding) {
      router.replace('/(tabs)/scan');
    }
  }, [initialized, session, profileLoaded, profile, segments, router]);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  useAuthInit();
  useProfileSync();
  useAuthRedirect();

  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const profileLoaded = useProfileStore((s) => s.profileLoaded);

  const ready = initialized && (!session || profileLoaded);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color={Colors.sage} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
