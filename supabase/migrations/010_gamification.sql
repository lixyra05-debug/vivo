-- Migration 010 : Gamification (badges + streaks) + colonne product_type sur scan_history
-- Idempotente : peut être ré-exécutée sans erreur.

-- 1. Ajouter product_type à scan_history pour distinguer food/cosmetic
ALTER TABLE public.scan_history
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'food'
    CHECK (product_type IN ('food','cosmetic'));

CREATE INDEX IF NOT EXISTS idx_scan_history_product_type
  ON public.scan_history(user_id, product_type);

-- 2. user_badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user
  ON public.user_badges(user_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own badges" ON public.user_badges;
CREATE POLICY "Users can read own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;
CREATE POLICY "Users can insert own badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. user_streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_scan_date date,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own streak" ON public.user_streaks;
CREATE POLICY "Users can read own streak" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own streak" ON public.user_streaks;
CREATE POLICY "Users can upsert own streak" ON public.user_streaks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
