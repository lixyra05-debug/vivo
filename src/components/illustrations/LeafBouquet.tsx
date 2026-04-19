import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

interface LeafBouquetProps {
  size?: number;
}

export function LeafBouquet({ size = 120 }: LeafBouquetProps) {
  const height = size * 0.72;
  return (
    <Svg width={size} height={height} viewBox="0 0 160 120" fill="none">
      <Defs>
        <SvgLinearGradient id="leafA" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A9C4A9" />
          <Stop offset="1" stopColor="#587858" />
        </SvgLinearGradient>
        <SvgLinearGradient id="leafB" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#8BAD8B" />
          <Stop offset="1" stopColor="#C6D8C6" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M80 108 C 45 96 26 68 32 36 C 54 44 74 64 80 108 Z"
        fill="url(#leafA)"
        opacity={0.95}
      />
      <Path
        d="M80 108 C 115 96 134 68 128 36 C 106 44 86 64 80 108 Z"
        fill="url(#leafB)"
        opacity={0.85}
      />
      <Path
        d="M80 108 C 80 80 80 52 80 24"
        stroke="#405A40"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.5}
      />
      <Path
        d="M80 108 C 72 96 64 82 56 68"
        stroke="#405A40"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.35}
      />
      <Path
        d="M80 108 C 88 96 96 82 104 68"
        stroke="#405A40"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.35}
      />
    </Svg>
  );
}
