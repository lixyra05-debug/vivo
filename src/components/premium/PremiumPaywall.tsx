/**
 * PremiumPaywall — système 2 tiers Premium + Expert (avril 2026).
 *
 * Règles :
 *   • Lookup `FEATURE_TIER[featureKey]` pour déterminer le tier primary
 *   • Mode normal : carte primary + teaser cross-sell (du tier opposé) en footer
 *   • Mode `compact` : 1 seule carte horizontale (pour intégration in-line)
 *   • Garantie "scanner et score restent TOUJOURS gratuits" toujours présente (R3)
 *   • Pricing : Premium 29,99€/an (~2,50€/mois), Expert 49,99€/an (~4,17€/mois)
 *   • Design Vivo : sage (#8BAD8B) Premium, earth (#C4A882) Expert. PAS de purple gradient.
 */

import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Lock,
  Leaf,
  Check,
} from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import { FEATURE_TIER, type PremiumFeatureKey } from '@/src/lib/premium/premium-gate';

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

interface PremiumPaywallProps {
  featureKey: PremiumFeatureKey;
  previewContent?: ReactNode;
  onUpgrade: (tier: 'premium' | 'expert') => void;
  /** Mode carte horizontale courte (pour intégration in-line) — affiche uniquement le primary. */
  compact?: boolean;
}

const PREMIUM_BULLETS: readonly string[] = [
  'Classement complet des 10 supermarchés',
  'Top produits par enseigne sans limite',
  'Alternatives intelligentes au scan',
];

const EXPERT_BULLETS: readonly string[] = [
  'Tout le Premium inclus',
  'Base plantes médicinales (200+ sourcées EFSA/EMA/ANSM)',
  'Sécurité grossesse, enfants, interactions plantes-médicaments',
];

const PREMIUM_PRICE_LABEL = '29,99€/an';
const PREMIUM_PRICE_HINT = '~2,50€/mois';
const PREMIUM_A11Y = 'Débloquer Premium — 29,99€ par an';

const EXPERT_PRICE_LABEL = '49,99€/an';
const EXPERT_PRICE_HINT = '~4,17€/mois';
const EXPERT_A11Y = 'Débloquer Expert — 49,99€ par an';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
  }
}

