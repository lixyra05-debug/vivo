import { useMemo } from 'react';
import { Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScanLine } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { Greeting } from '@/src/components/home/Greeting';
import { OrganicBlob } from '@/src/components/home/OrganicBlob';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { StatsRow } from '@/src/components/home/StatsRow';
import { TopByCategorySection } from '@/src/components/home/TopByCategorySection';
import { StreakCounter } from '@/src/components/gamification/StreakCounter';
import { WeeklyProgressBar } from '@/src/components/gamification/WeeklyProgressBar';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useScanHistory } from '@/src/lib/stores/useProductStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import { calculateStreak } from '@/src/lib/gamification/streak-engine';
import { calculateProfileStats } from '@/src/lib/stats/profile-stats-engine';
import { getTimeBasedTagline } from '@/src/lib/home/tagline';
import { fetchTopByCategoryHome } from '@/src/lib/api/top-by-category';
import type { ScanRecord } from '@/src/lib/gamification/types';
import type { UserProfile } from '@/src/lib/api/types';

const TOP_BY_CATEGORY_STALE_MS = 30 * 60 * 1000;
const TOP_BY_CATEGORY_GC_MS = 60 * 60 * 1000;

const BLOB_SIZE = 320;
const HALO_SIZE = 360;

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const { data: rawScans } = useScanHistory({ userId: user?.id, limit: 100 });

  const scans: ScanRecord[] = (rawScans ?? []).map((row) => ({
    barcode: row.barcode,
    score_at_scan: row.score_at_scan,
    scanned_at: row.scanned_at,
    product_type:
      (row as unknown as { product_type?: 'food' | 'cosmetic' }).product_type ?? 'food',
    is_favorite: row.is_favorite,
    category_slug: null,
  }));

  const streak = scans.length > 0 ? calculateStreak(scans).currentStreak : 0;
  const stats = scans.length > 0 ? calculateProfileStats(scans) : null;
  const last7 = stats ? stats.scansByDay.slice(-7) : [];
  const tagline = getTimeBasedTagline();

  const userProfile: UserProfile = useMemo(
    () => ({
      type: profile?.health_profile ?? 'standard',
      allergies: profile?.allergies ?? [],
      intolerances: profile?.intolerances ?? [],
    }),
    [profile],
  );

  const topByCategoryQuery = useQuery({
    queryKey: ['top-by-category-home', userProfile.type] as const,
    queryFn: () => fetchTopByCategoryHome(userProfile),
    staleTime: TOP_BY_CATEGORY_STALE_MS,
    gcTime: TOP_BY_CATEGORY_GC_MS,
  });

  return (
    <ScreenContainer scroll>
      <View className="flex-1 gap-8 pt-2">
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Greeting />
          </View>
          {streak > 0 ? (
            <View style={{ marginTop: 8 }}>
              <StreakCounter compact streak={streak} />
            </View>
          ) : null}
        </View>

        <FadeIn delay={100}>
          <Text
            accessibilityRole="text"
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: Colors.textMuted,
              textAlign: 'center',
              marginBottom: 8,
              marginTop: -16,
              paddingHorizontal: 12,
              lineHeight: 20,
            }}
          >
            {tagline}
          </Text>
        </FadeIn>

        <View
          className="items-center justify-center"
          style={{ height: BLOB_SIZE + 40 }}
          accessibilityElementsHidden={Platform.OS === 'ios' ? false : undefined}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: HALO_SIZE,
              height: HALO_SIZE,
              borderRadius: HALO_SIZE / 2,
              backgroundColor: '#E2EBE2',
              opacity: 0.55,
              shadowColor: '#8BAD8B',
              shadowOpacity: 0.28,
              shadowRadius: 40,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            }}
          />
          <OrganicBlob size={BLOB_SIZE} />
        </View>

        <StatsRow />

        {stats && last7.length === 7 ? (
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#E2EBE2',
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <WeeklyProgressBar
              compact
              scansByDayLast7={last7}
              averageScore={stats.averageScoreThisWeek}
              deltaVsLastWeek={stats.weekOverWeekDelta.avgScore}
            />
          </View>
        ) : null}

        <FadeIn delay={200}>
          <TopByCategorySection
            blocks={topByCategoryQuery.data}
            isLoading={topByCategoryQuery.isLoading}
          />
        </FadeIn>

        <View className="mt-auto">
          <PrimaryCTA
            label="Lancer le scan"
            icon={<ScanLine color="#FFFFFF" size={20} strokeWidth={2.2} />}
            onPress={() => router.push('/(tabs)/scan')}
            accessibilityHint="Ouvre la caméra pour scanner un produit"
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
