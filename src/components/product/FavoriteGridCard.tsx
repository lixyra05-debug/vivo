import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Heart, Package } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { MiniScoreCircle } from './MiniScoreCircle';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { Colors } from '@/src/constants/colors';

interface FavoriteGridCardProps {
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  score: number;
  onPress: () => void;
  onLongPress: () => void;
}

export function FavoriteGridCard({
  name,
  brand,
  imageUrl,
  score,
  onPress,
  onLongPress,
}: FavoriteGridCardProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();
  const displayName = name ?? 'Produit inconnu';

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePressIn() {
    if (reduceMotion) return;
    scale.value = withSpring(0.97, { damping: 18, stiffness: 260, mass: 0.9 });
  }

  function handlePressOut() {
    if (reduceMotion) return;
    scale.value = withSpring(1, { damping: 16, stiffness: 220, mass: 0.9 });
  }

  function handleLongPress() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
    onLongPress();
  }

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={500}
        accessibilityRole="button"
        accessibilityLabel={`${displayName}${brand ? `, ${brand}` : ''}. Score ${score} sur 100.`}
        accessibilityHint="Appuie pour voir le détail. Appui long pour retirer des favoris."
        style={styles.card}
      >
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <ExpoImage
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="contain"
              transition={240}
              accessibilityLabel={`Photo de ${displayName}`}
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Package color={Colors.textMuted} size={28} />
            </View>
          )}

          <View style={styles.scoreOverlay}>
            <MiniScoreCircle score={score} size={44} strokeWidth={4} />
          </View>

          <View style={styles.heartOverlay}>
            <Heart color={Colors.sage} fill={Colors.sage} size={14} strokeWidth={2} />
          </View>
        </View>

        <View style={styles.textWrap}>
          <Text
            style={{
              fontFamily: 'BricolageGrotesque-SemiBold',
              fontSize: 14,
              color: Colors.text,
              letterSpacing: -0.2,
            }}
            numberOfLines={2}
          >
            {displayName}
          </Text>
          {brand ? (
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 12,
                color: Colors.textMuted,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {brand}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  card: {
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    padding: 10,
    gap: 10,
    shadowColor: '#587858',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#F6F3EB',
    overflow: 'hidden',
    position: 'relative',
  },
  image: { flex: 1, width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  scoreOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 999,
    padding: 2,
    shadowColor: '#587858',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  heartOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 173, 139, 0.35)',
  },
  textWrap: { paddingHorizontal: 2, paddingBottom: 2, minHeight: 48 },
});
