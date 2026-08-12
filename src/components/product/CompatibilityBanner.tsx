/**
 * CompatibilityBanner — verdict de compatibilité profil.
 *
 * Trois états, là où il n'y en avait que deux :
 *
 *   compatible    → vert, aucun blocker levé ET vérification réellement faite
 *   incompatible  → rouge, au moins un blocker
 *   non vérifiée  → neutre, la liste d'ingrédients manquait
 *
 * Le troisième état corrige un mensonge par omission : `isCompatible` ne
 * répond qu'à « existe-t-il un blocker ? ». Sans ingrédients, aucun blocker ne
 * peut être levé — un utilisateur allergique lisait donc « Compatible avec
 * votre profil » alors que rien n'avait été contrôlé.
 *
 * Les motifs de sévérité `warning` sont désormais rendus dans TOUS les états.
 * Ils n'apparaissaient que dans la branche incompatible, ce qui rendait
 * invisibles des constats pourtant établis — 45 g de sucres sur un profil
 * diabète, un NOVA 4 sur un profil bébé, un déclencheur FODMAP.
 */

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { Icon } from '@/src/components/ui/Icon';
import { Colors } from '@/src/constants/colors';
import { Palette, Radius, Spacing, Type, withAlpha } from '@/src/constants/theme';
import { INSUFFICIENT_DATA_LABEL_FR } from '@/src/lib/scoring/compatibility-engine';
import type { CompatibilityResult, IncompatibilityReason } from '@/src/lib/api/types';

interface CompatibilityBannerProps {
  result: CompatibilityResult | null;
}

const VISIBLE_LIMIT = 3;

export const UNVERIFIED_TITLE = 'Vérification impossible';
export const UNVERIFIED_BODY =
  "La liste d'ingrédients de ce produit n'est pas disponible. Vos allergies et restrictions n'ont pas pu être vérifiées.";
const WARNINGS_LABEL = "Points d'attention";

interface WarningsBlockProps {
  warnings: IncompatibilityReason[];
  expanded: boolean;
  onToggle: () => void;
}

