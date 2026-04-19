interface UseStaggeredEntryOptions {
  count: number;
  baseDelay?: number;
  step?: number;
  cap?: number;
}

export function useStaggeredEntry({
  count,
  baseDelay = 0,
  step = 80,
  cap = 480,
}: UseStaggeredEntryOptions): number[] {
  return Array.from({ length: count }, (_, i) => Math.min(baseDelay + i * step, baseDelay + cap));
}
