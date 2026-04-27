import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useToast } from '@/src/components/common/ToastProvider';
import { ProductNotFound } from '@/src/components/product/ProductNotFound';
import { ProductHeader } from '@/src/components/product/ProductHeader';
import { ConfidenceBadge } from '@/src/components/product/ConfidenceBadge';
import { CompatibilityBanner } from '@/src/components/product/CompatibilityBanner';
import { FoodProductView } from '@/src/components/product/FoodProductView';
import { CosmeticProductView } from '@/src/components/product/CosmeticProductView';
import { BadgeUnlockedModal } from '@/src/components/gamification/BadgeUnlockedModal';
import { Colors } from '@/src/constants/colors';
import {
  productToScoringInput,
  fetchProductCategoryTag,
} from '@/src/lib/api/openfoodfacts';
import {
  cosmeticToScoringInput,
  getOrFetchCosmetic,
} from '@/src/lib/api/openbeautyfacts';
import {
  getProductConfidence,
  getCosmeticConfidence,
} from '@/src/lib/api/confidence';
import { calculateScore } from '@/src/lib/scoring/engine';
import { calculateCosmeticScore } from '@/src/lib/scoring/cosmetic-engine';
import { checkCompatibility } from '@/src/lib/scoring/compatibility-engine';
import { userProfileToCompatibilityProfile } from '@/src/lib/scoring/profile-adapter';
import { findRelevantCards } from '@/src/lib/education/content-database';
import { checkBadges, getUserStats } from '@/src/lib/gamification/badge-engine';
import { supabase } from '@/src/lib/api/supabase';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import {
  useProduct,
  useRecordScan,
  useScanHistory,
  useToggleFavorite,
} from '@/src/lib/stores/useProductStore';
import {
  useGrantBadges,
  useUserBadges,
  useUserReportCount,
} from '@/src/lib/stores/useBadges';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { usePremium } from '@/src/lib/hooks/usePremium';
import type { UserProfile } from '@/src/lib/api/types';
import type { BadgeDef, ScanRecord } from '@/src/lib/gamification/types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function ProductScreen() {
  const { barcode, type } = useLocalSearchParams<{
    barcode: string;
    type?: 'food' | 'cosmetic';
  }>();
  const isCosmetic = type === 'cosmetic';

  if (isCosmetic) {
    return <CosmeticProductScreen barcode={barcode} />;
  }

  return <FoodProductScreen barcode={barcode} />;
}

interface FoodProductScreenProps {
  barcode: string;
}

