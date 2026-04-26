import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { MiniScoreCircle } from '@/src/components/product/MiniScoreCircle';
import { Colors } from '@/src/constants/colors';
import type { StoreRanking } from '@/src/lib/api/store-ranking';

interface StoreRankingCardProps {
  rank: number;
  ranking: StoreRanking;
  onPress: (slug: string) => void;
}

export function StoreRankingCard({
  rank,
  ranking,
  onPress,
}: StoreRankingCardProps) {
  function handlePress() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
    onPress(ranking.slug);
  }

  const productLabel =
    ranking.productCount <= 1
      ? `${ranking.productCount} produit analysé`
      : `${ranking.productCount} produits analysés`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${rank}e place : ${ranking.nameFr}, ${productLabel}`}
      onPress={handlePress}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      <GlassCard style={styles.card}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <Text style={styles.emoji} allowFontScaling={false}>
          {ranking.emoji}
        </Text>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {ranking.nameFr}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {productLabel}
          </Text>
        </View>
        <MiniScoreCircle score={ranking.avgScore} size={48} strokeWidth={4} />
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.sage,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
