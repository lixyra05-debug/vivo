import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { Colors } from '@/src/constants/colors';
import type { CompatibilityResult } from '@/src/lib/api/types';

interface CompatibilityBannerProps {
  result: CompatibilityResult | null;
}

const VISIBLE_LIMIT = 3;

export function CompatibilityBanner({ result }: CompatibilityBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!result) {
    return null;
  }

  if (result.isCompatible) {
    const showPercentage = result.compatibilityPercentage < 100;
    return (
      <FadeIn>
        <View style={styles.compatible}>
          <View style={styles.headerRow}>
            <CheckCircle2 color={Colors.sage} size={22} strokeWidth={2.2} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.compatibleTitle}>Compatible avec votre profil</Text>
              {showPercentage ? (
                <Text style={styles.compatibleSubtitle}>
                  {`✓ ${result.compatibilityPercentage}% des critères passent`}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </FadeIn>
    );
  }

  const reasons = result.incompatibilities;
  const hasMore = reasons.length > VISIBLE_LIMIT;
  const visibleReasons = expanded ? reasons : reasons.slice(0, VISIBLE_LIMIT);
  const remaining = reasons.length - VISIBLE_LIMIT;

  function handleToggle() {
    if (!hasMore) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    setExpanded((v) => !v);
  }

  return (
    <FadeIn>
      <Pressable
        onPress={handleToggle}
        accessibilityRole={hasMore ? 'button' : undefined}
        accessibilityLabel="Incompatible avec votre profil"
        accessibilityHint={hasMore ? 'Appuyer pour voir tous les motifs' : undefined}
        style={styles.incompatible}
      >
        <View style={styles.headerRow}>
          <AlertTriangle color={Colors.score.red} size={22} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.incompatibleTitle}>Incompatible avec votre profil</Text>
          </View>
          {hasMore ? (
            expanded ? (
              <ChevronUp color={Colors.score.red} size={18} strokeWidth={2.2} />
            ) : (
              <ChevronDown color={Colors.score.red} size={18} strokeWidth={2.2} />
            )
          ) : null}
        </View>
        <View style={styles.reasonsList}>
          {visibleReasons.map((reason, idx) => (
            <View key={`${reason.type}-${idx}`} style={styles.reasonRow}>
              <View style={styles.dot} />
              <Text style={styles.reasonText} numberOfLines={2}>
                {reason.labelFr}
              </Text>
            </View>
          ))}
          {!expanded && hasMore ? (
            <Text style={styles.moreText}>{`+ ${remaining} autres`}</Text>
          ) : null}
        </View>
      </Pressable>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  compatible: {
    backgroundColor: 'rgba(139,173,139,0.10)',
    borderColor: 'rgba(139,173,139,0.35)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  incompatible: {
    backgroundColor: 'rgba(244,67,54,0.08)',
    borderColor: 'rgba(244,67,54,0.30)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compatibleTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  compatibleSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  incompatibleTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  reasonsList: {
    paddingLeft: 8,
    gap: 4,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.score.red,
    marginTop: 7,
  },
  reasonText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  moreText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.score.red,
    paddingLeft: 13,
    marginTop: 2,
  },
});
