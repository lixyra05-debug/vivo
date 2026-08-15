# Audit 01 — Cohérence des scores entre écrans

Agent 1 · 2026-08-14 · HEAD `45678fa` (arbre propre, aucune modification de source effectuée)

---

## RÉPONSE À LA QUESTION DÉCISIVE (Amendement 2)

**OUI, le cache se régénère avec les packagings. Le bug « 100 sur la liste / 62 sur la fiche » est TEMPORAIRE (fenêtre 7 jours) et se résorbe seul.**

Preuves (SELECT Supabase, clé masquée `<ANON_KEY>`, sorties brutes en annexe A) :

1. **La ligne Cristaline est un millésime pré-bascule encore frais.** `updated_at = 2026-08-12T16:31:29.555Z` avec `packaging_components: []`. Or le lot « packaging entre dans le score » est le commit `45678fa` du **2026-08-13 18:15:56 +0200** (git log, annexe E). La ligne a donc été écrite **la veille** de la bascule, par un build dont le payload d'upsert ne contenait pas `packaging_components` — la colonne (migration 016, backfill `'[]'`) est restée à sa valeur par défaut tandis que `updated_at` était bumpé. Fraîche (< 7 j), elle est servie telle quelle par `getOrFetchProduct` (`openfoodfacts.ts:249-250`) → `composeScore(…, [])` → aucun malus → 100.
2. **Le chemin d'écriture actuel fonctionne.** Les 15 écritures les plus récentes (2026-08-14 07:42) portent TOUTES des `packaging_components` non vides (1 à 6 composants, annexe A.2) — dont une autre Cristaline (`3254380008430`, 2 composants). **Zéro** ligne écrite après la bascule (`updated_at ≥ 2026-08-13T16:15Z`) n'a de components vides (annexe A.4).
3. **OFF fournit bien la donnée au chemin d'écriture.** `fetchProductByBarcode` télécharge sans filtre `fields=` (`openfoodfacts.ts:46`), et le payload OFF de `3274080005003` contient `packagings[]` : PET bouteille (food_contact 1) + HDPE bouchon (food_contact 1) + étiquette plastique (food_contact 0) — annexe B. `normalizeOFFProduct` les écrit dans `packaging_components` (`openfoodfacts.ts:192`).

