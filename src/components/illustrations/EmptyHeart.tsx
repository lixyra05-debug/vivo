import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

interface EmptyHeartProps {
  size?: number;
}

export function EmptyHeart({ size = 140 }: EmptyHeartProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Defs>
        <SvgLinearGradient id="heartA" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E2EBE2" />
          <Stop offset="1" stopColor="#8BAD8B" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M80 130 C 40 104 22 82 22 58 C 22 40 36 26 54 26 C 66 26 76 32 80 42 C 84 32 94 26 106 26 C 124 26 138 40 138 58 C 138 82 120 104 80 130 Z"
        fill="url(#heartA)"
        opacity={0.3}
      />
      <Path
        d="M80 130 C 40 104 22 82 22 58 C 22 40 36 26 54 26 C 66 26 76 32 80 42 C 84 32 94 26 106 26 C 124 26 138 40 138 58 C 138 82 120 104 80 130 Z"
        stroke="#587858"
        strokeWidth={3.5}
        strokeLinejoin="round"
        fill="transparent"
      />
    </Svg>
  );
}
