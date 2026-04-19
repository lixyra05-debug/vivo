import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

interface EmptyBasketProps {
  size?: number;
}

export function EmptyBasket({ size = 140 }: EmptyBasketProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Defs>
        <SvgLinearGradient id="basketA" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#EDE2CF" />
          <Stop offset="1" stopColor="#C4A882" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M42 70 L 118 70 L 110 130 C 109 136 105 140 98 140 L 62 140 C 55 140 51 136 50 130 Z"
        fill="url(#basketA)"
        opacity={0.55}
      />
      <Path
        d="M42 70 L 118 70 L 110 130 C 109 136 105 140 98 140 L 62 140 C 55 140 51 136 50 130 Z"
        stroke="#644F33"
        strokeWidth={3}
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M38 70 L 122 70"
        stroke="#644F33"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Path
        d="M60 70 C 60 46 70 30 80 30 C 90 30 100 46 100 70"
        stroke="#644F33"
        strokeWidth={3}
        strokeLinecap="round"
        fill="transparent"
      />
      <Path
        d="M80 50 C 70 46 62 36 66 22 C 78 24 84 34 80 50 Z"
        fill="#8BAD8B"
        opacity={0.9}
      />
      <Path
        d="M80 50 C 78 40 78 30 80 22"
        stroke="#405A40"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.6}
        fill="transparent"
      />
    </Svg>
  );
}
