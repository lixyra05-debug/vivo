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
import { ChevronRight, Leaf } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { MiniScoreCircle } from '@/src/components/product/MiniScoreCircle';
import { Colors } from '@/src/constants/colors';
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

interface SectionHeaderProps {
  // Pas de props pour l'instant : titre + sous-titre fixes.
}

function SectionHeader(_props: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{SECTION_TITLE}</Text>
      <Text style={styles.sectionSubtitle}>{SECTION_SUBTITLE}</Text>
    </View>
  );
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
            <Leaf color={Colors.sage} size={20} strokeWidth={1.8} />
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
        <ChevronRight color={Colors.textMuted} size={18} strokeWidth={2} />
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
      <SectionHeader />

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
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
  },
  blocksList: {
    gap: 12,
  },
  blockCard: {
    padding: 12,
    borderRadius: 20,
    gap: 4,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  blockEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  blockHeaderText: {
    flex: 1,
  },
  blockTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 15,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  itemsList: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#EFEFE6',
    marginHorizontal: 4,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F3F3EC',
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
    gap: 2,
  },
  itemName: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 14,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  itemBrand: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
