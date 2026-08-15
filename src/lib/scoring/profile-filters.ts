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
 *
 * « Pas de blocker » ne suffit pas à affirmer un produit compatible : un
 * produit dont les allergènes n'ont pas pu être contrôlés (pas de liste
 * d'ingrédients, allergène inconnu du moteur) répond `isCompatible: true`
 * avec `verificationStatus: 'insufficient_data'`. Il sort du filtre « Ce que
 * je peux manger » — au doute, on exclut. La sémantique de `isCompatible`
 * (blockers.length === 0), consommée ailleurs, reste inchangée : l'exclusion
 * vit ici, dans le wrapper.
 */
export function isProductCompatible(
  product: Product | CosmeticProduct,
  scoringResult: ScoringResult | CosmeticScoringResult,
  profile: CompatibilityProfile
): boolean {
  const result = checkCompatibility(product, scoringResult, profile);
  return result.isCompatible && result.verificationStatus !== 'insufficient_data';
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
