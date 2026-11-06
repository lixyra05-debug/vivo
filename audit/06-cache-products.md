# 06 — Audit du cache `products` (lot C, novembre 2026)

Avant le lot C, la migration 012 ouvrait `products` en INSERT et en UPDATE à tout compte connecté
(`WITH CHECK (true)`, sans trigger), et `updated_at` venait du client. Une fiche réécrite était servie
à tous pendant 7 jours, et sans fin si sa date était mise dans le futur. Elle nourrit la note et le
verdict allergène.

Cet audit ne modifie rien. Deux étages : des requêtes SQL rapides (signes d'écriture hors de l'app),
puis la confrontation de chaque fiche à Open Food Facts.

## 1. Requêtes SQL — lecture seule (Supabase → SQL Editor)

```sql
-- a. Dates dans le futur : avant le lot C, l'app datait la fiche à l'heure du téléphone (téléphone en
--    avance, ou date forgée). À lancer AVANT 018, qui les rend périmées : ensuite, rien ne les distingue.
select count(*) as dates_futures
from public.products
where updated_at > now() + interval '5 minutes';

-- b. Codes-barres que cache-product refuserait : ni 8 à 14 chiffres (même règle qu'isValidBarcode).
select count(*) as codes_hors_format
from public.products
where barcode !~ '^[0-9]{8,14}$';

-- c. Compteurs qu'aucune version de l'app n'a jamais écrits.
select count(*) as compteurs_touches
from public.products
where coalesce(scan_count, 0) <> 0 or our_score is not null or our_score_computed_at is not null;

-- d. Dates désaccordées : l'app écrivait off_last_updated et updated_at au même instant.
--    Surtout parlant avant 018 : ensuite, updated_at vient du serveur, off_last_updated du
--    téléphone des versions antérieures (jusqu'à 019).
select count(*) as dates_desaccordees
from public.products
where off_last_updated is not null
  and abs(extract(epoch from (updated_at - off_last_updated))) > 60;

-- e. Tags d'allergènes hors du format d'OFF (« en:milk »).
select count(*) as tags_hors_format
from public.products p
where exists (select 1 from unnest(p.allergens_tags) t where t !~ '^[a-z]{2}:[a-z0-9-]+$');

-- f. Volume et âge : combien de fiches les clients servent encore (moins de 7 jours).
select count(*) as fiches,
       count(*) filter (where updated_at > now() - interval '7 days') as encore_servies,
       min(updated_at) as plus_ancienne,
       max(updated_at) as plus_recente
from public.products;

-- g. Le cache cosmétique n'a jamais pu être écrit par un client : il doit être vide
--    tant que cache-product n'est pas déployée.
select count(*) as fiches_cosmetiques from public.cosmetic_products;
```

Ce sont des signes, pas des preuves : une ligne modifiée à la main dans le tableau de bord sort aussi en (c)
ou en (d).

## 2. Confrontation à Open Food Facts — `audit/products-cache-audit.ts`

Le script lit les fiches en cache par l'API publique (clé publique de l'app), les plus récemment écrites
d'abord, relit chaque code-barres sur OFF à 12 requêtes par minute au plus (OFF : 15 par minute et par
adresse IP, sous peine de bannissement), et écrit un rapport JSON local. Il n'écrit rien en base. Compter
environ 5 secondes par fiche : 200 fiches, un peu moins de 17 minutes.

```bash
SUPABASE_URL=… SUPABASE_ANON_KEY=… AUDIT_LIMIT=200 AUDIT_OUT=/tmp/audit-cache.json \
deno run --allow-env=SUPABASE_URL,SUPABASE_ANON_KEY,AUDIT_LIMIT,AUDIT_OUT \
  --allow-net=fr.openfoodfacts.org,<ref-du-projet>.supabase.co --allow-write=/tmp \
  audit/products-cache-audit.ts
```

Verdicts (`src/lib/api/cache-audit.ts`) :

| Verdict | Sens |
|---|---|
| `conforme` | mêmes valeurs qu'OFF aujourd'hui |
| `date_future` | `updated_at` dans le futur : téléphone en avance, ou date forgée — visible avant 018 seulement |
| `code_hors_format` | ni 8 à 14 chiffres : `cache-product` le refuserait ; OFF n'est pas interrogé |
| `absente_off` | OFF ne connaît pas le code : fiche inventée, ou retirée d'OFF |
| `ecart_sensible` | écart sur les textes d'ingrédients, les allergènes ou les additifs déclarés : toujours suspect, même si OFF a été retouché depuis |
| `off_a_change` | autre écart, mais OFF a été modifié après la mise en cache : attendu |
| `ecart_inexplique` | autre écart alors qu'OFF n'a pas changé depuis, ou sans date : altération probable |

Champs comparés : nom, marque, image, les deux textes d'ingrédients, allergènes et additifs déclarés,
NOVA, Nutri-Score, nutriments, huiles, portion, bio, emballage. Limite connue : `ingredients_text_fr`,
`allergens_tags` et `packaging_components`, arrivés avec 016 et 017, ne sont pas comparés quand la ligne
les a vides — une ligne ancienne les a vides sans être altérée.

Limite : une fiche vandalisée sur OFF au moment où `cache-product` la relit (modifier OFF, déclencher la
relecture, annuler la modification) reste servie 7 jours, et l'audit la voit en `ecart_sensible` si elle
touche aux allergènes, en `off_a_change` sinon. Comparer à la révision d'OFF relue (`rev`) demanderait de
la stocker : hors lot C.

## 3. Après l'audit

Rien n'est corrigé ici. 018 rend déjà périmées les fiches datées dans le futur, avant de créer le trigger.
**Après 018, ne jamais « rafraîchir » une fiche par `update`** : le trigger la redate à l'heure du serveur,
ce qui la rend fraîche 7 jours. Le remède est un `delete` ciblé (aucune clé étrangère ne pointe vers
`products`) : la lecture suivante relit la source. Décision à part, après lecture du rapport.
