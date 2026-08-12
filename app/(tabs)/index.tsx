/**
 * Home — écran de référence du Design System v2.
 *
 * Ce que la v1 empilait : un salut personnalisé, une tagline flottante, un bloc
 * de marque animé, puis six sections, et enfin le bouton de scan tout en bas.
 * Trois blocs se disputaient le rôle de héros en haut de page, et l'action
 * centrale de l'app — gratuite, illimitée, la raison d'être du produit —
 * n'était atteignable qu'après avoir traversé tout le contenu.
 *
 * La v2 tranche : UN héros, la carte marque + scan, immédiatement visible. Le
 * reste devient du contenu de consultation, annoncé par des libellés `micro`
 * qui s'effacent volontairement pour laisser le poids visuel aux données.
 *
 * Aucune logique métier touchée : mêmes requêtes, mêmes conditions
 * d'affichage, mêmes routes.
 */

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Icon } from '@/src/components/ui/Icon';
import type { IconName } from '@/src/components/ui/Icon';
import { Greeting } from '@/src/components/home/Greeting';
import { AnimatedVivoBrand } from '@/src/components/home/AnimatedVivoBrand';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { PlantOfWeekCard } from '@/src/components/home/PlantOfWeekCard';
import { FamilyProfilePills } from '@/src/components/home/FamilyProfilePills';
import { SectionLabel } from '@/src/components/home/SectionLabel';
import { StatsRow } from '@/src/components/home/StatsRow';
import { TopByCategorySection } from '@/src/components/home/TopByCategorySection';
import { StreakCounter } from '@/src/components/gamification/StreakCounter';
import { WeeklyProgressBar } from '@/src/components/gamification/WeeklyProgressBar';
import { Palette, Radius, Spacing, Type, withAlpha } from '@/src/constants/theme';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useScanHistory } from '@/src/lib/stores/useProductStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import { calculateStreak } from '@/src/lib/gamification/streak-engine';
import { calculateProfileStats } from '@/src/lib/stats/profile-stats-engine';
import { useMonthlyRecap } from '@/src/lib/stats/use-monthly-recap';
import { getTimeBasedTagline } from '@/src/lib/home/tagline';
import { fetchTopByCategoryHome } from '@/src/lib/api/top-by-category';
import { useProtocol } from '@/src/lib/protocols/use-protocol';
import { getProtocolById } from '@/src/data/protocols';
import { usePremium } from '@/src/lib/hooks/usePremium';
import type { ScanRecord } from '@/src/lib/gamification/types';
import type { UserProfile } from '@/src/lib/api/types';

const TOP_BY_CATEGORY_STALE_MS = 30 * 60 * 1000;
const TOP_BY_CATEGORY_GC_MS = 60 * 60 * 1000;

/**
 * Bandeau de rappel contextuel. Recap mensuel et protocole en cours avaient le
 * même balisage dupliqué mot pour mot ; il ne vit plus qu'ici.
 */
interface HomeBannerProps {
  icon: IconName;
  title: string;
  subtitle: string;
  accessibilityLabel: string;
  onPress: () => void;
}

