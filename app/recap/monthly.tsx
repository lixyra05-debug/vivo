/**
 * Vivo Recap mensuel — story partageable (Premium tier).
 *
 * 8 cartes verticales empilées dans un <ViewShot> capturable en PNG, avec un
 * bouton de partage natif via expo-sharing. Si l'utilisateur n'est pas Premium,
 * la story est rendue floutée derrière un PremiumPaywall.
 */

import { useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import { Share2, X } from 'lucide-react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { usePremium } from '@/src/lib/premium/premium-gate';
import { useMonthlyRecap } from '@/src/lib/stats/use-monthly-recap';
import type { MonthlyRecap } from '@/src/lib/stats/monthly-recap';

const GRADIENT_TOP = '#2D4A2D';
const GRADIENT_BOTTOM = '#8BAD8B';
const WHITE = '#FFFFFF';

/**
 * Renvoie le mois précédent (year, month 0-11) du jour courant, en gérant
 * la bascule janvier → décembre de l'année précédente.
 */
function getPreviousMonth(now: Date = new Date()): { year: number; month: number } {
  const month = now.getMonth();
  if (month === 0) return { year: now.getFullYear() - 1, month: 11 };
  return { year: now.getFullYear(), month: month - 1 };
}

/**
 * Parse les query params en (year, month) avec fallback "mois précédent".
 */
function parseTargetMonth(params: {
  year?: string;
  month?: string;
}): { year: number; month: number } {
  const fallback = getPreviousMonth();
  const yearNum = params.year ? Number(params.year) : NaN;
  const monthNum = params.month ? Number(params.month) : NaN;

  const isValid =
    Number.isInteger(yearNum) &&
    yearNum > 1970 &&
    yearNum < 3000 &&
    Number.isInteger(monthNum) &&
    monthNum >= 0 &&
    monthNum <= 11;

  return isValid ? { year: yearNum, month: monthNum } : fallback;
}

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  }
}

