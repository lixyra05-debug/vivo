import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Leaf, Share2, Sparkles } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { useToast } from '@/src/components/common/ToastProvider';
import { ScoreCircle } from '@/src/components/product/ScoreCircle';
import { NovaBadge } from '@/src/components/product/NovaBadge';
import { SeedOilAlert } from '@/src/components/product/SeedOilAlert';
import { IngredientsList } from '@/src/components/product/IngredientsList';
import { PenaltyCard } from '@/src/components/product/PenaltyCard';
import { ProductNotFound } from '@/src/components/product/ProductNotFound';
import { Colors, scoreColor } from '@/src/constants/colors';
import { productToScoringInput } from '@/src/lib/api/openfoodfacts';
import { calculateScore, findAdditive } from '@/src/lib/scoring/engine';
import { supabase } from '@/src/lib/api/supabase';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import {
  useProduct,
  useRecordScan,
  useToggleFavorite,
} from '@/src/lib/stores/useProductStore';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import type { UserProfile } from '@/src/lib/api/types';

const SCORE_LABEL = {
  green: 'Bon',
  yellow: 'Moyen',
  orange: 'Mauvais',
  red: 'À éviter',
} as const;

function labelFromScore(score: number): string {
  if (score >= 70) return SCORE_LABEL.green;
  if (score >= 50) return SCORE_LABEL.yellow;
  if (score >= 25) return SCORE_LABEL.orange;
  return SCORE_LABEL.red;
}

