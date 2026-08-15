# Audit Agent 4 — Distribution réelle du scoring (échantillon ~300 produits OFF)

**Date** : 14 août 2026 · **HEAD audité** : 45678fa (arbre propre, aucune modification de source)
**Méthode** : pipeline de PRODUCTION rejoué à l'identique — `normalizeOFFProduct` → `productToScoringInput` → `calculateScore(profil standard)` → `composeScore` — sur 299 produits uniques (50 × 6 catégories, `fr.openfoodfacts.org` search v2, `countries_tags=france`, `sort_by=popularity_key`). Runner : `audit/sample-runner.ts` (jest, aucun maillon réimplémenté). Données brutes : scratchpad `off-sample/`.

**Point méthodo important** : le test préalable a montré que le **search v2 renvoie bien `packagings`** → 6 appels search ont suffi (pas de fallback produit-par-produit). Cadence 8–20 s entre appels, User-Agent `Vivo-Audit/1.0`, **zéro 429** (2×503 transitoires « Page temporarily unavailable », résolus au retry — documentés en annexe C).

---

## 0) Tableau récapitulatif

| Sévérité | Statut | Constat | Fichier:ligne |
|---|---|---|---|
| BLOQUANT | PROUVE | La pénalité macros dépend de `serving_size` (texte libre contributeur) : portions de 1 g à 1 500 g, défaut 100 g si absent/non parsé → inversions sanitaires intra-catégorie (chocolat 85 % moins sucré noté 0, chocolat 50 % plus sucré noté 36) | `src/lib/api/openfoodfacts.ts:144-150,190` + `src/lib/scoring/engine.ts:183-187` |
| BLOQUANT | PROUVE | `nova_group` absent → NOVA 4 forcé (plafond 30) : Perrier 22/100, Contrex 19/100, Vittel 20/100, Aquafina 20/100 — eaux minérales affichées « à éviter ». Le fallback `classifyNova` du moteur est rendu inatteignable | `src/lib/api/openfoodfacts.ts:279-280` (tue `src/lib/scoring/engine.ts:80`) |
| MAJEUR | PROUVE | Biais « absence de packagings[] = absence de malus » : écart (a)−(b) global 0,39 pt (dilué par le plancher), mais **+14,3 pts** d'avantage moyen pour les produits non documentés parmi les formulations ≥ 50 ; médianes 100 vs 68 ; 4 des 10 produits ≥ 90 sont sans packagings | `src/lib/scoring/composite-score.ts:146,165` |
| MAJEUR | PROUVE | Distribution écrasée au plancher : 53,5 % dans [0-9], **43,8 % à 0 exactement dont 90,1 % SANS blocker**, médiane 7/100, bande [70-79] vide — **contredit le commentaire « le zéro reste RÉSERVÉ aux additifs bloquants »** | `src/lib/scoring/composite-score.ts:15-17` vs `src/lib/scoring/engine.ts:142-247` |
| MINEUR | PROUVE | Le malus emballage est de facto inopérant sous formulation basse (D3, amortissement) : sodas couverts à 87,8 % mais malus > 0 sur 8,2 % ; malus médian de (b) = 0. La feature « emballage dans le score » ne mord en pratique que sur les eaux (86 %) | `src/lib/scoring/composite-score.ts:168` |
| MINEUR | PROUVE | `parsePortionGrams` ne reconnaît ni `l` ni `cl` : '1l', '1 L', '0.33l', '33 cl' → défaut 100 g alors que '1000 ml' → 1 000 g. 31/299 produits (10,4 %) présents-mais-non-parsés | `src/lib/api/openfoodfacts.ts:146` |
| MINEUR | PROUVE (code) / HYPOTHESE (impact) | Macros absentes → 0 (aucune pénalité) : structurellement le défaut racine, impact marginal dans CET échantillon (concerne surtout des eaux) | `src/lib/api/openfoodfacts.ts:287-291` |
| MINEUR | PROUVE | Données OFF aberrantes absorbées sans garde de plausibilité : Evian `serving_size='1g'` → portion 1 g ; eau Sidi Ali avec `sugars_100g=1.4` → −2,8 pts sur une eau | `src/lib/api/openfoodfacts.ts:144-150,184` |
| COSMETIQUE | PROUVE | `readProductFromCache` : les deux branches du test TTL renvoient la même valeur — test mort (le staleness est regéré par `getOrFetchProduct`) | `src/lib/api/openfoodfacts.ts:210-212` |
| SAIN ×8 | PROUVE | Voir section 5 : ancre Cristaline 62 exacte, 0 inversion NOVA brut, emballage hors `penalties[]`, note=0 ⟺ formulation=0, `recyclable:null` sans surcharge, plafond 45 marginal (1,1 %), couverture packagings 89,3 % cohérente, pipeline strict-clean | — |

