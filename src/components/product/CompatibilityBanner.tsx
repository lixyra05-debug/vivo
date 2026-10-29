/**
 * CompatibilityBanner — verdict de compatibilité profil.
 *
 * Trois états, là où il n'y en avait que deux :
 *
 *   compatible    → vert, aucun blocker levé ET vérification réellement faite
 *   incompatible  → rouge, au moins un blocker
 *   non vérifiée  → neutre, un critère demandé n'a pas pu être tranché (le plus
 *                   souvent, la liste d'ingrédients manquait)
 *
 * Le troisième état corrige un mensonge par omission : `isCompatible` ne
 * répond qu'à « existe-t-il un blocker ? ». Sans ingrédients, seul un allergène
 * que la fiche déclare peut encore lever un blocker ; sans lui, un utilisateur
 * allergique lisait « Compatible avec votre profil » alors que rien n'avait été
 * contrôlé.
 *
 * Les motifs de sévérité `warning` sont désormais rendus dans TOUS les états.
 * Ils n'apparaissaient que dans la branche incompatible, ce qui rendait
 * invisibles des constats pourtant établis — 45 g de sucres sur un profil
 * diabète, un NOVA 4 sur un profil bébé, un déclencheur FODMAP.
 *
 * L'état compatible ne dit plus « Compatible avec votre profil » : le moteur ne
 * lit que la fiche transcrite — pour un aliment (Open Food Facts), la liste
 * d'ingrédients, le texte français d'abord puis celui de la langue principale,
 * et les allergènes que la fiche déclare ; pour un cosmétique (Open Beauty
 * Facts), la liste INCI ; plus quelques données de la fiche (valeurs
 * nutritionnelles, additifs, NOVA, huiles, note). Jamais l'étiquette elle-même,
 * ni le champ des traces. Le titre dit donc ce qui a été cherché, renvoie à
 * l'étiquette, et ne parle d'allergènes qu'à un profil qui en a déclaré
 * (`checkedAllergenCount`). Dans l'état incompatible, un motif d'allergie
 * montre le mot tel que le texte lu l'écrit (`matchedText`, le texte français
 * d'abord : il peut manquer à la liste affichée, voir CLAUDE.md) ; un allergène
 * trouvé par sa seule déclaration n'en montre aucun. Le bandeau tutoie.
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
  /**
   * Constat propre au produit, qui remplace la phrase générique sur la liste
   * d'ingrédients dans l'état « Vérification impossible » (fiche d'un
   * cosmétique dont aucun ingrédient n'a été évalué, S3-3). Le message de
   * sécurité et les points d'attention suivent toujours. Sans effet dans les
   * deux autres états.
   */
  unverifiedLead?: string;
}

const VISIBLE_LIMIT = 3;

export const UNVERIFIED_TITLE = 'Vérification impossible';
/**
 * Le message de sécurité de l'état « Vérification impossible ». Il ne
 * disparaît jamais : un bloc qui porte cet état à la place du bandeau le
 * reprend mot pour mot.
 */
export const UNVERIFIED_SAFETY = "Tes allergies et restrictions n'ont pas pu être vérifiées.";
export const UNVERIFIED_BODY = `La liste d'ingrédients de ce produit n'est pas disponible. ${UNVERIFIED_SAFETY}`;
/** Titre compatible quand au moins une allergie déclarée a été cherchée. */
const COMPATIBLE_ALLERGENS_TITLE =
  "Aucun de tes allergènes détecté dans la liste d'ingrédients, vérifie l'étiquette";
/** Titre compatible pour un profil sans allergie cherchée (diabète, grossesse, enfant seuls). */
const COMPATIBLE_GENERIC_TITLE = "Rien de bloquant détecté pour ton profil, vérifie l'étiquette";
const INCOMPATIBLE_TITLE = 'Incompatible avec ton profil';
const WARNINGS_LABEL = "Points d'attention";

/** Graphie lue dans la liste d'ingrédients, sous le motif qu'elle a déclenché. */
function matchedTextLabel(matched: string): string {
  return `Mot détecté : « ${matched} »`;
}

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

