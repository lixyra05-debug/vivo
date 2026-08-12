import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Leaf, TrendingUp } from 'lucide-react-native';
import { MiniScoreCircle } from '../product/MiniScoreCircle';
import { Colors } from '@/src/constants/colors';
import type { Alternative } from '@/src/lib/api/smart-alternatives';

interface AlternativeCardProps {
  alt: Alternative;
  onPress: (barcode: string) => void;
}

interface NovaStyle {
  bg: string;
  color: string;
}

function novaStyle(group: number): NovaStyle {
  if (group <= 2) {
    return { bg: 'rgba(139,173,139,0.18)', color: Colors.sageVivid };
  }
  if (group === 3) {
    return { bg: 'rgba(255,152,0,0.18)', color: '#B96B00' };
  }
  return { bg: 'rgba(244,67,54,0.18)', color: '#B5311E' };
}

interface AdditivesStyle {
  label: string;
  color: string;
}

function additivesStyle(count: number): AdditivesStyle {
  if (count === 0) {
    return { label: '0 additif', color: Colors.sageVivid };
  }
  if (count <= 3) {
    return {
      label: `${count} additif${count > 1 ? 's' : ''}`,
      color: Colors.textMuted,
    };
  }
  return { label: `${count} additifs`, color: '#B96B00' };
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

  const nova = alt.novaGroup !== null ? novaStyle(alt.novaGroup) : null;
  const additives = additivesStyle(alt.additivesCount);
  const novaLabel = alt.novaGroup !== null ? `NOVA ${alt.novaGroup}` : 'inconnu';
  const additiveSrLabel = `${alt.additivesCount} additif${
    alt.additivesCount > 1 ? 's' : ''
  }`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${alt.name}, score ${alt.score} sur 100, plus ${alt.scoreDelta} points, NOVA ${novaLabel}, ${additiveSrLabel}`}
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.imageWrap}>
        {alt.imageUrl ? (
          <Image
            source={{ uri: alt.imageUrl }}
            style={styles.image}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Leaf color={Colors.sage} size={24} strokeWidth={2.2} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {alt.name}
        </Text>
        {alt.brand ? (
          <Text style={styles.brand} numberOfLines={1}>
            {alt.brand}
          </Text>
        ) : null}

        <View style={styles.badgesRow}>
          <MiniScoreCircle score={alt.score} size={32} strokeWidth={3} />
          <View style={styles.deltaPill}>
            <TrendingUp color={Colors.score.green} size={12} strokeWidth={2.6} />
            <Text style={styles.deltaText}>+{alt.scoreDelta}</Text>
          </View>
          {nova ? (
            <View style={[styles.novaPill, { backgroundColor: nova.bg }]}>
              <Text style={[styles.novaText, { color: nova.color }]}>
                NOVA {alt.novaGroup}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.additivesText, { color: additives.color }]}>
            {additives.label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDEFE7',
    padding: 12,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#587858',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  imageWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F5F7F0',
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
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  brand: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.textMuted,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
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
  novaPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  novaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
  additivesText: {
    fontFamily: 'Inter',
    fontSize: 11,
  },
});
