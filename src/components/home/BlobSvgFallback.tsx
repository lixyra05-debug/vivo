import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface BlobSvgFallbackProps {
  size?: number;
}

const BLOB_PATH =
  'M160,32 C206,32 244,68 252,114 C260,160 240,204 206,228 C172,252 128,252 94,228 C60,204 40,160 48,114 C56,68 94,32 140,32 Z';

export function BlobSvgFallback({ size = 340 }: BlobSvgFallbackProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withTiming(1.04, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size }, animatedStyle]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Élément décoratif représentant l'univers Vivo"
    >
      <Svg width={size} height={size} viewBox="0 0 300 300">
        <Defs>
          <SvgLinearGradient id="blobGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#A9C4A9" stopOpacity="1" />
            <Stop offset="0.55" stopColor="#8BAD8B" stopOpacity="1" />
            <Stop offset="1" stopColor="#587858" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Path d={BLOB_PATH} fill="url(#blobGradient)" />
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: size * 0.22,
          left: size * 0.24,
          width: size * 0.22,
          height: size * 0.14,
          borderRadius: size * 0.11,
          backgroundColor: '#FFFFFF',
          opacity: 0.35,
          transform: [{ rotate: '-18deg' }],
        }}
      />
    </Animated.View>
  );
}
