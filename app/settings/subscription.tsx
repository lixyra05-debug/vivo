import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Check,
  Leaf,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Colors } from '@/src/constants/colors';
import {
  PREMIUM_FEATURES,
  FEATURE_TIER,
  usePremium,
  type PremiumFeatureKey,
} from '@/src/lib/premium/premium-gate';

const FREE_FEATURES = [
  'Scans illimités',
  'Score 0-100 complet',
  'Alertes allergènes',
  'Smart Swaps bruts',
  '30 derniers scans',
];

const PREMIUM_RENEWAL_TEXT =
  "Abonnement annuel de 29,99 €/an. L'abonnement se renouvelle automatiquement sauf si le renouvellement automatique est désactivé au moins 24 heures avant la fin de la période en cours. Vous pouvez gérer votre abonnement et désactiver le renouvellement automatique dans les Réglages de votre compte App Store.";

const EXPERT_RENEWAL_TEXT =
  "Abonnement annuel de 49,99 €/an. L'abonnement se renouvelle automatiquement sauf si le renouvellement automatique est désactivé au moins 24 heures avant la fin de la période en cours. Vous pouvez gérer votre abonnement et désactiver le renouvellement automatique dans les Réglages de votre compte App Store.";

function showRestoreAlert() {
  Alert.alert(
    'Restauration',
    'La restauration des achats sera disponible après la configuration de RevenueCat.',
  );
}

const PREMIUM_FEATURE_KEYS = (
  Object.keys(PREMIUM_FEATURES) as PremiumFeatureKey[]
).filter((k) => FEATURE_TIER[k] === 'premium');

const EXPERT_FEATURE_KEYS = (
  Object.keys(PREMIUM_FEATURES) as PremiumFeatureKey[]
).filter((k) => FEATURE_TIER[k] === 'expert');

const STACK_BREAKPOINT = 380;

