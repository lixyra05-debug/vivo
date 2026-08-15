# Audit Agent 2 — « Absence de donnée = absence de risque »

Dépôt : `/Users/volanthector/projects/vivo` · HEAD 45678fa · arbre propre · Audit de DÉTECTION, zéro correction appliquée.
Convention : chaque constat porte [PROUVE] (fichier:ligne ou sortie brute) ou [HYPOTHESE] (avec test discriminant).

---

## 0) Tableau récapitulatif

| Sévérité | Statut | Constat | Fichier:ligne |
|---|---|---|---|
| BLOQUANT | PROUVE | Allergies du profil principal stockées en libellés (`'Gluten'`, `'Fruits à coque'`, `'Œufs'`) inconnus de `ALLERGEN_KEYWORDS` (snake_case) → chaque allergie est silencieusement ignorée (`continue`), sans flag `insufficient_data` → bannière verte « Compatible avec votre profil » (verified) possible sur un produit contenant l'allergène | `app/onboarding/allergies.tsx:14`, `app/settings/health-profile.tsx:45`, `src/lib/scoring/compatibility-engine.ts:310-311` |
| BLOQUANT | PROUVE | `verificationStatus` vaut `'verified'` à tort : les conditions non-textuelles (diabete, bebe-food, hypertension, cholesterol) lisent `?? 0` sur des macros ABSENTES et `nova_group === 4` (null → false) sans jamais flaguer l'absence — réponse à l'amendement 3 = **cause (a)** | `src/lib/scoring/compatibility-engine.ts:393, 452-453, 468, 521, 533, 664` |
| BLOQUANT | PROUVE | Dette documentée CONFIRMÉE et circonscrite : le toggle « Compatibles » compte les produits non vérifiés (et, via le bloquant n°1, même les produits vérifiables jamais vérifiés) comme compatibles | `app/(tabs)/history.tsx:85`, `src/lib/scoring/profile-filters.ts:19`, `app/category/[slug].tsx:243,248`, `app/store/[slug].tsx:142,149` |
| MAJEUR | PROUVE (code) / HYPOTHESE (scénario) | `allergens_tags` et `traces_tags` OFF jetés à l'ingestion : la vérification allergène repose sur le seul texte libre | `src/lib/api/openfoodfacts.ts:170-201`, `src/lib/api/types.ts:77-109` |
| MAJEUR | PROUVE | Macros absentes = pénalité zéro dans le score : jusqu'à ~50 pts d'écart entre un NOVA 4 sans données sucres et le même renseigné (25 g × 2 pts/g), sans aucun marqueur d'incertitude sur le score | `src/lib/api/openfoodfacts.ts:287-291`, `src/lib/scoring/engine.ts:185-195, 197-209, 211-219` |
| MAJEUR | PROUVE | `additives_n` absent d'OFF coercé en 0 puis affiché « 0 additif » en vert sage sur les alternatives Premium — absence d'analyse rendue comme affirmation positive | `src/lib/api/smart-alternatives.ts:101-105`, `src/components/premium/AlternativeCard.tsx:34-37` |
| MINEUR | PROUVE | Tie-break du tri des alternatives (`additivesCount` asc) : l'absence de `additives_n` (→ 0) bat un produit documenté à 1 additif à score égal | `src/lib/api/smart-alternatives.ts:155-159` |
| MINEUR | PROUVE | `fakeResult.blockers: []` dans l'historique → le blocker bébé (« ingrédient bloquant ») ne peut jamais se déclencher dans le filtre historique | `app/(tabs)/history.tsx:79`, `src/lib/scoring/compatibility-engine.ts:475-486` |
| MINEUR | PROUVE | Profil `intolerant` : `profile.allergies?.includes('lactose')` échoue avec `'Lactose'` stocké (même racine que le bloquant n°1) — seules les intolérances (clés minuscules) fonctionnent | `src/lib/scoring/engine.ts:272-276`, `app/settings/health-profile.tsx:46-49` |
| MINEUR | PROUVE | `classifyNova('')` → 1 (plafond 100) — latent : inatteignable aujourd'hui car `ScoringInput.nova_group` est requis et `productToScoringInput` défaulte à 4, mais piégeux pour tout futur appelant | `src/lib/scoring/nova-classifier.ts:58`, `src/lib/api/types.ts:25`, `src/lib/api/openfoodfacts.ts:279-280` |
| MINEUR | PROUVE | Branche TTL morte dans `readProductFromCache` : les deux chemins renvoient la même valeur | `src/lib/api/openfoodfacts.ts:210-212` |
| COSMETIQUE | PROUVE | Label d'accessibilité « NOVA NOVA 4 » (novaLabel contient déjà « NOVA ») | `src/components/premium/AlternativeCard.tsx:59, 67` |
| COSMETIQUE | PROUVE | `fakeResult.nova_group: row.product.nova_group ?? 0` — 0 hors domaine 1-4 | `app/(tabs)/history.tsx:75` |

