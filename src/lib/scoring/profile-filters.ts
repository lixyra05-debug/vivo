import type {
  CompatibilityProfile,
  CosmeticProduct,
  CosmeticScoringResult,
  Product,
  ScoringResult,
} from '../api/types';
import { checkCompatibility } from './compatibility-engine';

/**
 * Wrapper booléen autour de `checkCompatibility` pour usage en filtre de liste
 * (ex. écran store/[slug]).
 */
export function isProductCompatible(
  product: Product | CosmeticProduct,
  scoringResult: ScoringResult | CosmeticScoringResult,
  profile: CompatibilityProfile
): boolean {
  return checkCompatibility(product, scoringResult, profile).isCompatible;
}

/**
 * Retourne uniquement les `labelFr` des incompatibilités, triés blockers en premier
 * (le tri est déjà appliqué par `checkCompatibility`).
 */
export function getIncompatibilityReasons(
  product: Product | CosmeticProduct,
  scoringResult: ScoringResult | CosmeticScoringResult,
  profile: CompatibilityProfile
): string[] {
  return checkCompatibility(product, scoringResult, profile).incompatibilities.map(
    (i) => i.labelFr
  );
}
