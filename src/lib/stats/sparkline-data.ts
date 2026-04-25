/**
 * Génération des données pour les sparklines (mini-graphiques de tendance).
 */

const SPARKLINE_COLOR_POSITIVE = '#8BAD8B'; // sage : tendance à la hausse
const SPARKLINE_COLOR_NEGATIVE = '#FF9800'; // orange : tendance à la baisse
const SPARKLINE_COLOR_NEUTRAL = '#C4A882'; // terre : tendance plate

/**
 * Génère un tableau de `days` valeurs `avgScore` correspondant aux `days`
 * dernières entrées de `scansByDay`. Si `scansByDay` est plus court que
 * `days`, on padde le début avec des zéros.
 */
export function generateSparklinePoints(
  scansByDay: Array<{ date: string; avgScore: number }>,
  days: number
): number[] {
  const lastDays = scansByDay.slice(-days);
  const padding = days - lastDays.length;
  if (padding <= 0) {
    return lastDays.map((d) => d.avgScore);
  }
  const padded: number[] = new Array(padding).fill(0);
  return padded.concat(lastDays.map((d) => d.avgScore));
}

/**
 * Détermine la couleur de la sparkline en fonction de la tendance.
 *
 * @param trend Différence entre la moyenne récente et la moyenne ancienne
 *              (typiquement avgScoreLast7 - avgScoreFirst7).
 *              - > +3 : tendance positive (sage)
 *              - < -3 : tendance négative (orange)
 *              - sinon : tendance plate (terre)
 */
export function generateSparklineColor(trend: number): string {
  if (trend > 3) {
    return SPARKLINE_COLOR_POSITIVE;
  }
  if (trend < -3) {
    return SPARKLINE_COLOR_NEGATIVE;
  }
  return SPARKLINE_COLOR_NEUTRAL;
}
