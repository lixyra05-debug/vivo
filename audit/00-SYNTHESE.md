# Synthèse de l'audit de détection — Vivo

**HEAD** `45678fa` · **Date** 14 août 2026 · **Nature** diagnostic uniquement, aucune correction appliquée.

Statuts employés :

| Statut | Signification |
|---|---|
| **[RE-VERIFIE]** | J'ai rouvert le fichier cité et confirmé que le code dit ce que l'agent affirme. |
| **[PROUVE — non re-ouvert]** | Preuve fournie par l'agent (fichier:ligne ou sortie brute), non re-contrôlée par moi. Réservé aux MINEURS / COSMETIQUES. |
| **[HYPOTHESE]** | Non tranché en l'état, avec le test qui trancherait. |

Conformément à R2, **tout BLOQUANT et tout MAJEUR de cette synthèse a été rouvert dans le code.** Aucun n'est repris sur la seule foi d'un rapport.

---

## 1) État de l'audit

### Intégrité — sorties brutes

```
$ git diff --stat
(vide)

$ git diff --stat HEAD
(vide)

$ git status --short
?? audit/
```

**Aucun fichier de `src/`, `app/`, `supabase/` ou de la racine n'a été modifié.** R1 respectée par les 5 agents.

```
$ wc -l audit/*
     276 audit/01-coherence-scores.md
     220 audit/02-donnee-absente.md
     261 audit/03-conformite-editoriale.md
     143 audit/04-distribution-scoring.md      ← TRONQUÉ
     316 audit/05-design-a11y.md
     503 audit/sample-runner.ts
```

### Complétude

| Rapport | État | Réserve |
|---|---|---|
| 01 — cohérence des scores | **complet** | — |
| 02 — donnée absente | **complet** | — |
| 03 — conformité éditoriale | **complet** | — |
| 04 — distribution du scoring | **TRONQUÉ** | Le corps est complet (constats, chiffres, réponses aux questions). Seule l'**annexe A** — la sortie brute du runner — a été emportée : le fichier se termine sur une ouverture de bloc <code>\`\`\`text</code> suivie de rien. L'agent est mort sur limite de session pendant l'écriture. |
| 05 — design & a11y | **complet** | — |

### Ce que la troncature aurait coûté, et pourquoi elle ne coûte rien

Le rapport 04 affirmait des chiffres dont la preuve brute manquait — exactement le cas où un rapport devient un témoignage invérifiable. **J'ai rejoué le runner** (`audit/sample-runner.ts`, vérifié strictement en lecture : `existsSync` / `readFileSync` seuls, aucune écriture) sur les 6 JSON du scratchpad :

```
$ npx jest --runTestsByPath audit/sample-runner.ts --testEnvironment=node \
    --testMatch '**/audit/sample-runner.ts'
```

**Tous les chiffres du rapport 04 sont reproduits à l'identique**, y compris le nombre le plus attendu (+14,3 pts). L'annexe manquante est reconstituée en §7. Rien n'est perdu.

### Ce que l'on ne sait toujours pas

- **Le profil santé réel d'Hector.** `user_profiles` est protégée par RLS (`auth.uid() = user_id`) : la clé anon ne peut pas le lire. Savoir si le « Compatible » observé vient du mécanisme n°1 ou n°2 (§6b) exige de regarder ce profil depuis une session authentifiée.
- **La liveness réelle des 25 URLs en 403** (WAF EFSA/ECHA) : classées « bot-block, non concluant » — ni vivantes ni mortes prouvées.
- **Le comportement lecteur d'écran réel** (`ScoreBreakdownChart`, labels groupés sans `accessible={true}`) : exige un passage VoiceOver/TalkBack.
- Une **inversion NOVA sodas/plats** ne peut pas être mesurée : l'échantillon ne contient aucun NOVA 1-2 dans ces deux catégories.

---

## 2) BLOQUANTS

Sept bloquants, tous re-vérifiés. Ils se répartissent en trois familles : **santé** (1, 2, 5), **fonction cœur** (3, 4), **légal/commercial** (6, 7).

---

### BLOQUANT 1 — Les allergies du profil principal ne sont jamais vérifiées, et l'app affirme le contraire

**[RE-VERIFIE]**

**Symptôme visible.** Un utilisateur déclare « Gluten » dans son profil. Il ouvre un produit contenant de la farine de blé. La bannière affiche, en vert : « Compatible avec votre profil », avec `verificationStatus: 'verified'`.

**Cause racine.** Le profil principal stocke des **libellés d'affichage** là où le moteur attend des **clés** :

```
app/onboarding/allergies.tsx:14      const ALLERGENS = ['Gluten', 'Lactose', 'Arachides',
app/settings/health-profile.tsx:45                      'Fruits à coque', 'Œufs', 'Soja'];

src/lib/scoring/compatibility-engine.ts:63   ALLERGEN_KEYWORDS = { gluten: […], lactose: […],
                                               arachides: […], fruits_a_coque: […], oeufs: […] }
```

Transport sans aucune transformation — `useProfileStore.ts:80-86` → `auth.ts:143-158` (upsert brut) → `profile-adapter.ts:30` (`Array.isArray(profile.allergies) ? profile.allergies : []`). J'ai grepé `toLowerCase|normalize|ALLERGEN` sur ces trois fichiers : **sortie vide**, aucune normalisation nulle part.

Le lookup échoue et le skip est **silencieux** :

```ts
// compatibility-engine.ts:309-315
for (const allergy of profile.allergies) {
  const keywords = ALLERGEN_KEYWORDS[allergy];
  if (!keywords) continue;        // ← ligne 311 : sort AVANT tout flag
  if (!hasText) {
    flagInsufficientData();       // ← ligne 312 : jamais atteint
    continue;
  }
```

L'ordre des deux lignes est décisif : le `continue` de la 311 s'exécute **avant** le `flagInsufficientData()` de la 312. L'allergie n'est ni vérifiée, ni signalée comme non vérifiable. Il ne reste que la barrière de score (`:621`, minScore 50) — tout produit ≥ 50 sort « Compatible », `verified`.

**Les 6 allergènes proposés par le profil principal sont cassés.** `'Gluten'` ≠ `gluten` (casse), `'Fruits à coque'` ≠ `fruits_a_coque` (casse + structure), `'Œufs'` ≠ `oeufs` (casse + diacritique).

**Pourquoi les 887 tests verts ne l'ont pas vu.** Les tests alimentent le moteur avec les **bonnes** clés :

```
compatibility-engine.test.ts:118   emptyProfile({ allergies: ['gluten'] })
compatibility-engine.test.ts:343   emptyProfile({ allergies: ['arachides'] })
```

Ils prouvent donc que le moteur fonctionne — ce qui est vrai — et ne touchent jamais le chemin de stockage du profil. Aucun test ne traverse `onboarding → useProfileStore → auth → profile-adapter → engine`. La suite ne pouvait structurellement pas attraper ce défaut.

**Le contraste qui achève la démonstration.** Le formulaire du Mode Famille utilise les bonnes clés, avec le commentaire explicite :

