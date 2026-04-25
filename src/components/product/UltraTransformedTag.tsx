import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, X } from 'lucide-react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';

const RED = Colors.score.red;

interface Props {
  novaGroup: number | null;
}

export function UltraTransformedTag({ novaGroup }: Props) {
  const [open, setOpen] = useState(false);

  if (novaGroup !== 4) return null;

  function openSheet() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    setOpen(true);
  }

  return (
    <>
      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel="Détails ultra-transformé"
        hitSlop={8}
        style={styles.chip}
      >
        <AlertTriangle color={RED} size={14} strokeWidth={2.4} />
        <Text style={styles.chipText}>Ultra-transformé (NOVA 4)</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Fermer"
        >
          <Pressable
            onPress={() => undefined}
            style={styles.sheetWrap}
            accessibilityViewIsModal
          >
            <GlassCard style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleRow}>
                  <AlertTriangle color={RED} size={16} strokeWidth={2.4} />
                  <Text style={styles.sheetTitle}>Ultra-transformé (NOVA 4)</Text>
                </View>
                <Pressable
                  onPress={() => setOpen(false)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                  style={styles.closeBtn}
                >
                  <X color={Colors.text} size={16} strokeWidth={2.2} />
                </Pressable>
              </View>
              <Text style={styles.body}>
                Ce produit est classé NOVA 4 (ultra-transformé). Il contient des ingrédients issus
                de procédés industriels (additifs, arômes, colorants) qu'on ne trouve pas dans une
                cuisine domestique.
              </Text>
              <Text style={styles.source}>
                Source : Classification NOVA — Monteiro et al., 2019
              </Text>
            </GlassCard>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    borderColor: 'rgba(244, 67, 54, 0.3)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: RED,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    padding: 18,
    borderRadius: 24,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sheetTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F3EC',
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  source: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
