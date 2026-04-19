import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarRange,
  Check,
  Sparkles,
  SwatchBook,
} from 'lucide-react-native';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Colors } from '@/src/constants/colors';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: <SwatchBook color={Colors.earth} size={20} strokeWidth={2.2} />,
    title: 'Smart Swaps produits',
    description: 'Découvre des alternatives scannables avec leur score, dispo en rayon.',
  },
  {
    icon: <CalendarRange color={Colors.earth} size={20} strokeWidth={2.2} />,
    title: 'Historique illimité',
    description: 'Tous tes scans conservés, sans limite des 30 derniers.',
  },
  {
    icon: <BookOpen color={Colors.earth} size={20} strokeWidth={2.2} />,
    title: 'Journal alimentaire',
    description: 'Suivi quotidien et score moyen de la journée.',
  },
  {
    icon: <BarChart3 color={Colors.earth} size={20} strokeWidth={2.2} />,
    title: 'Comparateur',
    description: 'Compare deux produits côte à côte, pénalité par pénalité.',
  },
];

const FREE_FEATURES = [
  'Scans illimités',
  'Score 0-100 complet',
  'Alertes allergènes',
  'Smart Swaps bruts',
  '30 derniers scans',
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const isPremium = profile?.subscription_tier === 'premium';

  function handleUpgrade() {
    Alert.alert(
      'Bientôt disponible',
      "Les abonnements Premium arrivent dans les prochaines semaines. Merci de ta patience !",
    );
  }

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
              style={styles.backButton}
            >
              <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
            </Pressable>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 22,
                color: Colors.text,
                letterSpacing: -0.4,
                flex: 1,
              }}
            >
              Abonnement
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={styles.currentPlanWrap}>
            <LinearGradient
              colors={isPremium ? ['#E7EFE7', '#F6F3EB', '#FAFAF7'] : ['#F6F3EB', '#FAFAF7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ padding: 20, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.sectionLabel}>Plan actuel</Text>
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
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-Bold',
                  fontSize: 22,
                  color: Colors.text,
                  letterSpacing: -0.4,
                }}
              >
                {isPremium ? 'Merci pour ton soutien !' : 'Tu es sur le plan gratuit'}
              </Text>
              <View style={{ gap: 8 }}>
                {FREE_FEATURES.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <View style={styles.checkCircle}>
                      <Check color={Colors.sage} size={12} strokeWidth={3} />
                    </View>
                    <Text
                      style={{
                        fontFamily: 'Inter',
                        fontSize: 14,
                        color: Colors.text,
                        flex: 1,
                      }}
                    >
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={180}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles color={Colors.earth} size={20} strokeWidth={2.2} />
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-Bold',
                  fontSize: 22,
                  color: Colors.text,
                  letterSpacing: -0.4,
                }}
              >
                Passe à Premium
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 14,
                color: Colors.textMuted,
                lineHeight: 21,
              }}
            >
              Débloque toutes les fonctionnalités pour 3,99 €/mois ou 29,99 €/an
              (~2,50 €/mois).
            </Text>
          </View>
        </FadeIn>

        <View style={{ gap: 10 }}>
          {BENEFITS.map((b, i) => (
            <FadeIn key={b.title} delay={240 + i * 60}>
              <GlassCard style={{ padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View style={styles.benefitIconWrap}>{b.icon}</View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'BricolageGrotesque-SemiBold',
                      fontSize: 15,
                      color: Colors.text,
                      letterSpacing: -0.2,
                    }}
                  >
                    {b.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: Colors.textMuted,
                      lineHeight: 19,
                      marginTop: 3,
                    }}
                  >
                    {b.description}
                  </Text>
                </View>
              </GlassCard>
            </FadeIn>
          ))}
        </View>

        <FadeIn delay={520}>
          <View style={{ gap: 10 }}>
            <PrimaryCTA
              label={isPremium ? "Gérer l'abonnement" : 'Bientôt disponible'}
              onPress={handleUpgrade}
              disabled={!isPremium}
              icon={<Sparkles color="#FFFFFF" size={18} strokeWidth={2.2} />}
            />
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 12,
                color: Colors.textMuted,
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              Le scan reste toujours gratuit et illimité.
            </Text>
          </View>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
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
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  currentPlanWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    shadowColor: '#587858',
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  planBadgeFree: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#C6D8C6',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#E7EFE7',
    borderWidth: 1,
    borderColor: '#C6D8C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(196, 168, 130, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
