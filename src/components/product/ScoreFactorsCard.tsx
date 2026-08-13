/**
 * ScoreFactorsCard — ce qui compose la note, juste sous le score.
 *
 * Répond à « pourquoi cette note ? » AVANT tout scroll. Le score n'arrive plus
 * nu : la formulation et l'emballage sont nommés, chiffrés, et leur somme vaut
 * exactement le nombre affiché dans l'anneau.
 *
 * Deux niveaux de lecture cohabitent sur la fiche, et ne se recouvrent pas :
 *   • ici           — 100 → formulation → note (l'emballage entre en jeu) ;
 *   • plus bas      — `ScoreBreakdownChart` détaille l'INTÉRIEUR de la
 *                     formulation (NOVA, additifs, macros, huiles).
 *
 * Ton strictement factuel : on constate, on ne prescrit jamais. Aucun conseil
 * d'achat, aucun impératif.
 */

import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { scoreColor } from '@/src/constants/colors';
import { Palette, Radius, Spacing, Type, withAlpha } from '@/src/constants/theme';
import type { ScoreFactor } from '@/src/lib/scoring/composite-score';

export const SCORE_FACTORS_TITLE = 'Ce qui influence la note';

/**
 * Reprend mot pour mot `SCORE_LABEL_DEFAULT` de l'anneau situé juste au-dessus.
 * Deux libellés différents pour le même nombre, à 40 px d'écart, se liraient
 * comme deux mesures distinctes.
 */
export const SCORE_FACTORS_TOTAL_LABEL = 'Note globale';

/** Le minimum en deçà duquel la carte ne dirait rien que le score ne dise déjà. */
const MIN_FACTORS = 2;

export interface ScoreFactorsCardProps {
  factors: ScoreFactor[];
  finalScore: number;
  title?: string;
}

/** U+2212 : un vrai signe moins, pas un trait d'union. */
function formatPoints(points: number): string {
  return points >= 0 ? `+${points}` : `−${Math.abs(points)}`;
}

function spokenPoints(points: number): string {
  const unit = Math.abs(points) > 1 ? 'points' : 'point';
  return points >= 0
    ? `plus ${points} ${unit}`
    : `moins ${Math.abs(points)} ${unit}`;
}

export function ScoreFactorsCard({
  factors,
  finalScore,
  title = SCORE_FACTORS_TITLE,
}: ScoreFactorsCardProps) {
  // Auto-garde : sans facteur emballage il ne resterait que la formulation,
  // c'est-à-dire le score déjà affiché juste au-dessus. La garde vit ici pour
  // que les deux fiches se comportent identiquement sans y penser.
  if (factors.length < MIN_FACTORS) return null;

  const spoken = factors
    .map((f) => `${f.label}, ${spokenPoints(f.points)}`)
    .join('. ');
  const a11yLabel = `${title}. ${spoken}. ${SCORE_FACTORS_TOTAL_LABEL} ${finalScore} sur 100.`;

  return (
    <GlassCard
      variant="flat"
      style={styles.card}
      accessibilityLabel={a11yLabel}
    >
      {/*
        `accessibilityElementsHidden` est iOS-only. Sans son équivalent Android
        (`importantForAccessibility="no-hide-descendants"`), TalkBack lit
        l'étiquette groupée de la carte PUIS chaque ligne, une par une.
      */}
      <Text
        style={styles.eyebrow}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {title}
      </Text>

      <View style={styles.rows}>
        {factors.map((factor) => (
          <View
            key={factor.code}
            style={styles.row}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View style={styles.rowLabel}>
              <Text style={styles.label}>{factor.label}</Text>
              {factor.detail ? (
                <Text style={styles.detail}>{factor.detail}</Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.points,
                {
                  color:
                    factor.kind === 'formulation'
                      ? scoreColor(factor.points)
                      : Palette.scorePoor,
                },
              ]}
            >
              {formatPoints(factor.points)}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={styles.totalRow}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.totalLabel}>{SCORE_FACTORS_TOTAL_LABEL}</Text>
        <Text style={[styles.total, { color: scoreColor(finalScore) }]}>
          {finalScore}
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderRadius: Radius.md,
  },
  eyebrow: {
    ...Type.micro,
    color: Palette.textMuted,
  },
  rows: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowLabel: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...Type.body,
    color: Palette.textPrimary,
  },
  detail: {
    ...Type.caption,
    color: Palette.textMuted,
  },
  points: {
    ...Type.h3,
    // Colonne de chiffres alignée : les points se lisent les uns sous les
    // autres, pas en escalier.
    minWidth: 52,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: withAlpha(Palette.borderCard, 0.7),
    paddingTop: Spacing.md,
  },
  totalLabel: {
    ...Type.h3,
    color: Palette.textSecondary,
  },
  total: {
    ...Type.h2,
    minWidth: 52,
    textAlign: 'right',
  },
});
