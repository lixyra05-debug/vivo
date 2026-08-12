/**
 * SectionLabel — libellé de section en capitales espacées.
 *
 * Remplace le couple « titre h2 + emoji » qui servait jusqu'ici à séparer les
 * blocs. Le problème de ce motif : un h2 à 20px pèse presque autant qu'un titre
 * d'écran, donc chaque section revendiquait le même niveau hiérarchique et
 * l'œil ne savait plus où se poser.
 *
 * Ici, le libellé s'efface volontairement (11px, capitales, `textMuted`) pour
 * que le CONTENU de la section porte le poids visuel. C'est le geste qui rend
 * la hiérarchie lisible d'un coup d'œil.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Palette, Spacing, Type } from '@/src/constants/theme';

interface SectionLabelProps {
  /** Le libellé, écrit normalement — la mise en capitales est un style. */
  children: string;
  /** Précision optionnelle, une ligne, sous le libellé. */
  hint?: string;
}

export function SectionLabel({ children, hint }: SectionLabelProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label} accessibilityRole="header">
        {children}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  label: {
    ...Type.micro,
    color: Palette.textMuted,
  },
  hint: {
    ...Type.caption,
    color: Palette.textMuted,
  },
});
