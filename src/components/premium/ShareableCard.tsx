/**
 * ShareableCard — wrapper réutilisable qui capture ses enfants en PNG via
 * react-native-view-shot puis ouvre la feuille de partage native via expo-sharing.
 *
 * Usage typique : enrouler une carte visuelle (ScanChocCard, RecapCard, etc.)
 * pour proposer un bouton "Partager" en dessous.
 *
 * Note : non testé en jest car react-native-view-shot a un binding natif
 * non disponible dans l'environnement Hermes/jest. Les composants enfants
 * doivent être testés indépendamment.
 */

import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Share2 } from 'lucide-react-native';
import { Colors } from '@/src/constants/colors';

export interface ShareableCardProps {
  children: ReactNode;
  filename: string;
  buttonLabel?: string;
}

export function ShareableCard({
  children,
  filename,
  buttonLabel = 'Partager',
}: ShareableCardProps) {
  const viewRef = useRef<ViewShot | null>(null);

  async function handleShare() {
    if (!viewRef.current) return;
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        fileName: filename,
      });
      const available = await Sharing.isAvailableAsync();
      if (!available) return;
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: buttonLabel,
      });
    } catch {
      // Silently swallow capture/share errors — UX préserve l'écran sans crash
    }
  }

  return (
    <View style={styles.wrapper}>
      <ViewShot ref={viewRef} style={styles.captureWrap}>
        {children}
      </ViewShot>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        onPress={handleShare}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
      >
        <Share2 color="#FFFFFF" size={18} strokeWidth={2.4} />
        <Text style={styles.buttonLabel}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
    width: '100%',
  },
  captureWrap: {
    width: '100%',
  },
  button: {
    width: '100%',
    backgroundColor: Colors.sage,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
