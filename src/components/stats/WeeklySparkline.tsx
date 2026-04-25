/**
 * WeeklySparkline — mini-graphique de tendance des scores sur N points.
 *
 * Courbe Catmull-Rom lissée (bezier en chaîne), point final mis en évidence,
 * fallback ligne plate grise si tous les points = 0. Sous-titre "4 semaines".
 */

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '@/src/constants/colors';

interface WeeklySparklineProps {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
  label?: string;
}

const PADDING = 4;

function buildSmoothPath(points: number[], width: number, height: number): string {
  if (points.length === 0) return '';
  const innerW = width - PADDING * 2;
  const innerH = height - PADDING * 2;
  const xs = points.map((_, i) =>
    points.length === 1 ? width / 2 : PADDING + (i / (points.length - 1)) * innerW,
  );
  // Score 0..100 inversé : 100 → top
  const ys = points.map((s) => {
    const clamped = Math.max(0, Math.min(100, s));
    return PADDING + innerH - (clamped / 100) * innerH;
  });

  let d = `M ${xs[0].toFixed(2)},${ys[0].toFixed(2)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[Math.max(i - 1, 0)];
    const y0 = ys[Math.max(i - 1, 0)];
    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    const x3 = xs[Math.min(i + 2, xs.length - 1)];
    const y3 = ys[Math.min(i + 2, ys.length - 1)];

    // Catmull-Rom → Bezier
    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }
  return d;
}

export function WeeklySparkline({
  points,
  color = Colors.earth,
  width = 120,
  height = 40,
  label = '4 semaines',
}: WeeklySparklineProps) {
  const hasData = points.some((p) => p > 0);

  return (
    <View style={styles.wrap} accessibilityLabel="Tendance hebdomadaire">
      <Svg width={width} height={height}>
        {hasData ? (
          <>
            <Path
              d={buildSmoothPath(points, width, height)}
              stroke={color}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.length > 0 ? (
              (() => {
                const innerW = width - PADDING * 2;
                const innerH = height - PADDING * 2;
                const lastIdx = points.length - 1;
                const lastX =
                  points.length === 1
                    ? width / 2
                    : PADDING + (lastIdx / (points.length - 1)) * innerW;
                const lastY =
                  PADDING + innerH - (Math.max(0, Math.min(100, points[lastIdx])) / 100) * innerH;
                return <Circle cx={lastX} cy={lastY} r={3} fill={color} />;
              })()
            ) : null}
          </>
        ) : (
          <Path
            d={`M ${PADDING},${height / 2} L ${width - PADDING},${height / 2}`}
            stroke="#D5D5C8"
            strokeWidth={1.5}
            strokeDasharray="3,3"
            fill="none"
          />
        )}
      </Svg>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
  },
  caption: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#A8B5A8',
    textAlign: 'center',
  },
});