---

## AMENDEMENT 3 — Verdict : cause (a), avec une contradiction de prémisse

### Le tracé complet (chaque maillon prouvé)

1. **Appelant** — `app/product/[barcode].tsx:314-317` : `userProfileToCompatibilityProfile(profile)` puis `checkCompatibility(product, result, compatProfile)`. Rendu à `:391-395` : `<CompatibilityBanner result={compatibilityResult} />`.
2. **Bannière** — `src/components/product/CompatibilityBanner.tsx:88` lit `result.verificationStatus === 'insufficient_data'` et `:106-121` rend bien le 3ᵉ état neutre « Vérification impossible ». **La cause (b) est EXCLUE : la bannière tient compte de `verificationStatus` sur ce chemin.** La doc projet dit vrai sur ce composant.
3. **Moteur** — `src/lib/scoring/compatibility-engine.ts:664` : `verificationStatus: dataInsufficientFlagged ? 'insufficient_data' : 'verified'`. Or `flagInsufficientData()` (`:298-306`) n'est appelé QUE derrière des gardes `!hasText` (`:312, :335, :411, :424, :439, :489, :502, :604`) — c'est-à-dire uniquement pour les critères qui inspectent le TEXTE d'ingrédients.

### Donc `'verified'` est produit à tort dans DEUX cas, tous deux prouvés

**Cas 1 — clés d'allergènes cassées (bloquant n°1).** `compatibility-engine.ts:309-311` :

```ts
for (const allergy of profile.allergies) {
  const keywords = ALLERGEN_KEYWORDS[allergy];
  if (!keywords) continue;          // ← skip TOTALEMENT silencieux
```

`ALLERGEN_KEYWORDS` (`:63-91`) est indexé `gluten`, `lactose`, `arachides`, `fruits_a_coque`, `oeufs`, `soja`… Le profil principal stocke `'Gluten'`, `'Lactose'`, `'Arachides'`, `'Fruits à coque'`, `'Œufs'`, `'Soja'` (`app/onboarding/allergies.tsx:14` ET `app/settings/health-profile.tsx:45`), transmis verbatim : `useProfileStore.ts:84` → `upsertUserProfile` (`src/lib/api/auth.ts:143-158`, aucun mapping) → `profile-adapter.ts:30` (aucun mapping) → moteur. Lookup `ALLERGEN_KEYWORDS['Gluten']` → `undefined` → `continue`. Ni vérification, ni flag. Le seul critère restant est la barrière de score (`:621`, minScore 50) → tout produit ≥ 50 sort « Compatible avec votre profil », `verificationStatus: 'verified'`.

**Cas 2 — conditions non-textuelles jamais flaguées (bloquant n°2).** Profil `diabetic` → `conditions: ['diabete']` (`profile-adapter.ts:26`). Branche diabete (`compatibility-engine.ts:390-408`) : `product.sugars_100g ?? 0` (`:393`) — une donnée sucres ABSENTE vaut 0 g, aucun `flagInsufficientData`. Idem bebe-food (`:452-453` sel/sucres, `:468` `nova_group === 4` où null → pas de warning), hypertension (`:521`), cholesterol (`:533`). Résultat : « Compatible avec votre profil » vert, `'verified'`, sur un produit dont AUCUNE donnée nutritionnelle n'existe.

### État réel du produit 3274080005003 (curl live, annexe A)