/**
 * L'état « Vérification impossible » : aucun blocker levé, mais la
 * vérification n'a pas eu lieu. Exporté pour qu'un écran qui porte cet état
 * ailleurs que dans le bandeau le reconnaisse exactement comme lui.
 */
export function isUnverifiedCompatibility(result: CompatibilityResult): boolean {
  return result.isCompatible && result.verificationStatus === 'insufficient_data';
}

export function CompatibilityBanner({ result, unverifiedLead }: CompatibilityBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!result) {
    return null;
  }

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
  if (isUnverifiedCompatibility(result)) {
    return (
      <FadeIn>
        <View style={styles.unverified} accessibilityLabel={UNVERIFIED_TITLE}>
          <View style={styles.headerRow}>
            <Icon name="AlertCircle" color="textMuted" />
            <View style={styles.headerBody}>
              <Text style={styles.unverifiedTitle}>{UNVERIFIED_TITLE}</Text>
              {unverifiedLead ? (
                <>
                  <Text style={styles.unverifiedBody}>{unverifiedLead}</Text>
                  <Text style={styles.unverifiedBody}>{UNVERIFIED_SAFETY}</Text>
                </>
              ) : (
                <Text style={styles.unverifiedBody}>{UNVERIFIED_BODY}</Text>
              )}
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
    // « Aucun de tes allergènes » serait faux pour un profil qui n'en a déclaré
    // aucun (diabète, grossesse ou enfant seuls) : il faut qu'une allergie ait
    // été CHERCHÉE. Champ absent (données anciennes) → titre générique.
    const title =
      (result.checkedAllergenCount ?? 0) > 0
        ? COMPATIBLE_ALLERGENS_TITLE
        : COMPATIBLE_GENERIC_TITLE;
    return (
      <FadeIn>
        <View style={styles.compatible}>
          <View style={styles.headerRow}>
            <CheckCircle2 color={Colors.sageVivid} size={22} strokeWidth={2.2} />
            <View style={styles.headerBody}>
              <Text style={styles.compatibleTitle}>{title}</Text>
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
  // Le Pressable est UN élément d'accessibilité : son libellé remplace la
  // lecture des enfants. Sans les motifs, un lecteur d'écran n'annonçait que
  // le verdict — ni l'allergène, ni le mot détecté.
  const a11yLabel = [
    INCOMPATIBLE_TITLE,
    ...visibleReasons.map((r) =>
      r.matchedText ? `${r.labelFr}, ${matchedTextLabel(r.matchedText)}` : r.labelFr,
    ),
  ].join('. ');

  function handleToggle() {
    if (!hasMore) return;
    toggle();
  }

  return (
    <FadeIn>
      <Pressable
        onPress={handleToggle}
        accessibilityRole={hasMore ? 'button' : undefined}
        accessibilityLabel={a11yLabel}
        accessibilityHint={hasMore ? 'Appuyer pour voir tous les motifs' : undefined}
        style={styles.incompatible}
      >
        <View style={styles.headerRow}>
          <AlertTriangle color={Colors.score.red} size={22} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.incompatibleTitle}>{INCOMPATIBLE_TITLE}</Text>
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
              <View style={styles.reasonBody}>
                <Text style={styles.reasonLabel} numberOfLines={2}>
                  {reason.labelFr}
                </Text>
                {reason.matchedText ? (
                  <Text style={styles.matchedText} numberOfLines={1}>
                    {matchedTextLabel(reason.matchedText)}
                  </Text>
                ) : null}
              </View>
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
  /* Colonne libellé + mot détecté : c'est elle qui prend la largeur restante. */
  reasonBody: {
    flex: 1,
    gap: 2,
  },
  reasonLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  /* textSecondary, pas textMuted : sur le fond rouge pâle, textMuted tombe à
     4,10:1, sous le seuil AA d'un texte de 12 px ; textSecondary tient 6,39:1. */
  matchedText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 16,
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
