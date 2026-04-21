export type HealthProfile =
  | 'standard'
  | 'diabetic'
  | 'athlete'
  | 'child'
  | 'pregnant'
  | 'intolerant';

export type ScoreColor = 'green' | 'yellow' | 'orange' | 'red';

export interface Macros100g {
  sugars: number;
  saturated_fat: number;
  salt: number;
  proteins: number;
  fiber: number;
}

export interface ScoringInput {
  barcode: string;
  ingredients_raw: string;
  additives_tags: string[];
  nova_group: 1 | 2 | 3 | 4;
  macros_100g: Macros100g;
  portion_grams: number;
  oil_types: string[];
  is_organic: boolean;
  packaging_material?: string;
}

export interface UserProfile {
  type: HealthProfile;
  allergies: string[];
  intolerances: string[];
}

export interface PenaltyDetail {
  code: string;
  label: string;
  points: number;
  category: 'nova' | 'additive' | 'macro' | 'seed_oil' | 'clean_labeling' | 'profile';
}

export interface ScoringResult {
  score_final: number;
  score_color: ScoreColor;
  nova_group: number;
  penalties: PenaltyDetail[];
  blockers: string[];
  seed_oils_detected: string[];
  clean_labeling_alerts: string[];
  profile_adjustments: string[];
}

export interface UserProfileRow {
  id: string;
  display_name: string | null;
  health_profile: HealthProfile;
  allergies: string[];
  intolerances: string[];
  preferred_portion_size: string;
  subscription_tier: 'free' | 'premium';
  subscription_expires_at: string | null;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  barcode: string;
  name: string | null;
  brand: string | null;
  image_url: string | null;
  ingredients_raw: string | null;
  additives_tags: string[];
  nova_group: number | null;
  nutriscore_grade: string | null;
  energy_kcal_100g: number | null;
  sugars_100g: number | null;
  saturated_fat_100g: number | null;
  salt_100g: number | null;
  proteins_100g: number | null;
  fiber_100g: number | null;
  oil_types: string[];
  portion_grams: number | null;
  packaging_material: string | null;
  is_organic: boolean;
  off_last_updated: string | null;
  our_score: number | null;
  our_score_computed_at: string | null;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export interface CosmeticProduct {
  barcode: string;
  name: string | null;
  brand: string | null;
  image_url: string | null;
  ingredients_inci: string;
  ingredients_list: string[];
  category: string | null;
  image_ingredients_url: string | null;
  obf_last_updated: string | null;
  our_score: number | null;
  our_score_computed_at: string | null;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryDef {
  slug: string;
  name: string;
  emoji: string;
  icon: string;
  off_tag: string | null;
  obf_tag: string | null;
  type: 'food' | 'cosmetic';
}

export interface SearchResult {
  barcode: string;
  name: string | null;
  brand: string | null;
  image_url: string | null;
  type: 'food' | 'cosmetic';
}

export interface SearchFilters {
  query: string;
  type: 'all' | 'food' | 'cosmetic';
  category_slug?: string;
}

export type CosmeticIngredientRisk = 'safe' | 'caution' | 'warning' | 'danger';

export interface CosmeticPenaltyDetail {
  code: string;
  label: string;
  points: number;
  category: 'endocrine' | 'irritant' | 'allergen' | 'silicone' | 'preservative' | 'profile';
}

export interface CosmeticScoringResult {
  score_final: number;
  score_color: ScoreColor;
  penalties: CosmeticPenaltyDetail[];
  blockers: string[];
  risky_ingredients: Array<{
    inci: string;
    risk: CosmeticIngredientRisk;
    reason: string | null;
  }>;
  profile_adjustments: string[];
}

export type CosmeticProfile = 'standard' | 'peau_sensible' | 'enceinte' | 'bebe';

export interface CosmeticScoringInput {
  barcode: string;
  ingredients_inci: string;
  ingredients_list: string[];
  category: string | null;
}
