import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Leaf } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import type { SearchResult } from '@/src/lib/api/types';

interface SearchResultCardProps {
  result: SearchResult;
  onPress: () => void;
}

export function SearchResultCard({ result, onPress }: SearchResultCardProps) {
  const isCosmetic = result.type === 'cosmetic';
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
      accessibilityLabel={`${displayName}${result.brand ? `, ${result.brand}` : ''}`}
    >
      <GlassCard style={styles.card}>
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
              <Leaf color={Colors.sage} size={24} strokeWidth={1.8} />
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

        <View
          style={[
            styles.chip,
            isCosmetic ? styles.chipCosmetic : styles.chipFood,
          ]}
        >
          <Text
            style={[
              styles.chipText,
              isCosmetic ? styles.chipTextCosmetic : styles.chipTextFood,
            ]}
          >
            {isCosmetic ? 'Cosmétique' : 'Aliment'}
          </Text>
        </View>
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
    borderRadius: 20,
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 64,
    height: 64,
  },
  thumbFallback: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 15,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  brand: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipFood: {
    backgroundColor: '#E2EBE2',
  },
  chipCosmetic: {
    backgroundColor: '#FCE7ED',
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
  chipTextFood: {
    color: '#405A40',
  },
  chipTextCosmetic: {
    color: '#8B3A5C',
  },
});
