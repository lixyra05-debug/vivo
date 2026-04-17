export const Colors = {
  sage: '#8BAD8B',
  cream: '#FAFAF7',
  earth: '#C4A882',
  text: '#2B3E2B',
  textMuted: '#587858',
  border: '#E7E7DA',
  score: {
    green: '#4CAF50',
    yellow: '#FFC107',
    orange: '#FF9800',
    red: '#F44336',
  },
} as const;

export function scoreColor(score: number): string {
  if (score >= 70) return Colors.score.green;
  if (score >= 50) return Colors.score.yellow;
  if (score >= 25) return Colors.score.orange;
  return Colors.score.red;
}