```ts
// app/family/edit.tsx:65
// 14 allergènes Annexe II Règlement UE 1169/2011 (mêmes clés que compatibility-engine).
const ALLERGENS = [{ key: 'gluten', … }, { key: 'fruits_a_coque', … }, { key: 'oeufs', … }, …]
```

**Le Mode Famille marche. Le profil principal — celui branché sur la fiche, l'historique, les catégories et les enseignes — ne marche pas.**

**Surfaces impactées.** Fiche produit (`product/[barcode].tsx:316`), toggle « Compatibles » de l'historique (`history.tsx:84`), des catégories (`category/[slug].tsx:243,248`) et des enseignes (`store/[slug].tsx:142,149`), cas spécial sulfites (`:318-325`) inatteignable lui aussi.

**Portée.** La règle projet « Les filtres allergènes sont GRATUITS (pas derrière le paywall comme Yuka) » décrit une fonctionnalité qui, pour le profil principal, **est un no-op intégral**.

**Piège de correction.** Normaliser à la lecture ne suffit pas : les profils **déjà stockés** en base contiennent les mauvaises valeurs. Le correctif est à double détente — normalisation à l'écriture *et* migration des lignes existantes (ou normalisation défensive à la lecture, qui couvre les deux).

---

### BLOQUANT 2 — `verificationStatus: 'verified'` sur des conditions que rien ne permettait de vérifier

**[RE-VERIFIE]** — même symptôme que le bloquant 1, cause et correctif différents.

**Cause racine.** Le drapeau « données insuffisantes » n'est câblé que sur le **texte d'ingrédients**. Les critères quantitatifs lisent une donnée absente comme un zéro rassurant, sans jamais flaguer :

```ts
compatibility-engine.ts:393   const sugars = product.sugars_100g ?? 0;      // diabète
compatibility-engine.ts:452   const salt   = product.salt_100g ?? 0;        // bébé
compatibility-engine.ts:453   const sugars = product.sugars_100g ?? 0;      // bébé
compatibility-engine.ts:468   if (product.nova_group === 4)                 // bébé : null → false
compatibility-engine.ts:521   const salt   = product.salt_100g ?? 0;        // hypertension
compatibility-engine.ts:533   const sat    = product.saturated_fat_100g ?? 0; // cholestérol
```

Puis :

```ts
compatibility-engine.ts:664
verificationStatus: dataInsufficientFlagged ? 'insufficient_data' : 'verified',
```

**Un diabétique voit « Compatible avec votre profil » sur un produit dont aucune donnée de sucres n'existe.** C'est le défaut racine du projet — l'absence de donnée traduite en absence de risque — logé dans la fonctionnalité santé la plus sensible.

**Le composant n'est pas en cause.** `CompatibilityBanner.tsx:88` lit bien `verificationStatus`, `:106-121` rend bien le troisième état neutre « Vérification impossible ». Le correctif appartient au moteur, pas à la bannière.

---

### BLOQUANT 3 — La note dépend de `serving_size`, un champ de texte libre saisi par les contributeurs

**[RE-VERIFIE]** — reproduit par rejeu du runner.

**Symptôme visible.** Deux chocolats noirs du même rayon :

| Produit | Sucres /100 g | AGS /100 g | `serving_size` | Portion retenue | **Note** |
|---|---|---|---|---|---|
| Lindt Noir Intense | **30 g** | 24 g | `'10 g'` | 10 g | **36** |
| Alter Eco Noir 85 % Pérou | **14 g** | 32 g | `'100g'` | 100 g | **0** |

**Cause racine.** La pénalité macros est calculée *par portion* :

```ts
// engine.ts:182-184
const portion = Math.max(0, input.portion_grams ?? 0);
const perPortion = (per100g: number) => (Math.max(0, per100g) / 100) * portion;
```

et la portion sort d'un parsing de texte libre :

```ts
// openfoodfacts.ts:144-150
function parsePortionGrams(servingSize?: string): number {
  if (!servingSize) return 100;
  const match = servingSize.match(/(\d+(?:[.,]\d+)?)\s*(g|ml)/i);
  if (!match) return 100;
  …
}
```

**Précision que le rapport 04 n'a pas poussée jusqu'au bout** : sur une base commune de 100 g, le Lindt encaisserait 60 pts de sucres + 48 d'AGS = 108 pts, soit **0 lui aussi**. L'écart 36 vs 0 n'existe **que** parce qu'un contributeur a tapé `'10 g'` et l'autre `'100g'`. Le classement intra-catégorie — la fonction cœur de l'app — est piloté par le format de saisie, pas par l'aliment.