**Échéance** : la ligne Cristaline devient périmée le **2026-08-19 ~16:31 UTC** (TTL 7 j, `openfoodfacts.ts:12` + `isCacheStale:215-218`) → refetch OFF → réécriture avec components → la liste affichera 62. Globalement, **45 lignes** « fraîches et vides » subsistent (annexe A.3, borne supérieure — certaines n'ont légitimement pas de packagings côté OFF) ; la dernière expire au plus tard le **2026-08-20 ~16:15 UTC** (7 j après la dernière écriture pré-bascule possible).

**Ce comportement est conforme à la fenêtre documentée** dans `supabase/migrations/016_products_packaging_components.sql:17-19` : *« Les lignes déjà en cache reçoivent '[]' et se corrigent d'elles-mêmes au prochain rafraîchissement (TTL 7 jours). Pendant cette fenêtre un classement sous-pénalise ; il ne sur-pénalise jamais. »* Ce n'est donc PAS un chemin d'écriture cassé — c'est la transition assumée, observée en plein milieu de sa fenêtre. Réserve : la clause « 7 jours » suppose OFF disponible au moment du refresh (voir MIN-4).

### Verdict des hypothèses

| Hypothèse | Verdict | Preuve |
|---|---|---|
| H1 — l'endpoint de recherche ne renvoie pas packagings | **[PROUVE] vraie factuellement, INFIRMÉE comme cause** | `buildCategoryUrl` demande `fields=code,product_name,brands,image_url` (`search.ts:126-134`) — reproduction curl en annexe C : la réponse ne contient que ces 4 champs. Mais ils ne servent qu'à la tuile (nom/marque/image) ; le produit scoré vient de `getOrFetchProduct` (`top-by-category.ts:65`), pas de la recherche. |
| H2 — ligne cache fraîche d'un millésime antérieur | **[PROUVE] CONFIRMÉE** | Ligne DB `updated_at 2026-08-12` + `packaging_components: []` (annexe A.1), bascule le 2026-08-13 18:15 (annexe E), TTL 7 j (`openfoodfacts.ts:12`). |
| H3 — l'écriture échoue malgré la colonne présente | **[PROUVE] INFIRMÉE** | Les écritures post-bascule (14/08 07:42) contiennent toutes les components (annexe A.2/A.4). L'écriture du 12/08 a réussi (updated_at bumpé) donc l'auteur était `authenticated` — RLS (`012_security_fixes.sql:18-24`) n'a pas bloqué. Le chemin d'échec silencieux existe (`openfoodfacts.ts:226`) mais n'est pas la cause ici (voir MIN-1). |

---

## 0) Tableau récapitulatif

| Sévérité | Statut | Constat | Fichier:ligne |
|---|---|---|---|
| MAJEUR | [PROUVE] | Fenêtre transitoire : listes (top/catégorie/enseigne) affichent la formulation seule (100) vs fiche 62 pour les ≤45 lignes cache pré-bascule encore fraîches — **conforme à la décision documentée** (migration 016), se résorbe seul ≤ 20/08 | `openfoodfacts.ts:249-250` + `016_…sql:17-19` |
| MAJEUR | [PROUVE] | Race à l'historisation : `recordScan` enregistre le score composé depuis le fallback cache AVANT la résolution de `packagingsQuery` → scan_history peut recevoir 100 quand la fiche affiche 62 (viole « score_at_scan = score montré ce jour-là ») | `app/product/[barcode].tsx:133-136, 146-164` |
| MAJEUR | [PROUVE] | Les descriptions de verdict attribuent 100 % des points perdus à la formulation et affirment « L'emballage… analysés séparément » alors qu'elles reçoivent la note COMPOSÉE — faux sur tout produit à malus emballage (Cristaline 62 → « Moyen : les pénalités relevées sur la formulation pèsent sensiblement » avec formulation 100/100) | `display-helpers.ts:108-146` ← `FoodProductView.tsx:94,157,169` |
| MAJEUR | [PROUVE] | L'écran « Comment Vivo note » publie une échelle Excellent ≥80 / Bon ≥60 / Moyen ≥40 / À éviter ≥20 qui contredit le verdict de la fiche (90/70/50/25, avec un tier « Mauvais » absent de la méthodo) et les couleurs (70/50/25) | `transparency.ts:24-29` vs `display-helpers.ts:111-146` ; `methodology.tsx:177-180,345` |
| MAJEUR | [PROUVE] | « À éviter » = 3 définitions concurrentes : <50 (home), <40 (recap mensuel), <30 (historique, PDF, hebdo, stats profil, stats avancées) — le compteur home (24) n'est comparable à aucun autre écran | `useProductStore.ts:189` / `monthly-recap.ts:146` / `history.tsx:116` / `profile.tsx:184` / `weekly-summary.ts:100` / `profile-stats-engine.ts:121` / `advanced-stats.ts:33` |
| MINEUR | [PROUVE] | Échec d'upsert cache silencieux, sans breadcrumb ni logger (R5/M-001) — une panne d'écriture serait invisible | `openfoodfacts.ts:226` |
| MINEUR | [PROUVE] | `our_score`/`our_score_computed_at` : colonne morte, écrasée à NULL à chaque écriture ; 0/334 lignes non nulles en DB | `openfoodfacts.ts:195-196` ; annexe A.5 |
| MINEUR | [PROUVE] | `scoreToColor` du classement supermarchés : seuils 75/50/25 ≠ moteur 70/50/25 → à 70-74 vert sur la fiche, jaune sur le classement — échelle locale absente de la dette documentée | `store-ranking.ts:71-76` vs `engine.ts:26-31` |
| MINEUR | [PROUVE] | En panne OFF, `getOrFetchProduct` sert la ligne périmée (potentiellement empoisonnée) → la fenêtre « 7 jours » de la migration 016 peut s'étendre indéfiniment sous indisponibilité OFF (503 observé pendant l'audit) | `openfoodfacts.ts:253` |
| MINEUR | [PROUVE] | `readProductFromCache` : branche morte — les deux chemins du `if` retournent la même valeur | `openfoodfacts.ts:210-212` |
| COSMETIQUE | [PROUVE] | Couleurs PDF : 3 buckets (≥70 vert, ≥50 orange, rouge) — pas de jaune, un 55 est orange dans le PDF et jaune dans l'app | `generate-pdf.ts:64-66` |
| COSMETIQUE | [PROUVE] | Nom OFF vandalisé « isabelle » affiché verbatim partout (tuile + fiche + cache) — donnée amont OFF, aucune garde qualité nom | `TopByCategorySection.tsx:47-50` ; annexes A.1, B, C |
| COSMETIQUE | [PROUVE] | `history.tsx` duplique localement le mapping couleur du moteur (identique 70/50/25 — cohérent mais dupliqué) | `history.tsx:67-74` vs `engine.ts:26-31` |

