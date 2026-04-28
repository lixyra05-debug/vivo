/**
 * useAlternatives — hook React qui charge les alternatives Open Food Facts
 * pour un produit scanné, avec gestion du loading et cancellation.
 *
 * Encapsule l'appel à findAlternatives pour éviter de polluer FoodProductView
 * avec un useState/useEffect.
 */

import { useEffect, useState } from 'react';
import { findAlternatives, type Alternative } from './smart-alternatives';

interface UseAlternativesResult {
  alternatives: Alternative[];
  isLoading: boolean;
}

export function useAlternatives(
  barcode: string,
  categoriesTags: string[],
  currentScore: number,
): UseAlternativesResult {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!barcode || categoriesTags.length === 0) {
      setAlternatives([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    findAlternatives(barcode, categoriesTags, currentScore)
      .then((res) => {
        if (cancelled) return;
        setAlternatives(res);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setAlternatives([]);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [barcode, categoriesTags, currentScore]);

  return { alternatives, isLoading };
}
