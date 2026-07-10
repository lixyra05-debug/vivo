-- 015_subscriptions_client_sync.sql — sync client du miroir subscriptions (RevenueCat)
--
-- Le client mobile synchronise `subscriptions.plan` depuis les entitlements
-- RevenueCat (source de vérité des achats). Il lui faut :
--   1. une contrainte UNIQUE(user_id) pour l'upsert onConflict
--   2. des policies INSERT/UPDATE limitées à SA propre ligne
--
-- Note sécurité : un utilisateur technique pourrait s'auto-attribuer un plan
-- en DB — impact limité au fallback d'affichage web/Expo Go (sur iOS, les
-- entitlements RevenueCat priment). Durcissement post-launch : webhook
-- RevenueCat → Edge Function service_role.
--
-- Idempotente — ré-exécutable sans erreur.

-- 0. Dédoublonnage préventif : garde la ligne la plus récente par user
DELETE FROM public.subscriptions s
USING public.subscriptions s2
WHERE s.user_id = s2.user_id
  AND (
    s.created_at < s2.created_at
    OR (s.created_at = s2.created_at AND s.ctid < s2.ctid)
  );

-- 1. Unicité user_id (requise pour upsert onConflict: 'user_id')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_key'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 2. Policies INSERT / UPDATE : chaque user ne peut écrire que sa ligne
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
