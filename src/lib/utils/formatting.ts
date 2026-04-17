export function formatScore(score: number): string {
  return `${Math.round(score)}/100`;
}

export function formatGrams(grams: number): string {
  return `${grams.toFixed(1)} g`;
}
