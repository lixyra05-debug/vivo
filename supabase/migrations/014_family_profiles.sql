-- 014_family_profiles.sql — Mode Famille (Mission D, mai 2026)
-- Création de la table family_profiles + RLS + triggers (max 4 / user, single is_active).
-- Idempotent : peut être rejouée sans casser l'état.

-- ─── Table ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 50),
  avatar_emoji text NOT NULL DEFAULT '🧑',
  age_group text NOT NULL CHECK (age_group IN ('adult', 'child', 'baby', 'pregnant')),
  allergies text[] NOT NULL DEFAULT '{}',
  conditions text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_profiles_user_id
  ON public.family_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_family_profiles_active
  ON public.family_profiles(user_id, is_active)
  WHERE is_active = true;

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_profiles_select_own" ON public.family_profiles;
CREATE POLICY "family_profiles_select_own" ON public.family_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "family_profiles_insert_own" ON public.family_profiles;
CREATE POLICY "family_profiles_insert_own" ON public.family_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "family_profiles_update_own" ON public.family_profiles;
CREATE POLICY "family_profiles_update_own" ON public.family_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "family_profiles_delete_own" ON public.family_profiles;
CREATE POLICY "family_profiles_delete_own" ON public.family_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Trigger : max 4 profils par user ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_max_family_profiles()
RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM public.family_profiles WHERE user_id = NEW.user_id) >= 4 THEN
    RAISE EXCEPTION 'Maximum 4 family profiles per user' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_max_family_profiles ON public.family_profiles;
CREATE TRIGGER trg_enforce_max_family_profiles
  BEFORE INSERT ON public.family_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_family_profiles();

-- ─── Trigger : un seul is_active=true par user ──────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_single_active_family_profile()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.family_profiles
      SET is_active = false, updated_at = now()
      WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_single_active_family_profile ON public.family_profiles;
CREATE TRIGGER trg_enforce_single_active_family_profile
  BEFORE INSERT OR UPDATE OF is_active ON public.family_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_family_profile();

-- ─── Trigger : updated_at auto ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at_family_profiles()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_family_profiles ON public.family_profiles;
CREATE TRIGGER trg_set_updated_at_family_profiles
  BEFORE UPDATE ON public.family_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_family_profiles();
