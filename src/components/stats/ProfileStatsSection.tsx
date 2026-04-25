/**
 * ProfileStatsSection — bloc agrégé de statistiques pour l'écran Profil.
 *
 * Compose : StreakCounter, grille 2x2 de StatCards, sparkline 28j,
 * WeeklyProgressBar 7j, BadgeGrid (12), CTA méthodologie.
 */

import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { StreakCounter } from '@/src/components/gamification/StreakCounter';
import { BadgeGrid } from '@/src/components/gamification/BadgeGrid';
import { WeeklyProgressBar } from '@/src/components/gamification/WeeklyProgressBar';
import { StatCard } from './StatCard';
import { WeeklySparkline } from './WeeklySparkline';
import { Colors, scoreColor } from '@/src/constants/colors';
import { calculateStreak } from '@/src/lib/gamification/streak-engine';
import { calculateProfileStats } from '@/src/lib/stats/profile-stats-engine';
import {
  generateSparklineColor,
  generateSparklinePoints,
} from '@/src/lib/stats/sparkline-data';
import type { BadgeDef, ScanRecord } from '@/src/lib/gamification/types';

interface ProfileStatsSectionProps {
  userId: string;
  scans: ScanRecord[];
  reportCount: number;
  badges: { earned: BadgeDef[]; newlyEarned: BadgeDef[] };
  onSeeMethodology: () => void;
  onSeeAllBadges?: () => void;
}

export function ProfileStatsSection({
  scans,
  badges,
  onSeeMethodology,
  onSeeAllBadges,
}: ProfileStatsSectionProps) {
  const router = useRouter();
  const stats = calculateProfileStats(scans);
  const streak = calculateStreak(scans).currentStreak;

  const sparklinePoints = generateSparklinePoints(stats.scansByDay, 28);
  const recent = sparklinePoints.slice(-7);
  const earlier = sparklinePoints.slice(0, 7);
  const avg = (arr: number[]) => {
    const filtered = arr.filter((v) => v > 0);
    if (filtered.length === 0) return 0;
    return filtered.reduce((a, b) => a + b, 0) / filtered.length;
  };
  const trend = avg(recent) - avg(earlier);
  const sparkColor = generateSparklineColor(trend);

  const last7 = stats.scansByDay.slice(-7);
  const avgScoreColor =
    stats.averageScoreAllTime > 0
      ? scoreColor(stats.averageScoreAllTime)
      : Colors.text;

  const earnedIds = badges.earned.map((b) => b.id);
  const newlyIds = badges.newlyEarned.map((b) => b.id);

  return (
    <View style={{ gap: 16 }}>
      <FadeIn delay={0}>
        <StreakCounter streak={streak} />
      </FadeIn>

      <FadeIn delay={80}>
        <View style={styles.gridRow}>
          <StatCard label="Total scans" value={stats.totalScans} />
          <StatCard
            label="Score moyen"
            value={stats.averageScoreAllTime}
            color={avgScoreColor}
          />
        </View>
      </FadeIn>

      <FadeIn delay={160}>
        <View style={styles.gridRow}>
          <StatCard
            label="Évités"
            value={stats.productsAvoided}
            color={Colors.score.orange}
            icon={<ShieldCheck color={Colors.score.orange} size={16} strokeWidth={2.2} />}
          />
          <StatCard
            label="Excellents"
            value={stats.excellentProducts}
            color={Colors.score.green}
            icon={<Sparkles color={Colors.score.green} size={16} strokeWidth={2.2} />}
          />
        </View>
      </FadeIn>

      <FadeIn delay={240}>
        <GlassCard style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <View style={styles.trendIconWrap}>
              <TrendingUp color={Colors.sage} size={16} strokeWidth={2.2} />
            </View>
            <Text style={styles.trendTitle}>Tendance score</Text>
          </View>
          <View style={styles.trendBody}>
            <WeeklySparkline points={sparklinePoints} color={sparkColor} width={200} height={50} />
          </View>
        </GlassCard>
      </FadeIn>

      <FadeIn delay={320}>
        <GlassCard style={{ padding: 16, gap: 10 }}>
          <Text style={styles.sectionLabel}>Cette semaine</Text>
          <WeeklyProgressBar
            scansByDayLast7={last7}
            averageScore={stats.averageScoreThisWeek}
            deltaVsLastWeek={stats.weekOverWeekDelta.avgScore}
          />
        </GlassCard>
      </FadeIn>

      <FadeIn delay={400}>
        <View style={{ gap: 10 }}>
          <View style={styles.badgesHeader}>
            <Text style={styles.sectionLabel}>Badges</Text>
            <Text style={styles.badgesCount}>
              {earnedIds.length} / {badges.earned.length + (12 - badges.earned.length)}
            </Text>
          </View>
          <BadgeGrid
            earnedIds={earnedIds}
            newlyEarnedIds={newlyIds}
            onBadgePress={onSeeAllBadges ? () => onSeeAllBadges() : undefined}
          />
        </View>
      </FadeIn>

      <FadeIn delay={480}>
        <SecondaryButton
          label="Comment Vivo note ?"
          onPress={onSeeMethodology ?? (() => router.push('/methodology'))}
          icon={<ArrowRight color={Colors.textMuted} size={16} strokeWidth={2.2} />}
          accessibilityHint="Ouvre la page de méthodologie"
        />
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  trendCard: {
    padding: 16,
    gap: 12,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7EFE7',
  },
  trendTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  trendBody: {
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  badgesCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
});