/** Motifs non bloquants — mêmes règles d'affichage dans les trois états. */
function WarningsBlock({ warnings, expanded, onToggle }: WarningsBlockProps) {
  if (warnings.length === 0) return null;

  const hasMore = warnings.length > VISIBLE_LIMIT;
  const visible = expanded ? warnings : warnings.slice(0, VISIBLE_LIMIT);
  const remaining = warnings.length - VISIBLE_LIMIT;

  return (
    <View style={styles.warningsBlock}>
      <Text style={styles.warningsLabel}>{WARNINGS_LABEL}</Text>
      {visible.map((w, idx) => (
        <View key={`${w.type}-${idx}`} style={styles.reasonRow}>
          <View style={styles.dotNeutral} />
          <Text style={styles.reasonText} numberOfLines={2}>
            {w.labelFr}
          </Text>
        </View>
      ))}
      {!expanded && hasMore ? (
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`Voir les ${remaining} autres points d'attention`}
        >
          <Text style={styles.moreNeutral}>{`+ ${remaining} autres`}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function CompatibilityBanner({ result }: CompatibilityBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!result) {
    return null;
  }

  const unverified = result.verificationStatus === 'insufficient_data';

  // Le motif « données insuffisantes » est déjà le titre de l'état dédié :
  // le répéter dans la liste ne dirait rien de plus.
  const warnings = result.incompatibilities.filter(
    (i) => i.severity === 'warning' && i.labelFr !== INSUFFICIENT_DATA_LABEL_FR,
  );

  function toggle() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    setExpanded((v) => !v);
  }

  // ── Vérification impossible ──────────────────────────────────────────────
  // Un blocker reste un verdict déterminé : s'il y en a un, `isCompatible` est
  // false et on tombe dans la branche incompatible, qui a le sens le plus sûr.
  if (result.isCompatible && unverified) {
    return (
      <FadeIn>
        <View style={styles.unverified} accessibilityLabel={UNVERIFIED_TITLE}>
          <View style={styles.headerRow}>
            <Icon name="AlertCircle" color="textMuted" />
            <View style={styles.headerBody}>
              <Text style={styles.unverifiedTitle}>{UNVERIFIED_TITLE}</Text>
              <Text style={styles.unverifiedBody}>{UNVERIFIED_BODY}</Text>
            </View>
          </View>
          <WarningsBlock warnings={warnings} expanded={expanded} onToggle={toggle} />
        </View>
      </FadeIn>
    );
  }

  // ── Compatible ───────────────────────────────────────────────────────────
  if (result.isCompatible) {
    const showPercentage = result.compatibilityPercentage < 100;
    return (
      <FadeIn>
        <View style={styles.compatible}>
          <View style={styles.headerRow}>
            <CheckCircle2 color={Colors.sageVivid} size={22} strokeWidth={2.2} />
            <View style={styles.headerBody}>
              <Text style={styles.compatibleTitle}>Compatible avec votre profil</Text>
              {showPercentage ? (
                <Text style={styles.compatibleSubtitle}>
                  {`✓ ${result.compatibilityPercentage}% des critères passent`}
                </Text>
              ) : null}
            </View>
          </View>
          <WarningsBlock warnings={warnings} expanded={expanded} onToggle={toggle} />
        </View>
      </FadeIn>
    );
  }

  // ── Incompatible ─────────────────────────────────────────────────────────
  const reasons = result.incompatibilities;
  const hasMore = reasons.length > VISIBLE_LIMIT;
  const visibleReasons = expanded ? reasons : reasons.slice(0, VISIBLE_LIMIT);
  const remaining = reasons.length - VISIBLE_LIMIT;

  function handleToggle() {
    if (!hasMore) return;
    toggle();
  }

  return (
    <FadeIn>
      <Pressable
        onPress={handleToggle}
        accessibilityRole={hasMore ? 'button' : undefined}
        accessibilityLabel="Incompatible avec votre profil"
        accessibilityHint={hasMore ? 'Appuyer pour voir tous les motifs' : undefined}
        style={styles.incompatible}
      >
        <View style={styles.headerRow}>
          <AlertTriangle color={Colors.score.red} size={22} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.incompatibleTitle}>Incompatible avec votre profil</Text>
          </View>
          {hasMore ? (
            expanded ? (
              <ChevronUp color={Colors.score.red} size={18} strokeWidth={2.2} />
            ) : (
              <ChevronDown color={Colors.score.red} size={18} strokeWidth={2.2} />
            )
          ) : null}
        </View>
        <View style={styles.reasonsList}>
          {visibleReasons.map((reason, idx) => (
            <View key={`${reason.type}-${idx}`} style={styles.reasonRow}>
              <View style={styles.dot} />
              <Text style={styles.reasonText} numberOfLines={2}>
                {reason.labelFr}
              </Text>
            </View>
          ))}
          {!expanded && hasMore ? (
            <Text style={styles.moreText}>{`+ ${remaining} autres`}</Text>
          ) : null}
        </View>
      </Pressable>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  compatible: {
    backgroundColor: withAlpha(Palette.sage, 0.1),
    borderColor: withAlpha(Palette.sage, 0.35),
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 14,
    gap: Spacing.sm,
  },
  incompatible: {
    backgroundColor: withAlpha(Palette.scoreBad, 0.08),
    borderColor: withAlpha(Palette.scoreBad, 0.3),
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 14,
    gap: Spacing.sm,
  },
  /* Ni vert ni rouge : l'app ne sait pas, et doit le montrer comme tel. */
  unverified: {
    backgroundColor: Palette.surfaceInset,
    borderColor: Palette.borderSoft,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 14,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBody: {
    flex: 1,
    gap: 2,
  },
  compatibleTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  compatibleSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  incompatibleTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  unverifiedTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  unverifiedBody: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  reasonsList: {
    paddingLeft: Spacing.sm,
    gap: Spacing.xs,
  },
  warningsBlock: {
    paddingLeft: Spacing.sm,
    gap: Spacing.xs,
  },
  warningsLabel: {
    ...Type.micro,
    color: Palette.textMuted,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.score.red,
    marginTop: 7,
  },
  dotNeutral: {
    width: 5,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Palette.textMuted,
    marginTop: 7,
  },
  reasonText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  moreText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.score.red,
    paddingLeft: 13,
    marginTop: 2,
  },
  moreNeutral: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 2,
  },
});
