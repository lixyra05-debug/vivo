-- 009_stores_confidence_reports.sql
-- Listes par enseigne + signalements produit.

-- ============================================================
-- product_reports : signalements utilisateur
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('wrong_name','wrong_photo','wrong_ingredients','wrong_nutrition','other')),
  description TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reports_barcode ON public.product_reports(barcode);
CREATE INDEX IF NOT EXISTS idx_product_reports_user ON public.product_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reports_status ON public.product_reports(status) WHERE status = 'pending';

ALTER TABLE public.product_reports ENABLE ROW LEVEL SECURITY;

-- INSERT : un utilisateur ne peut signaler que sous son propre user_id
CREATE POLICY "Users can submit reports"
  ON public.product_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SELECT : lecture publique pour permettre l'agrégation de comptes
-- (badge "X signalements" visible par tous, façon Yuka).
CREATE POLICY "Public can read aggregate counts"
  ON public.product_reports FOR SELECT
  USING (true);

-- ============================================================
-- stores : référentiel des enseignes (TS = source de vérité, table = analytics futur)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stores (
  slug TEXT PRIMARY KEY,
  name_fr TEXT NOT NULL,
  emoji TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'FR',
  off_store_tag TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores are publicly readable"
  ON public.stores FOR SELECT
  USING (true);

-- Seed des 10 enseignes (idempotent)
INSERT INTO public.stores (slug, name_fr, emoji, country, off_store_tag, display_order) VALUES
  ('carrefour', 'Carrefour', '🟥', 'FR', 'carrefour', 0),
  ('leclerc', 'E.Leclerc', '🔵', 'FR', 'leclerc', 1),
  ('auchan', 'Auchan', '🟢', 'FR', 'auchan', 2),
  ('intermarche', 'Intermarché', '🟡', 'FR', 'intermarche', 3),
  ('picard', 'Picard', '❄️', 'FR', 'picard', 4),
  ('monoprix', 'Monoprix', '🟤', 'FR', 'monoprix', 5),
  ('lidl', 'Lidl', '🔶', 'FR', 'lidl', 6),
  ('aldi', 'Aldi', '🔷', 'FR', 'aldi', 7),
  ('casino', 'Casino', '🎰', 'FR', 'casino', 8),
  ('franprix', 'Franprix', '🟠', 'FR', 'franprix', 9)
ON CONFLICT (slug) DO NOTHING;
