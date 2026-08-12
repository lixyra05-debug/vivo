/**
 * Garde-fous du Design System v2.
 *
 * Ces tests protègent trois choses qui, si elles cassent, ne lèvent AUCUNE
 * erreur à l'exécution et se voient seulement à l'œil, tard :
 *   1. un nom de police inexistant → fallback silencieux sur la police système
 *   2. une couleur de texte sous 4,5:1 → illisible sans que rien ne le signale
 *   3. une ombre `#000` → gris sale sur une palette chaude
 */

import fs from 'fs';
import path from 'path';
import { Colors, scoreColor } from '../colors';
import { Elevation, FontFamily, Palette, Radius, Spacing, Type, withAlpha } from '../theme';

const ROOT = path.resolve(__dirname, '../../..');

/** Luminance relative WCAG 2.1. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const AA = 4.5;

describe('Design System — échelle typographique', () => {
  it('expose les 7 niveaux attendus', () => {
    expect(Object.keys(Type)).toEqual([
      'display',
      'h1',
      'h2',
      'h3',
      'body',
      'caption',
      'micro',
    ]);
  });

  it('creuse des écarts francs entre les niveaux (pas une gradation douce)', () => {
    const sizes = Object.values(Type).map((t) => t.fontSize);
    expect(sizes).toEqual([40, 28, 20, 16, 15, 13, 11]);
    // Le saut display → h1 doit rester spectaculaire : c'est lui qui crée la hiérarchie.
    expect(Type.display.fontSize - Type.h1.fontSize).toBeGreaterThanOrEqual(12);
  });

  it('serre le crénage sur les grandes tailles et l’ouvre sur micro', () => {
    expect(Type.display.letterSpacing).toBeLessThan(0);
    expect(Type.h1.letterSpacing).toBeLessThan(0);
    expect(Type.micro.letterSpacing).toBeGreaterThan(0);
    expect(Type.micro.textTransform).toBe('uppercase');
  });

  it('n’utilise que des familles réellement chargées par useFonts()', () => {
    const layout = fs.readFileSync(path.join(ROOT, 'app/_layout.tsx'), 'utf8');
    const block = layout.match(/useFonts\(\{([\s\S]*?)\}\)/);
    expect(block).not.toBeNull();

    // Les clés sont tantôt quotées ('Inter-Bold'), tantôt nues (Inter).
    const loaded = [...(block as RegExpMatchArray)[1].matchAll(/(?:'([^']+)'|([A-Za-z][\w-]*))\s*:/g)].map(
      (m) => m[1] ?? m[2],
    );
    expect(loaded).toContain('Inter');

    for (const family of Object.values(FontFamily)) {
      expect([family, loaded.includes(family)]).toEqual([family, true]);
    }
  });

  it('chaque style typo pointe sur une famille du registre', () => {
    const registered = Object.values(FontFamily) as string[];
    for (const [name, style] of Object.entries(Type)) {
      expect([name, registered.includes(style.fontFamily)]).toEqual([name, true]);
    }
  });
});

describe('Design System — contraste', () => {
  const TEXT_TOKENS = [
    'ink',
    'forest',
    'textPrimary',
    'textSecondary',
    'textMuted',
    'sageVivid',
    'earthDeep',
    'scoreExcellent',
    'scoreGood',
    'scoreMid',
    'scorePoor',
    'scoreBad',
  ] as const;

  it.each(TEXT_TOKENS)('%s atteint AA (4,5:1) sur le fond d’écran', (token) => {
    expect(contrast(Palette[token], Palette.surfaceBase)).toBeGreaterThanOrEqual(AA);
  });

  it.each(TEXT_TOKENS)('%s atteint AA sur une carte surélevée', (token) => {
    expect(contrast(Palette[token], Palette.surfaceRaised)).toBeGreaterThanOrEqual(AA);
  });

  it('ink est bien l’ancre : la couleur la plus foncée de la palette', () => {
    const darkest = Object.values(Palette).reduce((a, b) =>
      luminance(a) < luminance(b) ? a : b,
    );
    expect(darkest).toBe(Palette.ink);
    expect(contrast(Palette.ink, Palette.surfaceBase)).toBeGreaterThan(15);
  });

  it('sage et earth restent décoratifs — jamais listés comme couleurs de texte', () => {
    const textTokens: readonly string[] = TEXT_TOKENS;
    expect(textTokens).not.toContain('sage');
    expect(textTokens).not.toContain('earth');
    // Et c'est justifié : ils échouent au seuil AA, d'où la règle.
    expect(contrast(Palette.sage, Palette.surfaceBase)).toBeLessThan(AA);
    expect(contrast(Palette.earth, Palette.surfaceBase)).toBeLessThan(AA);
  });

  it('les couleurs de score passent AA — ScoreCircle les pose en couleur de TEXTE', () => {
    for (const score of [95, 82, 70, 60, 50, 40, 25, 10, 0]) {
      expect(contrast(scoreColor(score), Palette.surfaceBase)).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe('Design System — élévation', () => {
  it('teinte les ombres en forest et jamais en noir', () => {
    for (const [name, level] of Object.entries(Elevation)) {
      if (!('shadowColor' in level) || level.shadowColor === undefined) continue;
      expect([name, level.shadowColor]).toEqual([name, Palette.forest]);
    }
  });

  it('monte bien en trois paliers distincts', () => {
    expect('shadowColor' in Elevation.flat).toBe(false);
    expect(Elevation.raised.elevation).toBeLessThan(Elevation.hero.elevation as number);
    expect(Elevation.raised.shadowOpacity).toBeLessThan(
      Elevation.hero.shadowOpacity as number,
    );
  });
});

describe('Design System — échelles et façade', () => {
  it('expose des échelles strictes et croissantes', () => {
    const spacing = Object.values(Spacing);
    expect(spacing).toEqual([...spacing].sort((a, b) => a - b));
    expect(Spacing.xs).toBe(4);
    expect(Spacing.hero).toBe(64);
    expect(Radius.pill).toBe(999);
  });

  it('la façade Colors remappe les clés historiques sur les tokens v2', () => {
    expect(Colors.text).toBe(Palette.ink);
    expect(Colors.textMuted).toBe(Palette.textMuted);
    expect(Colors.cream).toBe(Palette.surfaceBase);
    expect(Colors.score.green).toBe(Palette.scoreExcellent);
    expect(Colors.score.red).toBe(Palette.scoreBad);
  });

  it('scoreColor conserve ses seuils métier', () => {
    expect(scoreColor(70)).toBe(Colors.score.green);
    expect(scoreColor(69)).toBe(Colors.score.yellow);
    expect(scoreColor(50)).toBe(Colors.score.yellow);
    expect(scoreColor(49)).toBe(Colors.score.orange);
    expect(scoreColor(25)).toBe(Colors.score.orange);
    expect(scoreColor(24)).toBe(Colors.score.red);
  });

  it('withAlpha décline un token en rgba sans hex au call-site', () => {
    expect(withAlpha(Palette.sage, 0.16)).toBe('rgba(139, 173, 139, 0.16)');
    expect(withAlpha(Palette.ink, 1)).toBe('rgba(20, 32, 26, 1)');
  });
});
