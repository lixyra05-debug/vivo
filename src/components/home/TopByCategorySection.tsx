/**
 * TopByCategorySection — section "Top par catégorie" de la home.
 *
 * Reçoit `blocks` (depuis `fetchTopByCategoryHome`) + `isLoading`. Affiche un
 * skeleton (3 blocs × 3 items) en chargement, puis liste verticale de blocs
 * — chaque bloc = en-tête cliquable (emoji + nom + lien vers catégorie) +
 * 1 à N items cliquables (image + nom + brand + MiniScoreCircle).
 *
 * Règles :
 *  - Bloc avec 0 item → masqué (silent skip).
 *  - Tous les blocs vides + non en chargement → toute la section est masquée.
 *  - Strings FR uniquement.
 */

import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Icon } from '@/src/components/ui/Icon';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { MiniScoreCircle } from '@/src/components/product/MiniScoreCircle';
import { SectionLabel } from '@/src/components/home/SectionLabel';
import { Palette, Radius, Spacing, Type } from '@/src/constants/theme';
import type { TopCategoryBlock, TopCategoryItem } from '@/src/lib/api/top-by-category';

interface TopByCategorySectionProps {
  blocks: TopCategoryBlock[] | undefined;
  isLoading: boolean;
}

const SECTION_TITLE = 'Top par catégorie';
const SECTION_SUBTITLE = 'Les meilleurs produits notés par Vivo';

function lightHaptic(): void {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }
}

interface ItemRowProps {
  item: TopCategoryItem;
  onPress: () => void;
}

function ItemRow({ item, onPress }: ItemRowProps) {
  const displayName =
    item.result.name && item.result.name.trim().length > 0
      ? item.result.name
      : 'Produit';

  function handlePress() {
    lightHaptic();
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, score ${item.score} sur 100`}
      style={styles.itemRow}
    >
      <View style={styles.thumbWrap}>
        {item.result.image_url ? (
          <ExpoImage
            source={{ uri: item.result.image_url }}
            style={styles.thumb}
            contentFit="contain"
            transition={200}
          />
        ) : (
          <View style={styles.thumbFallback}>
            <Icon name="Leaf" color="sageVivid" />
          </View>
        )}
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemName} numberOfLines={1}>
          {displayName}
        </Text>
        {item.result.brand ? (
          <Text style={styles.itemBrand} numberOfLines={1}>
            {item.result.brand}
          </Text>
        ) : null}
      </View>
      <MiniScoreCircle score={item.score} size={48} strokeWidth={4.5} />
    </Pressable>
  );
}

interface BlockCardProps {
  block: TopCategoryBlock;
  onCategoryPress: () => void;
  onItemPress: (item: TopCategoryItem) => void;
}

function BlockCard({ block, onCategoryPress, onItemPress }: BlockCardProps) {
  function handleHeaderPress() {
    lightHaptic();
    onCategoryPress();
  }

  return (
    <GlassCard style={styles.blockCard}>
      <Pressable
        onPress={handleHeaderPress}
        accessibilityRole="button"
        accessibilityLabel={`Voir tous les produits de la catégorie ${block.category.name}`}
        style={styles.blockHeader}
      >
        <Text style={styles.blockEmoji} allowFontScaling={false}>
          {block.category.emoji}
        </Text>
        <View style={styles.blockHeaderText}>
          <Text style={styles.blockTitle}>{block.category.name}</Text>
        </View>
        <Icon name="ChevronRight" size="sm" color="textMuted" />
      </Pressable>

      <View style={styles.itemsList}>
        {block.items.map((item, idx) => (
          <View key={item.result.barcode}>
            {idx > 0 ? <View style={styles.itemDivider} /> : null}
            <ItemRow item={item} onPress={() => onItemPress(item)} />
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

function SkeletonBlock() {
  return (
    <GlassCard style={styles.blockCard}>
      <View style={styles.blockHeader}>
        <Skeleton width={32} height={32} radius={16} />
        <View style={styles.blockHeaderText}>
          <Skeleton width={120} height={16} radius={8} />
        </View>
      </View>
      <View style={styles.itemsList}>
        {[0, 1, 2].map((i) => (
          <View key={i}>
            {i > 0 ? <View style={styles.itemDivider} /> : null}
            <View style={styles.itemRow}>
              <Skeleton width={56} height={56} radius={14} />
              <View style={styles.itemBody}>
                <Skeleton height={14} radius={6} />
                <View style={{ height: 6 }} />
                <Skeleton width={80} height={12} radius={6} />
              </View>
              <Skeleton width={48} height={48} radius={24} />
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

export function TopByCategorySection({ blocks, isLoading }: TopByCategorySectionProps) {
  const router = useRouter();
  const safeBlocks = blocks ?? [];
  const visibleBlocks = safeBlocks.filter((b) => b.items.length > 0);

  // Rien à afficher : ni chargement ni données → masque la section entière.
  if (!isLoading && visibleBlocks.length === 0) {
    return null;
  }

  function handleCategoryPress(slug: string) {
    router.push(`/category/${slug}`);
  }

  function handleItemPress(item: TopCategoryItem) {
    router.push(`/product/${item.result.barcode}?type=food`);
  }

  return (
    <View style={styles.section}>
      <SectionLabel hint={SECTION_SUBTITLE}>{SECTION_TITLE}</SectionLabel>

      {isLoading && visibleBlocks.length === 0 ? (
        <View style={styles.blocksList}>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} />
          ))}
        </View>
      ) : (
        <View style={styles.blocksList}>
          {visibleBlocks.map((block) => (
            <BlockCard
              key={block.category.slug}
              block={block}
              onCategoryPress={() => handleCategoryPress(block.category.slug)}
              onItemPress={handleItemPress}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  blocksList: {
    gap: Spacing.md,
  },
  blockCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  blockEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  blockHeaderText: {
    flex: 1,
  },
  blockTitle: {
    ...Type.h3,
    color: Palette.ink,
  },
  itemsList: {
    marginTop: Spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Palette.borderSoft,
    marginHorizontal: Spacing.xs,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Palette.surfaceInset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 56,
    height: 56,
  },
  thumbFallback: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemName: {
    ...Type.h3,
    color: Palette.ink,
  },
  itemBrand: {
    ...Type.caption,
    fontFamily: 'Inter',
    color: Palette.textMuted,
  },
});
