-- 003_additives_database.sql

CREATE TABLE public.additives (
  code TEXT PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  risk_level TEXT NOT NULL
    CHECK (risk_level IN ('blocker', 'high', 'moderate', 'low', 'safe')),
  penalty_points INTEGER NOT NULL DEFAULT 0,
  is_blocker BOOLEAN NOT NULL DEFAULT FALSE,
  description_short_fr TEXT,
  description_detailed_fr TEXT,
  scientific_sources TEXT[],
  hidden_names TEXT[] DEFAULT '{}',
  profiles_extra_penalty JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.additives (code, name_fr, category, risk_level, penalty_points, is_blocker, description_short_fr, hidden_names, profiles_extra_penalty) VALUES
  ('e951', 'Aspartame', 'edulcorant', 'blocker', 0, TRUE,
   'Neurotoxique métabolisé en méthanol puis formaldéhyde.',
   ARRAY['arôme artificiel'],
   '{"child": "blocker", "pregnant": "blocker", "athlete": "blocker"}'::jsonb),
  ('e621', 'Glutamate monosodique', 'exhausteur', 'blocker', 0, TRUE,
   'Excitotoxine. Noms cachés fréquents sur les étiquettes.',
   ARRAY['extrait de levure', 'arôme naturel', 'protéines hydrolysées', 'maltodextrine', 'bouillon'],
   '{"child": "blocker", "athlete": "blocker"}'::jsonb),
  ('e171', 'Dioxyde de titane', 'colorant', 'blocker', 0, TRUE,
   'Nanoparticule génotoxique. Interdit en France depuis 2020.',
   ARRAY[]::TEXT[], '{}'::jsonb),
  ('e955', 'Sucralose', 'edulcorant', 'high', 50, FALSE,
   'Organochloré mutagène perturbant le microbiote.',
   ARRAY[]::TEXT[], '{"diabetic": "blocker"}'::jsonb),
  ('e250', 'Nitrite de sodium', 'conservateur', 'high', 50, FALSE,
   'Forme des nitrosamines cancérogènes (cancer colorectal).',
   ARRAY[]::TEXT[], '{"child": "blocker"}'::jsonb),
  ('e120', 'Cochenille', 'colorant', 'high', 40, FALSE,
   'Allergène sévère. Risque de choc anaphylactique.',
   ARRAY['carmin', 'acide carminique'], '{}'::jsonb),
  ('e150c', 'Caramel ammoniacal', 'colorant', 'moderate', 30, FALSE,
   'Contient du 4-MEI, immunotoxique.',
   ARRAY[]::TEXT[], '{}'::jsonb),
  ('e330', 'Acide citrique', 'acidifiant', 'moderate', 20, FALSE,
   'Issu de moisissures Aspergillus niger. Facilite le passage de l''aluminium dans le cerveau.',
   ARRAY[]::TEXT[], '{}'::jsonb)
ON CONFLICT (code) DO NOTHING;
