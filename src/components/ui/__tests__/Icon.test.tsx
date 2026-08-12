import { render } from '@testing-library/react-native';
import { Icon, ICON_NAMES, IconSize } from '../Icon';
import { Palette } from '@/src/constants/theme';

/**
 * `lucide-react-native` rend un `RNSVGSvgView` à la racine. On lit ses props
 * directement : c'est le seul point d'observation fiable, le composant
 * n'acceptant pas de `testID` exploitable (cf. commentaire dans Icon.tsx).
 */
function rootProps(node: React.ReactElement) {
  const tree = render(node).toJSON();
  if (tree === null || Array.isArray(tree)) {
    throw new Error('Icon devrait rendre un unique nœud racine');
  }
  return tree.props as Record<string, unknown>;
}

describe('Icon', () => {
  it('rend une icône lucide à la taille du token demandé', () => {
    expect(rootProps(<Icon name="Leaf" size="sm" />).width).toBe(IconSize.sm);
    expect(rootProps(<Icon name="Leaf" size="md" />).width).toBe(IconSize.md);
    expect(rootProps(<Icon name="Leaf" size="lg" />).width).toBe(IconSize.lg);
  });

  it('applique md (20) par défaut', () => {
    const props = rootProps(<Icon name="Package" />);
    expect(props.width).toBe(20);
    expect(props.height).toBe(20);
  });

  it('normalise le trait à 1.75 — fin de la disparité 2.2 / 2.4', () => {
    expect(rootProps(<Icon name="Recycle" />).strokeWidth).toBe(1.75);
    expect(rootProps(<Icon name="Recycle" strokeWidth={2} />).strokeWidth).toBe(2);
  });

  it('résout la couleur depuis un token de palette, jamais un hex au call-site', () => {
    expect(rootProps(<Icon name="Flame" />).stroke).toBe(Palette.forest);
    expect(rootProps(<Icon name="Flame" color="scoreBad" />).stroke).toBe(Palette.scoreBad);
    expect(rootProps(<Icon name="Flame" color="textOnDark" />).stroke).toBe(
      Palette.textOnDark,
    );
  });

  it('est décorative par défaut : masquée aux lecteurs d’écran', () => {
    const props = rootProps(<Icon name="Building2" />);
    expect(props.accessibilityElementsHidden).toBe(true);
    expect(props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('devient annoncée dès qu’un libellé est fourni', () => {
    const props = rootProps(<Icon name="Building2" accessibilityLabel="Maison-mère" />);
    expect(props.accessibilityElementsHidden).toBe(false);
    expect(props.importantForAccessibility).toBe('yes');
    expect(props.accessibilityLabel).toBe('Maison-mère');
  });

  it('expose un registre curé, non le catalogue lucide complet', () => {
    expect(ICON_NAMES.length).toBeGreaterThan(20);
    expect(ICON_NAMES.length).toBeLessThan(200);
    expect(ICON_NAMES).toContain('Leaf');
    expect(ICON_NAMES).toContain('Pill');
    expect(ICON_NAMES).toContain('CupSoda');
  });

  it('rend chaque icône du registre sans exploser', () => {
    for (const name of ICON_NAMES) {
      expect([name, rootProps(<Icon name={name} />).width]).toEqual([name, 20]);
    }
  });
});
