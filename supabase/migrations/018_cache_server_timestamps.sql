-- 018_cache_server_timestamps.sql — lot C (novembre 2026)
--
-- Les dates des caches products et cosmetic_products sont fixées par le
-- serveur, et l'Edge Function cache-product tient le journal de ses
-- relectures (quotas).
--
-- Avant : updated_at et created_at venaient du client (normalizeOFFProduct),
-- et l'app tenait pour fraîche toute fiche datée de moins de 7 jours — une
-- date mise dans le futur la rendait fraîche pour toujours.
--
-- ORDRE DE DÉPLOIEMENT (CLAUDE.md, lot C) : 016 et 017 en base ; 018 ;
-- déployer cache-product et la vérifier ; 019 ; publier l'app. 018 vient AVANT
-- la fonction, qui écrit dans cache_refresh_log.
--
-- SEULE DONNÉE MODIFIÉE : les fiches datées de plus de 5 minutes dans le futur
-- (avant le lot C, le client datait la fiche à l'heure du téléphone : téléphone
-- en avance, ou date forgée) sont rendues périmées, AVANT la création des
-- triggers : exécutée après, cette mise à jour serait elle-même redatée par le
-- trigger, et ces fiches deviendraient fraîches pour 7 jours. La prochaine
-- lecture les relit à la source.
--
-- Versions installées de l'app : leurs écritures passent encore jusqu'à 019,
-- mais les dates qu'elles envoient sont remplacées par celles du serveur.
--
-- Idempotente. Aucune fonction SECURITY DEFINER. La RLS reste en place.

BEGIN;

-- 1. Dates du serveur, quel que soit l'écrivain.
CREATE OR REPLACE FUNCTION public.set_cache_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := pg_catalog.now();
  ELSE
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_set_cache_timestamps ON public.products;
DROP TRIGGER IF EXISTS cosmetic_products_set_cache_timestamps ON public.cosmetic_products;

-- 2. Dates dans le futur rendues périmées, tant qu'aucun trigger ne redate la mise à jour.
UPDATE public.products
  SET updated_at = NOW() - INTERVAL '8 days'
  WHERE updated_at > NOW() + INTERVAL '5 minutes';
UPDATE public.cosmetic_products
  SET updated_at = NOW() - INTERVAL '8 days'
  WHERE updated_at > NOW() + INTERVAL '5 minutes';

CREATE TRIGGER products_set_cache_timestamps
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_cache_timestamps();

CREATE TRIGGER cosmetic_products_set_cache_timestamps
  BEFORE INSERT OR UPDATE ON public.cosmetic_products
  FOR EACH ROW EXECUTE FUNCTION public.set_cache_timestamps();

-- 3. Journal des relectures de cache-product : quotas par compte, plafond par
--    source (OFF : 15 lectures par minute et par adresse IP). Ni code-barres ni
--    contenu de fiche : un compte, une source, une date. Purgé au-delà de
--    2 jours par la fonction, pour tous les comptes ; effacé avec le compte.
CREATE TABLE IF NOT EXISTS public.cache_refresh_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('off', 'obf')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_refresh_log_user_time
  ON public.cache_refresh_log (user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_cache_refresh_log_source_time
  ON public.cache_refresh_log (source, requested_at DESC);

ALTER TABLE public.cache_refresh_log ENABLE ROW LEVEL SECURITY;
-- Aucune politique, et aucun droit pour les rôles client (TRUNCATE échappe à la
-- RLS ; la table disparaît aussi de leur OpenAPI). Seul le rôle de service
-- (cache-product) y accède.
REVOKE ALL ON public.cache_refresh_log FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.cache_refresh_log_id_seq FROM anon, authenticated;

COMMIT;
