/**
 * S3-3 — un cosmétique dont aucun ingrédient n'a été évalué n'est pas vérifié.
 *
 * `calculateCosmeticScore` part de 100 et ne retire que ce que la base INCI
 * reconnaît : une liste absente, vide, ou faite de noms inconnus laisse 100.
 * Ce statut le dit À CÔTÉ de la note, comme `verificationStatus` à côté de
 * `isCompatible` (D11), sans toucher au moteur.
 */
import { getCosmeticVerificationStatus } from '../cosmetic-verification';
import { calculateCosmeticScore } from '../cosmetic-engine';
import { checkCompatibility } from '../compatibility-engine';
import { cosmeticToScoringInput, normalizeOBFProduct } from '../../api/openbeautyfacts';
import type { CompatibilityProfile, CosmeticProduct } from '../../api/types';

/** Le produit tel que l'app le construit : réponse OBF → `normalizeOBFProduct`. */
function depuisObf(inci: string | undefined): CosmeticProduct {
  return normalizeOBFProduct({ code: '3401520107313', ingredients_text: inci });
}

/** Une ligne de cache telle que Supabase peut la rendre, types contournés. */
function ligneDeCache(inci: unknown, list: unknown): CosmeticProduct {
  return {
    ...depuisObf(undefined),
    ingredients_inci: inci as string,
    ingredients_list: list as string[],
  };
}

// [cas, texte INCI tel qu'OBF le livre]
const NON_EVALUEES: ReadonlyArray<[string, string | undefined]> = [
  ['absente de la réponse OBF', undefined],
  ['vide', ''],
  ['blanche', '   '],
  ['faite de séparateurs', ',,;'],
  ['aux noms non reconnus', 'AQUA (WATER), PARFUM (FRAGRANCE)'],
  ['remplacée par un texte marketing', 'Un soin doux pour toute la famille'],
];

const EVALUEES: ReadonlyArray<[string, string]> = [
  ['reconnue', 'Aqua, Glycerin, Sodium Laureth Sulfate'],
  // Un seul nom reconnu suffit : le moteur a bien évalué quelque chose.
  ['reconnue en partie', 'Aqua (Water), Glycerin'],
];

describe('S3-3 — getCosmeticVerificationStatus', () => {
  it.each(NON_EVALUEES)('liste %s → insufficient_data', (_cas, inci) => {
    expect(getCosmeticVerificationStatus(depuisObf(inci))).toBe('insufficient_data');
  });

  it.each(EVALUEES)('liste %s → verified', (_cas, inci) => {
    expect(getCosmeticVerificationStatus(depuisObf(inci))).toBe('verified');
  });

  it('colonnes nulles ou absentes en cache (migration 008) → insufficient_data, sans lever', () => {
    expect(getCosmeticVerificationStatus(ligneDeCache(null, null))).toBe('insufficient_data');
    expect(getCosmeticVerificationStatus(ligneDeCache(undefined, undefined))).toBe(
      'insufficient_data',
    );
  });

  it('texte présent mais liste nulle : le moteur ne lit que la liste → insufficient_data', () => {
    expect(getCosmeticVerificationStatus(ligneDeCache('Aqua, Glycerin', null))).toBe(
      'insufficient_data',
    );
  });

  it('texte vide : insufficient_data même si une liste traîne — jamais moins prudent que D11', () => {
    expect(getCosmeticVerificationStatus(ligneDeCache('', ['glycerin']))).toBe(
      'insufficient_data',
    );
  });

  it('ignore les entrées non textuelles d’une liste corrompue', () => {
    expect(getCosmeticVerificationStatus(ligneDeCache('Glycerin', [42, null]))).toBe(
      'insufficient_data',
    );
    expect(getCosmeticVerificationStatus(ligneDeCache('Glycerin', [42, null, 'glycerin']))).toBe(
      'verified',
    );
  });

  it.each(NON_EVALUEES)(
    'liste %s : le statut dit ce que le moteur a lu — rien, d’où un 100 sans aucun relevé',
    (_cas, inci) => {
      const result = calculateCosmeticScore(cosmeticToScoringInput(depuisObf(inci)), 'standard');
      expect([result.score_final, result.penalties, result.risky_ingredients]).toEqual([
        100,
        [],
        [],
      ]);
    },
  );

  it('jamais moins prudent que D11 : quand la compatibilité ne lit pas la liste, ce statut non plus', () => {
    const allergique: CompatibilityProfile = {
      allergies: ['gluten'],
      dietary: [],
      conditions: [],
      avoid: [],
      minScore: 50,
    };
    for (const product of [
      depuisObf(''),
      depuisObf('   '),
      ligneDeCache(null, null),
      ligneDeCache(undefined, undefined),
    ]) {
      const result = calculateCosmeticScore(cosmeticToScoringInput(product), 'standard');
      expect(checkCompatibility(product, result, allergique).verificationStatus).toBe(
        'insufficient_data',
      );
      expect(getCosmeticVerificationStatus(product)).toBe('insufficient_data');
    }
  });
});
