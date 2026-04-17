import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scoreColor } from '@/src/constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const COLOR_LABEL = {
  green: 'Bon',
  yellow: 'Moyen',
  orange: 'Mauvais',
  red: 'Danger',
} as const;

function getColorKey(s: number): keyof typeof COLOR_LABEL {
  if (s >= 70) return 'green';
  if (s >= 50) return 'yellow';
  if (s >= 25) return 'orange';
  return 'red';
}

export function ScoreCircle({ score, size = 160, strokeWidth = 12 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = scoreColor(clamped);
  const colorKey = getColorKey(clamped);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped / 100, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
      accessibilityRole="text"
      accessibilityLabel={`Score de santé : ${clamped} sur 100. ${COLOR_LABEL[colorKey]}.`}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E7E7DA"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>
      <View
        className="absolute inset-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Text
          className="font-display text-5xl font-bold"
          style={{ color }}
          accessibilityElementsHidden
        >
          {clamped}
        </Text>
        <Text className="text-xs uppercase tracking-wider text-sage-700" accessibilityElementsHidden>
          / 100
        </Text>
      </View>
    </View>
  );
}
