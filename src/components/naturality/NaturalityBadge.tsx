/**
 * NaturalityBadge — affiche les plantes bénéfiques détectées dans une liste
 * d'ingrédients (food ou cosmétique INCI). Le badge se gate seul :
 *
 *   • Free / Premium : opacity 0.4, icône Lock, tap → PremiumPaywall inline
 *   • Expert         : Pressable révèle la liste des plantes (clic plante = onPressPlant)
 *
 * Si aucune plante n'est détectée, le composant rend `null` (pas de badge).
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Leaf, Lock } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { PremiumPaywall } from '../premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { detectNaturalIngredients } from '@/src/lib/naturality/naturality-score';
import { getPlantById } from '@/src/data/plant-encyclopedia';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';

interface NaturalityBadgeProps {
  ingredientsList: string | null | undefined;
  onPressPlant?: (plantId: string) => void;
}

export function NaturalityBadge({
  ingredientsList,
  onPressPlant,
}: NaturalityBadgeProps) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const [expanded, setExpanded] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const matches = detectNaturalIngredients(ingredientsList);
  if (matches.length === 0) return null;

  const isExpert = tier === 'expert';
  const count = matches.length;
  const titleText =
    count === 1
      ? '🌿 1 plante bénéfique détectée'
      : `🌿 ${count} plantes bénéfiques détectées`;

  function handlePressBadge() {
    if (!isExpert) {
      setShowPaywall(true);
      return;
    }
    setExpanded((v) => !v);
  }

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  function handlePlantPress(plantId: string) {
    if (onPressPlant) {
      onPressPlant(plantId);
      return;
    }
    router.push(`/plants/${plantId}`);
  }

  if (!isExpert && showPaywall) {
    return (
      <View style={styles.wrapper}>
        <PremiumPaywall
          featureKey="naturality_score"
          onUpgrade={handleUpgrade}
          compact
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={titleText}
        onPress={handlePressBadge}
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
      >
        <GlassCard
          style={[styles.card, !isExpert ? styles.cardLocked : null]}
        >
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              {isExpert ? (
                <Leaf color={Colors.sage} size={20} strokeWidth={2.4} />
              ) : (
                <Lock color={Colors.sage} size={18} strokeWidth={2.4} />
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.title}>{titleText}</Text>
              <Text style={styles.subtitle}>
                {isExpert
                  ? 'Tap pour voir les détails'
                  : 'Réservé au tier Expert'}
              </Text>
            </View>
            {isExpert ? (
              expanded ? (
                <ChevronUp
                  color={Colors.textMuted}
                  size={18}
                  strokeWidth={2.2}
                />
              ) : (
                <ChevronDown
                  color={Colors.textMuted}
                  size={18}
                  strokeWidth={2.2}
                />
              )
            ) : null}
          </View>
        </GlassCard>
      </Pressable>

      {isExpert && expanded ? (
        <View style={styles.list}>
          {matches.map((m) => {
            const plant = getPlantById(m.plantId);
            const emoji = plant?.emoji ?? '🌿';
            return (
              <Pressable
                key={m.plantId}
                accessibilityRole="button"
                accessibilityLabel={`Voir la fiche de ${m.nameFr}`}
                onPress={() => handlePlantPress(m.plantId)}
                style={({ pressed }) => [
                  styles.plantRow,
                  pressed && { backgroundColor: 'rgba(139, 173, 139, 0.06)' },
                ]}
              >
                <Text style={styles.plantEmoji}>{emoji}</Text>
                <Text style={styles.plantName} numberOfLines={1}>
                  {m.nameFr}
                </Text>
                <Text style={styles.plantArrow}>→</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    borderColor: 'rgba(139, 173, 139, 0.32)',
    backgroundColor: 'rgba(139, 173, 139, 0.06)',
  },
  cardLocked: {
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  list: {
    gap: 6,
    paddingLeft: 6,
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  plantEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  plantName: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text,
  },
  plantArrow: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.sage,
  },
});
