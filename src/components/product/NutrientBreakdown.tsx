import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  convertToPortionValues,
  getNutrientThreshold,
  type NutrientValues,
} from '@/src/lib/scoring/display-helpers';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { NutrientBar } from '@/src/components/product/NutrientBar';
import { Colors } from '@/src/constants/colors';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

interface NutrientBreakdownProps {
  macros: NutrientValues;
  energyKcal?: number;
  portionGrams: number;
}

type Mode = 'per_100g' | 'per_portion';

interface NutrientRow {
  key: keyof NutrientValues;
  label: string;
  unit: string;
  max: number;
  forcedStatus?: 'good';
}

const ROWS: NutrientRow[] = [
  { key: 'energy', label: 'Énergie', unit: 'kcal', max: 500 },
  { key: 'sugars', label: 'Sucres', unit: 'g', max: 30 },
  { key: 'saturated_fat', label: 'Graisses sat.', unit: 'g', max: 10 },
  { key: 'salt', label: 'Sel', unit: 'g', max: 3 },
  { key: 'proteins', label: 'Protéines', unit: 'g', max: 25, forcedStatus: 'good' },
  { key: 'fiber', label: 'Fibres', unit: 'g', max: 15, forcedStatus: 'good' },
];

export function NutrientBreakdown({
  macros,
  energyKcal,
  portionGrams,
}: NutrientBreakdownProps) {
  const [mode, setMode] = useState<Mode>('per_100g');
  const [pill100Width, setPill100Width] = useState(0);
  const [pill100X, setPill100X] = useState(0);
  const [pillPortionWidth, setPillPortionWidth] = useState(0);
  const [pillPortionX, setPillPortionX] = useState(0);
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const reduceMotion = useReduceMotion();

  const valuesPer100g = useMemo<NutrientValues>(() => {
    return {
      ...macros,
      energy: energyKcal,
    };
  }, [macros, energyKcal]);

  const activeValues = useMemo<NutrientValues>(() => {
    if (mode === 'per_portion') {
      return convertToPortionValues(valuesPer100g, portionGrams);
    }
    return valuesPer100g;
  }, [mode, valuesPer100g, portionGrams]);

  const visibleRows = useMemo(() => {
    return ROWS.filter((row) => {
      const v = activeValues[row.key];
      return typeof v === 'number' && Number.isFinite(v);
    });
  }, [activeValues]);

  useEffect(() => {
    const targetLeft = mode === 'per_100g' ? pill100X : pillPortionX;
    const targetWidth = mode === 'per_100g' ? pill100Width : pillPortionWidth;
    if (targetWidth <= 0) return;
    if (reduceMotion) {
      indicatorLeft.value = targetLeft;
      indicatorWidth.value = targetWidth;
      return;
    }
    indicatorLeft.value = withSpring(targetLeft, { damping: 18, stiffness: 220 });
    indicatorWidth.value = withSpring(targetWidth, { damping: 18, stiffness: 220 });
  }, [
    mode,
    pill100X,
    pill100Width,
    pillPortionX,
    pillPortionWidth,
    reduceMotion,
    indicatorLeft,
    indicatorWidth,
  ]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorLeft.value,
    width: indicatorWidth.value,
  }));

  function handleSelect(next: Mode) {
    if (next === mode) return;
    setMode(next);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
  }

  function onPill100Layout(event: LayoutChangeEvent) {
    const { x, width } = event.nativeEvent.layout;
    setPill100X(x);
    setPill100Width(width);
  }

  function onPillPortionLayout(event: LayoutChangeEvent) {
    const { x, width } = event.nativeEvent.layout;
    setPillPortionX(x);
    setPillPortionWidth(width);
  }

  if (visibleRows.length === 0) {
    return null;
  }

  const subtitle =
    mode === 'per_100g'
      ? 'Pour 100g'
      : `Pour ${portionGrams}g (portion estimée)`;

  return (
    <GlassCard style={styles.card}>
      <View
        style={styles.root}
        accessibilityLabel="Valeurs nutritionnelles"
      >
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Valeurs nutritionnelles</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.pillContainer}>
          <Animated.View
            style={[styles.pillIndicator, indicatorStyle]}
            accessibilityElementsHidden
          />
          <Pressable
            onLayout={onPill100Layout}
            onPress={() => handleSelect('per_100g')}
            style={styles.pillButton}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'per_100g' }}
            accessibilityLabel="Afficher les valeurs pour 100 grammes"
          >
            <Text
              style={[
                styles.pillText,
                mode === 'per_100g' ? styles.pillTextActive : undefined,
              ]}
            >
              100g
            </Text>
          </Pressable>
          <Pressable
            onLayout={onPillPortionLayout}
            onPress={() => handleSelect('per_portion')}
            style={styles.pillButton}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'per_portion' }}
            accessibilityLabel="Afficher les valeurs par portion"
          >
            <Text
              style={[
                styles.pillText,
                mode === 'per_portion' ? styles.pillTextActive : undefined,
              ]}
            >
              Portion
            </Text>
          </Pressable>
        </View>

        <View style={styles.barsStack}>
          {visibleRows.map((row, index) => {
            const raw = activeValues[row.key];
            if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
            const status =
              row.forcedStatus ?? getNutrientThreshold(row.key, raw);
            return (
              <NutrientBar
                key={`${mode}-${row.key}`}
                label={row.label}
                value={raw}
                unit={row.unit}
                status={status}
                max={row.max}
                delay={index * 60}
              />
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  root: {
    gap: 14,
  },
  headerBlock: {
    gap: 2,
  },
  title: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  pillContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F3EC',
    borderRadius: 999,
    padding: 4,
  },
  pillIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    shadowColor: '#587858',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    zIndex: 1,
  },
  pillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
  pillTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.text,
  },
  barsStack: {
    gap: 14,
  },
});
