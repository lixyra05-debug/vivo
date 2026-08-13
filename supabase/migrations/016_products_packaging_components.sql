-- 016_products_packaging_components.sql — stocke `packagings[]` d'Open Food Facts
-- Idempotent, non-destructif (aucune donnée existante modifiée).
--
-- POURQUOI : l'emballage entre désormais dans le score produit. Les écrans de
-- classement (catégorie, enseigne, top accueil) calculent le score depuis le
-- cache `products` ; sans cette colonne ils noteraient la formulation seule et
-- afficheraient une note différente de celle de la fiche pour le même produit.
--
-- La charge utile OFF contient déjà `packagings[]` — `fetchProductByBarcode`
-- télécharge la fiche sans filtre `fields=`. Aucune requête réseau
-- supplémentaire n'est introduite ; on cesse simplement de jeter la donnée.
--
-- OBLIGATOIRE AVANT DÉPLOIEMENT DU CODE : `writeProductToCache` fait un upsert
-- de l'objet Product entier. Sans cette colonne, toute écriture de cache
-- produit échoue silencieusement et le cache cesse de se remplir.
--
-- Les lignes déjà en cache reçoivent '[]' et se corrigent d'elles-mêmes au
-- prochain rafraîchissement (TTL 7 jours). Pendant cette fenêtre un classement
-- sous-pénalise ; il ne sur-pénalise jamais.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS packaging_components jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.packaging_components IS
  'Composants d''emballage OFF (packagings[]) : [{material, shape, food_contact}]. Source du malus emballage. Ne jamais alimenter depuis packaging_tags.';
