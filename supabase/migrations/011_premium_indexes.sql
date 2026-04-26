-- =============================================================================
-- Migration 011 — Index pour les lookups premium
-- =============================================================================
-- Contexte : la table public.subscriptions existe déjà (migration 006).
-- Cette migration ajoute UNIQUEMENT un index partiel pour accélérer la
-- vérification du gate premium (function isPremiumUser dans
-- src/lib/premium/premium-gate.ts) qui filtre :
--     WHERE user_id = $1 AND plan = 'premium' AND status IN ('active','trialing')
--
-- Pas de DROP, pas d'ALTER, pas de modification de RLS — purement additif.
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_plan_status
  ON public.subscriptions (user_id, status)
  WHERE plan = 'premium';

COMMENT ON INDEX public.idx_subscriptions_user_plan_status IS
  'Accélère le gate premium (premium-gate.ts) : lookup par user_id + status, restreint aux lignes plan=premium.';
