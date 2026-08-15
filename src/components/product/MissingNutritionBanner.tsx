/**
 * Bandeau « Données incomplètes » — FACE 2 du bloquant 4, voie (i).
 *
 * Un constat sur la SOURCE, jamais un jugement sur le produit (R5) : quand
 * des macros pénalisables manquent, la note est calculée sans elles — elle
 * n'invente ni risque ni innocence — et cette absence se dit AU MÊME NIVEAU
 * que la note, pas dans un badge de 11 px (racine A de l'audit). Couvre
 * aussi le « 100-par-vide » tracé au Temps 1 : une eau à 100 par absence de
 * pénalité porte ce bandeau, comme elle portait un 30 nu avant la face 1.
 *
 * Auto-gating : `null` quand rien ne manque — un bandeau permanent ne dit
 * rien. Copy verrouillée par MissingNutritionBanner.test.tsx.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Info } from 'lucide-react-native';
import { Palette, Radius, Spacing, Type, withAlpha } from '@/src/constants/theme';
import { getMissingNutritionFields } from '@/src/lib/api/confidence';
import type { Product } from '@/src/lib/api/types';

export interface MissingNutritionBannerProps {
  product: Product;
}

export function MissingNutritionBanner({ product }: MissingNutritionBannerProps) {
  const missing = getMissingNutritionFields(product);
  if (missing.length === 0) return null;

  // Accord : « sel » seul est le seul libellé singulier ; « sucres » et
  // « gras saturés » sont pluriels par eux-mêmes, et toute liste mixte prend
  // le masculin pluriel.
  const suffix =
    missing.length === 1 && missing[0] === 'sel'
      ? 'non renseigné par la source'
      : 'non renseignés par la source';
  const message = `Données incomplètes : ${missing.join(', ')} ${suffix}`;

  return (
    <View style={styles.container} accessibilityRole="text" accessibilityLabel={message}>
      <Info color={Palette.textMuted} size={14} strokeWidth={2.2} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: withAlpha(Palette.borderCard, 0.9),
    backgroundColor: withAlpha(Palette.textMuted, 0.06),
  },
  text: {
    ...Type.caption,
    color: Palette.textMuted,
    flex: 1,
  },
});
