import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Leaf } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import type { FeaturedProduct } from '@/src/data/featured-products';

const NUTRI_GRADE_COLORS: Record<'a' | 'b' | 'c' | 'd' | 'e', { bg: string; fg: string }> = {
  a: { bg: '#1F8A4C', fg: '#FFFFFF' },
  b: { bg: '#85BB2F', fg: '#FFFFFF' },
  c: { bg: '#FFC734', fg: '#2B3E2B' },
  d: { bg: '#EF8B22', fg: '#FFFFFF' },
  e: { bg: '#E63E11', fg: '#FFFFFF' },
};

interface FeaturedProductCardProps {
  product: FeaturedProduct;
  onPress: () => void;
}

export function FeaturedProductCard({ product, onPress }: FeaturedProductCardProps) {
  const displayName =
    product.name && product.name.trim().length > 0 ? product.name : 'Produit';
  const isCosmetic = product.type === 'cosmetic';
  const grade = product.nutritionGrade;

  function handlePress() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}${product.brand ? `, ${product.brand}` : ''}${
        grade ? `, Nutri-Score ${grade.toUpperCase()}` : ''
      }`}
    >
      <GlassCard style={styles.card}>
        <View style={styles.thumbWrap}>
          {product.imageUrl ? (
            <ExpoImage
              source={{ uri: product.imageUrl }}
              style={styles.thumb}
              contentFit="contain"
              transition={220}
            />
          ) : (
            <View style={styles.thumbFallback}>
              <Leaf color={Colors.sage} size={22} strokeWidth={1.8} />
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {displayName}
          </Text>
          {product.brand ? (
            <Text style={styles.brand} numberOfLines={1}>
              {product.brand}
            </Text>
          ) : null}
        </View>

        {grade && !isCosmetic ? (
          <View
            style={[styles.gradeBadge, { backgroundColor: NUTRI_GRADE_COLORS[grade].bg }]}
            accessibilityLabel={`Nutri-Score ${grade.toUpperCase()}`}
          >
            <Text style={[styles.gradeText, { color: NUTRI_GRADE_COLORS[grade].fg }]}>
              {grade.toUpperCase()}
            </Text>
          </View>
        ) : isCosmetic ? (
          <View style={styles.chipCosmetic}>
            <Text style={styles.chipCosmeticText}>Cosmétique</Text>
          </View>
        ) : null}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderColor: 'rgba(139, 173, 139, 0.32)',
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
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 14,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  brand: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  gradeBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 14,
    letterSpacing: -0.4,
  },
  chipCosmetic: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FCE7ED',
  },
  chipCosmeticText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#8B3A5C',
  },
});