**La prémisse de l'amendement (« n'a vraisemblablement aucune liste d'ingrédients ») est CONTREDITE par l'API OFF : `ingredients_text` vaut `"Eau de source"` (présent, non vide), `states_tags` contient `en:ingredients-completed`.** Nom OFF « isabelle » confirmé. `additives_tags: []`, `nova_group: 1`, `nutriscore_grade: "a"`. En revanche `nutriments` ne contient PAS `sugars_100g` ni `energy-kcal_100g` (seulement minéraux + `salt_100g: 0.00275` ; les sucres ne sont que dans `nutriments_estimated`, que `normalizeOFFProduct` ne lit pas — `openfoodfacts.ts:171, 183-184`).

Conséquences :
- Badge « Contribution communautaire » : cohérent — 5 critères sur 6 remplis, `energy_kcal_100g` absent (`src/lib/api/confidence.ts:57-61, 76-88`).
- Si le profil d'Hector a des allergies (profil principal) : le « Compatible » observé vient du **cas 1** — l'allergie n'a jamais été confrontée à quoi que ce soit, même avec un texte d'ingrédients présent.
- Si le profil est `diabetic`/`child` : le « Compatible » vient du **cas 2** — `sugars_100g` est null côté app (`nutriments['sugars_100g']` absent → `openfoodfacts.ts:184` → null → `?? 0`).
- Dans les deux cas `verificationStatus` ment (« verified ») ; le rendu final est identique à celui d'une vraie vérification passée. Un état stale du cache Supabase (ligne écrite avant complétion de la fiche OFF, `ingredients_raw` null) ne change pas ce verdict : avec allergies aux BONNES clés il donnerait « Vérification impossible » (correct) ; avec les clés cassées ou un profil conditions-only il donne « Compatible » — c'est l'état du cache que l'agent 1 peut trancher côté Supabase.

---

## 1) BLOQUANTS

### B1 — [PROUVE] Les allergies du profil principal ne sont JAMAIS vérifiées (mismatch de clés), et l'app affirme le contraire

