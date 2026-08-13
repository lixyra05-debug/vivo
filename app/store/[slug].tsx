import { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { CategoryRankCard, type Medal } from '@/src/components/explore/CategoryRankCard';
import { CompatibilityToggle, type CompatibilityMode } from '@/src/components/explore/CompatibilityToggle';
import { StoreLogo } from '@/src/components/explore/StoreLogo';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { fetchStoreTopProducts, getStoreBySlug } from '@/src/lib/api/stores';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { getFeatureLimit } from '@/src/lib/premium/premium-gate';
import { getOrFetchProduct, productToScoringInput } from '@/src/lib/api/openfoodfacts';
import { getProductConfidence } from '@/src/lib/api/confidence';
import { calculateScore } from '@/src/lib/scoring/engine';
import { composeScore } from '@/src/lib/scoring/composite-score';
import { isProductCompatible } from '@/src/lib/scoring/profile-filters';
import { userProfileToCompatibilityProfile } from '@/src/lib/scoring/profile-adapter';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import type {
  Product,
  ProductConfidence,
  ScoringResult,
  SearchResult,
  UserProfile,
} from '@/src/lib/api/types';

const FIVE_MIN_MS = 5 * 60 * 1000;
const TEN_MIN_MS = 10 * 60 * 1000;

interface RankedItem {
  result: SearchResult;
  product: Product;
  scoring: ScoringResult;
  score: number;
  confidence: ProductConfidence;
}

async function computeRankedItem(
  result: SearchResult,
  userProfile: UserProfile,
): Promise<RankedItem | null> {
  try {
    const product = await getOrFetchProduct(result.barcode);
    if (!product) return null;
    const scoring = composeScore(
      calculateScore(productToScoringInput(product), userProfile),
      product.packaging_components,
    );
    return {
      result,
      product,
      scoring,
      score: scoring.score_final,
      confidence: getProductConfidence(product),
    };
  } catch {
    return null;
  }
}

async function rankResults(
  results: SearchResult[],
  userProfile: UserProfile,
): Promise<RankedItem[]> {
  const tasks = results.map((r) => computeRankedItem(r, userProfile));
  const settled = await Promise.all(tasks);
  const ranked = settled.filter((x): x is RankedItem => x !== null);
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

function medalForIndex(idx: number): Medal | undefined {
  if (idx === 0) return 'gold';
  if (idx === 1) return 'silver';
  if (idx === 2) return 'bronze';
  return undefined;
}

export default function StoreScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const profile = useProfileStore((s) => s.profile);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { isPremium, tier } = usePremium(userId);
  const store = getStoreBySlug(slug ?? '');

  const [page, setPage] = useState<number>(1);
  const [mode, setMode] = useState<CompatibilityMode>('all');

  const userProfile: UserProfile = useMemo(
    () => ({
      type: profile?.health_profile ?? 'standard',
      allergies: profile?.allergies ?? [],
      intolerances: profile?.intolerances ?? [],
    }),
    [profile],
  );

  const compatProfile = useMemo(
    () => userProfileToCompatibilityProfile(profile),
    [profile],
  );

  const listQuery = useQuery({
    queryKey: ['store', slug, page] as const,
    queryFn: () =>
      store ? fetchStoreTopProducts(store.slug, page) : Promise.resolve([]),
    enabled: Boolean(store),
    staleTime: FIVE_MIN_MS,
  });

  const rankedQuery = useQuery({
    queryKey: ['store-ranked', slug, page, userProfile.type] as const,
    queryFn: () =>
      store ? rankResults(listQuery.data ?? [], userProfile) : Promise.resolve([]),
    enabled:
      Boolean(store) && Array.isArray(listQuery.data) && listQuery.data.length > 0,
    staleTime: TEN_MIN_MS,
  });

  const rankedData: RankedItem[] = rankedQuery.data ?? [];

  const compatibleCount = useMemo(() => {
    if (!compatProfile) return 0;
    return rankedData.filter((r) =>
      isProductCompatible(r.product, r.scoring, compatProfile),
    ).length;
  }, [rankedData, compatProfile]);

  const visibleData: RankedItem[] = useMemo(() => {
    if (mode === 'all' || !compatProfile) return rankedData;
    return rankedData.filter((r) =>
      isProductCompatible(r.product, r.scoring, compatProfile),
    );
  }, [rankedData, mode, compatProfile]);

  function handleBack() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    router.back();
  }

  function handleRefresh() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    void listQuery.refetch().then(() => rankedQuery.refetch());
  }

  function handleItemPress(item: RankedItem) {
    router.push(`/product/${item.result.barcode}?type=food`);
  }

  function handleLoadMore() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    setPage((p) => p + 1);
  }

  function handleUnlock() {
    router.push('/profile');
  }

  if (!store) {
    return (
      <ScreenContainer>
        <View style={{ gap: 18, flex: 1 }}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backButton}
          >
            <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 22,
                color: Colors.text,
                textAlign: 'center',
              }}
            >
              Enseigne introuvable
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 14,
                color: Colors.textMuted,
                textAlign: 'center',
              }}
            >
              Cette enseigne n'existe pas ou n'est plus disponible.
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const isLoading = listQuery.isLoading || rankedQuery.isLoading || rankedQuery.isFetching;
  const isRefreshing = listQuery.isRefetching || rankedQuery.isRefetching;
  const hasItems = visibleData.length > 0;

  const storeListLimit = getFeatureLimit(tier, 'store_comparison');
  const limitedData = Number.isFinite(storeListLimit)
    ? visibleData.slice(0, storeListLimit)
    : visibleData;
  const podium = limitedData.slice(0, 3);
  const rest = limitedData.slice(3);
  const showPaywall =
    !isPremium && visibleData.length > limitedData.length;

  return (
    <ScreenContainer>
      <View style={{ flex: 1, gap: 18 }}>
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
            <StoreLogo slug={store.slug} emoji={store.emoji} variant="header" />
            <View style={{ gap: 2, flex: 1 }}>
              <Text style={styles.title}>{store.nameFr}</Text>
              <Text style={styles.subtitle}>Les meilleurs produits</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <CompatibilityToggle
            mode={mode}
            onChange={setMode}
            compatibleCount={compatibleCount}
            totalCount={rankedData.length}
            disabled={!compatProfile}
          />
        </FadeIn>

        {isLoading && rankedData.length === 0 ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={88} radius={20} />
            ))}
            <Text style={styles.loadingHint}>Calcul des scores…</Text>
          </View>
        ) : !hasItems ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
            <Text style={styles.emptyText}>
              {mode === 'profile'
                ? 'Aucun produit compatible avec votre profil dans cette enseigne.'
                : 'Aucun produit n\'a pu être analysé dans cette enseigne pour le moment.'}
            </Text>
          </GlassCard>
        ) : (
          <FlatList
            data={[...podium, ...rest]}
            keyExtractor={(item) => item.result.barcode}
            contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.sage}
                colors={[Colors.sage]}
              />
            }
            ListFooterComponent={
              showPaywall ? (
                <View style={{ marginTop: 12 }}>
                  <PremiumPaywall
                    featureKey="store_comparison"
                    onUpgrade={() => handleUnlock()}
                  />
                </View>
              ) : visibleData.length > 0 ? (
                <Pressable
                  onPress={handleLoadMore}
                  accessibilityRole="button"
                  accessibilityLabel="Charger plus de produits"
                  style={styles.loadMore}
                >
                  <Text style={styles.loadMoreText}>Voir plus</Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item, index }) => {
              const medal = medalForIndex(index);
              return (
                <FadeIn delay={Math.min(120 + index * 40, 480)}>
                  <CategoryRankCard
                    result={item.result}
                    score={item.score}
                    rank={index + 1}
                    medal={medal}
                    confidence={item.confidence}
                    onPress={() => handleItemPress(item)}
                  />
                </FadeIn>
              );
            }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 28,
    color: Colors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
  },
  loadingHint: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  loadMore: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#F3F3EC',
    marginTop: 12,
  },
  loadMoreText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
});