function FoodProductScreen({ barcode }: FoodProductScreenProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const productQuery = useProduct(barcode ?? null);
  const recordScan = useRecordScan(user?.id);
  const toggleFavorite = useToggleFavorite(user?.id);
  const scanHistoryQuery = useScanHistory({ userId: user?.id, limit: 500 });
  const reportCountQuery = useUserReportCount(user?.id);
  const userBadgesQuery = useUserBadges(user?.id);
  const grantBadges = useGrantBadges(user?.id);
  const { isPremium } = usePremium(user?.id ?? null);

  const categoryTagQuery = useQuery({
    queryKey: ['product-category-tag', barcode] as const,
    queryFn: () => fetchProductCategoryTag(barcode),
    enabled: Boolean(barcode),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const toast = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [scanRecorded, setScanRecorded] = useState(false);
  const [badgeQueue, setBadgeQueue] = useState<BadgeDef[]>([]);
  const [unlockChecked, setUnlockChecked] = useState(false);
  const reduceMotion = useReduceMotion();
  const heartScale = useSharedValue(1);

  const userProfile: UserProfile = useMemo(
    () => ({
      type: profile?.health_profile ?? 'standard',
      allergies: profile?.allergies ?? [],
      intolerances: profile?.intolerances ?? [],
    }),
    [profile],
  );

  const result = useMemo(() => {
    if (!productQuery.data) return null;
    return calculateScore(productToScoringInput(productQuery.data), userProfile);
  }, [productQuery.data, userProfile]);

  useEffect(() => {
    if (!user || !barcode || !result || scanRecorded) return;
    setScanRecorded(true);
    recordScan.mutate(
      {
        barcode,
        score: result.score_final,
        profile: userProfile.type,
        penalties: result.penalties,
        productType: 'food',
      },
      {
        onSuccess: () => {
          // refetch scan_history pour évaluer les badges
          void scanHistoryQuery.refetch();
        },
      },
    );
  }, [user, barcode, result, scanRecorded, recordScan, userProfile.type, scanHistoryQuery]);

  // Check badges après l'enregistrement du scan
  useEffect(() => {
    if (!user || !scanRecorded || unlockChecked) return;
    if (!scanHistoryQuery.data || !userBadgesQuery.data) return;
    setUnlockChecked(true);
    const scans: ScanRecord[] = scanHistoryQuery.data.map((row) => ({
      barcode: row.barcode,
      score_at_scan: row.score_at_scan,
      scanned_at: row.scanned_at,
      product_type:
        (row as unknown as { product_type?: 'food' | 'cosmetic' }).product_type ?? 'food',
      is_favorite: row.is_favorite,
      category_slug: null,
    }));
    const stats = getUserStats(scans, reportCountQuery.data ?? 0, 1);
    const alreadyEarned = userBadgesQuery.data.map((row) => ({
      badgeId: row.badge_id,
      earnedAt: row.earned_at,
    }));
    const { newlyEarned } = checkBadges(stats, alreadyEarned);
    if (newlyEarned.length > 0) {
      grantBadges.mutate(newlyEarned.map((b) => b.id));
      setBadgeQueue(newlyEarned);
    }
  }, [
    user,
    scanRecorded,
    unlockChecked,
    scanHistoryQuery.data,
    userBadgesQuery.data,
    reportCountQuery.data,
    grantBadges,
  ]);

  useEffect(() => {
    if (!user || !barcode) return;
    let cancelled = false;
    void supabase
      .from('scan_history')
      .select('is_favorite')
      .eq('user_id', user.id)
      .eq('barcode', barcode)
      .eq('is_favorite', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setIsFavorite(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, barcode]);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  async function onToggleFavorite() {
    if (!user || !barcode) return;
    const next = !isFavorite;
    setIsFavorite(next);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
      ).catch(() => undefined);
    }
    if (!reduceMotion) {
      heartScale.value = withSequence(
        withSpring(1.35, { damping: 8, stiffness: 280 }),
        withSpring(1, { damping: 12, stiffness: 220 }),
      );
    }
    try {
      await toggleFavorite.mutateAsync({ barcode, next });
      toast.success(next ? 'Ajouté aux favoris' : 'Retiré des favoris');
    } catch (err) {
      setIsFavorite(!next);
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }

  async function handleShare() {
    if (!productQuery.data || !result) return;
    try {
      await Share.share({
        message: `${productQuery.data.name ?? 'Produit'} — Score Vivo ${result.score_final}/100`,
      });
    } catch {
      // ignore
    }
  }

  if (productQuery.isLoading) {
    return (
      <ScreenContainer scroll>
        <View style={{ gap: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={44} height={44} radius={999} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Skeleton width={44} height={44} radius={999} />
              <Skeleton width={44} height={44} radius={999} />
            </View>
          </View>
          <View style={{ alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Skeleton width={180} height={180} radius={24} />
            <Skeleton width={220} height={22} />
            <Skeleton width={120} height={14} />
          </View>
          <View style={{ alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Skeleton width={200} height={200} radius={999} />
            <Skeleton width={140} height={22} />
            <Skeleton width={260} height={16} />
          </View>
          <Skeleton height={10} radius={5} />
          <Skeleton height={180} radius={20} />
          <Skeleton height={280} radius={24} />
          <Skeleton height={120} radius={20} />
          <View style={{ gap: 12 }}>
            <Skeleton height={80} radius={20} />
            <Skeleton height={80} radius={20} />
            <Skeleton height={80} radius={20} />
          </View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: Colors.textMuted,
              textAlign: 'center',
              marginTop: 20,
            }}
          >
            Analyse en cours…
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!productQuery.data || !result) {
    return (
      <ProductNotFound
        barcode={barcode}
        onRetry={() => productQuery.refetch()}
        onBack={() => router.replace('/(tabs)/scan')}
      />
    );
  }

  const product = productQuery.data;
  const confidence = getProductConfidence(product);
  const compatProfile = userProfileToCompatibilityProfile(profile);
  const compatibilityResult = compatProfile
    ? checkCompatibility(product, result, compatProfile)
    : null;
  const educationalCards = findRelevantCards(
    {
      additives_tags: product.additives_tags ?? [],
      ingredients_raw: product.ingredients_raw ?? null,
      ingredients_inci: null,
      category_slug: null,
    },
    { score_final: result.score_final },
    2,
  );

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 22 }}>
        <FadeIn delay={0}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={styles.iconButton}
            >
              <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Animated.View style={heartStyle}>
                <Pressable
                  onPress={onToggleFavorite}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  accessibilityState={{ selected: isFavorite }}
                  style={[styles.iconButton, isFavorite && styles.iconButtonActive]}
                >
                  <Heart
                    color={isFavorite ? Colors.score.red : Colors.text}
                    fill={isFavorite ? Colors.score.red : 'transparent'}
                    size={20}
                    strokeWidth={2.2}
                  />
                </Pressable>
              </Animated.View>
              <Pressable
                onPress={handleShare}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Partager ce produit"
                style={styles.iconButton}
              >
                <Share2 color={Colors.text} size={20} strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={60}>
          <ProductHeader
            name={product.name}
            brand={product.brand}
            imageUrl={product.image_url}
            score={result.score_final}
            isOrganic={product.is_organic}
            category={null}
          />
        </FadeIn>

        <FadeIn delay={100}>
          <View style={{ alignItems: 'center' }}>
            <ConfidenceBadge confidence={confidence} size="small" />
          </View>
        </FadeIn>

        {compatibilityResult ? (
          <FadeIn delay={120}>
            <CompatibilityBanner result={compatibilityResult} />
          </FadeIn>
        ) : null}

        <FoodProductView
          product={product}
          result={result}
          educationalCards={educationalCards}
          categoryTag={categoryTagQuery.data ?? null}
          isPremium={isPremium}
          onUnlockPremium={() => router.push('/profile')}
          onPressAlternative={(bc) => router.push(`/product/${bc}?type=food`)}
          onPressMethodology={() => router.push('/methodology')}
          onPressSwap={() => router.push(`/swap/${product.barcode}`)}
        />

        <View style={{ height: 24 }} />
      </View>
      <BadgeUnlockedModal
        badge={badgeQueue[0] ?? null}
        onClose={() => setBadgeQueue((q) => q.slice(1))}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
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
  iconButtonActive: {
    borderColor: 'rgba(244, 67, 54, 0.25)',
  },
});

interface CosmeticProductScreenProps {
  barcode: string;
}

function CosmeticProductScreen({ barcode }: CosmeticProductScreenProps) {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);

  const cosmeticQuery = useQuery({
    queryKey: ['cosmetic', barcode] as const,
    queryFn: () => (barcode ? getOrFetchCosmetic(barcode) : Promise.resolve(null)),
    enabled: Boolean(barcode),
    staleTime: SEVEN_DAYS_MS,
    gcTime: SEVEN_DAYS_MS,
  });

  const result = useMemo(() => {
    if (!cosmeticQuery.data) return null;
    return calculateCosmeticScore(
      cosmeticToScoringInput(cosmeticQuery.data),
      'standard',
    );
  }, [cosmeticQuery.data]);

  const compatibilityResult = useMemo(() => {
    if (!cosmeticQuery.data || !result) return null;
    const compat = userProfileToCompatibilityProfile(profile);
    if (!compat) return null;
    return checkCompatibility(cosmeticQuery.data, result, compat);
  }, [cosmeticQuery.data, result, profile]);

  const confidence = useMemo(() => {
    if (!cosmeticQuery.data) return null;
    return getCosmeticConfidence(cosmeticQuery.data);
  }, [cosmeticQuery.data]);

  const educationalCards = useMemo(() => {
    if (!cosmeticQuery.data || !result) return [];
    return findRelevantCards(
      {
        additives_tags: [],
        ingredients_raw: null,
        ingredients_inci: cosmeticQuery.data.ingredients_inci ?? null,
        category_slug: null,
      },
      { score_final: result.score_final },
      2,
    );
  }, [cosmeticQuery.data, result]);

  if (cosmeticQuery.isLoading) {
    return (
      <ScreenContainer scroll>
        <View style={{ gap: 18 }}>
          <View style={styles.topRow}>
            <Skeleton width={44} height={44} radius={999} />
          </View>
          <View style={{ alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Skeleton width={180} height={180} radius={24} />
            <Skeleton width={220} height={22} />
            <Skeleton width={120} height={14} />
          </View>
          <View style={{ alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Skeleton width={200} height={200} radius={999} />
            <Skeleton width={140} height={22} />
          </View>
          <Skeleton height={180} radius={20} />
          <Skeleton height={120} radius={20} />
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: Colors.textMuted,
              textAlign: 'center',
              marginTop: 20,
            }}
          >
            Analyse INCI en cours…
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!cosmeticQuery.data || !result) {
    return (
      <ProductNotFound
        barcode={barcode}
        onRetry={() => cosmeticQuery.refetch()}
        onBack={() => router.replace('/(tabs)/explore')}
      />
    );
  }

  // TODO: activer les favoris cosmétiques quand scan_history (ou une table dédiée) supportera type='cosmetic'.
  return (
    <ScreenContainer scroll>
      <View style={{ gap: 22 }}>
        <FadeIn delay={0}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={styles.iconButton}
            >
              <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
            </Pressable>
          </View>
        </FadeIn>
        <CosmeticProductView
          product={cosmeticQuery.data}
          result={result}
          confidence={confidence}
          compatibilityResult={compatibilityResult}
          educationalCards={educationalCards}
          onPressMethodology={() => router.push('/methodology')}
        />
        <View style={{ height: 24 }} />
      </View>
    </ScreenContainer>
  );
}
