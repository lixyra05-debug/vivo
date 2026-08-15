# Audit Agent 5 — Design System v2 & Accessibilité

Dépôt `/Users/volanthector/projects/vivo`, HEAD `45678fa`, arbre propre. Audit de détection uniquement — aucun fichier source modifié. Tous les ratios WCAG sont calculés (luminance relative sRGB, WCAG 2.x), jamais estimés. Méthode et sorties brutes en annexe.

---

## 0) Tableau récapitulatif

| Sévérité | Statut | Constat | Fichier:ligne |
|---|---|---|---|
| MAJEUR | PROUVE | Le jaune historique `#FFC107` à **1,56:1** est toujours posé en couleur de TEXTE (« X% », 11px) sur l'écran méthodologie | `app/methodology.tsx:84` (couleurs :40, :45) |
| MAJEUR | PROUVE | Doctrine v2 « sage/earth jamais porteurs de texte » violée en masse : 38 fonds de boutons `Colors.sage`/`earth` sous texte blanc (2,49:1 / 2,27:1) + 29 `color: Colors.sage/earth` en texte (2,38:1 / 2,17:1) — alors que `sageVivid` (4,80) et `earthDeep` (6,18) passeraient | `src/components/premium/PremiumPaywall.tsx:680+700`, `app/recap/monthly.tsx:462+471`, etc. (liste §2.2) |
| MAJEUR | PROUVE | `ConfidenceBadge` : les 3 variantes posent une couleur v1 en texte 11-13px → 2,03 à 2,59:1, toutes FAIL AA | `src/lib/api/confidence.ts:8-10`, `src/components/product/ConfidenceBadge.tsx:45-49` |
| MAJEUR | PROUVE | Recap mensuel : la moitié basse du dégradé (`#8BAD8B`) rend le blanc et les scores illisibles — blanc 2,49:1, blanc 75% 2,02:1, `#FFB6B0` **1,49:1**, `#B6E0B5` 1,69:1 | `app/recap/monthly.tsx:33-35, :484, :585, :592` |
| MAJEUR | PROUVE | `AlternativeCard` : chips 11px sous AA — NOVA 3 `#B96B00` 3,52:1, additifs 4+ `#B96B00` 4,07:1, NOVA 1-2 `sageVivid` sur pill sage 4,15:1 | `src/components/premium/AlternativeCard.tsx:24, :44, :21` |
| MAJEUR | PROUVE | `IngredientRiskMap` : chip « Bloquant » (info sécurité) garde le rouge v1 `#F44336` en texte 12px → 3,23:1, alors que moderate/high ont été assombris (4,63 / 6,22) | `src/components/product/IngredientRiskMap.tsx:36` |
| MINEUR | PROUVE | 9 nœuds `accessibilityElementsHidden` iOS-only SANS pendant Android dans 6 fichiers — dont **6 nœuds nouveaux non documentés** (la dette connue n'en citait que ScoreCircle) | détail §3.1 |
| MINEUR | PROUVE | **Dette documentée FAUSSE : `ScoreBreakdownChart.tsx` ne contient AUCUN `accessibilityElementsHidden` — et n'en a jamais contenu (git log -S vide)** | `src/components/product/ScoreBreakdownChart.tsx:131` |
| MINEUR | HYPOTHESE | Motif « label groupé sur View sans `accessible={true}` » : le label descriptif risque de n'être jamais annoncé comme groupe | `ScoreBreakdownChart.tsx:131`, `NutrientBreakdown.tsx:138-140`, `IngredientRiskMap.tsx` (root) |
| MINEUR | PROUVE | ~24 emoji d'INTERFACE résiduels rendus (hors emoji de donnée), + 3 chemins via `src/lib` (titre section `🔄`, Alerts, notification) | détail §3.3 |
| MINEUR | PROUVE | Angle mort du garde-fou hex : 5 fichiers HORS allowlist portent des `rgba()` en dur — invisibles pour la regex `#…` alors que `withAlpha()` existe | `CategoryCard.tsx:24`, `StoreCard.tsx:86`, `StoreRankingCard.tsx:73`, `BadgeUnlockedModal.tsx:162`, `ConglomerateSection.tsx:165` |
| MINEUR | PROUVE | `ScoreComparison` : dette connue CONFIRMÉE — dégradé v1 :67, légende « Danger » :77 — plus 4 hex v1-era non documentés (:112, :114, :115, :138) | `src/components/product/ScoreComparison.tsx:67, :77` |
| MINEUR | PROUVE | Scan Choc : section alternative — blanc 13-14px sur sage 0,95 → 2,64:1 (seul FAIL de la carte) | `src/components/premium/ScanChocCard.tsx:214, :222-223` |
| MINEUR | PROUVE | Graphiques non-texte < 3:1 (WCAG 1.4.11) : sparkline `#FF9800` 2,06:1, icônes OCR `#FF9800` 2,06:1, barre méthodo `#FFC107` 1,40:1 sur son track | `sparkline-data.ts:6`, `ocr/analyzing.tsx:202`, `methodology.tsx:433` |
| MINEUR | PROUVE | **Doc CLAUDE.md périmée : les titres emoji qu'elle décrit ont été retirés** (« 🌿 Plantes médicinales » sur explore : 0 emoji dans le fichier ; chips « ✅ 0 additif » / « ⚠️ » d'AlternativeCard : texte nu) | `app/(tabs)/explore.tsx`, `AlternativeCard.tsx:36-44` |
| COSMETIQUE | PROUVE | Dingbats `✓` (U+2713) — glyphes typographiques, pas des emoji couleur | `CompatibilityBanner.tsx:135`, `DayCircle.tsx:133` |
| COSMETIQUE | PROUVE | Puces `•` OCR en couleurs v1 (2,16 / 2,78:1) — décoratives, texte adjacent lisible | `app/ocr/result.tsx:158, :178, :253` |
| COSMETIQUE | PROUVE | Nœuds décoratifs sans contenu masqués iOS-only (indicateurs de pills, skeleton) — impact lecteur d'écran quasi nul | `Skeleton.tsx:63`, `NutrientBreakdown.tsx:150`, `CompatibilityToggle.tsx:99` |
| COSMETIQUE | PROUVE | `🔥` StreakCounter : résiduel documenté « garde son 🔥 jusqu'à la phase 2 » | `StreakCounter.tsx:72, :82` (commentaire :5-10) |
| COSMETIQUE | PROUVE | Médailles `🥇🥈🥉` en mapping d'interface | `CategoryRankCard.tsx:23-25` |
| SAIN ×10 | PROUVE | Voir §5 — allowlist exacte 102=102, tokens v2 vérifiés au centième, scoreColor(62) AA, zéro DOM web en JSX RN, etc. | — |

