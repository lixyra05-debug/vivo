import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import { Elevation, Palette, Radius, Spacing, withAlpha } from '@/src/constants/theme';

/**
 * GlassCard — carte de contenu.
 *
 * Le défaut de la v1 : toutes les cartes étaient identiques. Une fiche produit
 * empilait dix cartes au même niveau d'élévation → aucune hiérarchie, l'œil ne
 * savait pas où se poser. `variant` corrige ça.
 *
 *   flat   → sections secondaires (creux, liseré, pas d'ombre)
 *   raised → défaut, contenu courant
 *   hero   → UN SEUL par écran
 *
 * `tone` reste orthogonal : il n'exprime que l'état sémantique et ne surcharge
 * la surface que pour les états d'alerte, laissant `variant` piloter le neutre.
 */

type Tone = 'default' | 'warning' | 'danger' | 'info';
type Variant = 'flat' | 'raised' | 'hero';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  tone?: Tone;
  /** Défaut `raised` — aucun call-site existant n'a besoin de changer. */
  variant?: Variant;
  /** Passe-plat a11y : évite d'ajouter une `View` uniquement pour l'étiquette. */
  accessibilityLabel?: string;
}

const VARIANT_STYLES: Record<Variant, ViewStyle> = {
  flat: {
    backgroundColor: Palette.surfaceInset,
    ...Elevation.flat,
  },
  raised: {
    backgroundColor: Palette.surfaceRaised,
    borderWidth: 1,
    borderColor: Palette.borderCard,
    ...Elevation.raised,
  },
  hero: {
    backgroundColor: Palette.surfaceRaised,
    borderWidth: 1,
    borderColor: Palette.borderCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Elevation.hero,
  },
};

/** `default` est volontairement vide : la surface neutre appartient à `variant`. */
const TONE_STYLES: Record<Tone, ViewStyle> = {
  default: {},
  warning: {
    backgroundColor: withAlpha(Palette.scorePoor, 0.06),
    borderColor: withAlpha(Palette.scorePoor, 0.22),
  },
  danger: {
    backgroundColor: withAlpha(Palette.scoreBad, 0.06),
    borderColor: withAlpha(Palette.scoreBad, 0.24),
  },
  info: {
    backgroundColor: withAlpha(Palette.scoreMid, 0.08),
    borderColor: withAlpha(Palette.scoreMid, 0.3),
  },
};

export function GlassCard({
  children,
  className,
  style,
  tone = 'default',
  variant = 'raised',
  accessibilityLabel,
}: GlassCardProps) {
  return (
    <View
      className={className}
      accessibilityLabel={accessibilityLabel}
      style={[styles.base, VARIANT_STYLES[variant], TONE_STYLES[tone], style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
  },
});
