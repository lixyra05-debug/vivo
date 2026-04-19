import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Flashlight,
  FlashlightOff,
  Hash,
  ScanLine,
} from 'lucide-react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Input } from '@/src/components/ui/Input';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { SearchNotFound } from '@/src/components/illustrations/SearchNotFound';
import { useToast } from '@/src/components/common/ToastProvider';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { Colors } from '@/src/constants/colors';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;
const FRAME_WIDTH = 280;
const FRAME_HEIGHT = 180;
const OVERLAY_COLOR = 'rgba(6, 10, 8, 0.55)';
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;
const CORNER_COLOR = '#CBE0CB';

export default function ScanScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(true);
  const [manual, setManual] = useState('');
  const [torch, setTorch] = useState(false);
  const lastScan = useRef<{ value: string; at: number } | null>(null);
  const reduceMotion = useReduceMotion();

  const pulse = useSharedValue(0.6);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => {
        setActive(false);
        setTorch(false);
      };
    }, []),
  );

  function handleBarcode({ data }: { data: string }) {
    if (!data) return;
    const now = Date.now();
    if (lastScan.current && lastScan.current.value === data && now - lastScan.current.at < 3000) {
      return;
    }
    lastScan.current = { value: data, at: now };
    setActive(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
    toast.show('Code-barres détecté — analyse en cours');
    router.push(`/product/${data}`);
  }

  function submitManual() {
    const code = manual.trim();
    if (!code) return;
    if (!/^\d{6,14}$/.test(code)) {
      Alert.alert('Code invalide', 'Saisis un code-barres EAN/UPC (6 à 14 chiffres).');
      return;
    }
    router.push(`/product/${code}`);
  }

  function toggleTorch() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    setTorch((t) => !t);
  }

  if (Platform.OS === 'web') {
    return (
      <ScreenContainer scroll>
        <View style={{ flex: 1, gap: 24, justifyContent: 'center' }}>
          <FadeIn delay={0}>
            <View style={{ alignItems: 'center', gap: 14 }}>
              <SearchNotFound size={132} />
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-Bold',
                  fontSize: 26,
                  color: Colors.text,
                  letterSpacing: -0.5,
                }}
              >
                Saisie manuelle
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: Colors.textMuted,
                  textAlign: 'center',
                  maxWidth: 280,
                  lineHeight: 22,
                }}
              >
                Le scanner caméra n'est pas disponible sur le web. Saisis un code-barres pour
                tester l'analyse.
              </Text>
            </View>
          </FadeIn>

          <FadeIn delay={140}>
            <GlassCard style={{ padding: 20 }}>
              <Input
                value={manual}
                onChangeText={setManual}
                keyboardType="number-pad"
                placeholder="Ex : 5449000000996"
                leftIcon={<Hash size={18} color={Colors.textMuted} />}
                accessibilityLabel="Saisie manuelle du code-barres"
              />
            </GlassCard>
          </FadeIn>

          <FadeIn delay={260}>
            <PrimaryCTA
              label="Analyser"
              onPress={submitManual}
              icon={<ScanLine color="#FFFFFF" size={18} strokeWidth={2.2} />}
              accessibilityHint="Ouvre la fiche produit correspondant à ce code-barres"
            />
          </FadeIn>
        </View>
      </ScreenContainer>
    );
  }

  if (!permission) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, gap: 16, justifyContent: 'center' }}>
          <Skeleton height={300} radius={32} />
          <View style={{ gap: 10, alignItems: 'center' }}>
            <Skeleton width="55%" height={16} />
            <Skeleton width="35%" height={12} />
          </View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: Colors.textMuted,
              textAlign: 'center',
              marginTop: 12,
            }}
          >
            Initialisation de la caméra…
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          <FadeIn delay={0}>
            <View style={styles.permissionIconWrap}>
              <Camera color={Colors.sage} size={52} strokeWidth={1.8} />
            </View>
          </FadeIn>

          <FadeIn delay={140}>
            <View style={{ alignItems: 'center', gap: 10, maxWidth: 320 }}>
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-Bold',
                  fontSize: 26,
                  color: Colors.text,
                  textAlign: 'center',
                  letterSpacing: -0.5,
                }}
              >
                Accès à la caméra
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 15,
                  color: Colors.textMuted,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                Vivo a besoin de ta caméra pour lire les codes-barres de tes produits.
              </Text>
            </View>
          </FadeIn>

          <FadeIn delay={280} style={{ alignSelf: 'stretch' }}>
            <PrimaryCTA
              label="Autoriser la caméra"
              onPress={requestPermission}
              icon={<Camera color="#FFFFFF" size={18} strokeWidth={2.2} />}
              accessibilityHint="Ouvre le prompt de permission iOS ou Android"
            />
          </FadeIn>
        </View>
      </ScreenContainer>
    );
  }

  const frameTop = Math.max(0, (winH - FRAME_HEIGHT) / 2 - 40);
  const frameLeft = Math.max(0, (winW - FRAME_WIDTH) / 2);

  return (
    <View style={styles.cameraRoot} accessibilityLabel="Vue caméra scanner">
      {active ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
          onBarcodeScanned={handleBarcode}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      )}

      <View
        pointerEvents="none"
        style={[
          styles.overlay,
          { top: 0, left: 0, right: 0, height: frameTop },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.overlay,
          { top: frameTop + FRAME_HEIGHT, left: 0, right: 0, bottom: 0 },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.overlay,
          {
            top: frameTop,
            left: 0,
            width: frameLeft,
            height: FRAME_HEIGHT,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.overlay,
          {
            top: frameTop,
            right: 0,
            width: frameLeft,
            height: FRAME_HEIGHT,
          },
        ]}
      />

      <View
        pointerEvents="none"
        style={[
          styles.frameWrap,
          { top: frameTop, left: frameLeft, width: FRAME_WIDTH, height: FRAME_HEIGHT },
        ]}
        accessibilityLabel="Zone de scan du code-barres"
      >
        <Animated.View style={[styles.frameBorder, pulseStyle]} />
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      <View
        pointerEvents="none"
        style={[styles.hintWrap, { top: frameTop - 42 }]}
      >
        <Text style={styles.hintText}>Place le code-barres dans le cadre</Text>
      </View>

      <View style={[styles.torchWrap, { top: Math.max(insets.top, 16) + 8 }]}>
        <Pressable
          onPress={toggleTorch}
          accessibilityRole="button"
          accessibilityLabel={torch ? 'Éteindre le flash' : 'Allumer le flash'}
          accessibilityState={{ selected: torch }}
          style={({ pressed }) => [
            styles.torchButton,
            torch && styles.torchButtonActive,
            pressed && { opacity: 0.85 },
          ]}
        >
          {torch ? (
            <Flashlight color="#FBBF24" size={22} strokeWidth={2.2} fill="#FBBF24" />
          ) : (
            <FlashlightOff color="#FFFFFF" size={22} strokeWidth={2.2} />
          )}
        </Pressable>
      </View>

      <View style={[styles.manualWrap, { bottom: Math.max(insets.bottom, 12) + 12 }]}>
        <GlassCard style={styles.manualCard}>
          <Input
            value={manual}
            onChangeText={setManual}
            keyboardType="number-pad"
            placeholder="Code-barres (EAN / UPC)"
            leftIcon={<Hash size={18} color={Colors.textMuted} />}
            accessibilityLabel="Saisie manuelle du code-barres"
            returnKeyType="go"
            onSubmitEditing={submitManual}
          />
          <PrimaryCTA
            label="Analyser ce code"
            onPress={submitManual}
            icon={<ScanLine color="#FFFFFF" size={18} strokeWidth={2.2} />}
            accessibilityHint="Ouvre la fiche produit correspondant à ce code"
          />
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraRoot: { flex: 1, backgroundColor: '#000' },
  overlay: { position: 'absolute', backgroundColor: OVERLAY_COLOR },

  frameWrap: { position: 'absolute' },
  frameBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(203, 224, 203, 0.65)',
    borderRadius: 26,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 26,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 26,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 26,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 26,
  },

  hintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    fontSize: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
    letterSpacing: 0.2,
  },

  torchWrap: { position: 'absolute', right: 20 },
  torchButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchButtonActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    borderColor: 'rgba(251, 191, 36, 0.45)',
  },

  manualWrap: { position: 'absolute', left: 16, right: 16 },
  manualCard: { padding: 16, gap: 12 },

  permissionIconWrap: {
    width: 108,
    height: 108,
    borderRadius: 999,
    backgroundColor: '#E7EFE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C6D8C6',
  },
});