---

## 1) BLOQUANTS

**Aucun.** Grille appliquée : aucun constat ne trompe l'utilisateur sur la santé/sécurité (aucune couleur n'inverse un sens, aucun verdict n'est faussé) et aucune fonction cœur n'est cassée. Les pires cas sont des défauts de LISIBILITÉ d'informations exactes (chip « Bloquant » à 3,23:1, badge de confiance à 2,03:1) — classés MAJEUR, pas BLOQUANT.

---

## 2) MAJEURS

### 2.1 — [PROUVE] Le défaut historique du projet (jaune 1,56:1) est encore vivant — `app/methodology.tsx`

Le commentaire de `theme.ts:8-9` désigne le défaut fondateur corrigé par la v2 : « score jaune 1,56:1 sur cream ». Ce défaut existe toujours, littéralement, sur l'écran de transparence :

- `app/methodology.tsx:40` (`macros: '#FFC107'`) et `:45` (`allergen: '#FFC107'`) sont posés **en couleur de texte** ligne `:84` : `<Text style={[styles.weightValue, { color }]}>{weight}%</Text>` — `weightValue` est de l'Inter-SemiBold **11px** (`:437-439`).
- Ratios calculés : `#FFC107` sur blanc **1,63:1**, sur cream **1,56:1** — le chiffre exact du défaut historique. FAIL AA (4,5) et même FAIL AA-large (3,0).
- Mêmes lignes, autres axes : `#FF9800` (additives/irritant, :39/:44) **2,16:1** FAIL ; `#4CAF50` (bonus, :42) **2,78:1** FAIL ; `#F44336` (endocrine, :43) 3,68:1 (passerait seulement en large, or c'est du 11px) ; seul `preservative: '#587858'` (:47) passe (4,95:1).

Ironie : c'est l'écran « Comment Vivo note » — celui qui documente la rigueur du score — qui porte les pourcentages illisibles. Le fichier est dans l'allowlist theme-guard (backlog phase 2), mais le backlog documenté porte sur les hex, pas sur le fait qu'un des hex est LE défaut que la v2 déclare corrigé.

### 2.2 — [PROUVE] Doctrine v2 « sage/earth = support, jamais texte » violée systémiquement — ~67 call-sites

`theme.ts:20-21` : « `sage` n'est plus jamais une couleur de texte principale ». `theme.ts:39` : « Jamais du texte ». Or :

**a) 38 fonds de boutons `backgroundColor: Colors.sage` (#8BAD8B) ou `Colors.earth` (#C4A882) portent du texte blanc.** Blanc sur sage = **2,49:1**, blanc sur earth = **2,27:1** — FAIL AA texte normal ET large. Échantillon vérifié (fond + texte blanc confirmés dans le même style) :

| Fond | Texte blanc | Taille |
|---|---|---|
| `PremiumPaywall.tsx:680` (CTA Premium) / `:690, :717` (CTA Expert, earth) | `:700`, `:726` | CTA d'achat |
| `app/recap/monthly.tsx:462` (CTA partage) | `:471` | 14px |
| `src/components/common/ErrorBoundary.tsx:90` | `:99-…` (`buttonLabel`) | 15px |
| `app/(tabs)/scan.tsx:623` (bouton OCR) | `:625-…` (`ocrPrimaryBtnText`) | 14px |
| `app/(tabs)/explore.tsx:531` (`chipActive`) | `:539` (`chipTextActive`) | 13px |
| `app/reminders/index.tsx:746` (`durationBtnActive`) | `:754` (`durationTextActive`) | 14px |
| `app/protocols/[id].tsx:629` (`completeButton`) | `:639` (`completeButtonText`) | 15px |

Liste complète des 38 fonds en annexe A6. Les CTA d'achat du paywall (« Débloquer Premium — 29,99 €/an ») sont concernés. Le point aggravant qui rend le constat systémique et non « dette v1 » : **la palette v2 fournit déjà les bons tokens** — blanc sur `sageVivid` = 4,80:1 PASS, sur `earthDeep` = 6,18:1 PASS, sur `forest` = 9,76:1 PASS. Les call-sites n'ont juste pas suivi.

**b) 29 styles posent `color: Colors.sage` (2,38:1) ou `color: Colors.earth` (2,17:1) en texte** — ex. `app/methodology.tsx:514`, `app/settings/privacy.tsx:515, :519, :564`, `app/plants/[id].tsx:437, :477, :488`, `app/stats/index.tsx:676, :732`, `app/onboarding/welcome.tsx:47`… (liste complète annexe A6). Certains sont sur fond sombre (à vérifier cas par cas), mais les écrans concernés sont majoritairement sur cream/blanc.