---

## 1) BLOQUANTS

### B1 — [PROUVE] La base « portion » rend les notes incomparables et inverse des classements sanitaires

La pénalité sucres/graisses saturées est calculée **par portion** (`engine.ts:183-187` : `perPortion = per100g / 100 × portion`), et `portion_grams` sort de `parsePortionGrams(off.serving_size)` (`openfoodfacts.ts:144-150,190`) — un champ OFF **texte libre contributeur**. Mesuré sur l'échantillon :

- `serving_size` **absent** → défaut 100 g : 59/299 (19,7 %)
- présent mais **non parsé** ('1l', '1,5L', '0.33l', '1 L'…) → défaut 100 g : 31/299 (10,4 %)
- parsé : 209/299, portion **min 1 g** (Evian '1g'), **max 1 500 g**, médiane 100 g

Conséquence prouvée par les dumps du runner (annexe A, section DETAILS) — deux chocolats noirs du même rayon :

| Produit | Sucres/100 g | `serving_size` | Portion moteur | Pénalité sucres | **Note affichée** |
|---|---|---|---|---|---|
| Lindt Noir Intense (3046920022651) | **30 g** | '10 g' | 10 g | 6 pts | **36** |
| Alter Eco Noir 85 % Pérou (3700214611548) | **14 g** | '100g' | 100 g | 28 pts (+64 AGS) | **0** |

Le produit **objectivement moins sucré est noté 0**, le plus sucré 36 — uniquement parce qu'un contributeur a saisi '10 g' et l'autre '100g'. Même mécanique sur Coca-Cola : selon la fiche, portion 100/250/330/450 g → pénalité sucres de 21 à 95 pts pour un liquide identique. Le classement intra-catégorie — la fonction cœur de l'app — est piloté par le format de saisie OFF, pas par le produit. C'est la forme la plus grave du défaut racine : **la note mesure la donnée, pas l'aliment**.

### B2 — [PROUVE] `nova_group` absent → NOVA 4 forcé : des eaux minérales affichées « à éviter »

`productToScoringInput` fait `const novaRaw = product.nova_group ?? 4` (`openfoodfacts.ts:279-280`). Le moteur contient pourtant un fallback conçu pour ce cas — `input.nova_group ?? classifyNova(ingredients, additives)` (`engine.ts:80`) — mais il est **inatteignable** : l'adaptateur coalesce à 4 avant le moteur, `nova_group` étant non-nullable dans `ScoringInput`. Le classifieur NOVA du projet (`nova-classifier.ts`) n'est jamais consulté sur le chemin de production.

Effet mesuré : 28/299 produits (9,4 %) ont `nova_group` absent chez OFF, **note moyenne 14,6/100**. Dont 14 eaux minérales, plafonnées à 30 puis amorties par l'emballage (sortie brute, section EAUX) :

- **PERRIER eau minérale gazeuse → 22/100** · **CONTREX → 19/100** · **Vittel → 20/100** · **Aquafina → 20/100**
- pendant que **Sidi Ali (nova=1) → 68/100** — et le dump jumeau Sidi Ali `6111035000430` (nova absent) → **18/100**. Même eau, même marque : 68 vs 18 selon qu'un contributeur OFF a rempli un champ.

