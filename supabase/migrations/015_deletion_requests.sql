-- 015_deletion_requests.sql — RGPD art. 17 (droit à l'effacement) + Apple Guideline 5.1.1(v)
-- Permet aux users de demander la suppression de leur compte depuis l'app.
-- Le traitement est manuel côté équipe LYXIRIA (sous 30 jours max).
-- Idempotente : peut être rejouée sans casser l'état.

-- ─── Table ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id
  ON public.deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_pending
  ON public.deletion_requests(processed_at)
  WHERE processed_at IS NULL;

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deletion_requests_insert_own" ON public.deletion_requests;
CREATE POLICY "deletion_requests_insert_own" ON public.deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "deletion_requests_select_own" ON public.deletion_requests;
CREATE POLICY "deletion_requests_select_own" ON public.deletion_requests
  FOR SELECT USING (auth.uid() = user_id);