function HomeBanner({
  icon,
  title,
  subtitle,
  accessibilityLabel,
  onPress,
}: HomeBannerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      <GlassCard style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Icon name={icon} color="sageVivid" />
        </View>
        <View style={styles.bannerBody}>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.bannerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Icon name="ChevronRight" size="sm" color="textMuted" />
      </GlassCard>
    </Pressable>
  );
}

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

  // Banner "Recap mensuel" — affiche le récap du mois précédent si dispo et ≥5 scans.
  const previousMonth = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    if (m === 0) return { year: now.getFullYear() - 1, month: 11 };
    return { year: now.getFullYear(), month: m - 1 };
  }, []);
  const { recap: previousRecap } = useMonthlyRecap(
    user?.id ?? null,
    previousMonth.year,
    previousMonth.month,
  );
  const showRecapBanner =
    previousRecap !== null && previousRecap.totalScans >= 5;

  // Banner protocole actif — visible uniquement Expert + protocole en cours
  const { tier } = usePremium(user?.id ?? null);
  const { activeProtocol } = useProtocol();
  const activeProtocolDef = activeProtocol
    ? getProtocolById(activeProtocol.protocolId) ?? null
    : null;
  const showProtocolBanner =
    tier === 'expert' && activeProtocol !== null && activeProtocolDef !== null;

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
      <View style={styles.page}>
        <FadeIn delay={60}>
          <FamilyProfilePills />
        </FadeIn>

        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Greeting />
          </View>
          {streak > 0 ? <StreakCounter compact streak={streak} /> : null}
        </View>

        {/* L'unique héros de l'écran : identité + action centrale, sans scroll. */}
        <FadeIn delay={100}>
          <GlassCard variant="hero" style={styles.hero}>
            <AnimatedVivoBrand tagline={tagline} />
            <PrimaryCTA
              variant="hero"
              label="Lancer le scan"
              icon={<Icon name="ScanLine" color="textOnDark" />}
              onPress={() => router.push('/(tabs)/scan')}
              accessibilityHint="Ouvre la caméra pour scanner un produit"
            />
            <Text style={styles.heroNote}>Toujours gratuit et illimité</Text>
          </GlassCard>
        </FadeIn>

        {showRecapBanner && previousRecap ? (
          <FadeIn delay={150}>
            <HomeBanner
              icon="BarChart3"
              title={`Ton Recap de ${previousRecap.monthLabel} est prêt !`}
              subtitle={`${previousRecap.totalScans} scans · score moyen ${previousRecap.averageScore}`}
              accessibilityLabel={`Voir mon recap de ${previousRecap.monthLabel}`}
              onPress={() =>
                router.push(
                  `/recap/monthly?year=${previousMonth.year}&month=${previousMonth.month}`,
                )
              }
            />
          </FadeIn>
        ) : null}

        {showProtocolBanner && activeProtocol && activeProtocolDef ? (
          <FadeIn delay={170}>
            <HomeBanner
              icon="Calendar"
              title={`Jour ${activeProtocol.currentDay}/21 — ${activeProtocolDef.titleFr}`}
              subtitle="Continue ton protocole"
              accessibilityLabel={`Continuer mon protocole ${activeProtocolDef.titleFr}`}
              onPress={() => router.push(`/protocols/${activeProtocol.protocolId}`)}
            />
          </FadeIn>
        ) : null}

        <View style={styles.section}>
          <SectionLabel>Ton activité</SectionLabel>
          <StatsRow />
          {stats && last7.length === 7 ? (
            <GlassCard variant="flat" style={styles.weeklyCard}>
              <WeeklyProgressBar
                compact
                scansByDayLast7={last7}
                averageScore={stats.averageScoreThisWeek}
                deltaVsLastWeek={stats.weekOverWeekDelta.avgScore}
              />
            </GlassCard>
          ) : null}
        </View>

        <FadeIn delay={200}>
          <TopByCategorySection
            blocks={topByCategoryQuery.data}
            isLoading={topByCategoryQuery.isLoading}
          />
        </FadeIn>

        <FadeIn delay={230}>
          <View style={styles.section}>
            <SectionLabel>À découvrir</SectionLabel>
            <PlantOfWeekCard />
          </View>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  /* Respiration généreuse entre les blocs — c'est le vide qui hiérarchise. */
  page: {
    flex: 1,
    gap: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  hero: {
    gap: Spacing.xl,
  },
  heroNote: {
    ...Type.micro,
    color: Palette.sageVivid,
    textAlign: 'center',
  },
  /* Serré à l'intérieur d'une section, large entre les sections. */
  section: {
    gap: Spacing.md,
  },
  weeklyCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: withAlpha(Palette.sage, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  bannerTitle: {
    ...Type.h3,
    color: Palette.ink,
  },
  bannerSubtitle: {
    ...Type.caption,
    fontFamily: 'Inter',
    color: Palette.textMuted,
  },
});
