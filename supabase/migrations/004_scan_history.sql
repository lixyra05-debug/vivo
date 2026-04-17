-- 004_scan_history.sql

CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL REFERENCES public.products(barcode),
  score_at_scan INTEGER NOT NULL,
  profile_used TEXT NOT NULL,
  penalties_snapshot JSONB,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scan_history_user ON public.scan_history(user_id, scanned_at DESC);
CREATE INDEX idx_scan_history_barcode ON public.scan_history(barcode);

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own history"
  ON public.scan_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON public.scan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history"
  ON public.scan_history FOR UPDATE
  USING (auth.uid() = user_id);
