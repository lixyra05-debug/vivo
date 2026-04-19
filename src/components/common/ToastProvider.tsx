import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

type ToastVariant = 'info' | 'success' | 'error';

interface ToastState {
  message: string;
  variant: ToastVariant;
  key: number;
}

interface ToastContextValue {
  show: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
  success: () => {},
  error: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const AUTO_DISMISS_MS = 2800;

const VARIANT_STYLES: Record<
  ToastVariant,
  {
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
    iconColor: string;
    textColor: string;
  }
> = {
  info: {
    backgroundColor: Colors.text,
    iconColor: '#CBE0CB',
    textColor: '#FFFFFF',
  },
  success: {
    backgroundColor: '#587858',
    iconColor: '#E7EFE7',
    textColor: '#FFFFFF',
  },
  error: {
    backgroundColor: '#FDECEA',
    borderColor: 'rgba(244, 67, 54, 0.45)',
    borderWidth: 1,
    iconColor: Colors.score.red,
    textColor: '#8A1F15',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [toast, setToast] = useState<ToastState | null>(null);
  const translateY = useSharedValue(-40);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    cancelAnimation(translateY);
    cancelAnimation(opacity);
    if (reduceMotion) {
      opacity.value = withTiming(0, { duration: 140 }, (finished) => {
        if (finished) runOnJS(setToast)(null);
      });
    } else {
      translateY.value = withTiming(-40, { duration: 200, easing: Easing.in(Easing.ease) });
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setToast)(null);
      });
    }
  }, [clearTimer, opacity, reduceMotion, translateY]);

  const present = useCallback(
    (message: string, variant: ToastVariant) => {
      counterRef.current += 1;
      setToast({ message, variant, key: counterRef.current });
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      if (reduceMotion) {
        translateY.value = 0;
        opacity.value = withTiming(1, { duration: 160 });
      } else {
        translateY.value = -40;
        opacity.value = 0;
        translateY.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.9 });
        opacity.value = withTiming(1, { duration: 260 });
      }
      clearTimer();
      timerRef.current = setTimeout(hide, AUTO_DISMISS_MS);
    },
    [clearTimer, hide, opacity, reduceMotion, translateY],
  );

  const show = useCallback((msg: string) => present(msg, 'info'), [present]);
  const success = useCallback((msg: string) => present(msg, 'success'), [present]);
  const error = useCallback((msg: string) => present(msg, 'error'), [present]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const topOffset = insets.top + 12;

  return (
    <ToastContext.Provider value={{ show, success, error }}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.key}
          pointerEvents="box-none"
          style={[styles.wrapper, { top: topOffset }, animatedStyle]}
        >
          <Pressable
            onPress={hide}
            accessibilityRole={toast.variant === 'error' ? 'alert' : 'text'}
            accessibilityLiveRegion={toast.variant === 'error' ? 'assertive' : 'polite'}
            accessibilityLabel={toast.message}
            accessibilityHint="Appuyer pour fermer"
            style={[
              styles.toast,
              {
                backgroundColor: VARIANT_STYLES[toast.variant].backgroundColor,
                borderColor: VARIANT_STYLES[toast.variant].borderColor,
                borderWidth: VARIANT_STYLES[toast.variant].borderWidth ?? 0,
              },
            ]}
          >
            <View style={styles.iconWrap}>
              {toast.variant === 'success' ? (
                <CheckCircle2
                  color={VARIANT_STYLES.success.iconColor}
                  size={20}
                  strokeWidth={2.4}
                />
              ) : toast.variant === 'error' ? (
                <AlertCircle color={VARIANT_STYLES.error.iconColor} size={20} strokeWidth={2.4} />
              ) : (
                <Info color={VARIANT_STYLES.info.iconColor} size={20} strokeWidth={2.4} />
              )}
            </View>
            <Text
              numberOfLines={3}
              style={[styles.message, { color: VARIANT_STYLES[toast.variant].textColor }]}
            >
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
});