export default function SubscriptionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { tier, isPremium, isExpert } = usePremium();

  const stackVertical = width < STACK_BREAKPOINT;

  function handleUpgrade() {
    // TODO: hook RevenueCat / Stripe — Sprint 3+
    router.push('/profile');
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
            <Text style={styles.headerTitle}>Abonnement</Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <CurrentPlanCard tier={tier} />
        </FadeIn>

        {tier === 'free' ? (
          <FreeStateCards
            stackVertical={stackVertical}
            onUpgrade={handleUpgrade}
          />
        ) : null}

        {tier === 'premium' ? (
          <PremiumStateCards onUpgrade={handleUpgrade} />
        ) : null}

        {isExpert ? <ExpertStateCard /> : null}

        {!isPremium ? (
          <FadeIn delay={520}>
            <Text style={styles.scanGuarantee}>
              Le scan reste toujours gratuit et illimité.
            </Text>
          </FadeIn>
        ) : null}

        <FadeIn delay={580}>
          <LegalFooter tier={tier} />
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Legal footer (Apple guideline 3.1.2)
// ---------------------------------------------------------------------------

function LegalFooter({ tier }: { tier: 'free' | 'premium' | 'expert' }) {
  const router = useRouter();

  return (
    <View style={styles.legalFooter}>
      {tier === 'free' ? (
        <>
          <Text style={styles.legalRenewalText}>{PREMIUM_RENEWAL_TEXT}</Text>
          <Text style={styles.legalRenewalText}>{EXPERT_RENEWAL_TEXT}</Text>
        </>
      ) : null}
      {tier === 'premium' ? (
        <Text style={styles.legalRenewalText}>{EXPERT_RENEWAL_TEXT}</Text>
      ) : null}

      <View style={styles.legalLinksRow}>
        <Pressable
          onPress={() => router.push('/settings/cgu')}
          accessibilityRole="link"
          accessibilityLabel="Ouvrir les conditions d'utilisation"
          hitSlop={6}
        >
          <Text style={styles.legalLink}>Conditions d'utilisation</Text>
        </Pressable>
        <Text style={styles.legalLinkSep}>·</Text>
        <Pressable
          onPress={() => router.push('/settings/privacy')}
          accessibilityRole="link"
          accessibilityLabel="Ouvrir la politique de confidentialité"
          hitSlop={6}
        >
          <Text style={styles.legalLink}>Politique de confidentialité</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={showRestoreAlert}
        accessibilityRole="button"
        accessibilityLabel="Restaurer les achats"
        hitSlop={8}
        style={({ pressed }) => [
          styles.restoreButton,
          pressed && { opacity: 0.7 },
        ]}
      >
        <RotateCcw color={Colors.sage} size={14} strokeWidth={2.4} />
        <Text style={styles.restoreLink}>Restaurer les achats</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Current plan badge (toujours en haut)
// ---------------------------------------------------------------------------

interface CurrentPlanProps {
  tier: 'free' | 'premium' | 'expert';
}

function CurrentPlanCard({ tier }: CurrentPlanProps) {
  const isFree = tier === 'free';
  const isExpert = tier === 'expert';

  return (
    <View style={styles.currentPlanWrap}>
      <LinearGradient
        colors={
          isExpert
            ? ['#F2EAD8', '#F6F3EB', '#FAFAF7']
            : !isFree
            ? ['#E7EFE7', '#F6F3EB', '#FAFAF7']
            : ['#F6F3EB', '#FAFAF7']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ padding: 20, gap: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={styles.sectionLabel}>Plan actuel</Text>
          {isExpert ? (
            <LinearGradient
              colors={['#C4A882', '#A88E68']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planBadge}
            >
              <Leaf color="#FFFFFF" size={12} strokeWidth={2.4} />
              <Text style={styles.planBadgeText}>EXPERT</Text>
            </LinearGradient>
          ) : !isFree ? (
            <LinearGradient
              colors={['#709770', '#587858']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planBadge}
            >
              <Sparkles color="#FFFFFF" size={12} strokeWidth={2.4} />
              <Text style={styles.planBadgeText}>PREMIUM</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.planBadge, styles.planBadgeFree]}>
              <Text style={styles.planBadgeFreeText}>GRATUIT</Text>
            </View>
          )}
        </View>
        <Text style={styles.currentPlanTitle}>
          {isExpert
            ? 'Tu es Expert 🌿'
            : !isFree
            ? 'Tu es Premium, merci pour ton soutien !'
            : 'Tu es sur le plan gratuit'}
        </Text>
        <View style={{ gap: 8 }}>
          {FREE_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Check color={Colors.sage} size={12} strokeWidth={3} />
              </View>
              <Text style={styles.featureLabel}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Free state — 2 cartes (Premium + Expert) côte à côte
// ---------------------------------------------------------------------------

interface FreeStateProps {
  stackVertical: boolean;
  onUpgrade: () => void;
}

function FreeStateCards({ stackVertical, onUpgrade }: FreeStateProps) {
  return (
    <FadeIn delay={180}>
      <View
        style={[
          styles.cardsWrap,
          stackVertical ? styles.cardsWrapStack : styles.cardsWrapRow,
        ]}
      >
        <PlanCard
          variant="premium"
          stackVertical={stackVertical}
          onUpgrade={onUpgrade}
        />
        <PlanCard
          variant="expert"
          stackVertical={stackVertical}
          onUpgrade={onUpgrade}
        />
      </View>
    </FadeIn>
  );
}

// ---------------------------------------------------------------------------
// Premium state — confirmation + cross-sell Expert
// ---------------------------------------------------------------------------

function PremiumStateCards({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <View style={{ gap: 16 }}>
      <FadeIn delay={180}>
        <GlassCard style={styles.confirmCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Sparkles color={Colors.sage} size={20} strokeWidth={2.2} />
            <Text style={styles.confirmTitle}>Tu es Premium ✓</Text>
          </View>
          <Text style={styles.confirmBody}>
            Toutes les fonctionnalités Premium sont débloquées : classement
            complet des supermarchés, alternatives intelligentes, historique
            illimité.
          </Text>
        </GlassCard>
      </FadeIn>

      <FadeIn delay={260}>
        <GlassCard style={styles.expertUpsellCard}>
          <View style={styles.expertUpsellHeader}>
            <View style={styles.expertIconBadge}>
              <Leaf color={Colors.earth} size={18} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.expertUpsellTitle}>
                Aller plus loin — Vivo Expert 🌿
              </Text>
              <Text style={styles.expertUpsellPrice}>
                49,99€/an · ~4,17€/mois
              </Text>
            </View>
          </View>
          <View style={{ gap: 8 }}>
            {EXPERT_FEATURE_KEYS.slice(0, 3).map((k) => (
              <View key={k} style={styles.featureRow}>
                <View style={styles.checkCircleEarth}>
                  <Check color={Colors.earth} size={12} strokeWidth={3} />
                </View>
                <Text style={styles.featureLabel}>
                  {PREMIUM_FEATURES[k].labelFr}
                </Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={onUpgrade}
            accessibilityRole="button"
            accessibilityLabel="Débloquer Expert — 49,99€ par an"
            style={({ pressed }) => [
              styles.ctaExpert,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Leaf color="#FFFFFF" size={16} strokeWidth={2.4} />
            <Text style={styles.ctaText}>Passer à Expert</Text>
          </Pressable>
        </GlassCard>
      </FadeIn>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Expert state — top tier, pas d'upsell
// ---------------------------------------------------------------------------

function ExpertStateCard() {
  return (
    <FadeIn delay={180}>
      <GlassCard style={styles.expertConfirmCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Leaf color={Colors.earth} size={22} strokeWidth={2.2} />
          <Text style={styles.confirmTitle}>Tu es Expert 🌿</Text>
        </View>
        <Text style={styles.confirmBody}>
          Tu as accès à toutes les fonctionnalités Vivo : Premium + plantes
          médicinales, sécurité grossesse & enfants, interactions
          plantes-médicaments. Merci pour ton soutien !
        </Text>
      </GlassCard>
    </FadeIn>
  );
}

// ---------------------------------------------------------------------------
// Plan card (Premium ou Expert) — utilisée pour le free state
// ---------------------------------------------------------------------------

interface PlanCardProps {
  variant: 'premium' | 'expert';
  stackVertical: boolean;
  onUpgrade: () => void;
}

function PlanCard({ variant, stackVertical, onUpgrade }: PlanCardProps) {
  const isExpert = variant === 'expert';
  const tierName = isExpert ? 'Expert' : 'Premium';
  const price = isExpert ? '49,99€/an' : '29,99€/an';
  const priceHint = isExpert ? '~4,17€/mois' : '~2,50€/mois';
  const a11y = isExpert
    ? 'Débloquer Expert — 49,99€ par an'
    : 'Débloquer Premium — 29,99€ par an';
  const featureKeys = isExpert ? EXPERT_FEATURE_KEYS : PREMIUM_FEATURE_KEYS;
  const Icon = isExpert ? Leaf : Sparkles;
  const accent = isExpert ? Colors.earth : Colors.sage;

  return (
    <View
      style={[
        styles.planCardOuter,
        stackVertical ? null : styles.planCardOuterRow,
        isExpert ? styles.planCardOuterExpert : styles.planCardOuterPremium,
      ]}
    >
      {isExpert ? (
        <View style={styles.recommendedPill}>
          <Text style={styles.recommendedText}>🌿 RECOMMANDÉ</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.iconBadgeBig,
          isExpert ? styles.iconBadgeExpert : styles.iconBadgePremium,
        ]}
      >
        <Icon color={accent} size={22} strokeWidth={2.2} />
      </View>

      <View style={{ gap: 4 }}>
        <Text style={styles.planTierLabel}>Vivo {tierName}</Text>
        <Text style={styles.planPrice}>{price}</Text>
        <Text style={styles.planPriceHint}>{priceHint}</Text>
      </View>

      <View style={{ gap: 6 }}>
        {featureKeys.slice(0, 4).map((k) => (
          <View key={k} style={styles.featureRowSmall}>
            <View
              style={[
                styles.checkCircleSmall,
                isExpert ? styles.checkCircleEarth : styles.checkCircleSage,
              ]}
            >
              <Check color={accent} size={10} strokeWidth={3} />
            </View>
            <Text style={styles.featureLabelSmall}>
              {PREMIUM_FEATURES[k].labelFr}
            </Text>
          </View>
        ))}
        {featureKeys.length > 4 ? (
          <Text style={styles.moreText}>
            + {featureKeys.length - 4} autres avantages
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        onPress={onUpgrade}
        style={({ pressed }) => [
          isExpert ? styles.ctaExpert : styles.ctaPremium,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Icon color="#FFFFFF" size={16} strokeWidth={2.4} />
        <Text style={styles.ctaText}>Débloquer {tierName}</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.4,
    flex: 1,
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

  // Current plan
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
  currentPlanTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  planBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  planBadgeFree: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#C6D8C6',
  },
  planBadgeFreeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  checkCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSage: {
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(139, 173, 139, 0.36)',
  },
  checkCircleEarth: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(196, 168, 130, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(196, 168, 130, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  featureLabelSmall: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.text,
    flex: 1,
    lineHeight: 17,
  },

  // Cards layout (free state)
  cardsWrap: {
    gap: 12,
  },
  cardsWrapRow: {
    flexDirection: 'row',
  },
  cardsWrapStack: {
    flexDirection: 'column',
  },

  // Plan cards
  planCardOuter: {
    padding: 18,
    borderRadius: 20,
    gap: 14,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#587858',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  planCardOuterRow: {
    flex: 1,
  },
  planCardOuterPremium: {
    borderColor: 'rgba(139, 173, 139, 0.32)',
    backgroundColor: 'rgba(139, 173, 139, 0.06)',
  },
  planCardOuterExpert: {
    borderColor: 'rgba(196, 168, 130, 0.6)',
    backgroundColor: 'rgba(196, 168, 130, 0.10)',
    paddingTop: 28,
  },
  recommendedPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.earth,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 1,
  },
  recommendedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  iconBadgeBig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgePremium: {
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
  },
  iconBadgeExpert: {
    backgroundColor: 'rgba(196, 168, 130, 0.20)',
  },
  planTierLabel: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  planPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  planPriceHint: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  moreText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // CTAs
  ctaPremium: {
    backgroundColor: Colors.sage,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  ctaExpert: {
    backgroundColor: Colors.earth,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  ctaText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Premium / Expert confirm cards
  confirmCard: {
    padding: 18,
    gap: 10,
  },
  confirmTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  confirmBody: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 21,
  },
  expertConfirmCard: {
    padding: 20,
    gap: 10,
    borderColor: 'rgba(196, 168, 130, 0.6)',
    backgroundColor: 'rgba(196, 168, 130, 0.10)',
  },

  // Expert upsell (for tier=premium)
  expertUpsellCard: {
    padding: 18,
    gap: 14,
    borderColor: 'rgba(196, 168, 130, 0.6)',
    backgroundColor: 'rgba(196, 168, 130, 0.10)',
  },
  expertUpsellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expertIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(196, 168, 130, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertUpsellTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  expertUpsellPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.text,
    marginTop: 2,
  },

  scanGuarantee: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Legal footer (Apple guideline 3.1.2)
  legalFooter: {
    gap: 12,
    paddingTop: 4,
  },
  legalRenewalText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    textAlign: 'left',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  legalLink: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.sage,
    textDecorationLine: 'underline',
  },
  legalLinkSep: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  restoreLink: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.sage,
    textDecorationLine: 'underline',
  },
});
