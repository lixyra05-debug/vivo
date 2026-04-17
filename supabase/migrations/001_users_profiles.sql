-- 001_users_profiles.sql

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  health_profile TEXT NOT NULL DEFAULT 'standard'
    CHECK (health_profile IN ('standard', 'diabetic', 'athlete', 'child', 'pregnant', 'intolerant')),
  allergies TEXT[] DEFAULT '{}',
  intolerances TEXT[] DEFAULT '{}',
  preferred_portion_size TEXT DEFAULT 'realistic',
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at TIMESTAMPTZ,
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
