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
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Icon } from '@/src/components/ui/Icon';
import { Palette, Radius, Spacing, Type, withAlpha } from '@/src/constants/theme';
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
              <Text style={styles.badgeText}>Plante de la semaine</Text>
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
              <Icon name="Lock" color="earthDeep" />
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
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  inner: {
    gap: Spacing.md,
  },
  innerLocked: {
    opacity: 0.3,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: withAlpha(Palette.sage, 0.16),
  },
  badgeText: {
    ...Type.micro,
    color: Palette.sageVivid,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  nameFr: {
    ...Type.h2,
    color: Palette.ink,
  },
  nameLatin: {
    ...Type.caption,
    fontFamily: 'Inter',
    color: Palette.textMuted,
    fontStyle: 'italic',
  },
  properties: {
    ...Type.caption,
    fontFamily: 'Inter',
    color: Palette.textSecondary,
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
    gap: Spacing.sm,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: withAlpha(Palette.earth, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* `earth` posé en texte tenait 2,17:1 — remplacé par `earthDeep` (5,91:1). */
  lockText: {
    ...Type.micro,
    color: Palette.earthDeep,
  },
});
