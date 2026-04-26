import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TrendingUp } from 'lucide-react-native';
import { MiniScoreCircle } from '../product/MiniScoreCircle';
import { Colors } from '@/src/constants/colors';
import type { AlternativeProduct } from '@/src/lib/api/smart-alternatives';

interface AlternativeCardProps {
  alt: AlternativeProduct;
  onPress: (barcode: string) => void;
}

export function AlternativeCard({ alt, onPress }: AlternativeCardProps) {
  function handlePress() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
    onPress(alt.barcode);
  }

  const displayName = alt.name ?? 'Produit sans nom';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, score ${alt.proxyScore} sur 100, plus ${alt.scoreDelta} points`}
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.imageWrap}>
        {alt.imageUrl ? (
          <Image
            source={{ uri: alt.imageUrl }}
            style={styles.image}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>🥗</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {displayName}
        </Text>
        {alt.brand ? (
          <Text style={styles.brand} numberOfLines={1}>
            {alt.brand}
          </Text>
        ) : null}

        <View style={styles.scoreRow}>
          <MiniScoreCircle score={alt.proxyScore} size={40} strokeWidth={4} />
          <View style={styles.deltaPill}>
            <TrendingUp color={Colors.score.green} size={12} strokeWidth={2.6} />
            <Text style={styles.deltaText}>+{alt.scoreDelta}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDEFE7',
    padding: 12,
    gap: 10,
    shadowColor: '#587858',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  imageWrap: {
    height: 96,
    backgroundColor: '#F5F7F0',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: '#F5F7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    fontSize: 32,
  },
  body: {
    gap: 4,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 17,
    color: Colors.text,
  },
  brand: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderRadius: 999,
  },
  deltaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.score.green,
  },
});
