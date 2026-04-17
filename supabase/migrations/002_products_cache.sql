-- 002_products_cache.sql

CREATE TABLE public.products (
  barcode TEXT PRIMARY KEY,
  name TEXT,
  brand TEXT,
  image_url TEXT,
  ingredients_raw TEXT,
  additives_tags TEXT[] DEFAULT '{}',
  nova_group SMALLINT,
  nutriscore_grade TEXT,
  energy_kcal_100g NUMERIC,
  sugars_100g NUMERIC,
  saturated_fat_100g NUMERIC,
  salt_100g NUMERIC,
  proteins_100g NUMERIC,
  fiber_100g NUMERIC,
  oil_types TEXT[] DEFAULT '{}',
  portion_grams NUMERIC,
  packaging_material TEXT,
  is_organic BOOLEAN DEFAULT FALSE,
  off_last_updated TIMESTAMPTZ,
  our_score INTEGER,
  our_score_computed_at TIMESTAMPTZ,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_name ON public.products USING gin(to_tsvector('french', name));
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_products_nova ON public.products(nova_group);
CREATE INDEX idx_products_score ON public.products(our_score);