**Signalement (règle de contradiction)** : le contexte de mission décrit le fil rouge comme « l'absence de donnée est traduite en absence de risque ». Ici c'est l'inverse — **l'absence de donnée est traduite en risque maximal** — et c'est tout aussi faux : une eau minérale affichée rouge « à éviter » trompe l'utilisateur sur la santé exactement comme un produit dangereux affiché vert. Les deux directions du même défaut racine coexistent dans le même fichier (`openfoodfacts.ts:279` punit, `:287-291` absout).

---

## 2) MAJEURS

### M1 — [PROUVE] Le biais packaging « absence de donnée = absence de malus » : invisible en moyenne globale, +14,3 pts là où il compte

C'est LE chiffre demandé par l'amendement 4 — il faut le lire en deux temps :

- **Écart brut (a)−(b)** : moyenne **+0,39 pt**, médiane **0,0 pt** (20,97/7,0 vs 20,58/7,0). Apparemment négligeable.
- **Mais cet écart est dilué mécaniquement** : 53,5 % de la distribution est au plancher [0-9], où l'amortissement D3 (`malus × formulation/100`, `composite-score.ts:168`) rend le malus ≈ 0 quelle que soit la donnée. Le biais ne PEUT PAS apparaître en bas d'échelle.
- **Sur le haut de l'échelle (formulation ≥ 50, n=62)** — là où se jouent les tops de listes : produits AVEC packagings notés **66,5** en moyenne (médiane 68) ; produits SANS packagings notés **80,9** (médiane **100**). **Avantage moyen du produit non documenté : +14,3 pts.**
- Cas jumeau nominal : « Eau mineral 33cl aman » (sans packagings) → **100/100** vs Sidi Ali nova=1 (bouteille plastique documentée) → **68/100**. Formulations identiques (100). Dans le top 15, **4 des 10 produits à ≥ 90 sont des SANS-PACK** (aman, FAGE Total 0%, 2× Jaouda) — le podium est un podium de produits non documentés.

Proportion échappant au malus par absence de donnée : **32/299 (10,7 %)** sur OFF live. **Limite assumée** : l'app passe par le cache Supabase (`products.packaging_components`, migration 016 `DEFAULT '[]'`, sans backfill) — les lignes en cache d'avant migration ont `[]` même quand OFF documente l'emballage. **En production le biais est donc au moins égal, probablement supérieur, à ce que mesure cet échantillon live** (à recouper avec l'agent 1). S'ajoute la dette déjà documentée dans CLAUDE.md : les listes trient sur `score_final`, donc cet avantage de +14,3 pts est un avantage **de classement**.

### M2 — [PROUVE] Distribution écrasée au plancher ; le « zéro réservé aux blockers » est contredit par les faits

- **53,5 %** des produits (160/299) notés dans [0-9] ; **71 %** ≤ 29 ; médiane **7/100** ; moyenne 20,97.
- **43,8 % (131/299) affichent exactement 0** — et **90,1 % de ces zéros n'ont AUCUN additif bloquant** : le zéro par simple accumulation (plafond NOVA 70 + huile de colza 30 + macros) est la norme, pas l'exception.
- La bande **[70-79] est VIDE** (0 produit) et [80-89] n'en a qu'un : l'échelle affichée est de facto **{0 · ~20-30 · 62-68 · 94-100}**. Entre « à éviter » et « excellent », il n'existe pratiquement rien.
- Cas parlant : **Velouté de 12 légumes Liebig — 0 additif — noté 0/100**, strictement indiscernable d'un **Coca Zero à l'aspartame (blocker) noté 0/100** (dumps en annexe A). Un utilisateur ne peut pas distinguer « soupe de légumes avec huile de colza » de « produit à additif bloquant ».

**Ce constat contredit la doc projet** : le commentaire de `composite-score.ts:15-17` affirme « Le zéro reste RÉSERVÉ aux additifs bloquants (chemin `buildResult(0, …)`) ». L'équivalence note=0 ⟺ formulation=0 est vraie (vérifiée sur 299, cf. section 5), mais **« réservé aux blockers » est faux** : `engine.ts` atteint 0 par accumulation sur 118 produits sans blocker de l'échantillon. Le raisonnement qui justifie D3 (« un biscuit sous plastique ne devient jamais indiscernable d'un produit à l'aspartame ») est valable pour l'emballage mais son postulat sur le moteur est démenti — un velouté de légumes EST déjà indiscernable d'un produit à l'aspartame, sans emballage dans l'équation.

