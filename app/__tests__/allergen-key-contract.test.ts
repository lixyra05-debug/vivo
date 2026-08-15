/**
 * TEST DE FRONTIÈRE — le contrat de clés entre les écrans de profil et le
 * moteur de compatibilité. C'est cette frontière que 887 tests verts n'ont
 * jamais traversée : chaque côté était juste, leur contrat était faux.
 *
 * Couches TRAVERSÉES :
 *  1. La constante `ALLERGENS` exportée par les écrans RÉELS — importée
 *     directement depuis `app/onboarding/allergies.tsx` et
 *     `app/settings/health-profile.tsx`, jamais redéclarée ici. Si un écran
 *     change une clé, ce fichier tombe.
 *  2. `userProfileToCompatibilityProfile` (profile-adapter réel) — les
 *     allergies y transitent telles quelles depuis `user_profiles`.
 *  3. `checkCompatibility` (moteur réel) — résolution `ALLERGEN_KEYWORDS`.
 *
 * Couches NON traversées :
 *  - Le round-trip Supabase (`user_profiles` est simulé par un littéral
 *    `UserProfileRow`) — la persistance elle-même n'est PAS couverte.
 *  - Le rendu React des écrans (TappableChip, onPress) — on importe la
 *    constante, pas l'arbre rendu ; le câblage chip→store n'est PAS couvert.
 *  - Le Mode Famille (`app/family/edit.tsx` garde sa liste locale non
 *    exportée — à raccorder ici si elle est exportée un jour).
 *
 * Barrière de score inerte par construction : l'adapter pose `minScore: 50`
 * et la fixture de scoring `score_final: 80` — si un test tombe, c'est par le
 * chemin allergie/vérification, jamais par le score.
 */
import { ALLERGENS as ONBOARDING_ALLERGENS } from '../onboarding/allergies';
import { ALLERGENS as SETTINGS_ALLERGENS } from '../settings/health-profile';
import { userProfileToCompatibilityProfile } from '@/src/lib/scoring/profile-adapter';
import {
  checkCompatibility,
  normalizeAllergenKey,
} from '@/src/lib/scoring/compatibility-engine';
import type { Product, ScoringResult, UserProfileRow } from '@/src/lib/api/types';

function makeProduct(ingredients: string | null): Product {
  return {
    barcode: '0000000000001',
    name: 'Produit test',
    brand: 'Test',
    image_url: null,
    ingredients_raw: ingredients,
    additives_tags: [],
    nova_group: 1,
    nutriscore_grade: null,
    energy_kcal_100g: null,
    sugars_100g: 0,
    saturated_fat_100g: 0,
    salt_100g: 0,
    proteins_100g: 0,
    fiber_100g: 0,
    oil_types: [],
    portion_grams: 100,
    packaging_material: null,
    is_organic: false,
    off_last_updated: null,
    our_score: null,
    our_score_computed_at: null,
    scan_count: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };
}

const scoring: ScoringResult = {
  score_final: 80,
  score_color: 'green',
  nova_group: 1,
  penalties: [],
  blockers: [],
  seed_oils_detected: [],
  clean_labeling_alerts: [],
  profile_adjustments: [],
};

function makeUserRow(allergies: string[]): UserProfileRow {
  return {
    id: 'user-1',
    display_name: null,
    health_profile: 'standard',
    allergies,
    intolerances: [],
    preferred_portion_size: 'standard',
    subscription_tier: 'free',
    subscription_expires_at: null,
    scan_count: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };
}

function allergyBlockers(res: ReturnType<typeof checkCompatibility>) {
  return res.incompatibilities.filter(
    (i) => i.type === 'allergy' && i.severity === 'blocker',
  );
}

/** Un ingrédient déclencheur par clé écran (forme exacte d'un mot-clé moteur). */
const TRIGGER_INGREDIENT: Record<string, string> = {
  gluten: 'farine, blé, sel',
  lactose: 'lait écrémé, sucre',
  arachides: 'cacahuète grillée',
  fruits_a_coque: 'pâte d\'amande, sucre',
  oeufs: 'oeuf entier, sel',
  soja: 'eau, soja, sel',
};

