/**
 * Statistiques avancées — dashboard Premium.
 *
 * Consomme `calculateAdvancedStats(scans, now)` (moteur pur) + `useScanHistory`
 * (limite 500 scans). 6 sections :
 *   1) Tendance 28j (sparkline lissé) + pente régression linéaire
 *   2) Distribution des scores (5 buckets)
 *   3) Top 5 catégories
 *   4) Top 5 marques
 *   5) Streak (current + longest)
 *   6) Exposition toxique (30j) — totalPenalties, uniqueAdditives, worstAdditive
 *
 * Free / Premium-non-éligible : `<PremiumPaywall featureKey="advanced_stats" />`.
 * R5 : aucune allégation thérapeutique. Les nombres restent des observations.
 */

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Flame,
  Layers,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useScanHistory } from '@/src/lib/stores/useProductStore';
import {
  calculateAdvancedStats,
  type AdvancedStats,
  type CategoryAggregate,
  type BrandAggregate,
} from '@/src/lib/stats/advanced-stats';
import type { ScanRecord } from '@/src/lib/gamification/types';

const SPARKLINE_PADDING = 6;
const SPARKLINE_HEIGHT = 100;

// ─── Helpers locaux ─────────────────────────────────────────────────────────

function buildSmoothPath(
  values: number[],
  width: number,
  height: number,
): string {
  if (values.length === 0) return '';
  const innerW = width - SPARKLINE_PADDING * 2;
  const innerH = height - SPARKLINE_PADDING * 2;
  const xs = values.map((_, i) =>
    values.length === 1
      ? width / 2
      : SPARKLINE_PADDING + (i / (values.length - 1)) * innerW,
  );
  const ys = values.map((s) => {
    const clamped = Math.max(0, Math.min(100, s));
    return SPARKLINE_PADDING + innerH - (clamped / 100) * innerH;
  });

  let d = `M ${xs[0].toFixed(2)},${ys[0].toFixed(2)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[Math.max(i - 1, 0)];
    const y0 = ys[Math.max(i - 1, 0)];
    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    const x3 = xs[Math.min(i + 2, xs.length - 1)];
    const y3 = ys[Math.min(i + 2, ys.length - 1)];

    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }
  return d;
}

function trendColor(slope: number): string {
  if (slope > 0.5) return Colors.score.green;
  if (slope < -0.5) return Colors.score.orange;
  return Colors.earth;
}

function trendLabel(slope: number): string {
  if (slope > 0.5) return 'En progression';
  if (slope < -0.5) return 'En recul';
  return 'Stable';
}

// ─── Écran ──────────────────────────────────────────────────────────────────

export default function AdvancedStatsScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier, isLoading: tierLoading } = usePremium(userId);
  const scanHistoryQuery = useScanHistory({ userId: userId ?? undefined, limit: 500 });

  const isFree = tier === 'free';

  const scans: ScanRecord[] = useMemo(
    () =>
      (scanHistoryQuery.data ?? []).map((row) => ({
        barcode: row.barcode,
        score_at_scan: row.score_at_scan,
        scanned_at: row.scanned_at,
        product_type: row.product_type ?? 'food',
        is_favorite: row.is_favorite,
        category_slug:
          (row.product as { categories_tags?: string[] | null } | null)
            ?.categories_tags?.[0] ?? null,
      })),
    [scanHistoryQuery.data],
  );

  const stats: AdvancedStats = useMemo(
    () => calculateAdvancedStats(scans),
    [scans],
  );

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 18 }}>
        <FadeIn delay={0}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backButton}
          >
            <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
          </Pressable>
        </FadeIn>

        <FadeIn delay={60}>
          <View style={{ gap: 4 }}>
            <Text style={styles.title}>Statistiques avancées</Text>
            <Text style={styles.subtitle}>
              Analyse fine de tes 500 derniers scans
            </Text>
          </View>
        </FadeIn>

        {!tierLoading && isFree ? (
          <FadeIn delay={120}>
            <PremiumPaywall
              featureKey="advanced_stats"
              onUpgrade={handleUpgrade}
            />
          </FadeIn>
        ) : scanHistoryQuery.isLoading ? (
          <View style={{ gap: 14 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={120} radius={20} />
            ))}
          </View>
        ) : scans.length === 0 ? (
          <FadeIn delay={120}>
            <GlassCard style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <BarChart3 color={Colors.sage} size={36} strokeWidth={1.6} />
              </View>
              <Text style={styles.emptyTitle}>Aucune donnée à analyser</Text>
              <Text style={styles.emptyBody}>
                Scanne quelques produits pour débloquer ton tableau de bord
                avancé.
              </Text>
            </GlassCard>
          </FadeIn>
        ) : (
          <StatsContent stats={stats} />
        )}
      </View>
    </ScreenContainer>
  );
}

interface StatsContentProps {
  stats: AdvancedStats;
}

function StatsContent({ stats }: StatsContentProps) {
  const sparklineWidth = 320; // largeur fixe — Svg s'adapte via viewBox
  const trendValues = stats.trend28d.points.map((p) => p.avgScore);
  const trendPath = buildSmoothPath(
    trendValues,
    sparklineWidth,
    SPARKLINE_HEIGHT,
  );
  const trendStroke = trendColor(stats.trend28d.slope);

  return (
    <View style={{ gap: 14 }}>
      {/* 1) Tendance 28j */}
      <FadeIn delay={120}>
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionLabel}>Tendance 28 jours</Text>
              <Text style={styles.sectionHint}>
                Score moyen quotidien (Europe/Paris)
              </Text>
            </View>
            <View
              style={[
                styles.trendPill,
                { backgroundColor: `${trendStroke}1A`, borderColor: trendStroke },
              ]}
            >
              {stats.trend28d.slope > 0.5 ? (
                <TrendingUp color={trendStroke} size={14} strokeWidth={2.4} />
              ) : stats.trend28d.slope < -0.5 ? (
                <TrendingDown color={trendStroke} size={14} strokeWidth={2.4} />
              ) : null}
              <Text style={[styles.trendPillText, { color: trendStroke }]}>
                {trendLabel(stats.trend28d.slope)}
              </Text>
            </View>
          </View>

          <View style={styles.sparklineWrap}>
            <Svg
              width="100%"
              height={SPARKLINE_HEIGHT}
              viewBox={`0 0 ${sparklineWidth} ${SPARKLINE_HEIGHT}`}
              preserveAspectRatio="none"
            >
              {/* Grille horizontale subtile */}
              {[0.25, 0.5, 0.75].map((ratio) => {
                const y =
                  SPARKLINE_PADDING +
                  ratio * (SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2);
                return (
                  <Path
                    key={ratio}
                    d={`M ${SPARKLINE_PADDING},${y} L ${sparklineWidth - SPARKLINE_PADDING},${y}`}
                    stroke="#E2EBE2"
                    strokeWidth={1}
                    strokeDasharray="3 4"
                  />
                );
              })}
              <Path
                d={trendPath}
                stroke={trendStroke}
                strokeWidth={2.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dernier point en évidence */}
              {trendValues.length > 0 ? (
                <Circle
                  cx={sparklineWidth - SPARKLINE_PADDING}
                  cy={
                    SPARKLINE_PADDING +
                    (SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2) *
                      (1 -
                        Math.max(
                          0,
                          Math.min(100, trendValues[trendValues.length - 1]),
                        ) /
                          100)
                  }
                  r={4}
                  fill={trendStroke}
                />
              ) : null}
            </Svg>
          </View>

          <View style={styles.trendFooter}>
            <Text style={styles.trendFooterLabel}>Pente</Text>
            <Text style={styles.trendFooterValue}>
              {stats.trend28d.slope > 0 ? '+' : ''}
              {stats.trend28d.slope.toFixed(2)} pt/jour
            </Text>
          </View>
        </GlassCard>
      </FadeIn>

      {/* 2) Distribution */}
      <FadeIn delay={180}>
        <GlassCard style={styles.card}>
          <Text style={styles.sectionLabel}>Distribution des scores</Text>
          <DistributionRow
            label="Excellent (≥85)"
            count={stats.distribution.excellent}
            color={Colors.score.green}
            total={
              stats.distribution.excellent +
              stats.distribution.good +
              stats.distribution.mid +
              stats.distribution.poor +
              stats.distribution.bad
            }
          />
          <DistributionRow
            label="Bon (70-84)"
            count={stats.distribution.good}
            color="#8BC34A"
            total={
              stats.distribution.excellent +
              stats.distribution.good +
              stats.distribution.mid +
              stats.distribution.poor +
              stats.distribution.bad
            }
          />
          <DistributionRow
            label="Moyen (50-69)"
            count={stats.distribution.mid}
            color={Colors.score.yellow}
            total={
              stats.distribution.excellent +
              stats.distribution.good +
              stats.distribution.mid +
              stats.distribution.poor +
              stats.distribution.bad
            }
          />
          <DistributionRow
            label="Médiocre (30-49)"
            count={stats.distribution.poor}
            color={Colors.score.orange}
            total={
              stats.distribution.excellent +
              stats.distribution.good +
              stats.distribution.mid +
              stats.distribution.poor +
              stats.distribution.bad
            }
          />
          <DistributionRow
            label="Mauvais (<30)"
            count={stats.distribution.bad}
            color={Colors.score.red}
            total={
              stats.distribution.excellent +
              stats.distribution.good +
              stats.distribution.mid +
              stats.distribution.poor +
              stats.distribution.bad
            }
          />
        </GlassCard>
      </FadeIn>

      {/* 3) Top catégories + 4) Top marques */}
      <FadeIn delay={240}>
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Layers color={Colors.sage} size={18} strokeWidth={2.2} />
            <Text style={styles.sectionLabel}>Top 5 catégories</Text>
          </View>
          {stats.topCategories.length === 0 ? (
            <Text style={styles.emptyInline}>
              Pas assez de scans catégorisés pour le moment.
            </Text>
          ) : (
            stats.topCategories.map((cat, idx) => (
              <CategoryRow key={`${cat.name}-${idx}`} item={cat} index={idx} />
            ))
          )}
        </GlassCard>
      </FadeIn>

      <FadeIn delay={300}>
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Award color={Colors.sage} size={18} strokeWidth={2.2} />
            <Text style={styles.sectionLabel}>Top 5 marques</Text>
          </View>
          {stats.topBrands.length === 0 ? (
            <Text style={styles.emptyInline}>
              Aucune marque détectée sur tes scans récents.
            </Text>
          ) : (
            stats.topBrands.map((brand, idx) => (
              <BrandRow key={`${brand.name}-${idx}`} item={brand} index={idx} />
            ))
          )}
        </GlassCard>
      </FadeIn>

      {/* 5) Streak */}
      <FadeIn delay={360}>
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Flame color={Colors.score.orange} size={18} strokeWidth={2.2} />
            <Text style={styles.sectionLabel}>Régularité</Text>
          </View>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={styles.streakValue}>{stats.streak.current}</Text>
              <Text style={styles.streakLabel}>Série actuelle</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakValue}>{stats.streak.longest}</Text>
              <Text style={styles.streakLabel}>Meilleure série</Text>
            </View>
          </View>
        </GlassCard>
      </FadeIn>

      {/* 6) Exposition toxique 30j */}
      <FadeIn delay={420}>
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Trophy color={Colors.earth} size={18} strokeWidth={2.2} />
            <Text style={styles.sectionLabel}>Exposition aux additifs (30j)</Text>
          </View>
          <View style={styles.exposureGrid}>
            <View style={styles.exposureCell}>
              <Text style={styles.exposureValue}>
                {stats.toxicExposure.totalPenalties}
              </Text>
              <Text style={styles.exposureLabel}>Pénalités cumulées</Text>
            </View>
            <View style={styles.exposureCell}>
              <Text style={styles.exposureValue}>
                {stats.toxicExposure.uniqueAdditives}
              </Text>
              <Text style={styles.exposureLabel}>Additifs uniques</Text>
            </View>
          </View>
          {stats.toxicExposure.worstAdditive ? (
            <View style={styles.worstAdditiveBox}>
              <Text style={styles.worstAdditiveLabel}>
                Additif le plus fréquent
              </Text>
              <Text style={styles.worstAdditiveCode}>
                {stats.toxicExposure.worstAdditive.code}
              </Text>
              <Text style={styles.worstAdditiveCount}>
                {stats.toxicExposure.worstAdditive.count} occurrence
                {stats.toxicExposure.worstAdditive.count > 1 ? 's' : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyInline}>
              Aucun additif détecté sur les 30 derniers jours ✅
            </Text>
          )}
        </GlassCard>
      </FadeIn>

      <FadeIn delay={480}>
        <Text style={styles.disclaimer}>
          Ces statistiques sont fournies à titre informatif et ne constituent
          pas un conseil médical.
        </Text>
      </FadeIn>
    </View>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface DistributionRowProps {
  label: string;
  count: number;
  color: string;
  total: number;
}

function DistributionRow({ label, count, color, total }: DistributionRowProps) {
  const ratio = total > 0 ? count / total : 0;
  const widthPercent = `${Math.round(ratio * 100)}%`;
  return (
    <View style={styles.distRow}>
      <View style={styles.distHeader}>
        <Text style={styles.distLabel}>{label}</Text>
        <Text style={styles.distCount}>{count}</Text>
      </View>
      <View style={styles.distTrack}>
        <View
          style={[
            styles.distFill,
            { width: widthPercent as `${number}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function CategoryRow({
  item,
  index,
}: {
  item: CategoryAggregate;
  index: number;
}) {
  return (
    <View style={styles.topRow}>
      <Text style={styles.topRank}>{index + 1}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.topName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.topMeta}>
          {item.count} scan{item.count > 1 ? 's' : ''} · score moyen{' '}
          {item.avgScore}
        </Text>
      </View>
    </View>
  );
}

