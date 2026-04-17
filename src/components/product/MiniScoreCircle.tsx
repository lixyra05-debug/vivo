import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { scoreColor } from '@/src/constants/colors';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function MiniScoreCircle({ score, size = 56, strokeWidth = 5 }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = scoreColor(clamped);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
      accessibilityRole="text"
      accessibilityLabel={`Score ${clamped} sur 100`}
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
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </Svg>
      <View
        className="absolute inset-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Text className="text-sm font-bold" style={{ color }} accessibilityElementsHidden>
          {clamped}
        </Text>
      </View>
    </View>
  );
}
