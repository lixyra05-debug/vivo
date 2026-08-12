/**
 * Façade de compatibilité au-dessus du Design System v2 (`./theme`).
 *
 * `Colors` est consommé ~1 080 fois dans l'app. Plutôt que de réécrire tous les
 * call-sites, on remappe les clés historiques sur les tokens v2 : chaque écran
 * hérite du nouveau contraste sans être touché.
 *
 * Pour tout NOUVEAU code, importer directement depuis `./theme` :
 *   import { Palette, Type, Spacing, Radius, Elevation } from '@/src/constants/theme';
 */

import { Palette } from './theme';

export const Colors = {
  /* — clés historiques, valeurs remappées v2 — */
  /** Support uniquement (fonds, bordures). Pour du texte : `sageVivid`. */
  sage: Palette.sage,
  cream: Palette.surfaceBase,
  /** Support uniquement (fonds, bordures). Pour du texte : `earthDeep`. */
  earth: Palette.earth,
  /** Ex-`#2B3E2B` (10,99:1) → ancre `ink` (16,05:1). */
  text: Palette.textPrimary,
  /** Ex-`#587858` (4,73:1) → `#607669` (4,68:1) — parité de lisibilité. */
  textMuted: Palette.textMuted,
  border: Palette.borderSoft,

  /* — ajouts v2, accessibles sans changer d'import — */
  ink: Palette.ink,
  forest: Palette.forest,
  sageVivid: Palette.sageVivid,
  earthDeep: Palette.earthDeep,
  surfaceRaised: Palette.surfaceRaised,
  surfaceInset: Palette.surfaceInset,
  borderCard: Palette.borderCard,
  textSecondary: Palette.textSecondary,
  textOnDark: Palette.textOnDark,

  /**
   * Les 4 clés historiques sont conservées telles quelles pour ne casser aucun
   * call-site. Elles pointent désormais sur la palette v2, qui passe toutes le
   * seuil 4,5:1 — `ScoreCircle` pose cette couleur en couleur de TEXTE.
   */
  score: {
    green: Palette.scoreExcellent, //  #4CAF50 2,66:1 → #1F7A3D 5,14:1
    yellow: Palette.scoreMid, //       #FFC107 1,56:1 → #8A6508 5,09:1
    orange: Palette.scorePoor, //      #FF9800 2,06:1 → #A8500B 5,26:1
    red: Palette.scoreBad, //          #F44336 3,52:1 → #A62B1A 6,73:1
  },
} as const;

/** Seuils inchangés — c'est de la logique métier (R1). */
export function scoreColor(score: number): string {
  if (score >= 70) return Colors.score.green;
  if (score >= 50) return Colors.score.yellow;
  if (score >= 25) return Colors.score.orange;
  return Colors.score.red;
}
