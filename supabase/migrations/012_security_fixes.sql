-- Migration 012 : Security fixes Sprint 1 (audit C-001, C-002, C-003, C-004)
-- Active RLS sur 4 tables publiques, drop FK bloquant cosmétiques,
-- ajoute DELETE policy scan_history (RGPD art. 17), colonnes consent (RGPD art. 7)

BEGIN;

-- C-001 : Active RLS sur 4 tables publiques (corrige advisor rls_disabled_in_public)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_rules ENABLE ROW LEVEL SECURITY;

-- products : SELECT public + INSERT/UPDATE authenticated (cache OFF côté client)
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
CREATE POLICY "Products are publicly readable" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can insert products" ON public.products;
CREATE POLICY "Authenticated can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update products" ON public.products;
CREATE POLICY "Authenticated can update products" ON public.products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- additives : SELECT public (catalogue read-only)
DROP POLICY IF EXISTS "Additives are publicly readable" ON public.additives;
CREATE POLICY "Additives are publicly readable" ON public.additives
  FOR SELECT USING (true);

-- swap_categories : SELECT public
DROP POLICY IF EXISTS "Swap categories are publicly readable" ON public.swap_categories;
CREATE POLICY "Swap categories are publicly readable" ON public.swap_categories
  FOR SELECT USING (true);

-- swap_rules : SELECT public
DROP POLICY IF EXISTS "Swap rules are publicly readable" ON public.swap_rules;
CREATE POLICY "Swap rules are publicly readable" ON public.swap_rules
  FOR SELECT USING (true);

-- C-002 : Drop FK scan_history.barcode -> products (bloque les barcodes cosmétiques absents de products)
ALTER TABLE public.scan_history DROP CONSTRAINT IF EXISTS scan_history_barcode_fkey;

-- C-003 : DELETE policy scan_history (RGPD art. 17 — droit à l'effacement)
DROP POLICY IF EXISTS "Users can delete own history" ON public.scan_history;
CREATE POLICY "Users can delete own history" ON public.scan_history
  FOR DELETE USING (auth.uid() = user_id);

-- C-004 : Colonnes consent_at + cgu_version sur user_profiles (RGPD art. 7 — preuve consentement)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS cgu_version text;

COMMIT;
