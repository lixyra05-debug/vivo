import { useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { StoreRankingCard } from '@/src/components/explore/StoreRankingCard';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { calculateStoreRanking } from '@/src/lib/api/store-ranking';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import {
  PREMIUM_FEATURES,
  getFeatureLimit,
} from '@/src/lib/premium/premium-gate';

const ONE_HOUR_MS = 60 * 60 * 1000;

export default function StoreRankingScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { isPremium } = usePremium(userId);

  const rankingQuery = useQuery({
    queryKey: ['store-ranking-full'] as const,
    queryFn: () => calculateStoreRanking(),
    staleTime: ONE_HOUR_MS,
  });

  const ranking = rankingQuery.data ?? [];
  const limit = getFeatureLimit(isPremium, 'store_full_ranking');
  const visibleRanking = useMemo(
    () => (Number.isFinite(limit) ? ranking.slice(0, limit) : ranking),
    [ranking, limit],
  );

  function handleBack() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
    router.back();
  }

  function handleStorePress(slug: string) {
    router.push(`/store/${slug}`);
  }

  function handleUnlock() {
    // TODO: hook to RevenueCat / Stripe — pour l'instant simple navigation profil
    router.push('/profile');
  }

  return (
    <ScreenContainer scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <FadeIn delay={0}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backButton}
          >
            <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
          </Pressable>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Trophy color={Colors.sage} size={24} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.title}>Classement supermarchés</Text>
              <Text style={styles.subtitle}>
                Qualité moyenne via Open Food Facts (proxy Nutri-Score).
              </Text>
            </View>
          </View>
        </FadeIn>

        {rankingQuery.isLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={76} radius={20} />
            ))}
          </View>
        ) : ranking.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Données indisponibles</Text>
            <Text style={styles.emptyText}>
              Le classement n'a pas pu être calculé pour le moment. Réessayez
              plus tard.
            </Text>
          </GlassCard>
        ) : (
          <View style={{ gap: 10 }}>
            {visibleRanking.map((row, idx) => (
              <FadeIn key={row.slug} delay={Math.min(120 + idx * 50, 480)}>
                <StoreRankingCard
                  rank={idx + 1}
                  ranking={row}
                  onPress={handleStorePress}
                />
              </FadeIn>
            ))}

            {!isPremium && ranking.length > visibleRanking.length ? (
              <FadeIn delay={420}>
                <PremiumPaywall
                  title={PREMIUM_FEATURES.store_full_ranking.labelFr}
                  description={
                    PREMIUM_FEATURES.store_full_ranking.descriptionFr
                  }
                  onUnlock={handleUnlock}
                />
              </FadeIn>
            ) : null}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
    gap: 18,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    shadowColor: '#587858',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 173, 139, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 26,
    color: Colors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