- Stockage : `app/onboarding/allergies.tsx:14` et `app/settings/health-profile.tsx:45` → `const ALLERGENS = ['Gluten', 'Lactose', 'Arachides', 'Fruits à coque', 'Œufs', 'Soja'];` (libellés d'affichage utilisés comme valeurs stockées).
- Transport sans transformation : `src/lib/stores/useProfileStore.ts:84` → `src/lib/api/auth.ts:143-158` (upsert brut) → `src/lib/scoring/profile-adapter.ts:30` (pass-through).
- Consommation : `src/lib/scoring/compatibility-engine.ts:63-91` (clés snake_case minuscules) puis `:310-311` `if (!keywords) continue;` — le skip est silencieux, ne déclenche PAS `flagInsufficientData`.
- Rendu utilisateur : bannière verte « Compatible avec votre profil » (`CompatibilityBanner.tsx:124-143`) dès que le score passe la barrière `:621` ; toggles « Compatibles » de l'historique/catégorie/enseigne inertes pour ces allergies ; cas spécial sulfites via `additives_tags` (`:318-325`) inatteignable aussi.
- Contraste accablant : le formulaire FAMILLE utilise les BONNES clés — `app/family/edit.tsx:71-86` (`'gluten'`, `'fruits_a_coque'`, `'oeufs'`…, commentaire ligne 65 : « mêmes clés que compatibility-engine »). Le Mode Famille fonctionnerait ; le profil principal, celui branché partout (`product/[barcode].tsx:314`, `history.tsx:56`, `category:*`, `store:*`), ne fonctionne pas.
- Portée : les 6 allergènes proposés par le profil principal sont TOUS cassés. La règle projet « Les filtres allergènes sont GRATUITS » décrit une feature qui, pour le profil principal, est un no-op intégral.
- Test discriminant (sans rien modifier) : `checkCompatibility({ingredients_raw: 'farine de blé'}, résultat≥50, {allergies: ['Gluten'], …})` → `isCompatible: true`, `verificationStatus: 'verified'`. Avec `['gluten']` → blocker « Contient gluten ».

### B2 — [PROUVE] `verificationStatus: 'verified'` quand rien n'était vérifiable (réponse amendement 3 = cause (a))

- Le flag « données insuffisantes » n'est câblé QUE sur le texte d'ingrédients (`compatibility-engine.ts:298-306`, appels gardés `!hasText` en `:312, :335, :411, :424, :439, :489, :502, :604`).
- Les critères quantitatifs consomment des macros absentes comme 0 sans flaguer : diabete `:393` (`sugars_100g ?? 0`), bebe `:452-453` (sel/sucres), `:468` (`nova_group === 4`, null → faux), hypertension `:521`, cholesterol `:533`.
- `:664` : tout ce qui n'a pas été flaggé sort `'verified'`. Un diabétique voit « Compatible avec votre profil » sur un produit SANS données de sucres — c'est littéralement le défaut racine du projet, dans la feature santé la plus sensible.
- La bannière est saine (elle afficherait le 3ᵉ état si le flag montait) : le correctif appartient au moteur, pas au composant.

### B3 — [PROUVE] Dette documentée confirmée : `isCompatible` sans `verificationStatus` dans les listes

- `app/(tabs)/history.tsx:84-85` — `if (!compat.isCompatible) set.add(row.barcode)` : les produits non vérifiés (et, via B1, non vérifiables) comptent « compatibles ».
- `src/lib/scoring/profile-filters.ts:19` — `checkCompatibility(...).isCompatible` ; consommateurs recensés par grep exhaustif hors tests : `app/category/[slug].tsx:243, 248` et `app/store/[slug].tsx:142, 149`. **Aucun débordement au-delà du périmètre documenté** (aucun autre appelant de `checkCompatibility` hors `product/[barcode].tsx:316/:497` → `CosmeticProductView.tsx:78-82`, qui passent par la bannière saine).
- Classé BLOQUANT par impact (un allergique filtrant « Compatibles » voit des produits jamais contrôlés) tout en étant une dette CONNUE et honnêtement documentée dans CLAUDE.md — la sévérité vécue par l'utilisateur ne baisse pas parce que la dette est écrite.

---

## 2) MAJEURS

### M1 — [PROUVE code / HYPOTHESE scénario] `allergens_tags` / `traces_tags` OFF jetés à l'ingestion

`normalizeOFFProduct` (`src/lib/api/openfoodfacts.ts:170-201`) ne mappe ni `allergens_tags` ni `traces_tags` ; l'interface `OFFProduct` (`:22-42`) ne les déclare même pas ; le type `Product` (`src/lib/api/types.ts:77-109`) n'a aucun champ allergène. La vérification allergène repose donc à 100 % sur le matching de texte libre. Un produit dont l'allergène n'apparaît que dans les champs structurés (typiquement les mentions « traces ») sort « Compatible avec votre profil » — vérifié. Le scénario utilisateur précis nécessite un produit réel où `traces_tags` contient l'allergène sans que `ingredients_text` le mentionne : test discriminant = requête OFF `traces_tags=en:peanuts` + inspection de `ingredients_text`.

### M2 — [PROUVE] Macros absentes = pénalité zéro, sans marqueur d'incertitude sur le score

- Coercition : `productToScoringInput` (`openfoodfacts.ts:287-291`) — tous les `*_100g` null → 0.
- Effet moteur : pénalité sucres `engine.ts:185-195` (2 pts/g/portion), graisses saturées `:197-209`, sel `:211-219` — toutes nulles si la donnée manque. Chiffrage : un NOVA 4 à 25 g sucres/100 g (portion 100 g) perd 50 pts ; le même produit SANS donnée sucres ne perd rien. Deux produits identiques en rayon peuvent s'écarter de 50 points par pure asymétrie documentaire.
- Le score, le verdict et la couleur s'affichent sans AUCUNE mention que les macros manquaient ; le seul signal est le badge confiance, purement décoratif (cf. section 5). L'UI est cohérente par ailleurs (les barres nutritionnelles absentes sont masquées, cf. section 5) — c'est précisément l'écart : l'affichage détaillé avoue l'absence, le chiffre agrégé l'ignore.

### M3 — [PROUVE] « 0 additif » vert sage sur des alternatives dont les additifs n'ont jamais été analysés

- `coerceAdditivesCount` (`src/lib/api/smart-alternatives.ts:101-105`) : `additives_n` null/undefined → **0**.
- `additivesStyle(0)` (`src/components/premium/AlternativeCard.tsx:34-37`) : label « 0 additif », couleur `Colors.sageVivid` (ton succès).
- Asymétrie qui prouve le trou : NOVA absent est, lui, honnêtement rendu « inconnu » (`AlternativeCard.tsx:57-59`) — l'état « inconnu » existe dans le composant, il manque juste pour les additifs. Sur OFF, `additives_n` est absent quand les ingrédients n'ont pas été analysés : l'app transforme « non analysé » en promesse « 0 additif » sur une reco Premium censée être meilleure.

### Cas limite chiffré (exigé par la mission) — produit quasi vide dans `calculateScore`

Entrée : `ingredients_raw` null, macros null, `nova_group` null, `additives_tags: []`, via la fiche produit :
1. `productToScoringInput` (`openfoodfacts.ts:279-296`) : nova null → **4** (`:279-280`), macros → 0, ingredients → `''`.
2. `engine.ts:83` `collectAdditives([])` → aucune pénalité additif ; `:84-85` seed oils / clean labeling sur `''` → rien.
3. `:130` pas de blockers → `:142` score = 100 → `:144-153` plafond NOVA 4 → **30** (`NOVA_CEILINGS[4] = 30`, `scoring-rules.ts:5`).
4. `:185-241` : macros 0 → aucune pénalité, aucun bonus. `:299` → **30/100**, couleur orange (`engine.ts:29-30`), verdict bande 25-49 (`display-helpers.ts:132+`).
5. `composeScore` sans packagings → inchangé (`composite-score.ts:165`).

**Donc pas d'excellence par vide TANT QUE nova est absent** — le défaut nova → 4 est le seul garde-fou conservateur de la chaîne. MAIS si OFF renseigne `nova_group: 1` et rien d'autre (fiches « to-be-completed » — la Cristaline elle-même est nova 1 avec `en:to-be-completed`), le même produit vide sort **100/100 « Excellent »** : preuve exécutable = la fixture `baseInput` d'`engine.test.ts:10-27` (ingredients `''`, additives `[]`, macros 0, nova 1) qui fonde les tests verts existants. Un unique garde-fou (nova) porte toute la protection ; macros et additifs absents ne coûtent rien.

---

## 3) MINEURS

- **m1 — [PROUVE]** Tri des alternatives : `smart-alternatives.ts:155-159` — à score égal, `additivesCount asc` fait gagner le produit au `additives_n` ABSENT (coercé 0) contre un produit documenté à 1 additif. Même biais « le moins documenté gagne » que la LIMITE CONNUE des listes, non documenté pour ce chemin.
- **m2 — [PROUVE]** `app/(tabs)/history.tsx:79` : `fakeResult.blockers: []` toujours — le check bebe « Produit contient un ingrédient bloquant » (`compatibility-engine.ts:475-486`, qui exige `blockers.length > 0`) ne peut jamais se déclencher dans le filtre historique. Un produit à additif bloquant bébé compte « compatible » dans le toggle (sous-cas aggravant de B3, non écrit dans la dette documentée).
- **m3 — [PROUVE]** `engine.ts:272-276` (profil `intolerant`) : `profile.allergies?.includes('lactose')` / `includes('gluten')` échouent avec `'Lactose'`/`'Gluten'` stockés (racine B1). Seules les intolérances fonctionnent (`INTOLERANCES` en minuscules, `settings/health-profile.tsx:46-49`). Le malus intolérant −20 via allergie ne se déclenche jamais.
- **m4 — [PROUVE]** `classifyNova('')` → 1 (`nova-classifier.ts:58`) : un texte d'ingrédients vide est classé « aliment brut » (plafond 100). Latent : `ScoringInput.nova_group` est requis (`types.ts:25`) et `productToScoringInput` défaulte à 4 (`openfoodfacts.ts:279`), donc le `?? classifyNova` d'`engine.ts:80` est aujourd'hui inatteignable avec un input vide — mais tout futur appelant qui construit un `ScoringInput` casté avec nova null + ingrédients vides obtiendrait 100. À défendre par un test si le chemin s'ouvre (OCR, imports).
- **m5 — [PROUVE]** `readProductFromCache` (`openfoodfacts.ts:210-212`) : `if (Date.now() - updated > CACHE_TTL_MS) return data as Product; return data as Product;` — les deux branches sont identiques. Sans conséquence comportementale (la staleness est re-testée par `getOrFetchProduct:250`), mais le code laisse croire qu'un TTL est appliqué ici.

---

## 4) COSMETIQUES

- **c1 — [PROUVE]** `AlternativeCard.tsx:59` construit `novaLabel = 'NOVA 4'` puis `:67` l'interpole dans « NOVA ${novaLabel} » → lecteurs d'écran entendent « NOVA NOVA 4 » (ou « NOVA inconnu », correct par accident).
- **c2 — [PROUVE]** `history.tsx:75` : `nova_group: row.product.nova_group ?? 0` — 0 n'appartient pas au domaine 1-4 ; sans effet aujourd'hui (les checks utilisent `product.nova_group`, pas celui du fakeResult), mais valeur sentinelle non typée.

---

## 5) Vérifié et SAIN (preuves)

1. **`CompatibilityBanner` gère bien les 3 états** — `CompatibilityBanner.tsx:88` (lecture de `verificationStatus`), `:106-121` (état neutre « Vérification impossible », styles `:214-222` ni vert ni rouge). La doc projet est exacte sur ce point ; la cause (b) de l'amendement est exclue. Les warnings sont rendus dans les trois états (`:117, :140`).
2. **Chaîne cosmétique** : `product/[barcode].tsx:493-498` → `CosmeticProductView.tsx:78-82` passe le résultat complet à la même bannière — même comportement 3 états.
3. **`hasIngredientData` traite `''` et les espaces comme absents** — `compatibility-engine.ts:279-282` (`trim().length > 0`) : pas de trou « chaîne vide » dans la détection texte. Le trou de l'amendement n'est PAS là.
4. **Nova absent → défaut 4 conservateur** sur le chemin produit — `openfoodfacts.ts:279-280`. L'absence de NOVA pénalise, elle n'avantage pas.
5. **Affichage nutritionnel honnête** — `FoodProductView.tsx:271-277` passe les macros brutes nullables (null → undefined), `NutrientBreakdown.tsx:73-78` masque les lignes non finies : jamais de « 0 g » mensonger à l'écran.
6. **`composeScore` sans packaging = identité** — `composite-score.ts:146, 165` : mêmes valeurs, `packagingPenalty` 0. Principe « absence de packaging = pas de malus » appliqué exactement comme documenté, et `hasPackagingData` est bien exposé (`:66, :154`) mais consommé nulle part (grep : seules occurrences dans `composite-score.ts`) — conforme au « champ non consommé » de la dette.
7. **LIMITE CONNUE circonscrite** — les tris sur `score_final` sont exactement les 3 documentés : `category/[slug].tsx:112`, `store/[slug].tsx:84`, `top-by-category.ts:86`. Aucun débordement : favorites/history/explore n'y recalculent aucun score (grep `calculateScore|score_final|our_score` vide sur ces écrans ; l'historique affiche `score_at_scan` stocké).
8. **`recyclable: null` jamais pénalisé, jamais « Non recyclable »** — `packaging-modifier.ts:75-79` (`=== false` uniquement) ; `PackagingSection.tsx:56, 67-77` affiche « Recyclabilité inconnue », icône `HelpCircle`, ton neutre. Décision appliquée, pas seulement écrite.
9. **`food_contact` absent = conservé, pondéré** — exclusion uniquement sur `0` explicite (`packaging-risks.ts:489`), statut `unknown` pondéré ×0.5 (`packaging-modifier.ts:81`, `scoring-rules.ts:61`). `coerceFoodContact` (`packaging-risks.ts:405-410`) refuse la coercition hasardeuse vers 0.
10. **Packaging absent → section absente, jamais de repli `packaging_tags`** — `detectPackagingDetections` (`packaging-risks.ts:478`) renvoie `[]`, `PackagingSection.tsx:94` renvoie null.
11. **Alternatives : Nutri-Score absent = candidat EXCLU** — `smart-alternatives.ts:135-137` (`nutriScoreToProxy` null → rejet) et `store-ranking.ts:62-69` : l'absence exclut du classement, elle n'avantage pas. Idem moyenne enseigne (`store-ranking.ts:121-124`, grades absents hors moyenne).
12. **D14 appliqué** — les alternatives se comparent sur `formulationScore` (`FoodProductView.tsx:83-87`) et `ScoreBreakdownChart` reçoit `formulationScore` (`:262`), pas la note composée.
13. **Confiance : purement décorative, et c'est prouvé** — `getProductConfidence`/`getCosmeticConfidence` ne sont consommés que pour l'affichage (`product/[barcode].tsx:313, 387`, `category/[slug].tsx:74, 357`, `store/[slug].tsx:70, 328`, `CategoryRankCard.tsx:89`) ; jamais dans un tri, un filtre ou un score (les tris utilisent `score` seul, `category:112`/`store:84`). Réponse à la question posée : « À vérifier » n'influence RIEN d'autre que le badge — le score affirme pendant que la confiance décore. (Le constat de fond est porté par M2.)
14. **`NaturalityBadge` muet sans donnée** — rendu seulement si `ingredients_raw`/`ingredients_inci` présents (`FoodProductView.tsx:447-454`, `CosmeticProductView.tsx:57-64`) ; jamais de « 0 plante » affirmatif.
15. **Mode Famille : clés d'allergènes correctes** — `app/family/edit.tsx:71-86` aligné sur le moteur (c'est le contraste qui a permis de prouver B1).