Nuance de statut : les ratios et l'existence des 38+29 call-sites sont [PROUVE] ; le fait que TOUS les 38 fonds portent du blanc est extrapolé d'un échantillon de 7/38 vérifiés un à un (7/7 blancs) + `PremiumPaywall` (3 CTA) — le test qui trancherait le solde : vérifier le style de texte associé à chacun des 31 restants.

À noter : `theme.ts:17-18` affirme « Contrainte tenue : toute couleur porteuse de texte atteint ≥ 4,5:1 sur surfaceBase ». C'est vrai des TOKENS (vérifié §5.2) mais faux des USAGES — la contrainte est vérifiée par `theme.test.ts` au niveau palette, aucun garde-fou ne couvre les call-sites.

### 2.3 — [PROUVE] `ConfidenceBadge` : les 3 variantes sont sous 2,6:1 en texte

`src/lib/api/confidence.ts:8-10` définit `#4CAF50` / `#C4A882` / `#FF9800` (palette v1), et `ConfidenceBadge.tsx:45-49` les pose en couleur d'icône ET de texte (11-13px, `:27`) sur un fond teinté à 8% (`:32`). Ratios calculés sur fond composité :

- Vérifié `#4CAF50` sur `#F1F9F1` : **2,59:1** FAIL
- Communauté `#C4A882` sur `#FAF8F5` : **2,14:1** FAIL
- À vérifier `#FF9800` sur `#FFF7EB` : **2,03:1** FAIL

Le badge est affiché sous le header de CHAQUE fiche produit (cf. CLAUDE.md « ConfidenceBadge sous le header produit ») — visibilité maximale, lisibilité minimale.

### 2.4 — [PROUVE] Recap mensuel : la moitié basse du dégradé est illisible

`app/recap/monthly.tsx:33-34` : dégradé plein écran `#2D4A2D → #8BAD8B`, cartes empilées par-dessus (fonds `rgba(255,255,255,0.10)` :519, quasi transparents). Tout passe en haut (blanc sur `#2D4A2D` : 9,86:1), tout casse en bas :

- Blanc pur sur `#8BAD8B` : **2,49:1** FAIL (scores 44px :535, labels)
- Blanc 75% (12px, `:484, :542`) sur `#8BAD8B` : **2,02:1** FAIL
- `#FFB6B0` (« pire produit », 26px, `:585`) sur `#8BAD8B` : **1,49:1** FAIL — pire ratio mesuré de tout l'audit
- `#B6E0B5` (« meilleur produit », 26px, `:592`) sur `#8BAD8B` : **1,69:1** FAIL

C'est une carte pensée pour être CAPTURÉE et PARTAGÉE (`captureRef` + `Sharing`) : l'illisibilité s'exporte dans l'image. La position exacte du point de bascule dépend du layout runtime (contenu scrollable), mais les cartes basses (badge, top marque/catégorie, CTA) tombent mécaniquement sur la zone claire.

### 2.5 — [PROUVE] `AlternativeCard` : chips 11px sous le seuil AA

Fond carte `#FFFFFF` (`:121`), textes 11px (`novaText:194`, `additivesText:198`) :

- NOVA 3 : `#B96B00` (`:24`) sur pill `rgba(255,152,0,0.18)` composité `#FFECD1` → **3,52:1** — FAIL AA texte normal (11px exige 4,5)
- Additifs 4+ : `#B96B00` (`:44`) directement sur la carte blanche → **4,07:1** FAIL
- NOVA 1-2 : `sageVivid` sur pill sage composité `#EAF0EA` → **4,15:1** FAIL (le token passe sur cream à 4,59 mais le fond teinté le fait basculer)
- NOVA 4 : `#B5311E` (`:26`) sur pill rouge `#FDDDDB` → 4,83:1 PASS

Les hex `#B96B00`/`#B5311E` sont déjà des assombrissements v2-era des couleurs v1 — le geste était le bon, le calcul n'a pas été refait sur le FOND TEINTÉ.

