/**
 * EducationalCard — affiche une carte éducative scientifique sourcée.
 *
 * Bordure gauche colorée selon tone (informative/positive/warning),
 * header avec icône Lucide, body, source tappable, bouton "×" optionnel.
 */

import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, BookOpen, Sparkles, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import type { EducationalCard as EducationalCardData, EducationalTone } from '@/src/lib/gamification/types';

interface EducationalCardProps {
  card: EducationalCardData;
  onDismiss?: () => void;
  onSourcePress?: (url: string) => void;
}

const ICON_BY_TONE: Record<EducationalTone, LucideIcon> = {
  informative: BookOpen,
  positive: Sparkles,
  warning: AlertCircle,
};

const COLOR_BY_TONE: Record<EducationalTone, string> = {
  informative: Colors.sage,
  positive: Colors.score.green,
  warning: Colors.earth,
};

export function EducationalCard({ card, onDismiss, onSourcePress }: EducationalCardProps) {
  const Icon = ICON_BY_TONE[card.tone];
  const accentColor = COLOR_BY_TONE[card.tone];

  function handleSourcePress() {
    if (onSourcePress) {
      onSourcePress(card.sourceUrl);
      return;
    }
    if (Platform.OS === 'web') {
      // pas de browser natif sur web
      return;
    }
    WebBrowser.openBrowserAsync(card.sourceUrl).catch(() => undefined);
  }

  return (
    <GlassCard
      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: accentColor }]}
    >
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Fermer cette carte"
          style={styles.closeBtn}
        >
          <X color={Colors.textMuted} size={14} strokeWidth={2.4} />
        </Pressable>
      ) : null}
      <View style={styles.header}>
        <Icon color={accentColor} size={18} strokeWidth={2.2} />
        <Text style={styles.title} numberOfLines={2}>
          {card.titleFr}
        </Text>
      </View>
      <Text style={styles.body}>{card.bodyFr}</Text>
      <Pressable
        onPress={handleSourcePress}
        accessibilityRole="link"
        accessibilityLabel={`Voir la source ${card.source}`}
      >
        <Text style={styles.source}>Source : {card.source}</Text>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 8,
    paddingRight: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  source: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#A8B5A8',
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