export function PremiumPaywall({
  featureKey,
  previewContent,
  onUpgrade,
  compact = false,
}: PremiumPaywallProps) {
  const requiredTier: 'premium' | 'expert' =
    FEATURE_TIER[featureKey] === 'expert' ? 'expert' : 'premium';

  function handlePremium() {
    triggerHaptic();
    onUpgrade('premium');
  }

  function handleExpert() {
    triggerHaptic();
    onUpgrade('expert');
  }

  if (compact) {
    return (
      <View style={styles.wrapper}>
        {previewContent ? <View>{previewContent}</View> : null}
        {requiredTier === 'expert' ? (
          <ExpertCard
            compact
            onPress={handleExpert}
          />
        ) : (
          <PremiumCard compact onPress={handlePremium} />
        )}
        <LegalFooter tier={requiredTier} />
        <Text style={styles.guarantee}>
          Le scanner et le score restent TOUJOURS gratuits ✅
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {previewContent ? <View>{previewContent}</View> : null}

      {requiredTier === 'expert' ? (
        <>
          <ExpertCard onPress={handleExpert} />
          <PremiumTeaser onPress={handlePremium} />
        </>
      ) : (
        <>
          <PremiumCard onPress={handlePremium} />
          <ExpertTeaser onPress={handleExpert} />
        </>
      )}

      <LegalFooter tier={requiredTier} />

      <Text style={styles.guarantee}>
        Le scanner et le score restent TOUJOURS gratuits ✅
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Legal footer — mentions auto-renouvellement Apple + liens légaux + restauration
// (R Apple App Store Review Guidelines 3.1.2 / 5.1.1)
// ---------------------------------------------------------------------------

function LegalFooter({ tier }: { tier: 'premium' | 'expert' }) {
  const router = useRouter();
  const renewalText = tier === 'expert' ? EXPERT_RENEWAL_TEXT : PREMIUM_RENEWAL_TEXT;

  return (
    <View style={styles.legalFooter}>
      <Text style={styles.legalRenewalText}>{renewalText}</Text>
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
        style={styles.restoreButton}
      >
        <Text style={styles.restoreLink}>Restaurer les achats</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Premium card
// ---------------------------------------------------------------------------

interface CardProps {
  compact?: boolean;
  onPress: () => void;
}

function PremiumCard({ compact, onPress }: CardProps) {
  if (compact) {
    return (
      <GlassCard tone="default" style={styles.premiumCardCompact}>
        <View style={styles.premiumIconBadge}>
          <Lock color={Colors.sage} size={18} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.compactTitle}>Vivo Premium</Text>
          <Text style={styles.compactSubtitle}>
            {PREMIUM_PRICE_LABEL} · {PREMIUM_PRICE_HINT}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={PREMIUM_A11Y}
          onPress={onPress}
          style={({ pressed }) => [
            styles.ctaPremiumCompact,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Sparkles color="#FFFFFF" size={14} strokeWidth={2.4} />
          <Text style={styles.ctaCompactText}>Débloquer</Text>
        </Pressable>
      </GlassCard>
    );
  }

  return (
    <GlassCard tone="default" style={styles.premiumCard}>
      <View style={styles.headerRow}>
        <View style={styles.premiumIconBadge}>
          <Sparkles color={Colors.sage} size={20} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tierLabel}>Vivo Premium</Text>
          <Text style={styles.priceText}>
            {PREMIUM_PRICE_LABEL}{' '}
            <Text style={styles.priceHint}>· {PREMIUM_PRICE_HINT}</Text>
          </Text>
        </View>
      </View>

      <Text style={styles.description}>
        Débloque le classement complet des supermarchés, le top par enseigne et
        les alternatives intelligentes.
      </Text>

      <View style={styles.featuresList}>
        {PREMIUM_BULLETS.map((label) => (
          <View key={label} style={styles.featureRow}>
            <View style={styles.checkCirclePremium}>
              <Check color={Colors.sage} size={12} strokeWidth={3} />
            </View>
            <Text style={styles.featureText}>{label}</Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={PREMIUM_A11Y}
        onPress={onPress}
        style={({ pressed }) => [
          styles.ctaPremium,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Sparkles color="#FFFFFF" size={18} strokeWidth={2.4} />
        <Text style={styles.ctaText}>{`Débloquer Premium — ${PREMIUM_PRICE_LABEL}`}</Text>
      </Pressable>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Expert card
// ---------------------------------------------------------------------------

function ExpertCard({ compact, onPress }: CardProps) {
  if (compact) {
    return (
      <GlassCard tone="default" style={styles.expertCardCompact}>
        <View style={styles.recommendedPill}>
          <Text style={styles.recommendedText}>🌿 RECOMMANDÉ</Text>
        </View>
        <View style={styles.expertIconBadge}>
          <Leaf color={Colors.earth} size={18} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.compactTitle}>Vivo Expert</Text>
          <Text style={styles.compactSubtitle}>
            {EXPERT_PRICE_LABEL} · {EXPERT_PRICE_HINT}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={EXPERT_A11Y}
          onPress={onPress}
          style={({ pressed }) => [
            styles.ctaExpertCompact,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Leaf color="#FFFFFF" size={14} strokeWidth={2.4} />
          <Text style={styles.ctaCompactText}>Débloquer</Text>
        </Pressable>
      </GlassCard>
    );
  }

  return (
    <GlassCard tone="default" style={styles.expertCard}>
      <View style={styles.recommendedPill}>
        <Text style={styles.recommendedText}>🌿 RECOMMANDÉ</Text>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.expertIconBadge}>
          <Leaf color={Colors.earth} size={20} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tierLabel}>Vivo Expert</Text>
          <Text style={styles.priceText}>
            {EXPERT_PRICE_LABEL}{' '}
            <Text style={styles.priceHint}>· {EXPERT_PRICE_HINT}</Text>
          </Text>
        </View>
      </View>

      <Text style={styles.description}>
        Toute la puissance Premium plus l'accès aux plantes médicinales sourcées
        EFSA/EMA/ANSM et aux alertes interactions médicamenteuses.
      </Text>

      <View style={styles.featuresList}>
        {EXPERT_BULLETS.map((label, index) => (
          <View key={label} style={styles.featureRow}>
            <View style={styles.checkCircleExpert}>
              <Check color={Colors.earth} size={12} strokeWidth={3} />
            </View>
            <Text style={styles.featureText}>
              {label}
              {index === 0 ? ' ✓' : ''}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={EXPERT_A11Y}
        onPress={onPress}
        style={({ pressed }) => [
          styles.ctaExpert,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Leaf color="#FFFFFF" size={18} strokeWidth={2.4} />
        <Text style={styles.ctaText}>{`Débloquer Expert — ${EXPERT_PRICE_LABEL}`}</Text>
      </Pressable>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Cross-sell teasers (mode normal uniquement)
// ---------------------------------------------------------------------------

function ExpertTeaser({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={EXPERT_A11Y}
      onPress={onPress}
      style={({ pressed }) => [styles.teaserCard, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.expertIconBadgeSmall}>
        <Leaf color={Colors.earth} size={16} strokeWidth={2.4} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.teaserTitle}>Aller plus loin — Vivo Expert 🌿</Text>
        <Text style={styles.teaserBody}>
          Plantes médicinales, sécurité grossesse & enfants, interactions
          plantes-médicaments. {EXPERT_PRICE_LABEL}.
        </Text>
      </View>
    </Pressable>
  );
}

function PremiumTeaser({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={PREMIUM_A11Y}
      onPress={onPress}
      style={({ pressed }) => [styles.teaserCard, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.premiumIconBadgeSmall}>
        <Sparkles color={Colors.sage} size={16} strokeWidth={2.4} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.teaserTitle}>Vivo Premium suffit ?</Text>
        <Text style={styles.teaserBody}>
          Si tu n'as pas besoin des plantes médicinales, Premium couvre les
          courses et alternatives. {PREMIUM_PRICE_LABEL}.
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },

  // Premium card (sage)
  premiumCard: {
    padding: 20,
    gap: 14,
    borderColor: 'rgba(139, 173, 139, 0.32)',
    backgroundColor: 'rgba(139, 173, 139, 0.06)',
    borderRadius: 20,
  },
  premiumCardCompact: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderColor: 'rgba(139, 173, 139, 0.32)',
    backgroundColor: 'rgba(139, 173, 139, 0.06)',
    borderRadius: 18,
  },

  // Expert card (earth)
  expertCard: {
    padding: 20,
    gap: 14,
    borderColor: 'rgba(196, 168, 130, 0.6)',
    backgroundColor: 'rgba(196, 168, 130, 0.10)',
    borderRadius: 20,
    position: 'relative',
  },
  expertCardCompact: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderColor: 'rgba(196, 168, 130, 0.6)',
    backgroundColor: 'rgba(196, 168, 130, 0.10)',
    borderRadius: 18,
    position: 'relative',
    paddingTop: 28,
  },

  // Recommandé pill (top-right)
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

  // Header (icon + tier label + price)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(196, 168, 130, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumIconBadgeSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertIconBadgeSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(196, 168, 130, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tierLabel: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  priceText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
    marginTop: 2,
  },
  priceHint: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textMuted,
  },

  // Features list
  featuresList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCirclePremium: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(139, 173, 139, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleExpert: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(196, 168, 130, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(196, 168, 130, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },

  // CTAs (full width)
  ctaPremium: {
    backgroundColor: Colors.sage,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaExpert: {
    backgroundColor: Colors.earth,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // CTAs compact (inline)
  ctaPremiumCompact: {
    backgroundColor: Colors.sage,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaExpertCompact: {
    backgroundColor: Colors.earth,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaCompactText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // Compact title (for compact card body)
  compactTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 15,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  compactSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Cross-sell teaser
  teaserCard: {
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: '#EDEEE6',
  },
  teaserTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  teaserBody: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Garantie
  guarantee: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Legal footer (Apple guideline 3.1.2)
  legalFooter: {
    gap: 10,
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
    alignItems: 'center',
    paddingVertical: 4,
  },
  restoreLink: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.sage,
    textDecorationLine: 'underline',
  },
});