### 2.6 — [PROUVE] `IngredientRiskMap` : la chip « Bloquant » a été oubliée par l'assombrissement

`src/components/product/IngredientRiskMap.tsx` : les niveaux moderate et high posent des textes assombris conformes (`#8A6D00` → 4,63:1, `#8B4A00` → 6,22:1 sur leurs fonds — PASS), mais `blocker` (`:36`) garde le rouge v1 brut `text: '#F44336'` → **3,23:1** sur fond composité `#FEECEB`, en 12px (`chipText`, exige 4,5). C'est précisément le niveau le plus critique pour la santé (additif bloquant) qui est le moins lisible des trois niveaux de risque colorés. Le motif « deux niveaux corrigés, le troisième oublié » est le même que §2.5.

---

## 3) MINEURS

### 3.1 — [PROUVE] Inventaire complet `accessibilityElementsHidden` (iOS-only) par NŒUD

Rappel : cette prop n'a aucun effet Android ; le pendant est `importantForAccessibility="no-hide-descendants"`.

**Corrects (4 nœuds, 2 fichiers) — motif de référence :**
- `src/components/ui/Icon.tsx:200-201` — paire conditionnelle `={decorative}` / `{decorative ? 'no-hide-descendants' : 'yes'}` ✔
- `src/components/product/ScoreFactorsCard.tsx:81-82, :92-93, :120-121` — 3 nœuds doublés ✔ (et le commentaire :75-76 explique pourquoi)

**iOS-only SANS pendant Android (9 nœuds, 6 fichiers) :**

| Nœud | Contenu masqué | Statut dette |
|---|---|---|
| `ScoreCircle.tsx:121` | chiffre du score | connue — CONFIRMÉE |
| `ScoreCircle.tsx:125` | « / 100 » | connue — CONFIRMÉE |
| `ScoreCircle.tsx:132` | libellé (« Note globale ») | connue — CONFIRMÉE |
| `MiniScoreCircle.tsx:50` | chiffre du score | **NOUVEAU, non documenté** |
| `ScanHistoryCard.tsx:71` | nom + marque + date | **NOUVEAU** (impact atténué : le parent `Pressable:43-47` est accessible et groupe déjà) |
| `ScanHistoryCard.tsx:97` | `<MiniScoreCircle>` avec son propre label | **NOUVEAU** (idem) |
| `NutrientBreakdown.tsx:150` | indicateur animé de pill (aucun texte) | **NOUVEAU** — impact quasi nul |
| `CompatibilityToggle.tsx:99` | indicateur animé de pill (aucun texte) | **NOUVEAU** — impact quasi nul |
| `Skeleton.tsx:63` | gradient décoratif (aucun texte) | **NOUVEAU** — impact quasi nul ; contraste avec `Icon.tsx` qui fait la paire |

Conséquence Android (nœuds porteurs de texte) : TalkBack lit le label groupé PUIS chaque enfant — le score est annoncé deux fois sur `MiniScoreCircle` et potentiellement `ScoreCircle`.

### 3.2 — **[PROUVE] La dette documentée est FAUSSE sur `ScoreBreakdownChart.tsx`** + [HYPOTHESE] labels groupés inopérants

La doc projet (CLAUDE.md, « Dette identifiée ») affirme : « `ScoreCircle.tsx` (3 nœuds) et `ScoreBreakdownChart.tsx` masquent leurs enfants avec `accessibilityElementsHidden` ». **C'est faux pour le second : `grep accessib ScoreBreakdownChart.tsx` ne renvoie que `:131 accessibilityLabel`, et `git log -S "accessibilityElementsHidden" -- ScoreBreakdownChart.tsx` est VIDE — la chaîne n'a jamais existé dans ce fichier** (historique complet : `7541ec0` création, `ccc5f18` refonte v2).

L'état réel est différent — et possiblement pire : le root `View:131` porte un `accessibilityLabel` descriptif complet SANS `accessible={true}` ni masquage des enfants. [HYPOTHESE] En React Native, une `View` n'est pas un élément d'accessibilité par défaut : le label groupé risque de n'être JAMAIS annoncé, et les enfants (titre, sous-titre, verdict, MiniScoreCircle) d'être lus individuellement sur LES DEUX plateformes. Même motif sur `NutrientBreakdown.tsx:138-140` et `IngredientRiskMap.tsx` (root `View` avec `a11yLabel`). Test qui tranche : VoiceOver/TalkBack sur la fiche produit, ou test RNTL vérifiant que le nœud est focusable (`accessible` prop).

### 3.3 — [PROUVE] Emoji d'INTERFACE résiduels (~24 occurrences rendues + 3 chemins via `src/lib`)

