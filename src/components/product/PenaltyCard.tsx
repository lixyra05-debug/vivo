import { useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AlertCircle, AlertTriangle, ChevronDown, ExternalLink, Info } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { Colors } from '@/src/constants/colors';

type Severity = 'blocker' | 'heavy' | 'light';

interface PenaltyCardProps {
  code?: string;
  title: string;
  points: number;
  description?: string;
  detailed?: string;
  sources?: string[];
  severity?: Severity;
}

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; icon: (size: number, color: string) => ReactNode }> = {
  blocker: {
    color: Colors.score.red,
    bg: 'rgba(244, 67, 54, 0.1)',
    icon: (size, color) => <AlertTriangle color={color} size={size} strokeWidth={2.2} />,
  },
  heavy: {
    color: Colors.score.orange,
    bg: 'rgba(255, 152, 0, 0.12)',
    icon: (size, color) => <AlertCircle color={color} size={size} strokeWidth={2.2} />,
  },
  light: {
    color: '#B58900',
    bg: 'rgba(255, 193, 7, 0.16)',
    icon: (size, color) => <Info color={color} size={size} strokeWidth={2.2} />,
  },
};

function severityFromPoints(points: number, isBlocker: boolean): Severity {
  if (isBlocker) return 'blocker';
  if (points >= 15) return 'heavy';
  return 'light';
}

export function PenaltyCard({
  code,
  title,
  points,
  description,
  detailed,
  sources,
  severity,
}: PenaltyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReduceMotion();
  const chevron = useSharedValue(0);

  const resolved = severity ?? severityFromPoints(points, points === 0);
  const config = SEVERITY_CONFIG[resolved];
  const hasExpandable = Boolean(detailed || (sources && sources.length > 0));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * 180}deg` }],
  }));

  function toggle() {
    if (!hasExpandable) return;
    const next = !expanded;
    setExpanded(next);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    chevron.value = reduceMotion
      ? next ? 1 : 0
      : withTiming(next ? 1 : 0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }

  return (
    <GlassCard style={{ padding: 14 }}>
      <Pressable
        onPress={toggle}
        disabled={!hasExpandable}
        accessibilityRole={hasExpandable ? 'button' : 'text'}
        accessibilityLabel={`${title}. Pénalité ${points} points.`}
        accessibilityHint={hasExpandable ? 'Appuie pour en savoir plus' : undefined}
        accessibilityState={hasExpandable ? { expanded } : undefined}
      >
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
            {config.icon(20, config.color)}
          </View>

          <View style={{ flex: 1 }}>
            {code ? (
              <Text
                style={{
                  fontFamily: 'Inter-SemiBold',
                  fontSize: 11,
                  color: Colors.textMuted,
                  letterSpacing: 1,
                }}
              >
                {code.toUpperCase()}
              </Text>
            ) : null}
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-SemiBold',
                fontSize: 15,
                color: Colors.text,
                marginTop: code ? 2 : 0,
              }}
              numberOfLines={2}
            >
              {title}
            </Text>
            {description ? (
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: Colors.textMuted,
                  lineHeight: 19,
                  marginTop: 4,
                }}
              >
                {description}
              </Text>
            ) : null}
          </View>

          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 20,
                color: config.color,
                letterSpacing: -0.3,
              }}
            >
              {points === 0 ? 'Bloquant' : `-${Math.round(points)}`}
            </Text>
            {hasExpandable ? (
              <Animated.View style={chevronStyle}>
                <ChevronDown size={16} color={Colors.textMuted} strokeWidth={2.2} />
              </Animated.View>
            ) : null}
          </View>
        </View>
      </Pressable>

      {expanded && hasExpandable ? (
        <View style={styles.expandedBody}>
          {detailed ? (
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: Colors.text,
                lineHeight: 20,
              }}
            >
              {detailed}
            </Text>
          ) : null}
          {sources && sources.length > 0 ? (
            <View style={{ gap: 6 }}>
              {sources.map((src) => (
                <Pressable
                  key={src}
                  onPress={() => {
                    void Linking.openURL(src);
                  }}
                  accessibilityRole="link"
                  accessibilityLabel="Source scientifique"
                  style={styles.sourceRow}
                >
                  <ExternalLink size={14} color={Colors.sage} strokeWidth={2.2} />
                  <Text
                    style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 12,
                      color: Colors.textMuted,
                      textDecorationLine: 'underline',
                      flex: 1,
                    }}
                    numberOfLines={2}
                  >
                    {src}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E7E7DA',
    gap: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
