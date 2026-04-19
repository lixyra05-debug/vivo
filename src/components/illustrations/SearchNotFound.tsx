import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

interface SearchNotFoundProps {
  size?: number;
}

export function SearchNotFound({ size = 140 }: SearchNotFoundProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Defs>
        <SvgLinearGradient id="lensA" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E2EBE2" />
          <Stop offset="1" stopColor="#A9C4A9" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx={70} cy={70} r={44} fill="url(#lensA)" opacity={0.35} />
      <Circle cx={70} cy={70} r={44} stroke="#587858" strokeWidth={4} fill="transparent" />
      <Path
        d="M102 102 L 138 138"
        stroke="#587858"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <Path
        d="M70 52 C 62 52 56 58 56 66"
        stroke="#405A40"
        strokeWidth={4}
        strokeLinecap="round"
        fill="transparent"
        opacity={0.9}
      />
      <Circle cx={70} cy={80} r={2.5} fill="#405A40" />
    </Svg>
  );
}