Classification appliquée : emoji de DONNÉE exclus (voir liste d'exclusions en annexe A4). Le test `app/(tabs)/__tests__/index.test.tsx:127` (« annonce les sections par des libellés, plus par des titres emoji », assertion `queryByText(/🌿|📅|📊/) → null`) documente l'intention v2 — sa portée est la HOME uniquement. Résiduels d'interface hors home :

**Dans le JSX (rendus à l'écran) :**
- `src/components/premium/ScanChocCard.tsx:57` « ⚠️ ATTENTION » (titre), `:95` « ✅ Mieux noté »
- `app/landing.tsx:49` « 🍎 App Store » / « ▶️ Google Play »
- `app/ocr/result.tsx:91` « 🧴 Cosmétique » / « 🥗 Aliment »
- `app/plants/[id].tsx:209-210` « Dans mon herbier ✅ » / « Ajouter à mon herbier 🌿 », `:225` « Créer un rappel de cure 💊 »
- `app/protocols/[id].tsx:257` ☕ (icône), `:262` 💡 (icône), `:323` « Jour complété ✅ », `:357` « Démarrer le protocole 🌱 », `:370` « … ⭐ »
- `app/recap/monthly.tsx:263` 📊 (empty state), `:322` « 😬 Le pire produit du mois », `:335` « 🌟 Le meilleur produit du mois »
- `app/reminders/index.tsx:323` « Pris ✅ »
- `app/settings/subscription.tsx:273, :364, :382, :440` (« Tu es Expert 🌿 », « Tu es Premium ✓ », …), `:489` « 🌿 RECOMMANDÉ »
- `app/stats/index.tsx:461` « Aucun additif détecté … ✅ »
- `src/components/explore/CategoryRankCard.tsx:23-25` 🥇🥈🥉 (mapping rang → médaille)
- `src/components/gamification/StreakCounter.tsx:72, :82` 🔥 — backlog assumé (commentaire `:5-10` : « garde son 🔥 jusqu'à la phase 2 ») → classé COSMETIQUE

**Via `src/lib` (hors périmètre du scan composants, mais rendus/affichés à l'utilisateur) :**
- `src/lib/api/smart-alternatives.ts:222-224` « 🔄 Des alternatives… » — rendu comme TITRE DE SECTION par `AlternativesSection.tsx:99`. C'est exactement le motif « titre de section emoji » que la v2 a retiré de la home.
- `src/lib/purchases/use-vivo-purchase.ts:169` (« Bienvenue dans Vivo X 🌿 »), `:196` (« Abonnement restauré ✅ ») — titres d'Alert.
- `src/lib/reminders/reminder-store.ts:110` (« Ta cure du jour 🌿 ») — titre de notification.

**Signalement doc en gras** : **CLAUDE.md décrit encore la section explore comme « 🌿 Plantes médicinales » et les chips AlternativeCard comme « ✅ 0 additif » / « ⚠️ X additifs » — le code actuel n'a AUCUN emoji dans `app/(tabs)/explore.tsx` (scan complet vide) et `AlternativeCard.tsx:36-44` rend « 0 additif » / « N additifs » en texte nu.** La doc est en retard sur l'assainissement réel, dans le bon sens.

### 3.4 — [PROUVE] Angle mort du garde-fou : `rgba()` en dur dans 5 fichiers HORS allowlist

La regex de `theme-guard.test.ts:25` (`#[0-9A-Fa-f]{3,8}\b`) ne voit que l'hex. 5 fichiers réputés « propres » (hors allowlist) portent des couleurs en dur au format `rgba()` :

- `src/components/explore/CategoryCard.tsx:24` — `rgba(139, 173, 139, 0.14)` / `rgba(196, 168, 130, 0.18)`
- `src/components/explore/StoreCard.tsx:86` — `rgba(139, 173, 139, 0.14)`
- `src/components/explore/StoreRankingCard.tsx:73` — `rgba(139, 173, 139, 0.16)`
- `src/components/gamification/BadgeUnlockedModal.tsx:162` — `rgba(0,0,0,0.5)`
- `src/components/product/ConglomerateSection.tsx:165` — `rgba(139, 173, 139, 0.14)`

`withAlpha()` (`theme.ts:220-226`) existe précisément pour ça. Fonds décoratifs, aucun enjeu de contraste — l'enjeu est l'étanchéité du garde-fou : un fichier peut aujourd'hui être « conforme R6 » en écrivant toutes ses couleurs en `rgba()`.

### 3.5 — [PROUVE] `ScoreComparison.tsx` : dette connue confirmée + 4 hex non documentés

État actuel confirmé :
- `:67` — dégradé v1 `['#F44336', '#FF9800', '#FFC107', '#4CAF50']` (bande de 10px de haut ; sur cream, `#FFC107` ne se détache qu'à 1,56:1 — le milieu de l'échelle est quasi invisible en tant que graphique, cf. 1.4.11).
- `:77` — légende « Danger » là où `getScoreVerdict` dit « À éviter » (incohérence de vocabulaire corrigée partout ailleurs).
- Non documentés dans la dette : `:112` `#FFFFFF` (dot), `:114` `#405A40` (bordure), `:115` `#587858` (ombre), `:138` `#A9C4A9` (tick) — verts v1-era.

Couplages de correction RAPPELÉS (non touchés) : `src/components/product/__tests__/ScoreComparison.test.tsx:17` attend `getByText('Danger')` (adapter dans le même commit) ; `theme-guard.test.ts:119` liste le fichier dans l'allowlist (le retirer dans le même commit si tous les hex partent, sinon l'assertion « aucune entrée périmée » `:162-165` échoue).

**Précision vs doc, en gras** : **CLAUDE.md écrit « À 45, le chiffre est `#A8500B` sur une bande `#FF9800` » — c'est inexact : `markerLabel` est positionné `top: -26` (`:101`) dans `markerRow` (hauteur 30, `:90`), AU-DESSUS de `trackWrap`. Le chiffre est posé sur le fond de la carte (5,26:1, PASS), pas sur le dégradé.** Le vrai défaut est le voisinage chromatique v1/v2 (marqueur v2 posé à côté d'une échelle v1), pas une superposition illisible.

### 3.6 — [PROUVE] Scan Choc : la section alternative échoue seule

`ScanChocCard.tsx` : tous les textes blancs sur le dégradé rouge passent AA (4,83 à 8,54:1 — voir §5.6), SAUF la section alternative : fond `rgba(139,173,139,0.95)` (`:214`, sage quasi opaque) sous du blanc 13-14px (`:222-223, :240-…`) → **2,64:1** FAIL. C'est le même défaut de fond que §2.2 (sage porteur de texte blanc), sur une carte destinée au partage social.

### 3.7 — [PROUVE] Non-texte sous 3:1 (WCAG 1.4.11)

- `src/lib/stats/sparkline-data.ts:6` — `SPARKLINE_COLOR_NEGATIVE '#FF9800'` : trait de tendance sur cream, **2,06:1**. L'information « tendance à la baisse » portée par une couleur sous le seuil graphique.
- `app/ocr/analyzing.tsx:202` et `app/ocr/result.tsx:152` — icônes `AlertTriangle #FF9800` sur cream : **2,06:1**.
- `app/methodology.tsx:433` (`weightFill`) — la barre `#FFC107` sur son track `#EEEEE3` : **1,40:1** ; sur blanc : 1,63:1. La barre de poids « Profil nutritionnel » est à peine discernable.

---

## 4) COSMETIQUES

1. [PROUVE] `CompatibilityBanner.tsx:135` (`✓ X% des critères passent`) et `DayCircle.tsx:133` (`'✓'`) — U+2713 est un dingbat typographique rendu en couleur du texte, pas un emoji couleur. Hors périmètre « emoji d'interface » au sens strict ; mentionnés pour exhaustivité.
2. [PROUVE] `app/ocr/result.tsx:158, :178, :253` — puces `•` colorées v1 (`#FF9800` 2,16:1, `#4CAF50` 2,78:1). Décoratives : le `bulletText` adjacent porte l'information en couleur conforme.
3. [PROUVE] Nœuds décoratifs sans contenu textuel masqués iOS-only (`Skeleton.tsx:63`, `NutrientBreakdown.tsx:150`, `CompatibilityToggle.tsx:99`) — recensés §3.1, impact réel quasi nul (rien à lire).
4. [PROUVE] `StreakCounter.tsx:72, :82` — 🔥 conservé, backlog explicitement documenté dans le fichier (`:5-10`).
5. [PROUVE] `CategoryRankCard.tsx:23-25` — 🥇🥈🥉 : mapping d'interface, cohérence v2 à arbitrer en phase 2 avec le reste de l'allowlist (le fichier y est déjà).

---

## 5) Vérifié et SAIN (avec preuves)

1. **Garde-fou hex : concordance PARFAITE.** Rejeu exact de la méthode de `theme-guard.test.ts` (mêmes dossiers `src/components` + `app`, même exclusion `__tests__`, même regex `:25`) : corpus 138 fichiers, **102 porteurs d'hex = 102 entrées d'allowlist**, **0 offender hors allowlist, 0 entrée périmée, 0 doublon** (sortie brute annexe A1). Aucune entrée d'allowlist n'est devenue inutile — la liste ne peut pas rétrécir aujourd'hui sans assainir un fichier.
2. **Le compteur a BAISSÉ : 106 → 102**, documenté dans le test lui-même (`theme-guard.test.ts:14-15` : la refonte home a sorti `index.tsx`, `AnimatedVivoBrand`, `FamilyProfilePills`, `TopByCategorySection`). La tendance est la bonne.
3. **Tokens v2 : 13/13 ratios commentés EXACTS au centième** (annexe A2). `ink` 16,05:1, `forest` 9,33:1, `sageVivid` 4,59:1, `earthDeep` 5,91:1, `textSecondary` 7,29:1, `textMuted` 4,68:1, et les 5 couleurs de score toutes ≥ 4,79:1 sur `surfaceBase`. `theme.test.ts` existe et calcule bien la luminance WCAG avec seuil `AA = 4.5` (`src/constants/__tests__/theme.test.ts:19-33`).
4. **La bande 60-70 est saine** : `scoreColor(62)` → `Colors.score.yellow` = `Palette.scoreMid` `#8A6508` (`colors.ts:54`, seuil `>= 50`) → **5,09:1** sur cream, PASS AA. Le score central de l'app est lisible sur toute l'échelle (pire cas : `scoreGood` 4,79:1, PASS).
5. **Aucun composant web DOM dans le JSX RN.** `<div>`/`<span>` n'existent QUE dans `src/lib/export/generate-pdf.ts` — exclusion motivée : c'est une chaîne HTML pour `expo-print` (document imprimé), pas du JSX. `dangerouslySetInnerHTML` n'existe QUE dans `app/+html.tsx:22` — fichier spécial Expo Router, shell HTML du build web, react-dom y est légitime. Tous les `className=` sont du NativeWind (stack officielle, CLAUDE.md « UI : NativeWind »), pas du CSS web.
6. **Scan Choc : 4 combos sur 5 passent** — blanc sur `#DC2626` 4,83:1 (header 24px bold), sur `#991B1B` 8,31:1, sur les rows assombries 6,65:1, sur le bloc score 8,54:1 (annexe A5). Le rouge viral a été choisi assez sombre.
7. **Le motif a11y correct existe et est documenté dans le code** : `Icon.tsx:200-201` (paire conditionnelle) et `ScoreFactorsCard.tsx:75-76, :81-82, :92-93, :120-121` (3 nœuds doublés + commentaire expliquant le pourquoi). La référence à imiter est en place.
8. **La home v2 est réellement sans emoji d'interface**, et c'est verrouillé par un test qui distingue explicitement donnée/interface (`app/(tabs)/__tests__/index.test.tsx:81-96` fige l'emoji de plante comme DONNÉE, `:127-131` interdit les titres emoji). `app/(tabs)/explore.tsx` est lui aussi à 0 emoji (au-delà de la promesse : la doc le décrit encore avec).
9. **`ScoreComparison` marqueur v2 : lisible.** `#A8500B` (18px bold) sur fond de carte : 5,26:1, PASS — et le chiffre n'est pas superposé au dégradé (§3.5).
10. **Les assombrissements v2 récents fonctionnent là où ils ont été appliqués** : NOVA 4 `#B5311E` 4,83:1 PASS ; `IngredientRiskMap` moderate `#8A6D00` 4,63:1 et high `#8B4A00` 6,22:1 PASS ; delta pill `scoreExcellent` sur fond teinté 4,80:1 PASS. Les défauts §2.5/§2.6 sont des oublis ponctuels dans un geste globalement réussi.

---

## 6) Annexes — sorties brutes

### A1 — Rejeu du balayage theme-guard (python3, méthode identique au test)

```
CORPUS: 138 fichiers
WITH_HEX: 102 fichiers
ALLOWLIST: 102 entrées
HORS ALLOWLIST (offenders): []
ENTREES PERIMEES (stale): []
DOUBLONS ALLOWLIST: []
```
(Liste nominative des 102 fichiers : identique à `theme-guard.test.ts:32-133`, vérifiée ensemble par ensemble.)

### A2 — Tokens v2 sur `surfaceBase #FAFAF7` (calculé vs commenté)

```
ink            #14201A : 16.05:1 (commenté 16,05) PASS
forest         #2D4A3A :  9.33:1 (commenté 9,33)  PASS
sage           #8BAD8B :  2.38:1 (commenté 2,38)  décoratif assumé
sageVivid      #4F7D4E :  4.59:1 (commenté 4,59)  PASS
earth          #C4A882 :  2.17:1 (commenté 2,17)  décoratif assumé
earthDeep      #7A5C2E :  5.91:1 (commenté 5,91)  PASS
textSecondary  #41594B :  7.29:1 (commenté 7,29)  PASS
textMuted      #607669 :  4.68:1 (commenté 4,68)  PASS
scoreExcellent #1F7A3D :  5.14:1 | scoreGood #4A7C1E : 4.79:1 | scoreMid #8A6508 : 5.09:1
scorePoor      #A8500B :  5.26:1 | scoreBad  #A62B1A : 6.73:1   — tous PASS
scoreColor(62) = scoreMid #8A6508 : 5.09:1 PASS
```

### A3 — Palette v1 posée en texte (fonds composités calculés)

```
methodology  #FFC107 (11px)  blanc 1.63 / cream 1.56  FAIL   (methodology.tsx:40,:45 → :84)
methodology  #FF9800 (11px)  blanc 2.16               FAIL   (:39,:44)
methodology  #4CAF50 (11px)  blanc 2.78               FAIL   (:42)
methodology  #F44336 (11px)  blanc 3.68               FAIL AA normal (:43)
methodology  #587858 (11px)  blanc 4.95               PASS   (:47)
ConfidenceBadge verified   #4CAF50 sur #F1F9F1 : 2.59 FAIL
ConfidenceBadge community  #C4A882 sur #FAF8F5 : 2.14 FAIL
ConfidenceBadge unverified #FF9800 sur #FFF7EB : 2.03 FAIL
IngredientRiskMap blocker  #F44336 sur #FEECEB : 3.23 FAIL (12px)
IngredientRiskMap moderate #8A6D00 sur #FFF8E1 : 4.63 PASS
IngredientRiskMap high     #8B4A00 sur #FFF3E0 : 6.22 PASS
IngredientRiskMap safe     #2B3E2B sur #F1F5F1 : 10.44 PASS
OCR bulletDot #FF9800 : 2.16 / #4CAF50 : 2.78 (puces décoratives)
```

### A4 — Emoji : exclusions de DONNÉE appliquées (non comptés comme défauts)

`app/family/edit.tsx:43-50` (choix d'`avatar_emoji`) · `app/protocols/[id].tsx:39` (`FEELING_EMOJIS`, tracker documenté) · `app/recipes/index.tsx:35-41` + `app/recipes/[id].tsx:38-44` (`CATEGORY_META`, catégories) · `app/recap/monthly.tsx:395-399` (identité des badges) · `app/swap/[barcode].tsx:19-21` (data statique) · `app/scan-choc/[barcode].tsx:77-110` (champ `emoji` des problèmes, structure de donnée documentée) · `NaturalityBadge.tsx:130` + `reminders/index.tsx:269` (fallback de `plant.emoji`) · `src/lib/api/categories.ts:25` (champ `emoji` de catégorie) · commentaires non rendus (`herbarium/index.tsx:2`, `recipes/index.tsx:2`, `reminders/index.tsx:2`, `scan-choc:9-14`, `StreakCounter:5-10`).

### A5 — Gradients (fonds composités)

```
SCAN CHOC (#DC2626 → #991B1B)
  blanc / #DC2626 (24px bold)        : 4.83 PASS
  blanc / #991B1B                    : 8.31 PASS
  blanc / row rgba(0,0,0,0.18)+haut  : 6.65 PASS
  blanc / bloc score 0.32+haut       : 8.54 PASS
  blanc / alternative sage 0.95      : 2.64 FAIL   ← §3.6
RECAP (#2D4A2D → #8BAD8B)
  blanc / #2D4A2D                    : 9.86 PASS
  blanc / #8BAD8B                    : 2.49 FAIL
  blanc 75% / #8BAD8B                : 2.02 FAIL
  blanc 85% / #8BAD8B                : 2.21 FAIL
  #FFB6B0 / #8BAD8B (26px)           : 1.49 FAIL   ← pire ratio de l'audit
  #B6E0B5 / #8BAD8B (26px)           : 1.69 FAIL
  CTA blanc / Colors.sage            : 2.49 FAIL
BOUTONS (référence)
  blanc / sage #8BAD8B : 2.49 FAIL   | blanc / sageVivid #4F7D4E : 4.80 PASS
  blanc / earth #C4A882 : 2.27 FAIL  | blanc / earthDeep #7A5C2E : 6.18 PASS
  blanc / forest #2D4A3A : 9.76 PASS
```

### A6 — Call-sites `Colors.sage`/`Colors.earth` (grep brut)

**38 `backgroundColor:` (boutons/chips actifs) :** `HealthConsentModal.tsx:166,:199` · `WeeklyProgressBar.tsx:141,:162` · `ReportButton.tsx:305` · `RecipeTimer.tsx:140` · `ProtocolCard.tsx:161(earth),:181` · `ErrorBoundary.tsx:90` · `PremiumPaywall.tsx:566(earth),:680,:690(earth),:708,:717(earth)` · `ShareableCard.tsx:81` · `HerbariumNoteModal.tsx:160` · `subscription.tsx:737(earth),:788,:799(earth)` · `recap/monthly.tsx:462` · `plants/[id].tsx:462` · `explore.tsx:531` · `scan.tsx:623` · `family/index.tsx:331,:408` · `recipes/[id].tsx:374,:404` · `herbarium/index.tsx:314` · `remedies/[categoryId].tsx:238` · `protocols/index.tsx:224` · `protocols/[id].tsx:629,:662` · `reminders/index.tsx:513,:554,:608,:621,:746,:758`

**29 `color:` (texte) :** `methodology.tsx:514` · `privacy.tsx:515,:519,:564` · `subscription.tsx:908,:926` · `cgu.tsx:370,:381` · `explore.tsx:599` · `plants/[id].tsx:437,:477(earth),:488` · `ocr/analyzing.tsx:348` · `scan.tsx:647` · `family/index.tsx:365` · `ocr/result.tsx:342,:481` · `recipes/[id].tsx:324` · `recipes/index.tsx:354` · `herbarium/index.tsx:351` · `protocols/index.tsx:214,:236` · `reminders/index.tsx:52(earth),:65,:588,:730` · `stats/index.tsx:676,:732(earth)` · `onboarding/welcome.tsx:47`

### A7 — Références de méthode

- Regex hex du garde-fou : `theme-guard.test.ts:25` (`#[0-9A-Fa-f]{3,8}\b`) ; dossiers scannés `:24` ; collecte `:136-147`.
- `git log -S "accessibilityElementsHidden" -- src/components/product/ScoreBreakdownChart.tsx` → vide (fichier créé `7541ec0`, refondu `ccc5f18`).
- Formule contraste : L = 0.2126·R' + 0.7152·G' + 0.0722·B' (sRGB linéarisé), ratio (L1+0.05)/(L2+0.05). Fonds semi-transparents composités par alpha-blending avant calcul.
