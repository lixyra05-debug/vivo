import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Leaf } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { MiniScoreCircle } from '@/src/components/product/MiniScoreCircle';
import { Colors } from '@/src/constants/colors';
import type { SearchResult } from '@/src/lib/api/types';

export type Medal = 'gold' | 'silver' | 'bronze';

interface CategoryRankCardProps {
  result: SearchResult;
  score: number;
  rank: number;
  medal?: Medal;
  onPress: () => void;
}

const MEDAL_EMOJI: Record<Medal, string> = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

export function CategoryRankCard({
  result,
  score,
  rank,
  medal,
  onPress,
}: CategoryRankCardProps) {
  const displayName = result.name && result.name.trim().length > 0 ? result.name : 'Produit';

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
      accessibilityLabel={`${medal ? `Médaille ${medal === 'gold' ? 'or' : medal === 'silver' ? 'argent' : 'bronze'}, ` : `Rang ${rank}, `}${displayName}, score ${score} sur 100`}
    >
      <GlassCard style={styles.card}>
        <View style={styles.rankBadge}>
          {medal ? (
            <Text style={styles.medalEmoji} allowFontScaling={false}>
              {MEDAL_EMOJI[medal]}
            </Text>
          ) : (
            <View style={styles.rankCircle}>
              <Text style={styles.rankText}>#{rank}</Text>
            </View>
          )}
        </View>

        <View style={styles.thumbWrap}>
          {result.image_url ? (
            <ExpoImage
              source={{ uri: result.image_url }}
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
          {result.brand ? (
            <Text style={styles.brand} numberOfLines={1}>
              {result.brand}
            </Text>
          ) : null}
        </View>

        <MiniScoreCircle score={score} size={52} strokeWidth={5} />
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 20,
  },
  rankBadge: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalEmoji: {
    fontSize: 32,
    lineHeight: 36,
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#F3F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: -0.2,
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
});
