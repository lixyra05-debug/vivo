/**
 * PlantOfWeekCard — carte "Plante de la semaine" sur la home (tier Expert).
 *
 * Comportement :
 *   • Calcule la plante via `getPlantOfWeek()` au mount (mémoïsé sur le jour courant).
 *   • Expert : tap → ouvre la fiche `/plants/[id]`.
 *   • Free / Premium : opacity 0.3 + overlay Lock + tap → écran abonnement Expert.
 *
 * Disclaimer global présent sur les écrans plantes (R8) — la card seule n'en porte pas.
 */

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { getPlantOfWeek } from '@/src/lib/plants/plant-of-week';

export function PlantOfWeekCard() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const plant = useMemo(() => getPlantOfWeek(), []);

  function handlePress() {
    if (isExpert) {
      router.push(`/plants/${plant.id}`);
    } else {
      router.push('/settings/subscription?tier=expert');
    }
  }

  const a11y = isExpert
    ? `Plante de la semaine : ${plant.nameFr}, ${plant.nameLatin}`
    : `Plante de la semaine — débloquer avec Expert`;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      <GlassCard style={styles.card}>
        <View style={[styles.inner, !isExpert && styles.innerLocked]}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🌿 Plante de la semaine</Text>
            </View>
          </View>

          <View style={styles.contentRow}>
            <Text style={styles.emoji}>{plant.emoji}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.nameFr} numberOfLines={1}>
                {plant.nameFr}
              </Text>
              <Text style={styles.nameLatin} numberOfLines={1}>
                {plant.nameLatin}
              </Text>
            </View>
          </View>

          <Text style={styles.properties} numberOfLines={2}>
            {plant.properties}
          </Text>
        </View>

        {!isExpert ? (
          <View style={styles.lockOverlay} pointerEvents="none">
            <View style={styles.lockBadge}>
              <Lock color={Colors.earth} size={20} strokeWidth={2.4} />
            </View>
            <Text style={styles.lockText}>Réservé Expert</Text>
          </View>
        ) : null}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  inner: {
    gap: 10,
  },
  innerLocked: {
    opacity: 0.3,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.sage,
    letterSpacing: 0.3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  nameFr: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  nameLatin: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  properties: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(196, 168, 130, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.earth,
    letterSpacing: 0.4,
  },
});