---

## 6) Annexes — sorties brutes

### A. Produit 3274080005003 (curl `fr.openfoodfacts.org/api/v2`, User-Agent Vivo-Audit/1.0, extrait)

```json
{
  "code": "3274080005003",
  "product": {
    "product_name": "isabelle",
    "ingredients_text": "Eau de source",
    "ingredients_text_fr": "Eau de source",
    "allergens_tags": ["en:none"],
    "traces_tags": ["en:none"],
    "additives_tags": [],
    "nova_group": 1,
    "nutriscore_grade": "a",
    "nutriments": {
      "salt_100g": 0.00275,
      "bicarbonate_100g": 0.435, "calcium_100g": 0.113,
      "ph_100g": 7.3, "sodium_100g": 0.0063
      /* PAS de sugars_100g ni energy-kcal_100g dans nutriments ;
         sugars_100g: 0 n'existe que dans nutriments_estimated, non lu par l'app */
    },
    "states_tags": ["en:to-be-completed", "en:ingredients-completed",
                    "en:nutrition-facts-completed", "..."]
  },
  "status": 1
}
```

### B. Grep exhaustif des appelants de compatibilité (hors tests)

```
app/category/[slug].tsx:243  isProductCompatible(r.product, r.scoring, compatProfile)).length
app/category/[slug].tsx:248  liveData.filter((r) => isProductCompatible(...))
app/(tabs)/history.tsx:84    checkCompatibility(row.product, fakeResult, compatProfile)
app/product/[barcode].tsx:316  checkCompatibility(product, result, compatProfile)
app/product/[barcode].tsx:497  checkCompatibility(cosmeticQuery.data, result, compat)
app/store/[slug].tsx:142/149   isProductCompatible(r.product, r.scoring, compatProfile)
src/lib/scoring/profile-filters.ts:19/:31  (wrappers)
```