describe('contrat écrans ↔ moteur — les deux listes', () => {
  it('les deux écrans exposent exactement la même liste (aucune dérive)', () => {
    expect(ONBOARDING_ALLERGENS).toEqual(SETTINGS_ALLERGENS);
  });

  it('chaque option porte une clé canonique (normalizeAllergenKey est un no-op dessus)', () => {
    for (const opt of ONBOARDING_ALLERGENS) {
      expect(normalizeAllergenKey(opt.key)).toBe(opt.key);
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });
});

describe('contrat écrans ↔ moteur — chaque clé traverse adapter puis moteur', () => {
  const keys = ONBOARDING_ALLERGENS.map((o) => o.key);

  it.each(keys)(
    'la clé écran « %s » est RÉSOLUE par le moteur (verified, pas insufficient_data)',
    (key) => {
      const compat = userProfileToCompatibilityProfile(makeUserRow([key]));
      expect(compat).not.toBeNull();
      // Produit avec liste d'ingrédients sans allergène : si la clé était
      // inconnue du moteur, la vérification n'aurait pas lieu et le statut
      // serait 'insufficient_data'. C'est CE test qui tombe si un écran
      // stocke autre chose qu'une clé moteur.
      const res = checkCompatibility(makeProduct('eau, sel'), scoring, compat!);
      expect(res.verificationStatus).toBe('verified');
      expect(res.isCompatible).toBe(true);
    },
  );

  it.each(keys)(
    'un profil déclarant « %s » bloque un produit qui en contient',
    (key) => {
      const trigger = TRIGGER_INGREDIENT[key];
      expect(trigger).toBeDefined();
      const compat = userProfileToCompatibilityProfile(makeUserRow([key]));
      const res = checkCompatibility(makeProduct(trigger), scoring, compat!);
      expect(allergyBlockers(res)).toHaveLength(1);
      expect(res.isCompatible).toBe(false);
    },
  );
});

/**
 * PROFILS « ANCIEN FORMAT » — NE PAS retirer `normalizeAllergenKey` du moteur.
 *
 * Les lignes `user_profiles` créées AVANT l'alignement des écrans (août 2026)
 * stockent des LIBELLÉS d'affichage (« Gluten », « Œufs », « Fruits à coque »)
 * et ne seront jamais réécrites en masse. Depuis l'alignement, les écrans
 * émettent des clés : la normalisation défensive du moteur devient invisible
 * sur les nouveaux profils — elle n'en reste pas moins la SEULE protection
 * des anciens. La supprimer comme « code mort » ferait perdre leurs alertes
 * allergènes à ces utilisateurs, sans aucun symptôme visible.
 */
describe('profils ancien format (libellés) — toujours protégés après l\'alignement', () => {
  it('[\'Gluten\'] bloque toujours un produit au blé', () => {
    const compat = userProfileToCompatibilityProfile(makeUserRow(['Gluten']));
    const res = checkCompatibility(makeProduct('farine, blé, sel'), scoring, compat!);
    expect(allergyBlockers(res)).toHaveLength(1);
  });

  it('[\'Œufs\'] (ligature œ) bloque toujours un produit à l\'oeuf', () => {
    const compat = userProfileToCompatibilityProfile(makeUserRow(['Œufs']));
    const res = checkCompatibility(makeProduct('oeuf entier, sel'), scoring, compat!);
    expect(allergyBlockers(res)).toHaveLength(1);
  });

  it('[\'Fruits à coque\'] bloque toujours un produit aux amandes', () => {
    const compat = userProfileToCompatibilityProfile(makeUserRow(['Fruits à coque']));
    const res = checkCompatibility(makeProduct('pâte d\'amande, sucre'), scoring, compat!);
    expect(allergyBlockers(res)).toHaveLength(1);
  });
});