**Ampleur mesurée** (299 produits) : `serving_size` absent 59 (19,7 %) · présent mais non parsé 31 (10,4 %, car le regex n'accepte ni `l` ni `cl` : `'1l'`, `'1,5L'`, `'0.33l'`, `'33 cl'` → défaut 100 g, alors que `'1000 ml'` → 1 000 g) · portions retenues de **1 g** (Evian, `serving_size='1g'`) à **1 500 g**.

---

### BLOQUANT 4 — `nova_group` absent → NOVA 4 forcé : des eaux minérales affichées « à éviter »

**[RE-VERIFIE]**

```ts
// openfoodfacts.ts:279-280
const novaRaw = product.nova_group ?? 4;
const nova = (novaRaw >= 1 && novaRaw <= 4 ? novaRaw : 4) as 1 | 2 | 3 | 4;
```

Le moteur contient pourtant un repli conçu exactement pour ce cas — `input.nova_group ?? classifyNova(ingredients, additives)` (`engine.ts:80`) — mais il est **inatteignable** : `ScoringInput.nova_group` est typé `1 | 2 | 3 | 4` non-nullable (`types.ts:25`) et l'adaptateur coalesce à 4 en amont. **Le classifieur NOVA du projet n'est jamais consulté sur le chemin de production.**

Effet mesuré : 28/299 produits (9,4 %) sans `nova_group` chez OFF, note moyenne **14,6/100**. Extraits bruts :

```
 22 (form  30) PERRIER eau minérale naturelle gazeuse — Nestlé Waters   «NOVA-ABSENT→4»
 19 (form  30) CONTREX eau minérale naturelle — Contrex                 «NOVA-ABSENT→4»
 20 (form  30) Vittel — Vittel                                          «NOVA-ABSENT→4»
 18 (form  27) Sidi Ali — سيدي علي                                       «NOVA-ABSENT→4»
```

à comparer au jumeau de la même marque dont le champ est rempli :

```
 68 (form 100) Sidi Ali — Sidi Ali                                       nova_brut=1
```

**Même eau, même marque : 68 ou 18 selon qu'un contributeur OFF a rempli un champ.**

**⚠️ Contradiction avec le `<context>`, signalée en gras comme exigé.** Le fil rouge est décrit comme « l'absence de donnée est traduite en absence de risque ». **Ici c'est l'inverse : l'absence de donnée est traduite en risque maximal.** Et c'est tout aussi faux — une eau minérale affichée rouge trompe l'utilisateur autant qu'un produit dangereux affiché vert. **Les deux directions du même défaut coexistent dans le même fichier** : `openfoodfacts.ts:279` punit l'absence, `:287-291` l'absout.

---

### BLOQUANT 5 — Un protocole payant fait boire une plante que l'app déclare elle-même déconseillée par voie interne

**[RE-VERIFIE]**

**Le fait.** `SKIN_ROTATION` (`protocols.ts:392-400`) place `borage` en 3ᵉ position → servi aux **jours 3, 10 et 17** du protocole « Peau Saine ». Deux de ces trois jours sont des infusions **de fleurs, à boire** :

```
protocols.ts:417  « Infusion de bourrache : 1,5g de fleurs séchées dans 200ml d'eau à 95°C… »
protocols.ts:419  « Bourrache + souci : 1g de chaque dans 200ml d'eau à 95°C… »
protocols.ts:418  « Huile de bourrache (capsule) : 500mg matin et soir… »   ← la forme SÛRE
```

Or la base de connaissances de l'app dit exactement le contraire :

```
content-database.ts:874 (carte borage_pa_warning, source EFSA pub/4908, vivante)
  « la bourrache (feuilles, fleurs) contient des alcaloïdes pyrrolizidiniques
    hépatotoxiques et potentiellement cancérogènes. Consommation interne déconseillée.
    Contre-indications : grossesse, allaitement, enfants <18 ans, maladie hépatique. »

plant-encyclopedia.ts:512  partUsed: 'Graines (huile) — éviter les parties aériennes au long cours'
```

**Calibrage honnête de la gravité.** Deux tasses d'infusion sur 21 jours ne constituent pas une dose hépatotoxique aiguë — la toxicité des alcaloïdes pyrrolizidiniques est cumulative. Ce n'est pas la dose qui fait le bloquant. Ce sont **trois faits combinés** :

1. L'app **prescrit la consommation d'une partie de plante qu'elle déclare ailleurs impropre à la consommation interne**, dans une fonctionnalité payante.
2. Les contre-indications visent nommément **grossesse, allaitement, mineurs, maladie hépatique** — et rien ne filtre : `grep -c "contre-indication" app/protocols/[id].tsx` → **0**. Une utilisatrice enceinte peut suivre le programme jour par jour sans jamais voir l'alerte.
3. Le seul écran qui porte l'avertissement est la fiche encyclopédie, que l'utilisateur du protocole n'a **aucune raison d'ouvrir**.

C'est le défaut racine sous une quatrième forme : **l'information de risque existe dans une couche, la surface de consommation ne la lit pas.**

---

### BLOQUANT 6 — Sept fonctionnalités Expert vendues 49,99 €/an n'existent nulle part dans le code

**[RE-VERIFIE]** — grep exhaustif rejoué, 7/7 à zéro call-site.

```
expert_consultation  -> 0 call-site(s) hors premium-gate/tests
plant_alternatives   -> 0
cosmetic_actives     -> 0
expert_articles      -> 0
pregnancy_safety     -> 0
children_safety      -> 0
interaction_warnings -> 0
```

Ces 7 clés sont pourtant **toutes rendues sur l'écran d'achat** : `subscription.tsx:52-55` filtre `Object.keys(PREMIUM_FEATURES)` sur `FEATURE_TIER[k] === 'expert'` et affiche chaque `labelFr`. Parmi les promesses :

- « **Consultation expert (1/an)** » — une prestation de service nominative ;
- « **Alternatives plantes aux médicaments** » ;
- « Interactions plantes-médicaments … sourcée ANSM » ;
- « Sécurité grossesse renforcée », « Sécurité enfants & nourrissons ».

Aucune mention « bientôt disponible » (grep vide). S'y ajoute :

```
premium-gate.ts:166  « Accès à plus de 200 plantes … »
$ grep -c "^    id: '" src/data/plant-encyclopedia.ts
40
```

**Deux dimensions.** *Commerciale* : pratique trompeuse (art. L.121-2 C. conso ; App Store Review 2.3.1 / 3.1.2), motif de rejet. *Santé* : le libellé « Alternatives plantes **aux médicaments** » promet précisément ce que la règle R5 du projet interdit — positionner des plantes en substitut de médicaments.

**Atténuation factuelle** : `REVENUECAT_APPLE_API_KEY = 'appl_REMPLACER_APRES_CONFIG_REVENUECAT'` (`config.ts:10`) — l'achat échouerait aujourd'hui en runtime. L'écran et le catalogue sont néanmoins prêts à encaisser dès la clé posée.

---

### BLOQUANT 7 — La politique de confidentialité affirme l'inverse de ce que fait le scan OCR

**[RE-VERIFIE]**

```
app/settings/privacy.tsx:166-168  (ARTICLE 3 — Données NON collectées)
  « LYXIRIA ne collecte jamais : … les photos de la galerie ou les images prises
    au scan (le scan n'enregistre que le code-barres décodé, jamais l'image) »
```

Réalité du code : le scan OCR photographie l'étiquette, transmet le base64 à l'Edge Function (`ocr-scan.ts:26-31`, `body: { imageBase64, mimeType }`), qui le forwarde à :

```
supabase/functions/analyze-ingredients/index.ts:10   const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
supabase/functions/analyze-ingredients/index.ts:112  claudeRes = await fetch(ANTHROPIC_API_URL, { … })
```

```
$ grep -in "anthropic|revenuecat" app/settings/privacy.tsx
(sortie vide)
```

**Ni Anthropic ni RevenueCat ne figurent dans le tableau des sous-traitants**, alors que Sentry y est déclaré avec sa base de transfert.

**Nuance importante, à porter au crédit du code.** La photo n'est effectivement **pas stockée** : `grep -cin "storage|\.insert(" supabase/functions/analyze-ingredients/index.ts` → **0**, et le store OCR côté client est volontairement non persisté. Le flux est sain ; c'est sa **déclaration** qui est fausse. Or transmettre à un tiers est un traitement au sens de l'art. 4(2) RGPD, et un transfert hors UE non déclaré viole les art. 13 et 44+. Une politique qui nie un traitement est plus exposante que pas de politique : c'est une déclaration fausse opposable.

---

## 3) MAJEURS

Tous re-vérifiés dans le code.

### MAJ-A — Le toggle « Compatibles » des listes ignore `verificationStatus` **[RE-VERIFIE]**

`history.tsx:85` (`if (!compat.isCompatible) set.add(row.barcode)`), `profile-filters.ts:19`, consommé par `category/[slug].tsx:243,248` et `store/[slug].tsx:142,149`. `isCompatible` répond seulement à « existe-t-il un blocker ? » — donc `true` quand rien n'a pu être contrôlé. **Dette déjà documentée dans `CLAUDE.md`, périmètre confirmé exact, aucun débordement.** Ce qui n'était pas documenté : le bloquant 1 la rend bien plus grave qu'écrit — les produits comptés « compatibles » ne sont pas seulement les *non vérifiables*, ce sont **tous** les produits, puisque aucune allergie n'est jamais confrontée à quoi que ce soit.

**Dépendance de correction critique** — voir §8 : corriger le bloquant 1 sans corriger celui-ci produirait une fiche qui vérifie enfin les allergies pendant que les listes continuent d'affirmer « compatible » sans vérifier.

### MAJ-B — L'historisation enregistre un score que la fiche contredit à l'écran **[RE-VERIFIE]**

`app/product/[barcode].tsx:133-136` construit `packagings = packagingsQuery.data ?? productQuery.data?.packaging_components ?? []` — repli sur le cache tant qu'OFF n'a pas répondu. L'effet `:146-164` se déclenche au **premier** `result` non-null et verrouille immédiatement `scanRecorded` (`:148`), enregistrant `result.score_final` (`:152`). Quand `packagingsQuery` résout ensuite, `result` est recalculé (la fiche affiche 62) mais **aucune correction n'est faite**.

Le commentaire `:128-131` assume le repli pour l'**affichage** ; personne n'a vu que l'historisation photographie la valeur transitoire. Conséquence : `score_at_scan` peut valoir 100 quand l'écran finit sur 62 — ce qui contredit la définition documentée « `score_at_scan` est par définition le score montré ce jour-là » et contamine score moyen, compteur « À éviter », recap, PDF et badges. **Incohérence nouvelle, distincte de la discontinuité assumée** (qui ne couvre que les scans antérieurs à la feature).

### MAJ-C — Les textes de verdict décrivent une note « 100 % formulation »… en recevant la note composée **[RE-VERIFIE]**

`FoodProductView.tsx:94` passe `result.score_final` (composé) à `getScoreVerdict` (`src/lib/scoring/display-helpers.ts:108`). Or :

```
display-helpers.ts:126-130  (branche ≥50)
  « Les pénalités relevées sur la formulation pèsent sensiblement sur le score. »
display-helpers.ts:114-116  (branche ≥90)
  « L'emballage et la maison-mère sont analysés séparément. »
```

Pour la Cristaline à 62, la formulation est à **100/100, zéro pénalité** : les 38 points viennent de l'emballage. La phrase est factuellement fausse. Celle de la branche ≥90 l'est aussi depuis août : l'emballage est **dans** la note.

**Le fichier se contredit lui-même**, et c'est la preuve qu'il a été oublié par le lot d'août — son propre commentaire d'en-tête pose un invariant que `composeScore` a cassé :

```
display-helpers.ts:96-106
  « … alors que le score ne mesure que la FORMULATION. L'emballage et la maison-mère
    sont analysés par d'autres sections de la fiche … »
  « Chaque description reste vraie par construction : à un score donné correspond
    exactement `100 - score` points de pénalité. »
```

### MAJ-D — L'écran « Comment Vivo note » publie une échelle que la fiche n'utilise pas **[RE-VERIFIE]**

| Source | Seuils | Fichier:ligne |
|---|---|---|
| Écran méthodologie | Excellent ≥80 · Bon ≥60 · Moyen ≥40 · À éviter ≥20 | `transparency.ts:24-29` → `methodology.tsx:177-180` |
| Verdict de la fiche | Excellent ≥90 · Bon ≥70 · Moyen ≥50 · **Mauvais** ≥25 · À éviter <25 | `display-helpers.ts:111-146` |
| Couleurs | vert ≥70 · jaune ≥50 · orange ≥25 · rouge | `engine.ts:26-31` |

Un produit à 82 est « Excellent » selon la méthodologie et « Bon » sur la fiche. Un 45 est « Moyen » selon la méthodologie et « Mauvais » sur la fiche. Le palier « Mauvais » n'existe pas dans la méthodologie, et 0-19 n'y a aucune catégorie. **L'écran dont l'unique raison d'être est d'expliquer la note la contredit.**

### MAJ-E — « À éviter » recouvre trois seuils différents **[RE-VERIFIE]**

```
useProductStore.ts:189        score_at_scan < 50    ← le « 24 » de la home
monthly-recap.ts:146          score_at_scan < 40
history.tsx:116,123           score_at_scan < 30
profile-stats-engine.ts:121   score_at_scan < 30
advanced-stats.ts:33          bad: < 30
```

Le même utilisateur lit « 24 À éviter » sur la home, un autre chiffre dans son recap, un troisième dans son historique — sans qu'aucun écran ne définisse son seuil. **Le 24 observé n'est comparable à aucun autre écran de l'app.** Même dispersion sur « excellent » : ≥75 (recap) vs ≥80 (PDF, stats profil) vs ≥85 (stats avancées).

### MAJ-F — Le biais « pas de données d'emballage = pas de malus », chiffré **[RE-VERIFIE par rejeu]**

Voir §7 : **+14,3 pts d'avantage moyen** au produit non documenté, sur le haut de l'échelle. Aggravé par la dette documentée du tri des listes sur `score_final`.

### MAJ-G — La distribution est écrasée au plancher, et « le zéro réservé aux blockers » est démenti **[RE-VERIFIE par rejeu]**

```
score affiché == 0 : 131/299 (43.8%)
  … dont AVEC additif bloquant : 13  (9.9%)
  … dont SANS aucun blocker    : 118 (90.1%)
bande [70-79] : 0 produit    bande [80-89] : 1 produit
médiane 7/100 · moyenne 20.97
```

**⚠️ Contredit un commentaire du code**, à signaler en gras : `composite-score.ts:15-17` affirme « Le zéro reste RÉSERVÉ aux additifs bloquants ». L'équivalence `note = 0 ⟺ formulation = 0` est bien vraie (vérifiée sur les 299), mais **« réservé aux blockers » est faux** — `engine.ts` atteint 0 par simple accumulation sur 118 produits sans aucun blocker. Concrètement :

```
0/100  Velouté de 12 légumes — Liebig   (0 additif ; NOVA 70 + colza 30 + macros)
0/100  Coca Zero — aspartame            (additif BLOQUANT)
```

Un utilisateur ne peut pas distinguer une soupe de légumes d'un produit à l'aspartame. Le raisonnement qui fonde D3 (« un biscuit sous plastique ne devient jamais indiscernable d'un produit à l'aspartame ») reste valide **pour l'emballage** ; son postulat sur le moteur, lui, est démenti. *(R4 : je n'audite pas le bien-fondé du barème — NOVA 30, colza 30, sucres 2 pts/g sont des choix assumés. Le constat porte sur ce que leur composition produit : 3 des 6 catégories les plus scannées sont non discriminantes — sodas moyenne 0,9 · chocolats médiane 0 · céréales médiane 2,5.)*