export default function ProductScreen() {
  const router = useRouter();
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const productQuery = useProduct(barcode ?? null);
  const recordScan = useRecordScan(user?.id);
  const toggleFavorite = useToggleFavorite(user?.id);

  const toast = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [scanRecorded, setScanRecorded] = useState(false);
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
    recordScan.mutate({
      barcode,
      score: result.score_final,
      profile: userProfile.type,
      penalties: result.penalties,
    });
  }, [user, barcode, result, scanRecorded, recordScan, userProfile.type]);

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
            <Skeleton width={160} height={160} radius={28} />
            <Skeleton width={220} height={22} />
            <Skeleton width={120} height={14} />
          </View>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Skeleton width={220} height={220} radius={999} />
          </View>
          <View style={{ gap: 12, marginTop: 12 }}>
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
  const additivePenalties = result.penalties.filter((p) => p.category === 'additive');
  const otherPenalties = result.penalties.filter(
    (p) => p.category !== 'additive' && p.points > 0,
  );
  const hasPenalties = additivePenalties.length > 0 || otherPenalties.length > 0;
  const scoreHex = scoreColor(result.score_final);
  const scoreLabel = labelFromScore(result.score_final);

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

        <FadeIn delay={80}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            {product.image_url ? (
              <ExpoImage
                source={{ uri: product.image_url }}
                style={styles.productImage}
                contentFit="contain"
                transition={300}
                accessibilityLabel={`Image de ${product.name ?? 'produit'}`}
              />
            ) : (
              <View style={[styles.productImage, styles.productImagePlaceholder]}>
                <Leaf color={Colors.sage} size={48} strokeWidth={1.6} />
              </View>
            )}
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 24,
                color: Colors.text,
                textAlign: 'center',
                letterSpacing: -0.5,
                paddingHorizontal: 16,
              }}
              numberOfLines={2}
            >
              {product.name ?? 'Produit'}
            </Text>
            {product.brand ? (
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 14,
                  color: Colors.textMuted,
                  textAlign: 'center',
                }}
              >
                {product.brand}
              </Text>
            ) : null}
          </View>
        </FadeIn>

        <FadeIn delay={180}>
          <View style={{ alignItems: 'center', gap: 14 }}>
            <View style={styles.scoreHaloWrap}>
              <View style={[styles.scoreHalo, { backgroundColor: `${scoreHex}18` }]} />
              <ScoreCircle score={result.score_final} size={200} strokeWidth={14} />
            </View>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-SemiBold',
                fontSize: 20,
                color: scoreHex,
                letterSpacing: -0.3,
              }}
            >
              {scoreLabel}
            </Text>
            {result.nova_group ? (
              <NovaBadge group={result.nova_group as 1 | 2 | 3 | 4} />
            ) : null}
          </View>
        </FadeIn>

        {result.blockers.length > 0 ? (
          <FadeIn delay={240}>
            <GlassCard tone="danger" style={{ padding: 16, gap: 6 }}>
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-SemiBold',
                  fontSize: 15,
                  color: Colors.score.red,
                }}
              >
                Bloquants détectés
              </Text>
              {result.blockers.map((b) => (
                <Text
                  key={b}
                  style={{ fontFamily: 'Inter', fontSize: 13, color: Colors.text }}
                >
                  • {b}
                </Text>
              ))}
            </GlassCard>
          </FadeIn>
        ) : null}

        {hasPenalties ? (
          <FadeIn delay={280}>
            <View style={{ gap: 12 }}>
              <View style={{ gap: 4 }}>
                <Text
                  style={{
                    fontFamily: 'BricolageGrotesque-Bold',
                    fontSize: 20,
                    color: Colors.text,
                    letterSpacing: -0.3,
                  }}
                >
                  Pourquoi ce score
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: Colors.textMuted,
                  }}
                >
                  Les éléments qui pèsent sur la note.
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                {additivePenalties.map((p) => {
                  const entry = findAdditive(p.code);
                  const isBlocker = entry?.isBlocker ?? false;
                  return (
                    <PenaltyCard
                      key={p.code}
                      code={p.code}
                      title={entry?.nameFr ?? p.label}
                      points={p.points}
                      description={entry?.descriptionShortFr ?? p.label}
                      detailed={entry?.descriptionDetailedFr}
                      sources={entry?.scientificSources}
                      severity={isBlocker ? 'blocker' : undefined}
                    />
                  );
                })}
                {otherPenalties.map((p) => (
                  <PenaltyCard
                    key={`${p.code}-${p.label}`}
                    title={p.label}
                    points={p.points}
                  />
                ))}
              </View>
            </View>
          </FadeIn>
        ) : null}

        {result.seed_oils_detected.length > 0 ? (
          <FadeIn delay={320}>
            <SeedOilAlert oils={result.seed_oils_detected} />
          </FadeIn>
        ) : null}

        {result.clean_labeling_alerts.length > 0 ? (
          <FadeIn delay={360}>
            <GlassCard tone="info" style={{ padding: 16, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles color="#B58900" size={18} strokeWidth={2.2} />
                <Text
                  style={{
                    fontFamily: 'BricolageGrotesque-SemiBold',
                    fontSize: 15,
                    color: Colors.text,
                  }}
                >
                  Clean labeling suspect
                </Text>
              </View>
              <View style={{ gap: 4 }}>
                {result.clean_labeling_alerts.map((a) => (
                  <Text
                    key={a}
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: Colors.textMuted,
                      lineHeight: 19,
                    }}
                  >
                    • {a}
                  </Text>
                ))}
              </View>
            </GlassCard>
          </FadeIn>
        ) : null}

        {result.profile_adjustments.length > 0 ? (
          <FadeIn delay={400}>
            <GlassCard style={{ padding: 16, gap: 6 }}>
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-SemiBold',
                  fontSize: 15,
                  color: Colors.text,
                }}
              >
                Ajustements liés à ton profil
              </Text>
              {result.profile_adjustments.map((a) => (
                <Text
                  key={a}
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: Colors.textMuted,
                    lineHeight: 19,
                  }}
                >
                  • {a}
                </Text>
              ))}
            </GlassCard>
          </FadeIn>
        ) : null}

        {product.ingredients_raw ? (
          <FadeIn delay={440}>
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-SemiBold',
                  fontSize: 16,
                  color: Colors.text,
                }}
              >
                Ingrédients
              </Text>
              <IngredientsList ingredientsRaw={product.ingredients_raw} />
            </View>
          </FadeIn>
        ) : null}

        <FadeIn delay={480}>
          <PrimaryCTA
            label="Voir les alternatives"
            onPress={() => router.push(`/swap/${product.barcode}`)}
            icon={<Leaf color="#FFFFFF" size={18} strokeWidth={2.2} />}
            accessibilityHint="Découvre des produits mieux notés dans la même catégorie"
          />
        </FadeIn>

        <View style={{ height: 24 }} />
      </View>
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
  productImage: {
    width: 160,
    height: 160,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#587858',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  productImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  scoreHaloWrap: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreHalo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
  },
});
