import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
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
import { FeaturedProductCard } from '@/src/components/explore/FeaturedProductCard';
import {
  CompatibilityToggle,
  type CompatibilityMode,
} from '@/src/components/explore/CompatibilityToggle';
import { Colors } from '@/src/constants/colors';
import { getCategoryBySlug } from '@/src/lib/api/categories';
import { searchByCategory } from '@/src/lib/api/search';
import { getOrFetchProduct, productToScoringInput } from '@/src/lib/api/openfoodfacts';
import { getOrFetchCosmetic, cosmeticToScoringInput } from '@/src/lib/api/openbeautyfacts';
import { getProductConfidence, getCosmeticConfidence } from '@/src/lib/api/confidence';
import { calculateScore } from '@/src/lib/scoring/engine';
import { composeScore } from '@/src/lib/scoring/composite-score';
import { calculateCosmeticScore } from '@/src/lib/scoring/cosmetic-engine';
import { isProductCompatible } from '@/src/lib/scoring/profile-filters';
import { userProfileToCompatibilityProfile } from '@/src/lib/scoring/profile-adapter';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import { getFeaturedProducts, type FeaturedProduct } from '@/src/data/featured-products';
import type {
  CategoryDef,
  CosmeticProduct,
  CosmeticScoringResult,
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
  score: number;
  confidence: ProductConfidence;
  product: Product | CosmeticProduct;
  scoring: ScoringResult | CosmeticScoringResult;
}

async function computeFoodScore(
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
      score: scoring.score_final,
      confidence: getProductConfidence(product),
      product,
      scoring,
    };
  } catch {
    return null;
  }
}

async function computeCosmeticScore(result: SearchResult): Promise<RankedItem | null> {
  try {
    const product = await getOrFetchCosmetic(result.barcode);
    if (!product) return null;
    const scoring = calculateCosmeticScore(cosmeticToScoringInput(product), 'standard');
    return {
      result,
      score: scoring.score_final,
      confidence: getCosmeticConfidence(product),
      product,
      scoring,
    };
  } catch {
    return null;
  }
}

async function rankResults(
  category: CategoryDef,
  results: SearchResult[],
  userProfile: UserProfile,
): Promise<RankedItem[]> {
  const tasks = results.map((r) =>
    category.type === 'food'
      ? computeFoodScore(r, userProfile)
      : computeCosmeticScore(r),
  );
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

export default function CategoryScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const profile = useProfileStore((s) => s.profile);
  const category = getCategoryBySlug(slug ?? '');
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

  const featuredProducts: FeaturedProduct[] = useMemo(
    () => (category ? getFeaturedProducts(category.slug) : []),
    [category],
  );

  const featuredBarcodeSet = useMemo(
    () => new Set(featuredProducts.map((f) => f.barcode)),
    [featuredProducts],
  );

  const listQuery = useQuery({
    queryKey: ['category', slug] as const,
    queryFn: () =>
      category ? searchByCategory(category.slug, category.type) : Promise.resolve([]),
    enabled: Boolean(category),
    staleTime: FIVE_MIN_MS,
  });

  const rankedQuery = useQuery({
    queryKey: ['ranked', slug, userProfile.type] as const,
    queryFn: () =>
      category ? rankResults(category, listQuery.data ?? [], userProfile) : Promise.resolve([]),
    enabled: Boolean(category) && Array.isArray(listQuery.data) && listQuery.data.length > 0,
    staleTime: TEN_MIN_MS,
  });

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
    if (!category) return;
    router.push(`/product/${item.result.barcode}?type=${category.type}`);
  }

  function handleFeaturedPress(featured: FeaturedProduct) {
    router.push(`/product/${featured.barcode}?type=${featured.type}`);
  }

  if (!category) {
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
              Catégorie introuvable
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 14,
                color: Colors.textMuted,
                textAlign: 'center',
              }}
            >
              Cette catégorie n'existe pas ou n'est plus disponible.
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const isLoading = listQuery.isLoading || rankedQuery.isLoading || rankedQuery.isFetching;
  const isRefreshing = listQuery.isRefetching || rankedQuery.isRefetching;
  const rankedData: RankedItem[] = rankedQuery.data ?? [];

  // Dedup R5 : exclure les barcodes déjà présents dans featured
  const liveData: RankedItem[] = rankedData.filter(
    (r) => !featuredBarcodeSet.has(r.result.barcode),
  );

  const compatibleCount = compatProfile
    ? liveData.filter((r) => isProductCompatible(r.product, r.scoring, compatProfile)).length
    : 0;

  const visibleLive: RankedItem[] =
    mode === 'profile' && compatProfile
      ? liveData.filter((r) => isProductCompatible(r.product, r.scoring, compatProfile))
      : liveData;

  const hasFeatured = featuredProducts.length > 0;
  const hasLive = visibleLive.length > 0;

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
            <Text style={styles.emoji} allowFontScaling={false}>
              {category.emoji}
            </Text>
            <View style={{ gap: 2, flex: 1 }}>
              <Text style={styles.title}>{category.name}</Text>
              <Text style={styles.subtitle}>Top des meilleurs produits</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <CompatibilityToggle
            mode={mode}
            onChange={setMode}
            compatibleCount={compatibleCount}
            totalCount={liveData.length}
            disabled={!compatProfile}
          />
        </FadeIn>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.sage}
              colors={[Colors.sage]}
            />
          }
        >
          {hasFeatured ? (
            <FadeIn delay={0}>
              <View style={{ gap: 10 }}>
                <Text style={styles.sectionTitle}>Produits populaires</Text>
                <View style={{ gap: 8 }}>
                  {featuredProducts.map((p) => (
                    <FeaturedProductCard
                      key={`featured-${p.barcode}`}
                      product={p}
                      onPress={() => handleFeaturedPress(p)}
                    />
                  ))}
                </View>
              </View>
            </FadeIn>
          ) : null}

          {hasFeatured ? <View style={styles.separator} /> : null}

          {hasFeatured ? (
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Plus de produits</Text>
          ) : null}

          {isLoading && !hasLive ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height={88} radius={20} />
              ))}
              <Text style={styles.loadingHint}>Calcul des scores…</Text>
            </View>
          ) : !hasLive ? (
            hasFeatured ? null : (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
                <Text style={styles.emptyText}>
                  Aucun produit n'a pu être analysé dans cette catégorie pour le moment.
                </Text>
              </GlassCard>
            )
          ) : (
            <View style={{ gap: 10 }}>
              {visibleLive.map((item, index) => {
                const medal = hasFeatured ? undefined : medalForIndex(index);
                return (
                  <FadeIn
                    key={item.result.barcode}
                    delay={Math.min(120 + index * 40, 480)}
                  >
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
              })}
            </View>
          )}
        </ScrollView>
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
  emoji: {
    fontSize: 48,
    lineHeight: 54,
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
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(139, 173, 139, 0.18)',
    marginVertical: 16,
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
});