*(R4 respecté : je n'audite pas le bien-fondé du barème — NOVA 30, colza 30, sucres 2 pts/g sont des choix. Le constat est que leur COMPOSITION rend l'échelle non discriminante sur 3 des 6 catégories les plus scannées : sodas moyenne 0,9 · chocolats médiane 0 · céréales médiane 2,5.)*

---

## 3) MINEURS

### m1 — [PROUVE] Le malus emballage ne mord que sur les eaux
Conséquence chiffrée (non re-débattue) de l'amortissement D3 : malus > 0 sur **40,5 %** des produits globalement, mais **8,2 %** chez les sodas (couverts à 87,8 % !), car `malus × formulation/100` s'arrondit à 0 quand la formulation est au plancher. Malus médian de (b) = **0**. Par catégorie : eaux 86 % · yaourts 42 % · chocolats 38 % · plats 36 % · céréales 32 % · sodas 8,2 %. La bouteille PET d'un soda n'apparaît jamais dans sa note ; celle d'une eau, toujours. `composite-score.ts:168`.

### m2 — [PROUVE] `parsePortionGrams` ignore les litres et centilitres
`openfoodfacts.ts:146` : le regex n'accepte que `g|ml`. '1l' / '1 L' / '1,5L' / '0.33l' / '33 cl' → défaut 100 g (31 produits, 10,4 %), alors que '1000 ml' parse → **1 000 g** (HEPAR). Deux fiches de la même eau d'1 litre peuvent avoir une base macros ×10 différente selon l'unité saisie. (Composante aggravante de B1, ligne de code distincte.)

### m3 — [PROUVE (code) / HYPOTHESE (impact)] Macros absentes → 0 pénalité
`openfoodfacts.ts:287-291` traduit chaque nutriment absent en 0 → aucune pénalité — le défaut racine au sens strict. Dans CET échantillon l'impact mesuré est marginal : les `sugars_100g` absents concernent surtout des eaux (46/50), où 0 est la bonne réponse *par accident*. **Test qui trancherait** : échantillonner des produits sucrés à `nutriments` incomplets (OFF `states_tags=en:nutrition-facts-to-be-completed` sur en:chocolates/en:sodas) et comparer leur note à leurs équivalents complétés.

### m4 — [PROUVE] Plafond 45 : atteint sur 1,1 % de (b) seulement
3/267 produits au plafond (`rawPoints ≥ 45`). La saturation théorique signalée par la mission (high 40 + contact 6 = 46 sature à un seul matériau) existe mais reste marginale en pratique — aucun écrasement de l'échelle emballage observé.

### m5 — [PROUVE] Aucune garde de plausibilité sur la donnée OFF
Evian `serving_size='1g'` → portion 1 g (macros ÷100) ; eau Sidi Ali `sugars_100g=1.4` → −2,8 pts sur une eau minérale. Le pipeline absorbe des valeurs physiquement absurdes sans borne ni rejet (`openfoodfacts.ts:144-150,184`).

---

## 4) COSMETIQUES

### c1 — [PROUVE] Test TTL mort dans `readProductFromCache`
`openfoodfacts.ts:210-212` : `if (Date.now() - updated > CACHE_TTL_MS) return data as Product;` suivi de `return data as Product;` — les deux branches sont identiques. Sans effet (le staleness est réévalué par `getOrFetchProduct:250`), mais le code laisse croire à un comportement TTL qui n'existe pas ici.

### c2 — [PROUVE] Limites d'échantillonnage (pas un défaut app)
`countries_tags=france` + `sort_by=popularity_key` sur fr.openfoodfacts.org place plusieurs produits maghrébins en tête (Sidi Ali, Aïn Atlas, Jaouda — référencés comme vendus en France). 1 doublon inter-catégories (299 uniques/300). Sodas et plats n'ont AUCUN produit NOVA 1-2 dans l'échantillon → l'analyse d'inversion y est structurellement vide.

