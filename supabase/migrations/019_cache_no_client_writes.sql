-- 019_cache_no_client_writes.sql — lot C (novembre 2026)
--
-- Plus aucune écriture client dans les caches products et cosmetic_products :
-- seule l'Edge Function cache-product les écrit, avec la clé de service, après
-- avoir relu Open Food Facts (ou Open Beauty Facts) elle-même.
--
-- Avant : 012 ouvrait products en INSERT et en UPDATE à tout compte connecté,
-- WITH CHECK (true), sans trigger — n'importe quel compte pouvait réécrire la
-- fiche, et le verdict allergène, que lisent tous les autres.
--
-- ORDRE DE DÉPLOIEMENT : APRÈS 018 et APRÈS le déploiement de cache-product,
-- vérifié par un appel réel (cached:false, puis cached:true) ; AVANT la
-- publication de l'app. Jusqu'à 019, n'importe quel compte connecté écrit
-- encore dans le cache, quelle que soit la version de l'app.
--
-- Versions installées de l'app : leurs écritures sont refusées (42501). Elles
-- avalent l'erreur (writeProductToCache rend la fiche lue d'OFF) et continuent
-- de lire le cache et OFF : rien ne casse, elles cessent seulement de remplir
-- le cache.
--
-- Idempotente. La lecture publique et la RLS restent en place.

BEGIN;

DROP POLICY IF EXISTS "Authenticated can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can update products" ON public.products;

-- Seconde serrure : même une politique ajoutée par erreur ne rouvrirait pas
-- l'écriture sans un GRANT explicite.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.products FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.cosmetic_products FROM anon, authenticated;

COMMIT;
