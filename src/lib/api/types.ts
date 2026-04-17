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
