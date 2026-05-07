/**
 * ProtocolCard — carte d'un protocole 21j dans la liste.
 *
 * États visuels :
 *   • Default     : GlassCard standard, sous-titre court
 *   • isActive    : border 2px sage, badge "EN COURS", barre de progression
 *   • isDisabled  : opacity 0.4, sous-titre "Termine ton protocole en cours"
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import type { Protocol } from '@/src/data/protocols';
import type { ProtocolProgress } from '@/src/lib/protocols/protocol-progress';

export interface ProtocolCardProps {
  protocol: Protocol;
  isActive?: boolean;
  isDisabled?: boolean;
  progress?: ProtocolProgress | null;
  onPress: () => void;
}

export function ProtocolCard({
  protocol,
  isActive = false,
  isDisabled = false,
  progress,
  onPress,
}: ProtocolCardProps) {
  const a11y = `${protocol.titleFr}, ${protocol.descriptionFr}`;
  const showProgress = isActive && progress != null;
  const progressPct = showProgress
    ? Math.max(0, Math.min(100, (progress!.currentDay / 21) * 100))
    : 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabledOuter,
      ]}
    >
      <GlassCard
        style={[
          styles.card,
          isActive ? styles.cardActive : null,
        ]}
      >
        {isActive ? (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>EN COURS</Text>
          </View>
        ) : null}

        <View style={styles.headerRow}>
          <Text style={styles.emoji}>{protocol.emoji}</Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.title} numberOfLines={1}>
              {protocol.titleFr}
            </Text>
            {isDisabled ? (
              <Text style={styles.disabledText} numberOfLines={2}>
                Termine ton protocole en cours
              </Text>
            ) : (
              <Text style={styles.description} numberOfLines={2}>
                {protocol.descriptionFr}
              </Text>
            )}
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>21 jours</Text>
          </View>
        </View>

        {showProgress ? (
          <View style={{ gap: 6, marginTop: 4 }}>
            <View style={styles.progressOuter}>
              <View
                style={[styles.progressInner, { width: `${progressPct}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              Jour {progress!.currentDay}/21
            </Text>
          </View>
        ) : null}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  disabledOuter: {
    opacity: 0.4,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    gap: 10,
    position: 'relative',
  },
  cardActive: {
    borderColor: Colors.sage,
    borderWidth: 2,
    backgroundColor: 'rgba(139, 173, 139, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 40,
    lineHeight: 46,
  },
  title: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 17,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  disabledText: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  chip: {
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.sage,
    letterSpacing: 0.2,
  },
  activeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.earth,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    zIndex: 1,
  },
  activeBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  progressOuter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    backgroundColor: Colors.sage,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.sage,
  },
});
