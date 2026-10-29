-- 017_products_allergen_sources.sql — sources des allergènes pour la compatibilité (lot S1b)
-- Idempotent, non-destructif (aucune donnée existante modifiée).
--
-- POURQUOI : la compatibilité lisait `ingredients_text`, le texte de la langue
-- PRINCIPALE de la fiche Open Food Facts. Sur 170 produits réels (octobre 2026), 42 ont un
-- texte principal différent du texte français et 9 n'ont aucun texte
-- français. Le Nutella (3017620422003) a pour texte principal « sugar, palm
-- oil » : ni fruit à coque, ni lait, ni soja détectés. `allergens_tags` était
-- renvoyé par OFF et jeté.
--
-- `allergens_tags` est une saisie communautaire : on y trouve des traces
-- recopiées dans les allergènes, des châtaignes déclarées « fruits à coque »
-- (hors annexe II du règlement 1169/2011) et des tags sans appui sur la fiche.
-- La compatibilité le prend en union avec le texte : une alerte de trop plutôt
-- qu'une alerte manquée.
--
-- La charge utile OFF contient déjà ces deux champs — `fetchProductByBarcode`
-- télécharge la fiche sans filtre `fields=`. Aucune requête réseau
-- supplémentaire n'est introduite.
--
-- `ingredients_raw` ne change pas : il continue de nourrir la NOTE. Les deux
-- colonnes ajoutées ne nourrissent que la compatibilité.
--
-- OBLIGATOIRE AVANT DÉPLOIEMENT DU CODE : `writeProductToCache` fait un upsert
-- de l'objet Product entier. Sans ces colonnes, toute écriture de cache
-- produit échoue silencieusement et le cache cesse de se remplir.
--
-- Les lignes déjà en cache reçoivent NULL et '{}' : la compatibilité n'y
-- trouve que le texte principal, sans tag — la source qu'elle lisait avant.
-- `getOrFetchProduct` les remplace au premier appel réussi à OFF passé 7 jours ;
-- tant qu'OFF ne répond pas, la ligne ancienne reste servie. L'historique, qui
-- lit le cache sans contrôle d'âge (`products(*)`), les montre telles quelles
-- tant qu'aucun écran ne les a rafraîchies.
--
-- RLS inchangée : les politiques de `products` (migration 012) portent sur
-- les lignes, les nouvelles colonnes les suivent (lecture publique, écriture
-- par un utilisateur authentifié).

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ingredients_text_fr TEXT,
  ADD COLUMN IF NOT EXISTS allergens_tags TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.products.ingredients_text_fr IS
  'Texte d''ingrédients français OFF (ingredients_text_fr). Lu par la compatibilité, jamais par la note.';

COMMENT ON COLUMN public.products.allergens_tags IS
  'Allergènes déclarés par la fiche OFF (allergens_tags, ex. en:milk), bruts. Complément du texte : un tag présent est lu comme contient, son absence ne prouve rien. Saisie communautaire : peut contenir des traces recopiées.';