---

## 5) Vérifié et SAIN (avec preuves)

1. **Ancre Cristaline reproduite à l'identique** — dump `3268840001008` : formulation 100, PET −32 + HDPE −6 = malus 38 → **62/100**, conforme au calibrage documenté (`scoring-rules.ts:31-33`) et à CLAUDE.md. Le pipeline live reproduit le test d'ancrage.
2. **Zéro inversion NOVA 4 > NOVA 1-2 (nova brut OFF, intra-catégorie)** sur 299 produits — 0 paire sur les 6 catégories. L'inversion redoutée par la mission est **absente** : le plafond NOVA 30 écrase tellement les NOVA 4 qu'aucun ne repasse devant un NOVA 1-2. Les inversions réelles passent par d'autres canaux (B1, B2, M1). *(Réserve c2 : sodas/plats sans NOVA 1-2 échantillonnés.)*
3. **L'emballage n'entre pas dans `penalties[]`** — tous les dumps montrent `penalties` (nova/additive/macro/seed_oil) et `factor:packaging` strictement séparés ; `penalties_snapshot`/« exposition toxique » n'est pas contaminé (conforme `composite-score.ts:25-31`).
4. **note = 0 ⟺ formulation = 0 dans la couche composite** — aucun des 299 produits n'a été amené à 0 par l'emballage (les 131 zéros ont tous formulation 0 ; propriété D3 vérifiée empiriquement, `composite-score.ts:169-171`).
5. **`recyclable: null` ne surcharge jamais** — lecture `packaging-modifier.ts:77` (`=== false` strict) + aucun facteur fantôme observé ; HEPAR (2 composants inertes) → malus brut 0, aucune ligne.
6. **Somme des `factors` = note affichée** — vérifié sur tous les dumps (ex. Cristaline 100 − 32 − 6 = 62) ; la répartition plus-fort-reste tient.
7. **Couverture `packagings[]` : 89,3 %** sur OFF live — cohérente avec les 85 % documentés lors du changement de source ; le search v2 renvoie le champ (pas de dégradation silencieuse de la source).
8. **Le pipeline rejoué est bien celui de prod** — les 4 maillons sont les exports de production, aucune logique réimplémentée ; `tsc --noEmit` clean avec le runner inclus ; profil standard `{type:'standard', allergies:[], intolerances:[]}`.

---

## 6) Réponses aux questions de mission

- **La distribution est-elle écrasée ?** OUI, massivement — par le bas : 53,5 % dans [0-9], médiane 7/100, [70-79] vide. L'échelle 0-100 fonctionne comme un ternaire {0, ~25, ~65} + îlot 100. (M2)
- **Les inversions sont-elles systémiques ou marginales ?** Les inversions NOVA brutes sont **inexistantes** (0 paire). Les inversions PAR DONNÉE sont **systémiques** : serving_size (B1 — chocolat moins sucré noté 0 vs 36), nova absent (B2 — Perrier 22 vs Sidi Ali 68), packagings absents (M1 — aman 100 vs Sidi Ali 68).
- **Quelle proportion échappe au malus par ABSENCE de donnée ?** 10,7 % (32/299) sur OFF live ; +14,3 pts d'avantage moyen sur formulation ≥ 50 ; probablement davantage en prod via le cache Supabase non backfillé (limite documentée, recoupement agent 1).
- **Le plafond 45 est-il souvent atteint ?** Non : 1,1 % de (b). La saturation « un seul matériau high au contact » reste théorique.

---

## Annexes

### A — Sortie console BRUTE du runner (collée telle quelle)

Commande : `npx jest --runTestsByPath audit/sample-runner.ts --testEnvironment=node --testMatch '**/audit/sample-runner.ts'`
*(Note d'exécution : `--runTestsByPath` seul refuse un fichier sans `.test.` — jest filtre aussi sur `testMatch` ; l'override CLI `--testMatch` ne modifie aucune config du repo.)*

```text
