import { useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3,
  Bell,
  BookHeart,
  BookOpen,
  Calendar,
  Coffee,
  FileText,
  HeartPulse,
  HelpCircle,
  Leaf,
  LogOut,
  Sparkles,
  User as UserIcon,
} from 'lucide-react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { SettingsRow } from '@/src/components/profile/SettingsRow';
import { ProfileStatsSection } from '@/src/components/stats/ProfileStatsSection';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { signOut } from '@/src/lib/api/auth';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import { useScanHistory } from '@/src/lib/stores/useProductStore';
import { useUserBadges, useUserReportCount } from '@/src/lib/stores/useBadges';
import { usePremium } from '@/src/lib/premium/premium-gate';
import {
  checkBadges,
  getUserStats,
} from '@/src/lib/gamification/badge-engine';
import type { ScanRecord } from '@/src/lib/gamification/types';

const HEALTH_LABELS = {
  standard: 'Standard',
  diabetic: 'Diabète / Poids',
  athlete: 'Sportif',
  child: 'Enfant',
  pregnant: 'Femme enceinte',
  intolerant: 'Intolérances',
} as const;

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const scanHistoryQuery = useScanHistory({ userId: user?.id, limit: 500 });
  const reportCountQuery = useUserReportCount(user?.id);
  const userBadgesQuery = useUserBadges(user?.id);
  const reduceMotion = useReduceMotion();
  const rotation = useSharedValue(0);

  const scans: ScanRecord[] = useMemo(
    () =>
      (scanHistoryQuery.data ?? []).map((row) => ({
        barcode: row.barcode,
        score_at_scan: row.score_at_scan,
        scanned_at: row.scanned_at,
        product_type:
          (row as unknown as { product_type?: 'food' | 'cosmetic' }).product_type ??
          'food',
        is_favorite: row.is_favorite,
        category_slug: null,
      })),
    [scanHistoryQuery.data],
  );

  const badges = useMemo(() => {
    const stats = getUserStats(scans, reportCountQuery.data ?? 0, 1);
    const alreadyEarned = (userBadgesQuery.data ?? []).map((row) => ({
      badgeId: row.badge_id,
      earnedAt: row.earned_at,
    }));
    return checkBadges(stats, alreadyEarned);
  }, [scans, reportCountQuery.data, userBadgesQuery.data]);

  useEffect(() => {
    if (reduceMotion) {
      rotation.value = 0;
      return;
    }
    rotation.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(rotation);
    };
  }, [reduceMotion, rotation]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const displayName = profile?.display_name?.trim() || user?.email?.split('@')[0] || 'Toi';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      Alert.alert('Déconnexion', err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }

  const allergies = profile?.allergies ?? [];
  const intolerances = profile?.intolerances ?? [];
  const { isPremium, tier } = usePremium();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <View style={styles.headerRoot}>
        <LinearGradient
          colors={['#C6D8C6', '#E2EBE2', '#FAFAF7']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={['top']} style={{ paddingTop: 4 }}>
          <FadeIn delay={0}>
            <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 28, gap: 10 }}>
              <View style={styles.avatarWrap}>
                <Animated.View style={[styles.avatarRing, ringStyle]} pointerEvents="none" />
                <View style={styles.avatarInner}>
                  <Text
                    style={{
                      fontFamily: 'BricolageGrotesque-Bold',
                      fontSize: 28,
                      color: Colors.textMuted,
                      letterSpacing: -0.5,
                    }}
                  >
                    {initials}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text
                  style={{
                    fontFamily: 'BricolageGrotesque-Bold',
                    fontSize: 22,
                    color: Colors.text,
                    letterSpacing: -0.4,
                  }}
                >
                  {displayName}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: Colors.textMuted,
                  }}
                >
                  {user?.email ?? ''}
                </Text>
              </View>
              {isPremium ? (
                <LinearGradient
                  colors={['#709770', '#587858']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.planBadge}
                >
                  <Sparkles color="#FFFFFF" size={12} strokeWidth={2.4} />
                  <Text
                    style={{
                      fontFamily: 'Inter-SemiBold',
                      fontSize: 11,
                      color: '#FFFFFF',
                      letterSpacing: 1,
                    }}
                  >
                    PREMIUM
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.planBadge, styles.planBadgeFree]}>
                  <Text
                    style={{
                      fontFamily: 'Inter-SemiBold',
                      fontSize: 11,
                      color: Colors.textMuted,
                      letterSpacing: 1,
                    }}
                  >
                    GRATUIT
                  </Text>
                </View>
              )}
            </View>
          </FadeIn>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={120}>
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionLabel}>Mon profil santé</Text>
            <GlassCard style={{ padding: 16, gap: 14 }}>
              <View style={styles.healthRow}>
                <View style={styles.healthIconWrap}>
                  <HeartPulse color={Colors.sage} size={20} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>Profil actif</Text>
                  <Text
                    style={{
                      fontFamily: 'BricolageGrotesque-SemiBold',
                      fontSize: 17,
                      color: Colors.text,
                      marginTop: 2,
                    }}
                  >
                    {profile ? HEALTH_LABELS[profile.health_profile] : '—'}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View>
                <Text style={styles.subLabel}>Allergies</Text>
                {allergies.length > 0 ? (
                  <View style={styles.chipWrap}>
                    {allergies.map((a) => (
                      <View key={a} style={styles.chip}>
                        <Text style={styles.chipText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: Colors.textMuted,
                      marginTop: 6,
                    }}
                  >
                    Aucune
                  </Text>
                )}
              </View>
              {intolerances.length > 0 ? (
                <View>
                  <Text style={styles.subLabel}>Intolérances</Text>
                  <View style={styles.chipWrap}>
                    {intolerances.map((a) => (
                      <View key={a} style={styles.chip}>
                        <Text style={styles.chipText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </GlassCard>
          </View>
        </FadeIn>

        <FadeIn delay={200}>
          <ProfileStatsSection
            userId={user?.id ?? ''}
            scans={scans}
            reportCount={reportCountQuery.data ?? 0}
            badges={{ earned: badges.earned, newlyEarned: [] }}
            onSeeMethodology={() => router.push('/methodology')}
          />
        </FadeIn>

        {tier === 'expert' ? (
          <FadeIn delay={240}>
            <View style={{ gap: 10 }}>
              <Text style={styles.sectionLabel}>Mon espace Expert 🌿</Text>
              <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
                <SettingsRow
                  icon={<BookOpen color={Colors.sage} size={18} strokeWidth={2.2} />}
                  label="Encyclopédie des plantes"
                  description="40+ plantes sourcées EMA · EFSA"
                  onPress={() => router.push('/plants')}
                />
                <View style={styles.rowDivider} />
                <SettingsRow
                  icon={<Leaf color={Colors.sage} size={18} strokeWidth={2.2} />}
                  label="Chercheur de remèdes"
                  description="8 catégories de bien-être"
                  onPress={() => router.push('/remedies')}
                />
                <View style={styles.rowDivider} />
                <SettingsRow
                  icon={<Calendar color={Colors.sage} size={18} strokeWidth={2.2} />}
                  label="Mes Protocoles"
                  description="Programmes 21 jours bien-être"
                  onPress={() => router.push('/protocols')}
                />
                <View style={styles.rowDivider} />
                <SettingsRow
                  icon={<BookHeart color={Colors.sage} size={18} strokeWidth={2.2} />}
                  label="Mon Herbier"
                  description="Tes plantes favorites avec notes"
                  onPress={() => router.push('/herbarium')}
                />
                <View style={styles.rowDivider} />
                <SettingsRow
                  icon={<Bell color={Colors.sage} size={18} strokeWidth={2.2} />}
                  label="Mes Rappels"
                  description="Suivi de tes cures de plantes"
                  onPress={() => router.push('/reminders')}
                />
                <View style={styles.rowDivider} />
                <SettingsRow
                  icon={<Coffee color={Colors.sage} size={18} strokeWidth={2.2} />}
                  label="Recettes Bien-être"
                  description="30 préparations sourcées EMA"
                  onPress={() => router.push('/recipes')}
                />
              </GlassCard>
            </View>
          </FadeIn>
        ) : null}

        <FadeIn delay={280}>
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionLabel}>Paramètres</Text>
            <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
              <SettingsRow
                icon={<UserIcon color={Colors.sage} size={18} strokeWidth={2.2} />}
                label="Modifier mon profil"
                description="Profil santé, allergies"
                onPress={() => router.push('/settings/health-profile')}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon={<Sparkles color={Colors.sage} size={18} strokeWidth={2.2} />}
                label="Mon abonnement"
                description={isPremium ? 'Premium actif' : 'Plan gratuit'}
                onPress={() => router.push('/settings/subscription')}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon={<BarChart3 color={Colors.sage} size={18} strokeWidth={2.2} />}
                label="Voir mon Recap mensuel"
                description="Récapitulatif partageable de ton mois"
                onPress={() => router.push('/recap/monthly')}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon={<HelpCircle color={Colors.sage} size={18} strokeWidth={2.2} />}
                label="Comment Vivo note"
                description="Méthodologie et sources scientifiques"
                onPress={() => router.push('/methodology')}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon={<FileText color={Colors.sage} size={18} strokeWidth={2.2} />}
                label="Mentions légales"
                onPress={() => router.push('/settings/legal')}
              />
              <View style={styles.rowDivider} />
              <SettingsRow
                icon={<LogOut color={Colors.score.red} size={18} strokeWidth={2.2} />}
                label="Se déconnecter"
                onPress={handleSignOut}
                tone="danger"
                showChevron={false}
              />
            </GlassCard>
          </View>
        </FadeIn>

        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            color: Colors.textMuted,
            textAlign: 'center',
            marginTop: 8,
            opacity: 0.7,
          }}
        >
          Vivo v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRoot: { overflow: 'hidden' },
  avatarWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(88, 120, 88, 0.35)',
    borderStyle: 'dashed',
  },
  avatarInner: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 2,
  },
  planBadgeFree: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#C6D8C6',
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    paddingLeft: 4,
  },
  subLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#E7EFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: '#E7E7DA' },
  rowDivider: { height: 1, backgroundColor: '#ECECDF', marginLeft: 68 },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#E7EFE7',
    borderWidth: 1,
    borderColor: '#C6D8C6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