### MAJ-H — Le jaune historique à 1,56:1 est toujours vivant, sur l'écran de transparence **[RE-VERIFIE]**

```
app/methodology.tsx:40   macros:   '#FFC107'
app/methodology.tsx:45   allergen: '#FFC107'
app/methodology.tsx:84   <Text style={[styles.weightValue, { color }]}>{weight}%</Text>
app/methodology.tsx:437  weightValue: { fontFamily: 'Inter-SemiBold', fontSize: 11, … }
```

`#FFC107` en **couleur de texte, 11 px** : **1,56:1 sur cream** — le chiffre exact que le commentaire de `theme.ts:8-9` désigne comme le défaut fondateur corrigé par la v2. Échouent aussi sur le même écran : `#FF9800` 2,16:1 · `#4CAF50` 2,78:1 · `#F44336` 3,68:1. **C'est l'écran qui documente la rigueur du score qui porte les pourcentages illisibles.**

### MAJ-I — Doctrine v2 « sage/earth jamais porteurs de texte » violée à ~67 endroits **[PROUVE — échantillon re-vérifié]**

`theme.ts:20-21` et `:39` posent la règle. 38 fonds `Colors.sage`/`Colors.earth` sous texte blanc (**2,49:1** / **2,27:1**, échec AA y compris large), dont les **CTA d'achat du paywall** (`PremiumPaywall.tsx:680, :690, :717`) ; 29 styles `color: Colors.sage/earth` en texte. Le point qui rend le constat systémique : **la palette v2 fournit déjà les bons tokens** — blanc sur `sageVivid` 4,80:1, sur `earthDeep` 6,18:1, sur `forest` 9,76:1. Les call-sites n'ont pas suivi. `theme.test.ts` valide les tokens, aucun garde-fou ne couvre les usages.

