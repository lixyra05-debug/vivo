/**
 * ScoreCircle — le nombre central de l'app.
 *
 * Deux corrections de cohérence :
 *
 * 1. Le score est NOMMÉ. Il ne mesurait rien d'explicite : « 100 » et « / 100 »
 *    se lisaient comme un verdict global alors que le moteur ne pesait que la
 *    formulation — une fiche pouvait afficher 100/100 juste au-dessus d'une
 *    section sur l'emballage, deux affirmations vraies qui se contredisent.
 *
 *    L'emballage entre désormais DANS la note (cf. `composite-score.ts`), et le
 *    libellé par défaut le dit. La fiche cosmétique, dont le score reste
 *    strictement la formulation, passe explicitement `label` pour ne pas
 *    hériter d'une promesse que son moteur ne tient pas.
 *
 * 2. Le libellé lu par les lecteurs d'écran vient de `getScoreVerdict`, source
 *    unique du verdict. Il était calculé par une table locale décalée d'un
 *    cran : un 95 s'annonçait « Bon » à l'oral alors que l'écran affichait
 *    « Excellent », et un 10 s'annonçait « Danger » là où l'écran disait
 *    « À éviter ».
 */

import { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { scoreColor } from '@/src/constants/colors';
import { Palette, Spacing, Type } from '@/src/constants/theme';
import { getScoreVerdict } from '@/src/lib/scoring/display-helpers';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  /** Ce que le score mesure. Optionnel : la valeur par défaut couvre les deux fiches. */
  label?: string;
}

export const SCORE_LABEL_DEFAULT = 'Note globale';

/** Pour les fiches dont le score ne pèse QUE la formulation (cosmétique). */
export const SCORE_LABEL_FORMULATION = 'Qualité de la formulation';

export function ScoreCircle({
  score,
  size = 160,
  strokeWidth = 12,
  label = SCORE_LABEL_DEFAULT,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = scoreColor(clamped);
  const verdictLabel = getScoreVerdict(clamped).label;
  const progress = useSharedValue(0);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    const target = clamped / 100;
    // Accessibilité : respecte la préférence "Réduire les animations" iOS/Android.
    if (reduceMotion) {
      progress.value = target;
      return;
    }
    progress.value = withTiming(target, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, progress, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
      accessibilityRole="text"
      accessibilityLabel={`${label} : ${clamped} sur 100. ${verdictLabel}.`}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          // Dernier hex du fichier (= `Palette.borderSoft`). Le remplacer sort
          // ce fichier de l'allowlist de `theme-guard.test.ts` : les deux
          // changements doivent aller dans le même commit. Backlog phase 2.
          stroke="#E7E7DA"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>
      <View
        className="absolute inset-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Text
          className="font-display text-5xl font-bold"
          style={{ color }}
          accessibilityElementsHidden
        >
          {clamped}
        </Text>
        <Text className="text-xs uppercase tracking-wider text-sage-700" accessibilityElementsHidden>
          / 100
        </Text>
        {/* Borné en largeur : le libellé doit tenir dans l'anneau, pas le déborder. */}
        <Text
          style={[styles.label, { maxWidth: size * 0.66 }]}
          numberOfLines={2}
          accessibilityElementsHidden
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...Type.micro,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
