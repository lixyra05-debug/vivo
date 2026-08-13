/**
 * Scan Choc — fiche partageable pour produit mal noté.
 *
 * Comportement :
 *   - Free → PremiumPaywall (featureKey 'scan_choc')
 *   - Premium / Expert → carte ShareableCard contenant ScanChocCard
 *
 * Détection des problèmes (priorité, max 3) :
 *   1. additivesCount >= 5  → 💀 Cocktail d'additifs
 *   2. NOVA 4               → 🍳 Ultra-transformé
 *   3. seed oils détectés   → 🛢️ Huiles de graines
 *   4. excès macros (sucre/sel/saturés) → 🍬 Excès de sucres/sel
 *   5. score < 30           → ⚠️ Très mal noté
 *   6. score < 50           → ⚠️ Mal noté
 */

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { ShareableCard } from '@/src/components/premium/ShareableCard';
import { ScanChocCard } from '@/src/components/premium/ScanChocCard';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import {
  fetchProductMultiSource,
  fetchProductCategoriesTags,
  fetchProductPackagings,
  normalizeOFFProduct,
  productToScoringInput,
} from '@/src/lib/api/openfoodfacts';
import { findAlternatives } from '@/src/lib/api/smart-alternatives';
import { calculateScore } from '@/src/lib/scoring/engine';
import {
  composeScore,
  type CompositeScoringResult,
} from '@/src/lib/scoring/composite-score';
import { detectSeedOils } from '@/src/lib/scoring/seed-oils';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { usePremium } from '@/src/lib/hooks/usePremium';
import type { Product, ScoringResult, UserProfile } from '@/src/lib/api/types';

const STALE_15_MIN_MS = 15 * 60 * 1000;
const SUGAR_HIGH_100G = 22.5;
const SALT_HIGH_100G = 1.5;
const SAT_FAT_HIGH_100G = 5;

interface ScanChocProblem {
  emoji: string;
  label: string;
}

function detectExcessMacro(product: Product): string | null {
  const sugars = product.sugars_100g ?? 0;
  const salt = product.salt_100g ?? 0;
  const sat = product.saturated_fat_100g ?? 0;
  if (sugars >= SUGAR_HIGH_100G) return 'sucres';
  if (salt >= SALT_HIGH_100G) return 'sel';
  if (sat >= SAT_FAT_HIGH_100G) return 'graisses saturées';
  return null;
}

export function detectProblems(
  product: Product,
  result: ScoringResult,
): ScanChocProblem[] {
  const problems: ScanChocProblem[] = [];
  const additives = product.additives_tags ?? [];
  const additivesCount = additives.length;

  if (additivesCount >= 5) {
    problems.push({
      emoji: '💀',
      label: `Cocktail d'additifs (${additivesCount})`,
    });
  }
  if (problems.length < 3 && result.nova_group === 4) {
    problems.push({
      emoji: '🍳',
      label: 'Ultra-transformé (NOVA 4)',
    });
  }
  if (problems.length < 3) {
    const detectedOils = detectSeedOils(
      product.ingredients_raw ?? '',
      product.oil_types ?? [],
    );
    if (detectedOils.length > 0 || result.seed_oils_detected.length > 0) {
      problems.push({ emoji: '🛢️', label: 'Huiles de graines' });
    }
  }
  if (problems.length < 3) {
    const macro = detectExcessMacro(product);
    if (macro) {
      problems.push({
        emoji: '🍬',
        label: `Excès de ${macro}`,
      });
    }
  }
  // Fallbacks sur le score si on n'a pas atteint 3
  if (problems.length === 0) {
    if (result.score_final < 30) {
      problems.push({ emoji: '⚠️', label: 'Très mal noté' });
    } else if (result.score_final < 50) {
      problems.push({ emoji: '⚠️', label: 'Mal noté' });
    }
  }

  return problems.slice(0, 3);
}