*Statut nuancé, tel que l'agent l'a lui-même posé : les ratios et l'existence des call-sites sont prouvés ; « tous les 38 fonds portent du blanc » est extrapolé de 10 vérifiés sur 38.*

### MAJ-J — Trois autres surfaces sous le seuil AA **[PROUVE — non re-ouvert]**

`ConfidenceBadge` (2,03 à 2,59:1, sur **chaque** fiche produit) · Recap mensuel, moitié basse du dégradé (blanc 2,49:1, `#FFB6B0` **1,49:1** — pire ratio de l'audit, sur une carte **destinée au partage**) · `IngredientRiskMap` chip « Bloquant » restée en `#F44336` 3,23:1 alors que *moderate* et *high* ont été assombris — **le niveau le plus critique pour la santé est le moins lisible des trois**.

### MAJ-K — Les sources affichées du tier Expert débouchent sur des 404 **[RE-VERIFIE]**

```
$ grep -c "sourceUrl: EMA_HMPC_BASE" src/data/plant-encyclopedia.ts
33                                    ← sur 40 fiches
$ curl -sI -A "Vivo-Audit/1.0" -L "https://www.ema.europa.eu/en/medicines/herbal-medicinal-products"
404
```

Ce lien est **affiché en clair** (`app/plants/[id].tsx:170`) et **ouvert** par `Linking.openURL` (`:160`). Toute la crédibilité « encyclopédie sourcée EMA » du tier payant aboutit à une page inexistante. S'y ajoutent `https://www.vivo-app.fr` → **NXDOMAIN** (domaine inexistant, utilisé comme `sourceUrl` sur 2 cartes éducatives, `content-database.ts:150,160` — le domaine réel est `vivo.lyxiria.com`), 6 URLs ANSES, 6 URLs EMA spécifiques, 5 PDF IARC, ANSM, registre UE, FDA.

**La règle projet « chaque pénalité doit avoir une source scientifique accessible » n'est plus tenue.**

> **Écart de comptage avec le rapport 03**, signalé par honnêteté : l'agent annonce « 35 des 40 fiches ». Le compte exact est **33 sur 40**. La substance est intacte.

### MAJ-L — Autres majeurs de conformité **[PROUVE — non re-ouverts individuellement]**

`allergens_tags`/`traces_tags` d'OFF jetés à l'ingestion (`openfoodfacts.ts:170-201`) : la vérification allergène repose à 100 % sur le texte libre, les mentions « traces » structurées sont invisibles · macros absentes = pénalité zéro, jusqu'à ~50 pts d'écart sans marqueur d'incertitude · `additives_n` absent coercé en 0 puis rendu « **0 additif** » en vert sage sur une reco Premium (`AlternativeCard.tsx:34-37`), alors que l'état « inconnu » existe déjà pour NOVA dans le même composant · tips des protocoles : chiffres inventés et pseudo-science sans source (« réduit la charge digestive de 30 % », « la transpiration draine les toxines », « les fruits fermentent mal ») dans une app dont le cœur de métier est la rigueur toxicologique · prompt OCR sans aucune contrainte éditoriale R5, dont l'exemple **modèle une prescription pédiatrique** · aucun garde-fou sur les noms produits absurdes (« isabelle » part sur la carte virale ScanChoc et dans le PDF destiné au médecin) · consentement art. 9 persisté **en AsyncStorage local seulement** alors que les données santé sont côté serveur — preuve perdue à la réinstallation, et le Mode Famille collecte des données de mineurs **sans passer par la modale**.

---

## 4) MINEURS et COSMETIQUES

**[PROUVE — non re-ouverts]**, sévérité faible assumée.

**Mineurs.** Échec d'upsert du cache totalement silencieux, sans breadcrumb ni logger (`openfoodfacts.ts:226`) — la panne même que cet audit a dû exclure par requêtes DB faute de logs · `our_score` colonne morte, réécrite à `NULL` à chaque refresh, 0/341 lignes non nulles · cinquième échelle de couleurs dans le classement supermarchés (75/50/25 vs 70/50/25) · la promesse « 7 jours » de la migration 016 suppose OFF disponible — un 503 a été reçu pendant l'audit · branche morte dans `readProductFromCache:210-212` (les deux chemins retournent la même valeur) · tri des alternatives : à score égal, l'absence de `additives_n` bat un produit documenté à 1 additif · `fakeResult.blockers: []` rend le blocker bébé inatteignable dans le filtre historique · `parsePortionGrams` ignore `l` et `cl` · aucune garde de plausibilité sur la donnée OFF (Evian `serving_size='1g'`) · 9 nœuds `accessibilityElementsHidden` iOS-only sans pendant Android dans 6 fichiers, dont **6 non documentés** · angle mort du garde-fou hex : 5 fichiers hors allowlist portent des `rgba()` en dur, invisibles à la regex `#…` · `ScoreComparison` dette connue confirmée (dégradé v1 `:67`, légende « Danger » `:77`) + 4 hex non documentés · ~24 emoji d'interface résiduels · CGU muettes sur le tier Expert · sources hors allowlist (`cir-safety.org`, panel financé par l'industrie ; `rspo.org`, filière huile de palme) · « Privilégie le clean » dans un tip, alors que `clean-labeling.ts` existe précisément pour pénaliser ce marketing.

**Cosmétiques.** Palette PDF à 3 crans sans jaune (un 55 est orange dans le rapport médecin, jaune dans l'app) · `history.tsx:67-74` duplique le mapping couleur du moteur · label a11y « NOVA NOVA 4 » · dingbats `✓` et médailles 🥇🥈🥉 · titres marketing « anti-stress » / « anti-ballonnements ».

### Trois divergences documentation ↔ code, à signaler en gras

1. **`CLAUDE.md` affirme que `ScoreBreakdownChart.tsx` masque ses enfants avec `accessibilityElementsHidden`. C'est faux — le fichier n'en contient aucun** (`grep` → seul `:131 accessibilityLabel`), et `git log -S` sur ce fichier est vide : la chaîne n'y a jamais existé. **[RE-VERIFIE]** La dette est réelle pour `ScoreCircle.tsx` (3 nœuds, `:121/:125/:132`), inventée pour l'autre.
2. **`CLAUDE.md` annonce « 31 cartes éducatives » ; `content-database.ts` en contient 65.** La doc est en retard d'un lot entier (34 cartes phytothérapie non documentées). **[PROUVE — non re-ouvert]**
3. **`CLAUDE.md` décrit encore des emoji d'interface qui ont été retirés** (section explore « 🌿 Plantes médicinales », chips « ✅ 0 additif ») — ici la doc est en retard **dans le bon sens** : le code est plus propre que sa description. **[PROUVE — non re-ouvert]**

---

## 5) Recoupements — un défaut racine compte une fois

Cinq défauts racines expliquent l'essentiel de l'audit. Aucun n'est compté deux fois.

### Racine A — « L'absence de donnée est traduite en absence de risque »

Le fil rouge annoncé. Vu par **trois agents sous trois angles**, tous concordants :

| Angle | Manifestation | Sévérité |
|---|---|---|
| Compatibilité (agent 2) | macros/NOVA absents lus `?? 0` → « Compatible », `verified` | **BLOQUANT 2** |
| Distribution (agent 4) | packagings absents → **+14,3 pts** sur le haut de l'échelle | MAJ-F |
| Cache (agent 1) | `packaging_components: []` → aucun malus → 100 vs 62 | §6a, transitoire |
| Score (agents 2 et 4) | macros absentes → jusqu'à ~50 pts non retirés | MAJ-L |
| Recommandation (agent 2) | `additives_n` absent → « 0 additif » **en vert** | MAJ-L |
| Listes (dette connue) | tri sur `score_final` : le moins documenté remonte | documenté |

**Le badge de confiance existe, il est honnête, et il ne sert à rien** : `getProductConfidence` n'est consommé que pour l'affichage — jamais dans un tri, un filtre ou un score. L'app avoue l'incertitude dans un badge de 11 px pendant que le chiffre de 72 px affirme.

### Racine B — L'absence de donnée traduite en risque **maximal**

La face opposée, **dans le même fichier** : `openfoodfacts.ts:279` force NOVA 4, `:287-291` absout les macros. **BLOQUANT 4.** À traiter avec A, jamais séparément : corriger une direction sans l'autre déplacerait le mensonge.

### Racine C — La donnée corrompue acceptée sans garde de plausibilité

Ce n'est plus l'absence, c'est la **corruption**. `serving_size` en texte libre pilote la note (**BLOQUANT 3**) ; `serving_size='1g'` sur une Evian ; 1,4 g de sucres sur une eau minérale ; un produit nommé « isabelle » qui part sur une carte de partage et dans un PDF médecin (MAJ-L). Aucun contrôle de vraisemblance nulle part dans le pipeline.

### Racine D — L'information de risque existe dans une couche, la surface ne la lit pas

**BLOQUANT 5** (l'encyclopédie sait la bourrache déconseillée, l'écran protocole ne l'affiche jamais) · contre-indications absentes des écrans recette/rappel · `verificationStatus` calculé puis ignoré par les listes (MAJ-A) · `hasPackagingData` exposé sur `CompositeScoringResult` et consommé nulle part.

### Racine E — Plusieurs vocabulaires pour un même nombre

Trois échelles de verdict (MAJ-D), trois seuils sous le libellé « À éviter » (MAJ-E), des verdicts qui décrivent la formulation en recevant la note composée (MAJ-C), une cinquième échelle de couleurs, `ScoreComparison` en palette v1. **Aucun de ces défauts n'est né du lot packaging** — mais le lot les a rendus visibles en changeant la signification du nombre sans mettre à jour tout ce qui le nomme.

### Défaut de contrat, hors racines

Le **BLOQUANT 1** n'appartient à aucune des cinq : ce n'est ni une absence, ni une corruption, ni un défaut de propagation. C'est un **contrat rompu entre deux couches** — un écran écrit `'Gluten'`, un moteur lit `gluten`, et rien entre les deux ne les réconcilie ni ne signale le désaccord. C'est aussi le seul défaut de l'audit dont **la suite de tests ne pouvait structurellement pas rendre compte**, parce qu'aucun test ne traverse la frontière où le contrat se brise.

---

## 6) Les deux bugs observés à l'écran — réponses directes

### a) Cristaline : 100 sur la liste, 62 sur la fiche

**Cause exacte, [RE-VERIFIE] par SELECT frais du jour :**

```json
[{"barcode":"3274080005003","name":"isabelle","packaging_components":[],
  "off_last_updated":"2026-08-12T16:31:29.555+00:00",
  "updated_at":"2026-08-12T16:31:29.555+00:00"}]
```

La ligne a été écrite le **12/08 à 16:31 UTC**, soit **la veille** du commit `45678fa` (13/08 18:15 CEST) qui fait entrer l'emballage dans le score. Elle porte donc le backfill `'[]'` de la migration 016, tout en étant **fraîche** (TTL 7 jours, `openfoodfacts.ts:12`). `getOrFetchProduct:249-250` la sert telle quelle → toutes les listes composent avec `[]` → aucun malus → **100**. La fiche, elle, a sa propre requête OFF directe (`app/product/[barcode].tsx:105-110`, staleTime 24 h) → PET + PEHD → **62**.

**Verdict des trois hypothèses :**

| | Verdict | Preuve |
|---|---|---|
| **H1** — l'endpoint de recherche ne renvoie pas `packagings` | **Vraie, mais ce n'est PAS la cause** | `buildCategoryUrl` demande `fields=code,product_name,brands,image_url` (`search.ts:126-134`) — ces 4 champs ne servent qu'à la tuile ; le produit scoré vient de `getOrFetchProduct` (`top-by-category.ts:65`). |
| **H2** — ligne cache fraîche d'un millésime antérieur | **CONFIRMÉE** | SELECT ci-dessus + chronologie git. |
| **H3** — l'écriture échoue malgré la colonne présente | **INFIRMÉE** | `updated_at=gte.2026-08-13T16:15:00Z & packaging_components=eq.[]` → **`[]`, zéro ligne**. Aucune écriture post-bascule n'est vide. |

### ➡️ Le cache se régénère-t-il ? **OUI. Le bug est temporaire et se résorbe seul.**

**Ce n'est donc pas un bloquant.** Échéance : la ligne Cristaline périme le **19/08 vers 16:31 UTC** ; au plus tard, la dernière ligne concernée le **20/08**. Ampleur mesurée aujourd'hui :

```
lignes fraîches (<7j) à components vides : 45
total products                            : 341
```

45 est une **borne supérieure** — une partie de ces produits n'a légitimement aucun `packagings[]` chez OFF.

**Un point que le rapport 01 laissait ouvert, et que je ferme ici.** On pouvait craindre que la résorption dépende du succès de l'écriture en cache — or la policy RLS réserve INSERT/UPDATE à `authenticated` (`012_security_fixes.sql:18-24`), et l'échec d'upsert est silencieux (`openfoodfacts.ts:226`). **La résorption n'en dépend pas** : après expiration, `getOrFetchProduct` refetch OFF et `writeProductToCache` retourne l'objet normalisé **même quand l'écriture échoue** (`if (error) return product`). L'utilisateur voit donc la bonne note à partir du 19/08, authentifié ou non, que la base accepte l'écriture ou pas.

**Réserve unique** : si OFF est indisponible au moment du refresh, `getOrFetchProduct:253` sert la ligne périmée — donc empoisonnée. Un 503 OFF a été reçu **pendant** cet audit. La clause « se corrigent d'elles-mêmes en 7 jours » de la migration 016 est **conditionnelle à la disponibilité d'OFF**, pas absolue.

---

### b) « Compatible avec votre profil » sur un produit non vérifié

**Réponse : cause (a). `verificationStatus` vaut `'verified'` à tort.**

**La cause (b) est formellement exclue** : `CompatibilityBanner.tsx:88` lit bien `verificationStatus`, et `:106-121` rend bien le troisième état neutre « Vérification impossible ». Le composant fait son travail ; **la doc projet dit vrai sur lui**. Le correctif appartient au moteur.

**Deux mécanismes indépendants produisent ce `'verified'`**, et ils appellent **deux correctifs différents** :

1. **BLOQUANT 1** — si le profil porte des allergies : le lookup `ALLERGEN_KEYWORDS['Gluten']` échoue, `continue` sort **avant** le flag. Aucune vérification, aucun signalement.
2. **BLOQUANT 2** — si le profil porte une condition (diabète, bébé, hypertension, cholestérol) : les macros absentes sont lues `?? 0`, aucun flag.

**⚠️ Une prémisse de la mission est contredite, signalée en gras comme exigé.** Le produit `3274080005003` **possède** une liste d'ingrédients : l'API OFF renvoie `ingredients_text: "Eau de source"` et `states_tags` contient `en:ingredients-completed`. **L'hypothèse « n'a vraisemblablement aucune liste d'ingrédients » est fausse.** La détection de texte manquant (`hasIngredientData`, `:279-282`, qui traite correctement `''` et les espaces comme absents) n'est donc pas en cause. Le mensonge ne vient pas d'un texte manquant — il vient de ce que **rien n'a jamais été confronté à ce texte**.

Détail qui illustre le fil rouge : sur cette même fiche, le badge « Contribution communautaire » est **honnête** (5 critères sur 6 remplis, `energy_kcal_100g` absent). Deux indicateurs côte à côte, l'un exact, l'autre faux.

**Test qui tranche entre 1 et 2** — je ne peux pas le faire : `user_profiles` est protégée par RLS `auth.uid() = user_id` et la clé anon n'a pas d'identité. Depuis une session authentifiée : lire `user_profiles.allergies` et `health_profile` pour le compte concerné. Si `allergies` est non vide → mécanisme 1. Si `allergies` est vide et `health_profile` vaut `diabetic`/`pregnant`/`child` → mécanisme 2. **Les deux sont à corriger de toute façon.**

---

## 7) Le chiffre du biais — distribution (a) contre (b)

Reconstitué par rejeu du runner, l'annexe du rapport 04 ayant été tronquée. **Échantillon : 299 produits uniques, 6 catégories, OFF live, pipeline de production rejoué à l'identique.**

```
--- (a) NOTE AFFICHÉE, tous produits (packagings absents → aucun malus)   n=299
    moyenne=20.97  médiane=7.0  écart-type=27.69
--- (b) NOTE AFFICHÉE, restreinte aux produits AVEC packagings[] non vide  n=267
    moyenne=20.58  médiane=7.0  écart-type=26.80

écart (a)−(b) : moyenne 0.39 pt · médiane 0.0 pt
```

**L'écart brut est négligeable — et c'est un artefact.** 53,5 % de la distribution est au plancher `[0-9]`, où l'amortissement proportionnel (`malus × formulation/100`) rend le malus ≈ 0 quelle que soit la donnée disponible. **Le biais ne peut pas apparaître en bas d'échelle.** Lu seul, ce 0,39 conclurait à tort qu'il n'y a pas de problème.

**Là où le biais se joue — le haut de l'échelle, celui des tops de listes :**

```
--- BIAIS PACKAGING (formulation >= 50)   n=62
    avec packagings : 55 produits — note moyenne 66.5, médiane 68.0
    SANS packagings :  7 produits — note moyenne 80.9, médiane 100.0
    avantage moyen du produit NON documenté : 14.3 pts
```

### **+14,3 points d'avantage au produit dont l'emballage n'a jamais été documenté.**

Cas jumeau nominal, formulations identiques à 100 :

```
100 (form 100, malus  0) [eaux] Eau mineral 33cl aman — (sans marque)   «SANS-PACK»
 68 (form 100, malus 32) [eaux] Sidi Ali — Sidi Ali                      packagings=oui
```

**Dans le top 15, 4 des 10 produits notés ≥ 90 sont des produits sans données d'emballage.** Le podium est un podium de produits non documentés.

**Proportion échappant au malus par absence de donnée : 32/299, soit 10,7 %** sur OFF live.

**En production, c'est pire — et je peux le quantifier.** L'app ne lit pas OFF live mais le cache Supabase, dont **45 lignes sur 341 (13,2 %)** sont fraîches avec `packaging_components: []` (mesuré aujourd'hui, §6a). Le biais réellement vécu est donc **au moins égal, et actuellement supérieur**, à ce que mesure l'échantillon. Il se résorbera au 20/08 pour revenir au niveau structurel de 10,7 %.

**Enfin, ce biais est un biais de classement**, pas seulement d'affichage : les trois écrans de liste trient sur `score_final` (`top-by-category.ts:86`, `category/[slug].tsx:112`, `store/[slug].tsx:84`) — dette déjà documentée, dont ce chiffre donne pour la première fois l'amplitude.

**Autres réponses chiffrées :**

- **Le plafond 45 est-il souvent atteint ?** Non : **3/267 (1,1 %)**. La saturation théorique « un seul matériau à risque élevé au contact = 46 points » reste marginale.
- **Le malus mord-il partout ?** Non — il ne mord réellement que sur les eaux : malus > 0 sur **86 %** des eaux, mais **8,2 %** des sodas, pourtant couverts à 87,8 %. Conséquence directe et non re-débattue de l'amortissement : la bouteille PET d'un soda n'apparaît jamais dans sa note, celle d'une eau toujours.
- **Inversions NOVA brutes** (NOVA 4 au-dessus d'un NOVA 1-2 dans la même catégorie) : **zéro sur 299**. L'inversion redoutée n'existe pas — le plafond NOVA écrase trop. Les inversions réelles passent par d'autres canaux : `serving_size` (bloquant 3), NOVA absent (bloquant 4), packagings absents (ci-dessus). *Réserve : sodas et plats ne contiennent aucun NOVA 1-2 dans l'échantillon.*

---

## 8) Ordre de correction proposé

Aucune correction n'a été appliquée. Ce qui suit est une proposition, pas une décision.

### Lot 0 — Bloque la publication App Store, coût faible, zéro risque technique

| # | Correctif | Coût estimé | Pourquoi d'abord |
|---|---|---|---|
| 1 | **Retirer les 7 clés Expert fantômes** du catalogue (ou les marquer explicitement « à venir » et les sortir de l'écran d'achat) ; corriger « plus de 200 plantes » → 40 | ~1 h | Motif de rejet App Store (2.3.1/3.1.2) et pratique commerciale trompeuse. Aucun code métier touché. |
| 2 | **Corriger la politique de confidentialité** : ARTICLE 3 (l'image OCR est transmise), ajouter Anthropic **et** RevenueCat aux sous-traitants avec base de transfert | ~2 h | Art. 13 et 44+ RGPD. Zéro ligne de code applicatif. |
| 3 | **Retirer la bourrache buvable** du protocole Peau (jours 3 et 17) — la forme capsule d'huile du jour 10 est déjà la forme sûre | ~30 min | Risque santé sur fonctionnalité payante, correctif trivial : 2 chaînes. |

Ces trois-là sont indépendants les uns des autres et de tout le reste. Ils peuvent partir seuls.

### Lot 1 — Santé : le mensonge « Compatible » (à faire d'un bloc)

**Les trois éléments doivent partir ensemble.** C'est la dépendance la plus importante de cet audit :

- **Bloquant 1** — normaliser les clés d'allergènes. **Double détente obligatoire** : normalisation défensive à la lecture (couvre les profils déjà en base) *et* alignement des deux écrans sur les clés du moteur.
- **Bloquant 2** — étendre `flagInsufficientData()` aux branches quantitatives (diabète, bébé, hypertension, cholestérol).
- **MAJ-A** — faire lire `verificationStatus` aux deux consommateurs de liste (`history.tsx:85`, `profile-filters.ts:19`), **sans changer la sémantique d'`isCompatible`**, qui est consommé ailleurs.

**Pourquoi d'un bloc :** corriger le bloquant 1 seul produirait une fiche qui vérifie enfin les allergies pendant que l'historique, les catégories et les enseignes continuent d'annoncer « compatible » sans rien vérifier — une confiance neuve, et fausse, sur les écrans les plus utilisés. Corriger le bloquant 2 seul laisserait les allergies inertes.

**Coût** : moyen. **Le test qui manque** est aussi important que le correctif — un test de bout en bout qui traverse `onboarding → store → auth → adapter → engine`, la frontière exacte où les 887 tests actuels ne vont pas.

### Lot 2 — Vocabulaire du score (indépendant, peu risqué, forte valeur perçue)

MAJ-C (verdicts qui décrivent la formulation en recevant la note composée — corriger aussi le commentaire d'en-tête devenu faux) · MAJ-D (aligner les seuils de la méthodologie sur `getScoreVerdict`) · MAJ-E (unifier « À éviter » sur un seuil unique, ou nommer différemment ce que la home compte). À traiter ensemble : ce sont trois symptômes d'une même racine, et les corriger séparément recréerait des écarts.

Couplage à respecter : `ScoreComparison` (légende « Danger », dégradé v1) casse `ScoreComparison.test.ts:17` et impose de retirer le fichier de l'allowlist `theme-guard` **dans le même commit** — sinon l'assertion « aucune entrée périmée » échoue. **Ne jamais éditer `theme-guard.test.ts` pour contourner : la liste ne peut que rétrécir.**

### Lot 3 — Contraste et accessibilité

MAJ-H (le jaune 1,56:1 de l'écran méthodologie — symboliquement le pire, sur l'écran qui vante la rigueur) · MAJ-J, en commençant par la chip « Bloquant » d'`IngredientRiskMap` : c'est l'information la plus critique pour la santé, et la moins lisible. Puis MAJ-I, qui est un chantier de call-sites : les bons tokens existent déjà (`sageVivid`, `earthDeep`, `forest`), c'est un remplacement mécanique. Y ajouter un garde-fou d'usage, faute de quoi la dérive reviendra.

### Lot 4 — Le scoring lui-même : une décision, pas un correctif

**Bloquants 3 et 4 (`serving_size` et NOVA absent) sont les plus dommageables pour la promesse du produit, et ce sont les plus lourds.** Ils ne peuvent pas être traités comme des bugs :

- Changer la base de portion **change toutes les notes de l'app**. L'ancre Cristaline, les fixtures d'`engine.test.ts` et le calibrage entier sont à refaire.
- Brancher `classifyNova` en repli suppose de rendre `ScoringInput.nova_group` nullable — donc de toucher au contrat d'entrée du moteur, sous D5.
- MAJ-G (43,8 % de notes à 0, bande 70-79 vide, une soupe de légumes indiscernable d'un produit à l'aspartame) pose la question de fond que ce lot devra trancher : l'échelle 0-100 fonctionne aujourd'hui comme un ternaire.

**Ce lot mérite son propre cycle plan → validation → exécution.** Je ne le range pas derrière les autres par ordre d'importance — il est probablement le plus important pour la valeur du produit — mais parce qu'il est le seul dont le périmètre dépasse le correctif.

### Ce qui ne doit PAS être corrigé

- **La fenêtre de cache 100 vs 62** (§6a) : elle expire seule au 20/08. La corriger serait du travail perdu. *Recommandation* : la re-mesurer le 21/08 (`packaging_components=eq.[]` + `updated_at` récent) pour confirmer la résorption plutôt que la supposer.
- **La discontinuité de `scan_history`** : décision documentée et assumée, `score_at_scan` reste le score montré ce jour-là. En revanche **MAJ-B (la race) est un bug distinct** : l'historique enregistre un score que la fiche contredit dans la même session. Correctif simple et indépendant — n'historiser qu'une fois `packagingsQuery` résolue.

---

## 9) Vérification finale

```
$ git diff --stat
(vide)

$ git status --short
?? audit/
```

Aucun fichier de `src/`, `app/`, `supabase/` ou de la racine n'a été touché à aucun moment. Le seul contenu produit vit sous `audit/`, non suivi :

```
audit/00-SYNTHESE.md          ← ce fichier
audit/01-coherence-scores.md
audit/02-donnee-absente.md
audit/03-conformite-editoriale.md
audit/04-distribution-scoring.md   (tronqué — annexe reconstituée en §7)
audit/05-design-a11y.md
audit/sample-runner.ts             (jetable, lecture seule, hors testMatch par défaut)
```

**Aucune correction n'a été appliquée. En attente de validation.**
