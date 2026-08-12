/**
 * RecipeTimer — minuteur countdown simple pour préparation de tisane / décoction.
 *
 * Comportement :
 *   • Affiche mm:ss restant.
 *   • "Lancer" → décompte. "Pause" → stop. "Réinitialiser" → reset à durationMinutes.
 *   • Auto-stop à 00:00.
 *
 * R9 : aucune nouvelle dep. Pas d'haptique vibration (lib non garantie).
 */

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pause, Play, RotateCcw } from 'lucide-react-native';
import { Colors } from '@/src/constants/colors';

interface RecipeTimerProps {
  durationMinutes: number;
}

function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RecipeTimer({ durationMinutes }: RecipeTimerProps) {
  const initialSeconds = Math.max(0, Math.floor(durationMinutes * 60));
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  function handleToggle() {
    if (secondsLeft === 0 && !running) {
      // tentative de relance après expiration : on remet la durée d'origine
      setSecondsLeft(initialSeconds);
      setRunning(true);
      return;
    }
    setRunning((r) => !r);
  }

  function handleReset() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setSecondsLeft(initialSeconds);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.timeDisplay} accessibilityLabel={`${formatMmSs(secondsLeft)} restants`}>
        {formatMmSs(secondsLeft)}
      </Text>
      <View style={styles.controlsRow}>
        <Pressable
          onPress={handleToggle}
          accessibilityRole="button"
          accessibilityLabel={running ? 'Mettre le timer en pause' : 'Lancer le timer'}
          style={({ pressed }) => [
            styles.btnPrimary,
            pressed && { opacity: 0.85 },
          ]}
        >
          {running ? (
            <Pause color="#FFFFFF" size={16} strokeWidth={2.4} />
          ) : (
            <Play color="#FFFFFF" size={16} strokeWidth={2.4} />
          )}
          <Text style={styles.btnPrimaryText}>
            {running ? 'Pause' : 'Lancer le timer'}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleReset}
          accessibilityRole="button"
          accessibilityLabel="Réinitialiser le timer"
          style={({ pressed }) => [
            styles.btnSecondary,
            pressed && { opacity: 0.85 },
          ]}
        >
          <RotateCcw color={Colors.sage} size={14} strokeWidth={2.4} />
          <Text style={styles.btnSecondaryText}>Réinitialiser</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeDisplay: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 48,
    color: Colors.text,
    letterSpacing: -1,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.sage,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
  },
  btnPrimaryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.12)',
  },
  btnSecondaryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.sageVivid,
    letterSpacing: 0.2,
  },
});
