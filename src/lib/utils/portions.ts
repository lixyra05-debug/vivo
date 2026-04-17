export function parsePortionGrams(servingSize: string | null | undefined): number | null {
  if (!servingSize) return null;
  const match = servingSize.match(/([\d.,]+)\s*g/i);
  if (!match) return null;
  const value = parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export function macroChargeOnPortion(value100g: number, portionGrams: number): number {
  return (value100g / 100) * portionGrams;
}