---

## 1) BLOQUANTS

**Aucun.** Le candidat bloquant (chemin d'écriture du cache cassé → écart permanent liste/fiche) est **infirmé par preuve** : toutes les écritures postérieures à la bascule contiennent les `packaging_components` (annexe A.2/A.4), et la ligne Cristaline expire le 19/08. Le zéro reste réservé aux blockers, aucun écran ne sur-pénalise, et aucune fonction cœur n'est cassée.

---

## 2) MAJEURS

### MAJ-1 — [PROUVE] La fenêtre transitoire du cache : listes à 100, fiche à 62 (conforme décision documentée, se résorbe seul)

- **Mécanisme** : `getOrFetchProduct` sert la ligne Supabase si `updated_at` < 7 j (`openfoodfacts.ts:249-250`, TTL `:12`). La ligne `3274080005003` (annexe A.1) a été écrite le 2026-08-12T16:31Z — la veille du commit `45678fa` (13/08 18:15) — par un build dont le payload ne comportait pas `packaging_components` : la colonne est restée au backfill `'[]'` de la migration 016. Toutes les listes composent alors avec `[]` → aucun malus → 100. La fiche, elle, compose avec `packagingsQuery` (OFF direct, staleTime 24 h, `app/product/[barcode].tsx:105-110`) → PET+HDPE → 62.
- **Ampleur** : ≤ **45 produits** dans cet état (lignes fraîches à components vides, annexe A.3 — borne supérieure, ~15 % des produits OFF n'ont légitimement pas de `packagings[]`). 302/334 lignes du cache sont encore au millésime pré-bascule mais PÉRIMÉES : elles seront refetchées à la première demande et n'affichent donc rien de faux.
- **Statut décisionnel** : c'est exactement la fenêtre **documentée et assumée** par `016_products_packaging_components.sql:17-19` (« sous-pénalise, ne sur-pénalise jamais »). Le constat est classé MAJEUR parce que l'écart est visible par l'utilisateur (100 vs 62 sur le même produit, le défaut racine « absence de donnée = absence de risque » à l'écran), mais il ne requiert AUCUNE correction de code : il expire de lui-même (Cristaline : 19/08 ~16:31 UTC ; dernier produit : ≤ 20/08 ~16:15 UTC). Réserve : voir MIN-4 (panne OFF prolonge la fenêtre).

### MAJ-2 — [PROUVE] Race `recordScan` : l'historique peut enregistrer un score que la fiche contredit à l'écran

- `app/product/[barcode].tsx:133-136` : `packagings = packagingsQuery.data ?? productQuery.data?.packaging_components ?? []` — fallback cache tant qu'OFF n'a pas répondu.
- `:138-144` : `result` (composé) devient non-null dès que `productQuery.data` arrive.
- `:146-164` : l'effet `recordScan` se déclenche au PREMIER `result` non-null et verrouille `scanRecorded` (`:148`). Sur le chemin cache-hit, la lecture Supabase résout avant le fetch OFF de `packagingsQuery` → le score historisé (`:152`, `result.score_final`) est calculé avec le fallback. Quand `packagingsQuery` arrive, `result` est recalculé (la fiche affiche 62) mais `scanRecorded === true` : aucune correction.
- **Conséquence concrète** : pendant la fenêtre MAJ-1, ouvrir la fiche Cristaline historise `score_at_scan = 100` alors que l'écran finit sur 62. Cela contredit la définition documentée « `score_at_scan` est par définition le score montré ce jour-là » (CLAUDE.md, section scan_history) et contamine tous les consommateurs de l'historique (score moyen, À éviter, recap, PDF, badges). Hors fenêtre, l'écart ne survient que si les `packagings` OFF ont changé depuis la mise en cache (≤ 7 j de dérive) — rare mais structurel.
- **Non documenté** : c'est une incohérence NOUVELLE, pas la discontinuité assumée (qui couvre les scans ANTÉRIEURS à la feature, pas les scans postérieurs mal historisés).

### MAJ-3 — [PROUVE] Les textes de verdict décrivent une note 100 % formulation… en recevant la note composée

- `FoodProductView.tsx:94` : `getScoreVerdict(result.score_final)` — `result` est le `CompositeScoringResult` (composé au routeur, `app/product/[barcode].tsx:140-144`). Label affiché en gros sous le ScoreCircle (`:157`), description dessous (`:169`).
- `display-helpers.ts:125-130` (branche ≥50) : *« Les pénalités relevées sur la formulation pèsent sensiblement sur le score. »* Pour la Cristaline à 62, la formulation est à **100/100, zéro pénalité** — les 38 points viennent de l'emballage. La phrase est factuellement fausse. Idem branche ≥25 (`:132-138`, « Plus de la moitié des points sont retirés par les pénalités de formulation ») et <25 (`:140-145`).
- `display-helpers.ts:111-116` (branche ≥90) : *« L'emballage et la maison-mère sont analysés séparément. »* — faux pour les aliments depuis août 2026 : l'emballage est DANS la note.
- **Le commentaire du fichier lui-même (`display-helpers.ts:100-106`) contredit l'architecture actuelle** : *« le score ne mesure que la FORMULATION. L'emballage et la maison-mère sont analysés par d'autres sections »* et *« à un score donné correspond exactement `100 - score` points de pénalité »* — cet invariant est cassé par `composeScore`. Ce module a été oublié par le lot d'août (la liste des libellés mis à jour dans CLAUDE.md ne le mentionne pas).

### MAJ-4 — [PROUVE] L'écran de transparence publie une échelle que la fiche n'utilise pas

- `transparency.ts:24-29` (food) et `:63-68` (cosmetic) : `excellent: 80, good: 60, mediocre: 40, bad: 20`. Rendu par `methodology.tsx:177-180` en pills `≥80 / ≥60 / ≥40 / ≥20` avec labels **Excellent / Bon / Moyen / À éviter** (`ThresholdPill`, `:345` affiche `≥{min}`).
- La fiche utilise `getScoreVerdict` (`display-helpers.ts:111-146`) : **Excellent ≥90 / Bon ≥70 / Moyen ≥50 / Mauvais ≥25 / À éviter <25**.
- Contradictions directes : un produit à 82 est « Excellent » selon la méthodo, « Bon » sur la fiche ; un 45 est « Moyen » selon la méthodo, « Mauvais » sur la fiche ; un 22 est « À éviter » selon la méthodo… et aussi sur la fiche, mais pour la méthodo « À éviter » commence à ≥20, ce qui laisse 0-19 sans catégorie. Le tier « Mauvais » n'existe pas dans la méthodo. Les couleurs (`engine.ts:26-31` : 70/50/25) sont une troisième grille.
- L'écran dont l'unique raison d'être est d'expliquer la note (« Comment ce score est calculé ? » pointe dessus, `FoodProductView.tsx:189-198`) contredit la note. Non couvert par la dette documentée (qui ne liste que `ScoreComparison`).

### MAJ-5 — [PROUVE] « À éviter » : trois définitions concurrentes, même libellé

| Surface | Seuil | Fichier:ligne |
|---|---|---|
| Home StatsRow (« À éviter » = 24 observé) | **< 50** | `useProductStore.ts:189` (label `StatsRow.tsx:50`) |
| Recap mensuel (« à éviter ») | **< 40** | `monthly-recap.ts:146` (label `recap/monthly.tsx:349`) |
| Historique (filtre « À éviter » + insight %) | **< 30** | `history.tsx:116,123,151` |
| Export PDF (productsAvoided) | **< 30** | `profile.tsx:184` |
| Notification hebdo | **< 30** | `weekly-summary.ts:100` |
| Stats profil | **< 30** | `profile-stats-engine.ts:121` |
| Stats avancées (bucket `bad`) | **< 30** | `advanced-stats.ts:33` |

Le même utilisateur lit « 24 À éviter » sur la home, un autre chiffre dans son recap, un troisième dans son historique — sans qu'aucun écran ne définisse son seuil. S'y ajoute « excellent » : ≥75 (recap, `monthly-recap.ts:147`) vs ≥80 (PDF `profile.tsx:186`, stats profil) vs ≥85 (bucket advanced-stats). Biais systémique de libellé, antérieur au lot packaging mais au cœur du périmètre cohérence.

---

## 3) MINEURS

### MIN-1 — [PROUVE] Échec d'upsert cache totalement silencieux
`openfoodfacts.ts:220-228` : `if (error) return product;` — aucun `logger.warn`, aucun breadcrumb (le module en a pourtant l'infrastructure depuis M-001). Si une écriture échoue (RLS pour un user non authentifié, colonne manquante, contrainte), l'affichage reste correct (l'objet mémoire normalisé est servi) mais le cache cesse de se remplir **sans aucun témoin**. C'est précisément le genre de panne que cet audit a dû exclure par requêtes DB faute de logs.

### MIN-2 — [PROUVE] `our_score` : colonne morte, réécrite NULL à chaque refresh
`normalizeOFFProduct` fixe `our_score: null, our_score_computed_at: null` (`openfoodfacts.ts:195-196`, idem cosmétique `openbeautyfacts.ts:97-98`) et `writeProductToCache` upserte l'objet entier → même si quelqu'un calculait un jour la colonne, elle serait écrasée au refresh suivant. Vérifié en DB : **0/334** lignes avec `our_score` non null (annexe A.5). Personne ne la lit pour l'affichage (grep annexe D). Colonne piège : un futur consommateur pourrait croire y trouver la note.

### MIN-3 — [PROUVE] Cinquième échelle de couleurs dans le classement supermarchés
`store-ranking.ts:71-76` : `scoreToColor` local à seuils **75/50/25** vs `engine.getScoreColor` **70/50/25** (`engine.ts:26-31`). Une moyenne d'enseigne à 72 est jaune ici, verte partout ailleurs. La dette documentée ne recense que `ScoreComparison` comme « quatrième échelle » — celle-ci est une cinquième, non documentée. (L'axe lui-même — proxy Nutri-Score — est annoncé honnêtement à l'écran, `store-ranking.tsx:90`.)

### MIN-4 — [PROUVE] La clause « 7 jours » de la migration 016 suppose OFF disponible
`openfoodfacts.ts:252-253` : si le refetch OFF échoue (`fetchProductByBarcode` → null sur timeout/503), `getOrFetchProduct` retourne la ligne périmée (`return cached ?? null`) — y compris une ligne empoisonnée à `[]`. Sous indisponibilité OFF prolongée, les listes continueraient d'afficher la formulation seule au-delà de la fenêtre. Non théorique : un 503 « Page temporarily unavailable » a été reçu PENDANT cet audit sur l'endpoint search (annexe C). Comportement de dégradation par ailleurs raisonnable — mais la promesse « se corrigent d'elles-mêmes » de `016:17-19` est conditionnelle, pas absolue.

### MIN-5 — [PROUVE] Branche morte dans `readProductFromCache`
`openfoodfacts.ts:210-212` : `if (Date.now() - updated > CACHE_TTL_MS) return data as Product; return data as Product;` — les deux chemins retournent la même chose. La staleness est en réalité décidée par `isCacheStale` dans `getOrFetchProduct`. Sans effet runtime, mais le code laisse croire qu'un tri fraîcheur a lieu ici.

---

## 4) COSMETIQUES

- **COS-1** — `generate-pdf.ts:64-66` : palette PDF à 3 crans (≥70 vert, ≥50 orange, sinon rouge) — le jaune (50-69 in-app) n'existe pas dans le PDF ; un 55 change de couleur entre l'app et le rapport médecin. [PROUVE]
- **COS-2** — Nom produit « isabelle » : c'est la donnée OFF elle-même (`product_name: "isabelle"` sur l'API produit ET l'API search, annexes B/C — vraisemblablement une saisie vandalisée en amont). Vivo l'affiche verbatim sur la tuile (`TopByCategorySection.tsx:47-50`, fallback uniquement si vide), la fiche et le cache (`row.name`, annexe A.1). Aucune garde de qualité nom (ex. heuristique « nom ≠ marque, initiale majuscule ») — hors périmètre score, à arbitrer produit. [PROUVE]
- **COS-3** — `history.tsx:67-74` : mapping couleur local recopiant les seuils du moteur (70/50/25). Aujourd'hui identique donc inoffensif, mais c'est une duplication qui divergera silencieusement au premier changement du moteur (le littéral `ScoringResult` de ce fichier est documenté, la duplication de `getScoreColor` ne l'est pas). [PROUVE]

---

## 5) VÉRIFIÉ ET SAIN (avec preuves)

**Mission 2 — le tableau des surfaces.** Chaque surface, son axe, la source du nombre :

| Surface | Axe affiché | Source du nombre (fichier:ligne) |
|---|---|---|
| Home « Top par catégorie » | **COMPOSÉ** | `top-by-category.ts:67-75` (`composeScore(calculateScore(…), product.packaging_components)`, score = `scoring.score_final`). La reconnaissance de l'orchestrateur est exacte. **Nom de la tuile = `item.result.name` (SearchResult OFF live, `TopByCategorySection.tsx:47-50`) ; score = Product du cache Supabase** — deux sources pour une même tuile, mais « isabelle » est identique des deux côtés (annexes A.1/C). |
| Catégorie | **COMPOSÉ** | `app/category/[slug].tsx:67-70` ; tri sur `score_final` `:112` (limite documentée « absence de donnée avantage » — conforme dette CLAUDE.md, non re-signalée) |
| Enseigne | **COMPOSÉ** | `app/store/[slug].tsx:61-64` ; tri `:84` (même limite documentée) |
| Classement supermarchés | **NI l'un ni l'autre — proxy Nutri-Score** (A=90…E=10), annoncé à l'écran | `store-ranking.ts:54-60,118-128` ; libellé honnête `store-ranking.tsx:90` |
| Fiche produit | **COMPOSÉ** | `app/product/[barcode].tsx:140-144` ; packagings = OFF direct (24 h) ?? cache ?? `[]` (`:133-136`) |
| Scan Choc | **COMPOSÉ** (l'image partagée = la note de la fiche) | `app/scan-choc/[barcode].tsx:157-163` |
| Historique | **HISTORISÉ** (`score_at_scan`) | `history.tsx:66` (littéral `ScoringResult` documenté) — conforme décision scan_history |
| Favoris | **HISTORISÉ** | `favorites.tsx:54` (`score={item.score_at_scan}`) — conforme |
| Alternatives | Axe de comparaison = **FORMULATION** (D14) ; scores candidats = proxy Nutri-Score (design documenté) | `FoodProductView.tsx:83-87` (`formulationScore ?? result.score_final`) ; `scan-choc/[barcode].tsx:179-183` (avec commentaire explicite) ; garde `alternatives-axis.test.ts` présente sur les DEUX appelants ✓ |
| ScoreComparison | **COMPOSÉ** (cohérent fiche) | `FoodProductView.tsx:209` ; la dette documentée (légende « Danger » `:77`, palette v1 `:67`) est toujours présente à l'identique — conforme dette, non re-signalée |
| ScoreBreakdownChart | **FORMULATION** (ses barres décomposent la formulation — conforme doc) | `FoodProductView.tsx:260-262` (`finalScore={formulationScore ?? result.score_final}`) ; le routeur passe bien `formulationScore={result.formulationScore}` (`[barcode].tsx:403`) |
| ScoreFactorsCard | **COMPOSÉ + décomposition exacte** | `FoodProductView.tsx:202-206` ; Σ factors = score_final garanti par plus-fort-reste (`composite-score.ts:87-131`) ; factors passés du routeur (`[barcode].tsx:404`) |
| Export PDF | **HISTORISÉ** | `profile.tsx:176-194` (moyenne, <30, ≥80, top 5 asc/desc sur `score_at_scan`) — conforme décision |
| Stats avancées | **HISTORISÉ** | `advanced-stats.ts` (buckets sur `score_at_scan`) — conforme |
| Vivo Recap | **HISTORISÉ** | `monthly-recap.ts:146-147` — conforme |
| Notification hebdo | **HISTORISÉ** | `weekly-summary.ts:100` — conforme |
| Cache `products.our_score` | **JAMAIS ÉCRIT** (toujours NULL — voir MIN-2) ; aucune surface ne l'affiche | `openfoodfacts.ts:195` ; annexe A.5 |
| Cosmétiques | **FORMULATION SEULE, étiquetée comme telle** (D4 appliquée) | aucune trace de `composeScore` dans `CosmeticProductView` ; `CosmeticResultView.tsx:113` passe `SCORE_LABEL_FORMULATION` ✓ |
| Explore (résultats de recherche) | **Aucun score affiché** (tuiles nom/marque/image) | `explore.tsx` — grep « score » vide sur le rendu résultats |

**Mission 3 — le cache** :
1. `writeProductToCache` écrit bien `packaging_components` : l'objet `Product` entier est upserté (`openfoodfacts.ts:220-228`) et `normalizeOFFProduct:192` remplit le champ depuis `off.packagings` — **prouvé en conditions réelles** par les 15 écritures du 14/08 toutes non vides (annexe A.2).
2. Les listes lisent ce cache via `readProductFromCache` en `select('*')` (`openfoodfacts.ts:203-208`) → `packaging_components` inclus.
3. Un produit déjà en cache affiche le bon score **si sa ligne est post-bascule** (32 lignes aujourd'hui, et 100 % des écritures nouvelles) ; les lignes pré-bascule périmées se corrigent au premier affichage ; seules les ≤45 « fraîches et vides » affichent la formulation seule jusqu'à expiration (MAJ-1).

**Mission 4 — scan_history** :
- Le score historisé est **composé depuis la bascule** : `recordScan` reçoit `result.score_final` composé (`app/product/[barcode].tsx:152`) — modulo la race MAJ-2.
- **SCORE MOYEN (53)** : `useUserStats` — moyenne arithmétique de TOUS les `score_at_scan` (toutes époques, sans dédup) — `useProductStore.ts:188`, affichée par `StatsRow.tsx:48` via `formatStats` (`formatters.ts:25-34`). Mélange millésimes formulation (pré-août) et composés (post-août) : **conforme à la discontinuité documentée et assumée** (pas de backfill, pas de falsification de l'historique).
- **À ÉVITER (24)** : `useProductStore.ts:189` — comptage `score_at_scan < 50`, affiché `StatsRow.tsx:50`. La provenance est saine ; le SEUIL est l'incohérence nouvelle MAJ-5 (non couverte par la décision de discontinuité, qui ne parle que des millésimes).
- Le composé n'entre PAS dans `penalties[]` → `penalties_snapshot` et l'« exposition toxique » d'advanced-stats ne comptent aucun emballage comme additif : `composeScore` hérite `penalties` intact par spread (`composite-score.ts:149-163,177-186`) ✓ conforme doc.

**Autres points vérifiés sains** :
- La formule affichée par la méthodo mentionne l'emballage : *« Note = Formulation ajustée selon l'emballage »* (`transparency.ts:15-16`) — le lot d'août a bien mis à jour CETTE partie (contrairement aux verdicts, MAJ-3, et aux seuils, MAJ-4).
- RLS `products` conforme au design : SELECT public, INSERT/UPDATE `authenticated` (`012_security_fixes.sql:14-24`) ; les écritures observées passent (annexe A.2).
- `composeScore` : propriétés du modèle respectées sur le cas réel — Cristaline formulation 100, malus brut 38 (PET 26+6, HDPE 0+6, étiquette exclue par `food_contact: 0`), amorti ×1.0 → **62**, exactement la fiche. Le zéro reste réservé (`composite-score.ts:169-171`, `Math.max(0, …)` n'écrase jamais une formulation > 0 en 0 : 38 % de 100 max).
- `normalizePackagings` fidèle au payload OFF réel (annexe B → 3 composants, `packaging-risks.ts:413-426`).
- Auto-toast Scan Choc : seuil <40 sur la note composée (`FoodProductView.tsx:64,102`) — cohérent avec l'écran scan-choc qui affiche la même note composée.

---

## 6) ANNEXES — sorties brutes

Clé anon systématiquement masquée `<ANON_KEY>`. Commande type :
`curl -s "$SUPA_URL/rest/v1/products?…" -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"`

### A.1 — Ligne cache Cristaline (SELECT du 2026-08-14)

```json
[{"barcode":"3274080005003","name":"isabelle","brand":"Cristaline",
  "packaging_components":[],
  "off_last_updated":"2026-08-12T16:31:29.555+00:00",
  "our_score":null,
  "created_at":"2026-04-26T21:50:21.848+00:00",
  "updated_at":"2026-08-12T16:31:29.555+00:00"}]
```

### A.2 — 15 dernières écritures `products` (order=updated_at.desc)

```
2026-08-14T07:42:48.114+00:00 20995553      'Шоколад 85% какаова маса'      components: 2
2026-08-14T07:42:45.119+00:00 3067140037898 'Chicoree soluble nature bio'   components: 3
2026-08-14T07:42:45.092+00:00 4056489028109 'Shot de gingembre bio'         components: 1
2026-08-14T07:42:45.09+00:00  3124480184344 'Orangina et sa pulpe'          components: 1
2026-08-14T07:42:19.138+00:00 5449000267412 'Coca-Cola goût original'       components: 3
2026-08-14T07:42:19.136+00:00 3033710065967 'NESQUIK Cacao'                 components: 3
2026-08-14T07:42:19.136+00:00 3229820181424 'Boisson Noisette'              components: 2
2026-08-14T07:42:19.132+00:00 3033710003228 'RICORÉ® aux céréales…'         components: 6
2026-08-14T07:42:19.129+00:00 3033710077274 'NESCAFÉ NES, Café Soluble…'    components: 3
2026-08-14T07:42:19.092+00:00 4056489997511 'Bio Hafer'                     components: 2
2026-08-14T07:42:19.092+00:00 9002515601018 'Pago Ace - Orange - Carotte'   components: 2
2026-08-14T07:42:19.091+00:00 3229820783338 'Épeautre noisette'             components: 2
2026-08-14T07:42:19.088+00:00 5449000232311 'FuzeTea Thé noir glacé…'       components: 1
2026-08-14T07:42:19.053+00:00 3034470003107 'Benco Original'                components: 3
2026-08-14T07:42:19.048+00:00 3254380008430 'CRISTALINE Eau De Source Pét…' components: 2
```

### A.3 — Comptages (`Prefer: count=exact`)

```
products (total)                                        → content-range: 0-0/334
products?packaging_components=neq.[]                    → content-range: 0-0/32
products?updated_at=gte.2026-08-07&pc=eq.[]  (fraîches vides) → content-range: 0-0/45
```

### A.4 — Écritures POST-bascule à components vides

```
products?updated_at=gte.2026-08-13T16:15:00Z&packaging_components=eq.[]  → []   (zéro ligne)
```

### A.5 — `our_score` non null

```
products?our_score=not.is.null → content-range: */0   (0 ligne sur 334)
```

### B — OFF produit 3274080005003 (fr.openfoodfacts.org, sans filtre fields, UA Vivo-Audit/1.0)

```
status: 1
product_name: 'isabelle'
has packagings key: True
packagings: [
 {"food_contact":1, "material":"en:pet-1-polyethylene-terephthalate", "shape":"en:bottle", …},
 {"food_contact":1, "material":"en:hdpe-2-high-density-polyethylene", "shape":"en:bottle-cap", …},
 {"food_contact":0, "material":"en:plastic", "shape":"en:label", …}
]
nb keys: 334
```

### C — Reproduction exacte de `buildCategoryUrl('boissons')`

URL : `https://fr.openfoodfacts.org/api/v2/search?categories_tags=boissons&fields=code,product_name,brands,image_url&page_size=50&page=1`

```
HTTP 200
{"count":71864,"page":1,"page_count":50,"page_size":50,"products":[
  {"brands":"Cristaline","code":"3274080005003",
   "image_url":"https://images.openfoodfacts.org/images/products/327/408/000/5003/front_fr.1029.400.jpg",
   "product_name":"isabelle"}, …
```

→ La Cristaline est le **premier** résultat de la catégorie ; la réponse ne contient que les 4 champs demandés (pas de `packagings`). NB : un premier appel identique avait renvoyé une page HTML « Page temporarily unavailable » (503 OFF transitoire — cf. MIN-4).

### D — Writers/readers de `products` (grep hors tests/mocks)

```
src/lib/api/openfoodfacts.ts:205  .from('products')   (readProductFromCache, select('*'))
src/lib/api/openfoodfacts.ts:222  .from('products')   (writeProductToCache, upsert objet entier)
```
Aucun autre accès. `our_score` : écrit uniquement à null (openfoodfacts.ts:195, openbeautyfacts.ts:97), jamais lu pour l'affichage.

### E — Chronologie git

```
45678fa 2026-08-13 18:15:56 +0200 feat: le packaging entre dans le score (option A modérée) + décomposition visible
adca806 2026-08-13 17:56:57 +0200 test(home): neutralise la plante de la semaine — échec calendaire
427ae00 2026-08-12 23:07:45 +0200 fix: cohérence inter-features — vérification impossible, copy non prescriptif, source packaging
ccc5f18 2026-08-12 18:18:44 +0200 refactor(ui): design system v2 — ancre ink, échelle typo, ombres teintées, icônes lucide
```
Écriture de la ligne Cristaline : 2026-08-12T16:31Z (= 18:31 CEST) — antérieure au commit de la bascule.