export default function MonthlyRecapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const { year, month } = useMemo(() => parseTargetMonth(params), [params]);

  const userId = useAuthStore((s) => s.session?.user?.id ?? null);
  const { tier, isLoading: tierLoading } = usePremium();
  const { recap, isLoading: recapLoading } = useMonthlyRecap(userId, year, month);

  const viewShotRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  function handleClose() {
    triggerHaptic();
    router.back();
  }

  function goToScan() {
    triggerHaptic();
    router.push('/(tabs)/scan');
  }

  function goToSubscription() {
    triggerHaptic();
    router.push('/settings/subscription');
  }

  async function handleShare() {
    if (sharing || !viewShotRef.current) return;
    setSharing(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) return;
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Partager mon Vivo Recap',
      });
    } catch {
      // Silent — l'utilisateur a peut-être annulé le partage.
    } finally {
      setSharing(false);
    }
  }

  // ── Premium gate (free tier → preview floutée + paywall) ────────────────
  if (!tierLoading && tier === 'free') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream }}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[GRADIENT_TOP, GRADIENT_BOTTOM]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
        />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <CloseButton onPress={handleClose} tint={Colors.text} />
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 56,
              paddingBottom: 40,
              gap: 16,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ opacity: 0.3 }} pointerEvents="none">
              <Text style={[styles.previewTeaser]}>
                {recap?.monthLabel ?? 'Ton mois en chiffres'}
              </Text>
              <Text style={styles.previewBigNumber}>
                {recap?.totalScans ?? 0}
              </Text>
              <Text style={styles.previewLabel}>scans ce mois-ci</Text>
            </View>
            <PremiumPaywall
              featureKey="vivo_recap"
              onUpgrade={goToSubscription}
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Premium tier — story complète ───────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: GRADIENT_TOP }}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[GRADIENT_TOP, GRADIENT_BOTTOM]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <CloseButton onPress={handleClose} tint={WHITE} />

        {recapLoading ? (
          <LoadingState />
        ) : recap === null || recap.totalScans === 0 ? (
          <EmptyState
            monthLabel={recap?.monthLabel ?? ''}
            onPressScan={goToScan}
          />
        ) : (
          <>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 56,
                paddingBottom: 120,
              }}
              showsVerticalScrollIndicator={false}
            >
              <View ref={viewShotRef} collapsable={false} style={styles.shotWrapper}>
                <RecapStoryCards recap={recap} />
              </View>
            </ScrollView>

            <View style={styles.shareBar} pointerEvents="box-none">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Partager mon Vivo Recap"
                onPress={handleShare}
                disabled={sharing}
                style={({ pressed }) => [
                  styles.shareBtn,
                  pressed && { opacity: 0.85 },
                  sharing && { opacity: 0.6 },
                ]}
              >
                <Share2 color={GRADIENT_TOP} size={18} strokeWidth={2.4} />
                <Text style={styles.shareBtnText}>
                  {sharing ? 'Préparation…' : 'Partager mon Recap'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function CloseButton({ onPress, tint }: { onPress: () => void; tint: string }) {
  return (
    <View style={styles.closeBtnWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer"
        onPress={onPress}
        style={({ pressed }) => [
          styles.closeBtn,
          pressed && { opacity: 0.6 },
        ]}
      >
        <X color={tint} size={22} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.centerFill}>
      <Text style={styles.loadingText}>Préparation de ton recap…</Text>
    </View>
  );
}

function EmptyState({
  monthLabel,
  onPressScan,
}: {
  monthLabel: string;
  onPressScan: () => void;
}) {
  return (
    <View style={styles.centerFill}>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>
          {monthLabel ? `Pas encore de recap pour ${monthLabel}` : 'Pas encore de recap'}
        </Text>
        <Text style={styles.emptySubtitle}>
          Tu n'as pas encore scanné ce mois-ci !
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scanner mes premiers produits"
          onPress={onPressScan}
          style={({ pressed }) => [
            styles.emptyCta,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.emptyCtaText}>Scanner mes premiers produits</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RecapStoryCards({ recap }: { recap: MonthlyRecap }) {
  const badgeInfo = badgeMeta(recap.badge);

  return (
    <View style={{ gap: 16 }}>
      {/* 1. Header */}
      <FadeIn delay={100}>
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>Ton récap</Text>
          <Text style={styles.headerMonth}>{recap.monthLabel}</Text>
        </View>
      </FadeIn>

      {/* 2. Total scans */}
      <FadeIn delay={200}>
        <View style={styles.bigNumberCard}>
          <Text style={styles.bigNumber}>{recap.totalScans}</Text>
          <Text style={styles.bigNumberLabel}>scans ce mois-ci</Text>
        </View>
      </FadeIn>

      {/* 3. Average score */}
      <FadeIn delay={300}>
        <View style={styles.avgScoreCard}>
          <View style={styles.avgScoreCircle}>
            <Text style={styles.avgScoreValue}>{recap.averageScore}</Text>
            <Text style={styles.avgScoreUnit}>/100</Text>
          </View>
          <Text style={styles.avgScoreLabel}>Score moyen</Text>
        </View>
      </FadeIn>

      {/* 4. Worst product */}
      {recap.worstProduct ? (
        <FadeIn delay={400}>
          <View style={styles.worstCard}>
            <Text style={styles.miniLabel}>😬 Le pire produit du mois</Text>
            <Text style={styles.productName} numberOfLines={2}>
              {recap.worstProduct.name}
            </Text>
            <Text style={styles.worstScore}>{recap.worstProduct.score}/100</Text>
          </View>
        </FadeIn>
      ) : null}

      {/* 5. Best product */}
      {recap.bestProduct ? (
        <FadeIn delay={500}>
          <View style={styles.bestCard}>
            <Text style={styles.miniLabel}>🌟 Le meilleur produit du mois</Text>
            <Text style={styles.productName} numberOfLines={2}>
              {recap.bestProduct.name}
            </Text>
            <Text style={styles.bestScore}>{recap.bestProduct.score}/100</Text>
          </View>
        </FadeIn>
      ) : null}

      {/* 6. Avoid + Excellent */}
      <FadeIn delay={600}>
        <View style={styles.twoCol}>
          <View style={[styles.miniStatCard, styles.miniStatAvoid]}>
            <Text style={styles.miniStatNumber}>{recap.avoidCount}</Text>
            <Text style={styles.miniStatLabel}>à éviter</Text>
          </View>
          <View style={[styles.miniStatCard, styles.miniStatExcellent]}>
            <Text style={styles.miniStatNumber}>{recap.excellentCount}</Text>
            <Text style={styles.miniStatLabel}>excellents</Text>
          </View>
        </View>
      </FadeIn>

      {/* 7. Badge + top brand + top category */}
      <FadeIn delay={700}>
        <View style={styles.badgeCard}>
          <Text style={styles.badgeEmoji}>{badgeInfo.emoji}</Text>
          <Text style={styles.badgeTitle}>{badgeInfo.label}</Text>
          {recap.topBrand ? (
            <Text style={styles.badgeMeta}>
              Marque la plus scannée :{' '}
              <Text style={styles.badgeMetaStrong}>{recap.topBrand}</Text>
            </Text>
          ) : null}
          {recap.topCategory ? (
            <Text style={styles.badgeMeta}>
              Catégorie phare :{' '}
              <Text style={styles.badgeMetaStrong}>{recap.topCategory}</Text>
            </Text>
          ) : null}
        </View>
      </FadeIn>

      {/* 8. Footer */}
      <FadeIn delay={800}>
        <View style={styles.footerCard}>
          <Text style={styles.footerBrand}>Vivo</Text>
          <Text style={styles.footerTagline}>Scanne tes courses sur Vivo</Text>
        </View>
      </FadeIn>
    </View>
  );
}

function badgeMeta(badge: MonthlyRecap['badge']): {
  emoji: string;
  label: string;
} {
  switch (badge) {
    case 'detective':
      return { emoji: '🔍', label: 'Détective Toxiques' };
    case 'eclaire':
      return { emoji: '💡', label: 'Consommateur Éclairé' };
    default:
      return { emoji: '🌱', label: 'Curieux' };
  }
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  closeBtnWrap: {
    position: 'absolute',
    top: 8,
    left: 16,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shotWrapper: {
    gap: 16,
  },

  // Loading / empty
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: WHITE,
    opacity: 0.85,
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 360,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    backgroundColor: Colors.sage,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    marginTop: 12,
  },
  emptyCtaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: WHITE,
    letterSpacing: 0.2,
  },

  // Header card
  headerCard: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerMonth: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 36,
    color: WHITE,
    letterSpacing: -0.6,
    marginTop: 6,
    textAlign: 'center',
  },

  // Big number (total scans)
  bigNumberCard: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  bigNumber: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 64,
    color: WHITE,
    letterSpacing: -1.2,
    lineHeight: 70,
  },
  bigNumberLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },

  // Avg score
  avgScoreCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  avgScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgScoreValue: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 44,
    color: WHITE,
    lineHeight: 48,
  },
  avgScoreUnit: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  avgScoreLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 12,
  },

  // Worst / best
  worstCard: {
    backgroundColor: 'rgba(244,67,54,0.18)',
    borderRadius: 20,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.35)',
  },
  bestCard: {
    backgroundColor: 'rgba(76,175,80,0.18)',
    borderRadius: 20,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.35)',
  },
  miniLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.6,
  },
  productName: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: WHITE,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  worstScore: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 26,
    color: '#FFB6B0',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  bestScore: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 26,
    color: '#B6E0B5',
    letterSpacing: -0.5,
    marginTop: 4,
  },

  // 2 cols stats
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStatCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  miniStatAvoid: {
    backgroundColor: 'rgba(244,67,54,0.18)',
    borderColor: 'rgba(244,67,54,0.30)',
  },
  miniStatExcellent: {
    backgroundColor: 'rgba(76,175,80,0.18)',
    borderColor: 'rgba(76,175,80,0.30)',
  },
  miniStatNumber: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 32,
    color: WHITE,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  miniStatLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },

  // Badge
  badgeCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    gap: 6,
  },
  badgeEmoji: { fontSize: 44 },
  badgeTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  badgeMeta: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  badgeMetaStrong: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.text,
  },

  // Footer
  footerCard: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 8,
    gap: 4,
  },
  footerBrand: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: WHITE,
    letterSpacing: 0.5,
  },
  footerTagline: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
  },

  // Share button (sticky bottom)
  shareBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: WHITE,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  shareBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: GRADIENT_TOP,
    letterSpacing: 0.2,
  },

  // Free tier preview
  previewTeaser: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  previewBigNumber: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 60,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -1.2,
  },
  previewLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