### C. Le mismatch de clés, pièce à pièce

```
app/onboarding/allergies.tsx:14
  const ALLERGENS = ['Gluten', 'Lactose', 'Arachides', 'Fruits à coque', 'Œufs', 'Soja'];
app/settings/health-profile.tsx:45  (même liste)
src/lib/api/auth.ts:150             allergies: input.allergies,        // upsert brut
src/lib/scoring/profile-adapter.ts:30  Array.isArray(profile.allergies) ? profile.allergies : []
src/lib/scoring/compatibility-engine.ts:63  ALLERGEN_KEYWORDS: { gluten: [...], fruits_a_coque: [...], oeufs: [...] }
src/lib/scoring/compatibility-engine.ts:310-311
  const keywords = ALLERGEN_KEYWORDS[allergy];
  if (!keywords) continue;
app/family/edit.tsx:71-86           // clés CORRECTES ('gluten', 'fruits_a_coque'…) — le contraste
```

### D. Tri des sites de liste (LIMITE CONNUE, vérifiée)

```
src/lib/api/top-by-category.ts:86  items.sort((a, b) => b.score - a.score);
app/store/[slug].tsx:84            ranked.sort((a, b) => b.score - a.score);
app/category/[slug].tsx:112        ranked.sort((a, b) => b.score - a.score);
```
