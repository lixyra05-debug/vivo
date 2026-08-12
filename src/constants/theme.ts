/**
 * Vivo — Design System v2 « Organique chaleureux »
 *
 * Source unique de vérité des tokens visuels. Aucun hex ne doit exister
 * ailleurs dans `src/components/` ou `app/` (garde-fou : theme-guard.test.ts).
 *
 * Le défaut corrigé par cette v2 : l'absence d'ancre foncée. Tout vivait dans
 * la même bande de luminosité (sage 2,38:1 · score vert 2,66:1 · score jaune
 * 1,56:1 sur cream) → sensation « fade », et un score de santé littéralement
 * illisible alors que c'est l'élément central de l'app.
 *
 * Trois leviers :
 *   1. contraste de valeur  → ancres `ink` (16,05:1) et `forest` (9,33:1)
 *   2. hiérarchie typo      → écarts brutaux 40 / 28 / 20 / 16 / 15 / 13 / 11
 *   3. profondeur teintée   → ombres `forest`, jamais `#000`
 *
 * Contrainte tenue : toute couleur porteuse de texte atteint ≥ 4,5:1 (WCAG AA)
 * sur `surfaceBase`. Vérifié par calcul dans `theme.test.ts`.
 *
 * `sage` n'est plus jamais une couleur de texte principale — c'était la cause
 * n°1 du fade. Il devient une couleur de SUPPORT (fonds, bordures, accents).
 */

import type { TextStyle, ViewStyle } from 'react-native';

/* ────────────────────────────────────────────────────────────────────────────
 * PALETTE
 * Les ratios en commentaire sont mesurés sur `surfaceBase` (#FAFAF7).
 * ──────────────────────────────────────────────────────────────────────────── */

export const Palette = {
  /* — ANCRES : ce qui manquait — */
  /** Quasi-noir vert désaturé. Titres display, texte principal. */
  ink: '#14201A', //           16,05:1
  /** Vert profond. UI forte, icônes appuyées, ombres. */
  forest: '#2D4A3A', //         9,33:1

  /* — IDENTITÉ — */
  /** Couleur de SUPPORT (fonds, bordures, accents). Jamais du texte. */
  sage: '#8BAD8B', //           2,38:1 — décoratif uniquement
  /** Version saturée : CTA, états actifs, accents porteurs de texte. */
  sageVivid: '#4F7D4E', //      4,59:1
  /** Accent tier Expert. Décoratif (fonds, bordures, pills). */
  earth: '#C4A882', //          2,17:1 — décoratif uniquement
  /** Accent tier Expert porteur de texte (labels, CTA Expert). */
  earthDeep: '#7A5C2E', //      5,91:1

  /* — SURFACES : hiérarchie d'élévation — */
  /** Fond d'écran. */
  surfaceBase: '#FAFAF7',
  /** Carte surélevée. */
  surfaceRaised: '#FFFFFF',
  /** Zone en creux : champs, chips neutres, sections secondaires. */
  surfaceInset: '#F2F0E9',

  /* — BORDURES — */
  /** Bordure neutre discrète. */
  borderSoft: '#E7E7DA',
  /** Bordure teintée verte des cartes. */
  borderCard: '#E2EBE2',

  /* — TEXTE : dérivés, ne jamais poser les couleurs brutes — */
  textPrimary: '#14201A', //   16,05:1  (= ink)
  textSecondary: '#41594B', //  7,29:1  (forest éclairci)
  textMuted: '#607669', //      4,68:1  (forest éclairci — plancher AA)
  textOnDark: '#FAFAF7',

  /* — SÉMANTIQUE SCORE —
   * Ces couleurs sont posées EN COULEUR DE TEXTE par ScoreCircle
   * (`style={{ color }}`), pas seulement en trait. D'où le seuil ≥ 4,5:1.
   * Teintes conservées : vert → olive → ocre → brique → rouge. */
  scoreExcellent: '#1F7A3D', // 5,14:1
  scoreGood: '#4A7C1E', //      4,79:1
  scoreMid: '#8A6508', //       5,09:1
  scorePoor: '#A8500B', //      5,26:1
  scoreBad: '#A62B1A', //       6,73:1
} as const;

export type PaletteToken = keyof typeof Palette;

/* ────────────────────────────────────────────────────────────────────────────
 * POLICES
 * ⚠️ Ces noms doivent correspondre EXACTEMENT aux clés de `useFonts()` dans
 * `app/_layout.tsx`. Un nom inconnu ne lève aucune erreur : React Native
 * retombe silencieusement sur la police système.
 * ──────────────────────────────────────────────────────────────────────────── */

export const FontFamily = {
  body: 'Inter',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
  displaySemiBold: 'BricolageGrotesque-SemiBold',
  displayBold: 'BricolageGrotesque-Bold',
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * ÉCHELLE TYPOGRAPHIQUE
 * Les écarts sont volontairement brutaux, pas progressifs : c'est le saut de
 * 40 → 28 → 20 qui crée la hiérarchie, pas une gradation douce.
 * `micro` (capitales espacées) est le marqueur premium des labels de section.
 * ──────────────────────────────────────────────────────────────────────────── */

export const Type = {
  display: {
    fontFamily: FontFamily.displayBold,
    fontSize: 40,
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  h1: {
    fontFamily: FontFamily.displayBold,
    fontSize: 28,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  h2: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 20,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  h3: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 23,
  },
  caption: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
  },
  micro: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TypeToken = keyof typeof Type;

/* ────────────────────────────────────────────────────────────────────────────
 * ESPACEMENT & RAYONS
 * Aucune valeur arbitraire tolérée ailleurs. Le rythme fait le premium :
 * généreux entre les blocs (xl/xxl), serré à l'intérieur (sm/md).
 * ──────────────────────────────────────────────────────────────────────────── */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  hero: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * ÉLÉVATION
 * `shadowColor` teinté `forest` — jamais `#000`. Une ombre noire sur une
 * palette chaude produit un gris sale ; une ombre verte fait « reposer »
 * la carte sur le fond cream.
 * ──────────────────────────────────────────────────────────────────────────── */

export const Elevation = {
  /** Sections secondaires : pas d'ombre, juste un liseré. */
  flat: {
    borderWidth: 1,
    borderColor: Palette.surfaceInset,
  },
  /** Défaut : contenu courant. */
  raised: {
    shadowColor: Palette.forest,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  /** UN SEUL par écran. */
  hero: {
    shadowColor: Palette.forest,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;

export type ElevationToken = keyof typeof Elevation;

/* ────────────────────────────────────────────────────────────────────────────
 * UTILITAIRE
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Décline un token de palette en `rgba()`. Permet de construire les fonds et
 * bordures translucides (voiles, états sémantiques) sans écrire un seul
 * `rgba(255, 152, 0, 0.06)` en dur au call-site.
 *
 *   withAlpha(Palette.sage, 0.16) // → 'rgba(139, 173, 139, 0.16)'
 */
export function withAlpha(color: string, alpha: number): string {
  const h = color.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
