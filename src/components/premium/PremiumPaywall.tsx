import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles, Lock, Trophy, Leaf, ShoppingCart } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { Colors } from '@/src/constants/colors';

interface PremiumPaywallProps {
  title: string;
  description: string;
  onUnlock: () => void;
}

const FEATURES: Array<{ icon: typeof Trophy; labelFr: string }> = [
  { icon: Trophy, labelFr: 'Classement complet des 10 supermarchés' },
  { icon: ShoppingCart, labelFr: 'Tous les produits par enseigne sans limite' },
  { icon: Leaf, labelFr: 'Alternatives intelligentes au scan' },
];

export function PremiumPaywall({
  title,
  description,
  onUnlock,
}: PremiumPaywallProps) {
  function handleUnlock() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
    onUnlock();
  }

  return (
    <GlassCard tone="default" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.lockBadge}>
          <Lock color={Colors.sage} size={18} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      <View style={styles.featuresList}>
        {FEATURES.map(({ icon: Icon, labelFr }) => (
          <View key={labelFr} style={styles.featureRow}>
            <Icon color={Colors.sage} size={16} strokeWidth={2.2} />
            <Text style={styles.featureText}>{labelFr}</Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Débloquer Premium — 29,99€ par an"
        onPress={handleUnlock}
        style={({ pressed }) => [
          styles.cta,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Sparkles color="#FFFFFF" size={18} strokeWidth={2.4} />
        <Text style={styles.ctaText}>Débloquer — 29,99€/an</Text>
      </Pressable>

      <Text style={styles.guarantee}>
        Le scanner et le score restent TOUJOURS gratuits ✅
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  lockBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 173, 139, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  featuresList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  cta: {
    backgroundColor: Colors.sage,
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
  guarantee: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
