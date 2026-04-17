-- 005_smart_swaps.sql

CREATE TABLE public.swap_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name_fr TEXT NOT NULL,
  swap_type TEXT NOT NULL DEFAULT 'brut',
  brut_alternatives JSONB,
  product_barcodes TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.swap_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_keywords TEXT[] NOT NULL,
  trigger_nova_min SMALLINT DEFAULT 3,
  swap_category_id UUID REFERENCES public.swap_categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