export default function ScanChocScreen() {
  const router = useRouter();
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier, isLoading: tierLoading } = usePremium(userId);

  const productQuery = useQuery({
    queryKey: ['scan-choc-product', barcode] as const,
    queryFn: async () => {
      if (!barcode) return null;
      const result = await fetchProductMultiSource(barcode);
      if (!result || result.type !== 'food') return null;
      return normalizeOFFProduct(result.product);
    },
    enabled: Boolean(barcode),
    staleTime: STALE_15_MIN_MS,
  });

  const categoriesTagsQuery = useQuery({
    queryKey: ['scan-choc-categories', barcode] as const,
    queryFn: () => fetchProductCategoriesTags(barcode),
    enabled: Boolean(barcode),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const userProfile: UserProfile = useMemo(
    () => ({ type: 'standard', allergies: [], intolerances: [] }),
    [],
  );

  const packagingsQuery = useQuery({
    queryKey: ['scan-choc-packagings', barcode] as const,
    queryFn: () => fetchProductPackagings(barcode),
    enabled: Boolean(barcode),
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Cet écran produit une image partagée publiquement : afficher une note
  // différente de celle de la fiche ferait circuler un chiffre que l'app
  // elle-même contredit.
  const result = useMemo<CompositeScoringResult | null>(() => {
    if (!productQuery.data) return null;
    return composeScore(
      calculateScore(productToScoringInput(productQuery.data), userProfile),
      packagingsQuery.data ?? productQuery.data.packaging_components ?? [],
    );
  }, [productQuery.data, userProfile, packagingsQuery.data]);

  const alternativesQuery = useQuery({
    queryKey: [
      'scan-choc-alts',
      barcode,
      categoriesTagsQuery.data ?? [],
      result?.formulationScore ?? result?.score_final ?? 0,
    ] as const,
    queryFn: async () => {
      if (!barcode || !result) return [];
      // Axe de comparaison : la FORMULATION, pas la note composée. Les
      // candidats de `findAlternatives` sont notés par un proxy Nutri-Score
      // aveugle à l'emballage — les opposer à une note qui, elle, l'intègre
      // remonterait des produits « meilleurs » uniquement parce que leur
      // emballage n'a jamais été évalué. Même axe que FoodProductView.
      return findAlternatives(
        barcode,
        categoriesTagsQuery.data ?? [],
        result.formulationScore ?? result.score_final,
      );
    },
    enabled: Boolean(barcode) && Boolean(result) && tier !== 'free',
    staleTime: STALE_15_MIN_MS,
  });

  const topAlternative = useMemo(() => {
    const alts = alternativesQuery.data ?? [];
    if (alts.length === 0) return null;
    // findAlternatives renvoie déjà trié desc — premier = meilleur
    const top = alts[0];
    return {
      name: top.name,
      score: top.score,
      imageUrl: top.imageUrl,
    };
  }, [alternativesQuery.data]);

  const problems = useMemo(() => {
    if (!productQuery.data || !result) return [];
    return detectProblems(productQuery.data, result);
  }, [productQuery.data, result]);

  function renderHeader() {
    return (
      <View style={styles.topRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          style={styles.iconButton}
        >
          <X color={Colors.text} size={20} strokeWidth={2.2} />
        </Pressable>
      </View>
    );
  }

  // Free tier — paywall
  if (!tierLoading && tier === 'free') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenContainer scroll>
          <View style={{ gap: 22 }}>
            {renderHeader()}
            <FadeIn delay={60}>
              <Text style={styles.title}>Mode Scan Choc</Text>
              <Text style={styles.subtitle}>
                Génère une carte d&apos;alerte partageable quand un produit est
                mal noté. Réservé aux abonnés Premium.
              </Text>
            </FadeIn>
            <FadeIn delay={120}>
              <PremiumPaywall
                featureKey="scan_choc"
                onUpgrade={() => router.push('/settings/subscription')}
              />
            </FadeIn>
          </View>
        </ScreenContainer>
      </>
    );
  }

  // Loading — squelettes
  if (productQuery.isLoading || !result || !productQuery.data) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenContainer scroll>
          <View style={{ gap: 22 }}>
            {renderHeader()}
            <FadeIn delay={60}>
              <View style={{ gap: 12, alignItems: 'center' }}>
                <Skeleton width="100%" height={520} radius={24} />
                <Skeleton width="100%" height={50} radius={16} />
              </View>
            </FadeIn>
            <Text style={styles.loadingHint}>
              Génération de la carte choc…
            </Text>
          </View>
        </ScreenContainer>
      </>
    );
  }

  const product = productQuery.data;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer scroll>
        <View style={{ gap: 22 }}>
          {renderHeader()}
          <FadeIn delay={60}>
            <Text style={styles.title}>Carte partageable</Text>
            <Text style={styles.subtitle}>
              Touche &laquo;&nbsp;Partager&nbsp;&raquo; pour ouvrir la feuille
              de partage native.
            </Text>
          </FadeIn>
          <FadeIn delay={120}>
            <ShareableCard
              filename={`scan-choc-${barcode}`}
              buttonLabel="Partager"
            >
              <ScanChocCard
                productName={product.name ?? 'Produit'}
                productImage={product.image_url}
                score={result.score_final}
                problems={problems}
                alternative={topAlternative}
              />
            </ShareableCard>
          </FadeIn>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  },
  title: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 24,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginTop: 6,
  },
  loadingHint: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
