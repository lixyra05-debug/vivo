/**
 * S3-3 — un cosmétique dont aucun ingrédient n'a été évalué n'est pas vérifié.
 *
 * `calculateCosmeticScore` part de 100 et ne retire que les pénalités des
 * ingrédients que la base INCI reconnaît. Une liste absente, vide, ou faite de
 * noms inconnus (« AQUA (WATER) », un texte marketing) laisse donc 100 — vert,
 * « Excellent », « Formule propre » : un verdict tiré d'une absence de donnée.
 *
 * Le moteur n'est PAS modifié : ce statut voyage À CÔTÉ de la note, comme
 * `verificationStatus` à côté de `isCompatible` (D11). Il relit la liste avec
 * la même résolution que le moteur (`findCosmeticIngredient`), donc ne peut
 * pas dire « vérifié » quand le moteur n'a rien reconnu.
 */
import type { CosmeticProduct } from '../api/types';
import { findCosmeticIngredient } from './cosmetic-ingredients-db';

export type CosmeticVerificationStatus = 'verified' | 'insufficient_data';

export function getCosmeticVerificationStatus(
  product: Pick<CosmeticProduct, 'ingredients_inci' | 'ingredients_list'>,
): CosmeticVerificationStatus {
  // Jamais moins prudent que D11 : là où `checkCompatibility` ne trouve pas de
  // texte à lire, il n'y a rien de vérifié ici non plus.
  const text = typeof product.ingredients_inci === 'string' ? product.ingredients_inci.trim() : '';
  if (text.length === 0) return 'insufficient_data';

  // Le moteur ne note que `ingredients_list`. Le cache Supabase peut la rendre
  // `null` malgré le type (colonne nullable, migration 008) : le moteur lit
  // alors une liste vide, et ce statut aussi.
  const tokens: unknown[] = Array.isArray(product.ingredients_list)
    ? product.ingredients_list
    : [];
  const recognized = tokens.some(
    (token) => typeof token === 'string' && findCosmeticIngredient(token) !== null,
  );
  return recognized ? 'verified' : 'insufficient_data';
}
