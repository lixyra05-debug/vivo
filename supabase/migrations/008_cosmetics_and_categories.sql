-- 008_cosmetics_and_categories.sql
-- Cosmétiques (Open Beauty Facts cache) + référentiel d'ingrédients INCI + catégories unifiées.

-- ============================================================
-- cosmetic_products : cache local des produits cosmétiques OBF
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cosmetic_products (
  barcode TEXT PRIMARY KEY,
  name TEXT,
  brand TEXT,
  image_url TEXT,
  image_ingredients_url TEXT,
  ingredients_inci TEXT,
  ingredients_list TEXT[] DEFAULT '{}',
  category TEXT,
  our_score INTEGER,
  our_score_computed_at TIMESTAMPTZ,
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  obf_last_updated TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cosmetic_products_category ON public.cosmetic_products(category);
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_updated_at ON public.cosmetic_products(updated_at);

ALTER TABLE public.cosmetic_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cosmetic products are publicly readable"
  ON public.cosmetic_products FOR SELECT
  USING (true);

-- ============================================================
-- cosmetic_ingredients : référentiel INCI (source de vérité = TS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cosmetic_ingredients (
  inci TEXT PRIMARY KEY,
  name_fr TEXT,
  risk TEXT NOT NULL CHECK (risk IN ('safe', 'caution', 'warning', 'danger')),
  category TEXT,
  penalty INTEGER NOT NULL DEFAULT 0,
  reason_fr TEXT,
  source_url TEXT
);

ALTER TABLE public.cosmetic_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cosmetic ingredients are publicly readable"
  ON public.cosmetic_ingredients FOR SELECT
  USING (true);

-- ============================================================
-- categories : référentiel unifié food + cosmétique
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  icon TEXT,
  off_tag TEXT,
  obf_tag TEXT,
  type TEXT NOT NULL CHECK (type IN ('food', 'cosmetic')),
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_categories_type_order ON public.categories(type, display_order);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT
  USING (true);

-- Seed des 26 catégories (idempotent)
INSERT INTO public.categories (slug, name, emoji, icon, off_tag, obf_tag, type, display_order) VALUES
  ('boissons', 'Boissons', '🥤', 'Coffee', 'beverages', NULL, 'food', 1),
  ('laitages', 'Laitages', '🥛', 'Milk', 'dairies', NULL, 'food', 2),
  ('cereales-petit-dej', 'Céréales p.-déj', '🥣', 'Wheat', 'breakfast-cereals', NULL, 'food', 3),
  ('snacks-sales', 'Snacks salés', '🥨', 'UtensilsCrossed', 'salty-snacks', NULL, 'food', 4),
  ('biscuits-sucres', 'Biscuits sucrés', '🍪', 'Cookie', 'biscuits', NULL, 'food', 5),
  ('plats-prepares', 'Plats préparés', '🍱', 'ChefHat', 'meals', NULL, 'food', 6),
  ('pates-riz', 'Pâtes & Riz', '🍝', 'Soup', 'pastas', NULL, 'food', 7),
  ('sauces', 'Sauces', '🥫', 'Soup', 'sauces', NULL, 'food', 8),
  ('chocolats', 'Chocolats', '🍫', 'Candy', 'chocolates', NULL, 'food', 9),
  ('conserves', 'Conserves', '🥫', 'Archive', 'canned-foods', NULL, 'food', 10),
  ('charcuterie', 'Charcuterie', '🥓', 'Beef', 'meats', NULL, 'food', 11),
  ('fromages', 'Fromages', '🧀', 'Slice', 'cheeses', NULL, 'food', 12),
  ('pains', 'Pains', '🥖', 'Wheat', 'breads', NULL, 'food', 13),
  ('shampoings', 'Shampoings', '🧴', 'Droplet', NULL, 'shampoos', 'cosmetic', 14),
  ('apres-shampoings', 'Après-shampoings', '💧', 'Droplet', NULL, 'hair-conditioners', 'cosmetic', 15),
  ('gels-douche', 'Gels douche', '🛁', 'Bath', NULL, 'shower-gels', 'cosmetic', 16),
  ('savons', 'Savons', '🧼', 'Bath', NULL, 'soaps', 'cosmetic', 17),
  ('deodorants', 'Déodorants', '🌿', 'SprayCan', NULL, 'deodorants', 'cosmetic', 18),
  ('cremes-visage', 'Crèmes visage', '🧴', 'Sparkles', NULL, 'face-creams', 'cosmetic', 19),
  ('serums', 'Sérums', '💎', 'Sparkles', NULL, 'serums', 'cosmetic', 20),
  ('cremes-solaires', 'Crèmes solaires', '☀️', 'Sun', NULL, 'sunscreens', 'cosmetic', 21),
  ('baumes-levres', 'Baumes lèvres', '💋', 'Sparkles', NULL, 'lip-balms', 'cosmetic', 22),
  ('dentifrices', 'Dentifrices', '🦷', 'Sparkles', NULL, 'toothpastes', 'cosmetic', 23),
  ('maquillage-teint', 'Maquillage teint', '💄', 'Sparkles', NULL, 'foundations', 'cosmetic', 24),
  ('mascaras', 'Mascaras', '👁️', 'Eye', NULL, 'mascaras', 'cosmetic', 25),
  ('soins-bebe', 'Soins bébé', '👶', 'Baby', NULL, 'baby-care', 'cosmetic', 26)
ON CONFLICT (slug) DO NOTHING;