function BrandRow({ item, index }: { item: BrandAggregate; index: number }) {
  return (
    <View style={styles.topRow}>
      <Text style={styles.topRank}>{index + 1}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.topName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.topMeta}>
          {item.count} scan{item.count > 1 ? 's' : ''} · score moyen{' '}
          {item.avgScore}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

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
  title: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 28,
    color: Colors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
  },
  card: {
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
    letterSpacing: 0.4,
  },
  sectionHint: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  trendPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  sparklineWrap: {
    width: '100%',
    height: SPARKLINE_HEIGHT,
  },
  trendFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendFooterLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  trendFooterValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  distRow: {
    gap: 6,
  },
  distHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.text,
  },
  distCount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  distTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#F1F1E8',
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: 999,
  },
  emptyInline: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  topRank: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 18,
    color: Colors.sage,
    width: 24,
    letterSpacing: -0.4,
  },
  topName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  topMeta: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  streakDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2EBE2',
  },
  streakValue: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 30,
    color: Colors.text,
    letterSpacing: -0.6,
  },
  streakLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  exposureGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  exposureCell: {
    flex: 1,
    backgroundColor: 'rgba(196, 168, 130, 0.08)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  exposureValue: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 26,
    color: Colors.earth,
    letterSpacing: -0.5,
  },
  exposureLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  worstAdditiveBox: {
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    borderRadius: 16,
    padding: 14,
    gap: 4,
    alignItems: 'flex-start',
  },
  worstAdditiveLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  worstAdditiveCode: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.score.orange,
    letterSpacing: -0.4,
  },
  worstAdditiveCount: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.text,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  emptyBody: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  disclaimer: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 16,
  },
});
