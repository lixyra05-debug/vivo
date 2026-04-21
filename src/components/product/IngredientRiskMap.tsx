import { StyleSheet, Text, View } from 'react-native';
import {
  mapIngredientsToRisk,
  type IngredientRisk,
} from '@/src/lib/scoring/display-helpers';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';

interface IngredientRiskMapProps {
  ingredientsRaw: string;
  delay?: number;
}

interface ChipPalette {
  bg: string;
  border: string;
  text: string;
}

const PALETTE: Record<IngredientRisk['riskLevel'], ChipPalette> = {
  safe: { bg: '#F1F5F1', border: '#C6D8C6', text: '#2B3E2B' },
  moderate: {
    bg: 'rgba(255, 193, 7, 0.12)',
    border: 'rgba(255, 193, 7, 0.38)',
    text: '#8A6D00',
  },
  high: {
    bg: 'rgba(255, 152, 0, 0.12)',
    border: 'rgba(255, 152, 0, 0.4)',
    text: '#8B4A00',
  },
  blocker: {
    bg: 'rgba(244, 67, 54, 0.10)',
    border: 'rgba(244, 67, 54, 0.45)',
    text: '#F44336',
  },
};

const LEGEND: { level: IngredientRisk['riskLevel']; label: string }[] = [
  { level: 'safe', label: 'Safe' },
  { level: 'moderate', label: 'Modéré' },
  { level: 'high', label: 'Élevé' },
  { level: 'blocker', label: 'Bloquant' },
];

const MAX_VISIBLE_CHIPS = 30;

export function IngredientRiskMap({
  ingredientsRaw,
  delay = 0,
}: IngredientRiskMapProps) {
  if (!ingredientsRaw || ingredientsRaw.trim().length === 0) {
    return null;
  }
  const mapped = mapIngredientsToRisk(ingredientsRaw);
  if (!mapped || mapped.length === 0) {
    return null;
  }

  const visible = mapped.slice(0, MAX_VISIBLE_CHIPS);
  const hidden = mapped.length - visible.length;

  const a11yLabel = `Carte des ingrédients, ${mapped.length} ingrédient${mapped.length > 1 ? 's' : ''} analysé${mapped.length > 1 ? 's' : ''}`;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.root} accessibilityLabel={a11yLabel}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Carte des ingrédients</Text>
          <Text style={styles.subtitle}>Codé par niveau de risque</Text>
        </View>

        <View style={styles.chipsWrap}>
          {visible.map((item, i) => {
            const palette = PALETTE[item.riskLevel];
            return (
              <FadeIn key={`${item.name}-${i}`} delay={delay + i * 40}>
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: palette.bg,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.chipText, { color: palette.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </View>
              </FadeIn>
            );
          })}
          {hidden > 0 ? (
            <FadeIn delay={delay + visible.length * 40}>
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: PALETTE.safe.bg,
                    borderColor: PALETTE.safe.border,
                  },
                ]}
              >
                <Text
                  style={[styles.chipText, { color: PALETTE.safe.text }]}
                  numberOfLines={1}
                >
                  +{hidden} autres
                </Text>
              </View>
            </FadeIn>
          ) : null}
        </View>

        <View style={styles.legendRow}>
          {LEGEND.map((entry) => (
            <View key={entry.level} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: PALETTE[entry.level].border },
                ]}
              />
              <Text style={styles.legendText}>{entry.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  root: {
    gap: 12,
  },
  headerBlock: {
    gap: 2,
  },
  title: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    maxWidth: 200,
  },
  chipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: Colors.textMuted,
  },
});
