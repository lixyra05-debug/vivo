/**
 * Écran loader OCR — analyse de l'image d'étiquette.
 *
 * Flow :
 *   1. Récupère imageBase64 + mimeType depuis useOcrSessionStore
 *   2. Si tier='free' → vérifie le quota OCR (3/jour). Si dépassé → Alert.
 *   3. Sinon, appelle analyzeIngredientImage()
 *   4. Si succès → consume du quota free + store le result + replace /ocr/result
 *   5. Si erreur → affiche un état d'erreur localisé FR avec boutons
 */

import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  Leaf,
  RotateCcw,
} from 'lucide-react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useOcrSessionStore } from '@/src/lib/stores/useOcrSessionStore';
import { usePremium } from '@/src/lib/hooks/usePremium';
import {
  consumeOcrScan,
  getOcrLimitStatus,
} from '@/src/lib/ocr/ocr-limit';
import { analyzeIngredientImage } from '@/src/lib/api/ocr-scan';
import type {
  OcrAnalysisError,
  OcrErrorCode,
} from '@/src/types/ocr-analysis';

const PROGRESS_MESSAGES: ReadonlyArray<{ delay: number; text: string }> = [
  { delay: 0, text: 'Lecture des ingrédients…' },
  { delay: 2000, text: 'Analyse des additifs…' },
  { delay: 4000, text: 'Évaluation toxicologique…' },
  { delay: 6000, text: 'Encore quelques secondes…' },
];

const ERROR_TEXT: Record<OcrErrorCode, string> = {
  unreadable:
    "L'image n'est pas assez lisible. Reprends une photo bien cadrée et nette.",
  not_ingredients:
    "Cette photo ne semble pas contenir une liste d'ingrédients.",
  rate_limited: 'Trop de scans simultanés. Réessaie dans quelques secondes.',
  network: 'Pas de connexion internet.',
  timeout: "L'analyse prend trop de temps. Réessaie.",
  server_error: 'Le serveur a rencontré une erreur. Réessaie plus tard.',
  invalid_request: "Le format de l'image n'est pas pris en charge.",
};

export default function OcrAnalyzingScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { tier } = usePremium(user?.id ?? null);
  const reduceMotion = useReduceMotion();

  const imageBase64 = useOcrSessionStore((s) => s.imageBase64);
  const mimeType = useOcrSessionStore((s) => s.mimeType);
  const setResult = useOcrSessionStore((s) => s.setResult);

  const [progressIndex, setProgressIndex] = useState(0);
  const [error, setError] = useState<OcrAnalysisError | null>(null);

  const pulse = useSharedValue(1);

  // Pulse animation
  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Progressive messages
  useEffect(() => {
    if (error) return;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    PROGRESS_MESSAGES.forEach((msg, idx) => {
      if (idx === 0) return;
      const t = setTimeout(() => setProgressIndex(idx), msg.delay);
      timeouts.push(t);
    });
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [error]);

  // Main analyze flow
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!imageBase64 || !mimeType) {
        router.replace('/(tabs)/scan');
        return;
      }

      // Free tier quota check
      if (tier === 'free') {
        const status = await getOcrLimitStatus();
        if (cancelled) return;
        if (status.reachedLimit) {
          Alert.alert(
            'Limite quotidienne atteinte',
            'Tu as utilisé tes 3 scans gratuits aujourd\'hui. Reviens demain ou passe Premium pour des scans illimités.',
            [
              {
                text: 'Plus tard',
                style: 'cancel',
                onPress: () => router.back(),
              },
              {
                text: 'Voir Premium',
                onPress: () => router.push('/settings/subscription'),
              },
            ],
          );
          return;
        }
      }

      const response = await analyzeIngredientImage({ imageBase64, mimeType });
      if (cancelled) return;

      if (response.ok) {
        if (tier === 'free') {
          await consumeOcrScan();
        }
        if (cancelled) return;
        setResult(response.data);
        router.replace('/ocr/result');
        return;
      }

      setError(response.error);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [imageBase64, mimeType, tier, router, setResult]);

  function handleRetake() {
    router.replace('/(tabs)/scan');
  }

  function handleBack() {
    router.back();
  }

  if (error) {
    return (
      <ScreenContainer scroll>
        <View style={styles.errorWrap}>
          <FadeIn delay={0}>
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={({ pressed }) => [
                styles.headerBack,
                pressed && { opacity: 0.7 },
              ]}
            >
              <ChevronLeft color={Colors.text} size={26} strokeWidth={2.4} />
            </Pressable>
          </FadeIn>

          <FadeIn delay={80}>
            <View style={styles.errorIconWrap}>
              <AlertTriangle color="#FF9800" size={44} strokeWidth={2} />
            </View>
          </FadeIn>

          <FadeIn delay={160}>
            <Text style={styles.errorTitle}>Analyse impossible</Text>
          </FadeIn>

          <FadeIn delay={240}>
            <GlassCard style={styles.errorCard}>
              <Text style={styles.errorText}>{ERROR_TEXT[error.code]}</Text>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={320} style={styles.actionsWrap}>
            <PrimaryCTA
              label="Reprendre une photo"
              onPress={handleRetake}
              icon={<Camera color="#FFFFFF" size={18} strokeWidth={2.2} />}
              accessibilityHint="Retour à l'écran de scan"
            />
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <RotateCcw color={Colors.sage} size={18} strokeWidth={2.2} />
              <Text style={styles.secondaryBtnText}>Retour</Text>
            </Pressable>
          </FadeIn>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.loaderWrap}>
        <FadeIn delay={0}>
          <Animated.View style={[styles.iconWrap, pulseStyle]}>
            <Leaf color={Colors.sage} size={64} strokeWidth={1.8} />
          </Animated.View>
        </FadeIn>

        <FadeIn delay={140}>
          <Text style={styles.loaderText}>
            {PROGRESS_MESSAGES[progressIndex]?.text ?? PROGRESS_MESSAGES[0].text}
          </Text>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 24,
  },

  errorWrap: {
    flex: 1,
    gap: 18,
  },
  headerBack: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 152, 0, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 24,
  },
  errorTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 24,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  errorCard: {
    padding: 18,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    textAlign: 'center',
  },
  actionsWrap: {
    gap: 12,
    marginTop: 12,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: Colors.sage,
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.sage,
    letterSpacing: 0.2,
  },
});
