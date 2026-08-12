# Vivo — Scanner Nutritionnel Intelligent

## Contexte
App mobile React Native/Expo de scanning nutritionnel pour le marché français. Score de santé 0-100 basé sur un algorithme de pénalités toxicologiques (pas le Nutri-Score). Détecte les additifs dangereux, les huiles de graines, le clean labeling, et adapte le score au profil santé de l'utilisateur. Concurrent direct de Yuka avec une approche scientifiquement plus rigoureuse.

## Stack
- **Mobile** : React Native + Expo SDK 54 (TypeScript strict)
- **Navigation** : Expo Router (file-based)
- **UI** : NativeWind (Tailwind pour RN) + React Native Paper
- **Scanner** : `expo-camera` (vision-camera retiré Sprint 1)
- **State** : Zustand + React Query (TanStack)
- **Backend** : Supabase (West EU Ireland) — Auth, PostgreSQL, Storage, Edge Functions
- **BDD Produits** : Open Food Facts API v2 (cache local 7 jours)
- **Paiements** : RevenueCat (IAP iOS/Android) + Stripe (web)
- **Analytics** : PostHog
- **Crash** : Sentry
- **CI/CD** : EAS Build + EAS Submit

## Architecture clé
- `src/lib/scoring/engine.ts` — CŒUR : moteur de scoring (100 - pénalités)
- `src/lib/scoring/additives-db.ts` — 700+ additifs avec pénalités
- `src/lib/scoring/nova-classifier.ts` — Classification NOVA 1-4
- `src/lib/scoring/seed-oils.ts` — Détection huiles de graines
- `src/lib/scoring/clean-labeling.ts` — NLP termes trompeurs
- `src/lib/scoring/profiles.ts` — Modificateurs par profil utilisateur
- `src/lib/scoring/compatibility-engine.ts` — Filtre B "Ce que je peux manger" (allergènes EU + diététique + 7 conditions + FODMAP)
- `src/lib/scoring/compatibility-presets.ts` — 6 presets (enceinte, bebe, diabete_t2, coeliaque, ibs_fodmap, sportif)
- `src/lib/scoring/profile-filters.ts` — Wrappers booléens autour de `checkCompatibility`
- `src/lib/scoring/profile-adapter.ts` — `userProfileToCompatibilityProfile` (renvoie `null` si pas de besoin spécifique → toggle masqué)
- `src/lib/api/stores.ts` — Référentiel TS de 10 enseignes FR + `fetchStoreTopProducts` (OFF v2 `stores_tags`, cache LRU 5min/30 entrées)
- `src/lib/api/confidence.ts` — Niveau de confiance produit (Vérifié / Communauté / À vérifier) à partir de la complétude des champs
- `src/lib/api/reports.ts` — Soumission et comptage des signalements (table `product_reports`)
- `src/lib/gamification/types.ts` — Source unique des types partagés (`ScanRecord`, `WeeklySummary`, `BadgeDef`, `EducationalCard`, `ScoringMethodology`…) — ne jamais dupliquer
- `src/lib/gamification/streak-engine.ts` — Calcul streak en jours civils Europe/Paris (`calculateStreak`, `isStreakActive`)
- `src/lib/gamification/badge-engine.ts` — Catalogue 12 badges + évaluation (`BADGES`, `getUserStats`, `checkBadges`)
- `src/lib/gamification/weekly-summary.ts` — Synthèse hebdo ISO (lun→dim Paris, DST-safe)
- `src/lib/education/content-database.ts` — 31 cartes éducatives (additifs/ingrédients/score/cosmétique/général + 9 cartes Beauvillard cross-référencées) + `findRelevantCards`
- `src/lib/education/transparency.ts` — `SCORING_METHODOLOGY` (poids food/cosmetic + 5 FAQ + sources EFSA/ANSES/OMS/CIRC)
- `src/lib/stats/profile-stats-engine.ts` — `calculateProfileStats` (totaux, top 3 catégories, scansByDay 28j, week-over-week) — seuils <30/>80
- `src/lib/stats/sparkline-data.ts` — Génération points + couleur trend (sage/orange/earth) pour `WeeklySparkline`
- `src/lib/stats/notification-scheduler.ts` — Planification résumé hebdo (lazy `require('expo-notifications')`, graceful degradation)
- `src/lib/stores/useBadges.ts` — Hooks React Query : `useUserBadges`, `useGrantBadges` (onConflict do-nothing), `useUserReportCount`

## Features Gamification / Éducation / Stats / Transparence
- **Streak & badges** : `StreakCounter` (compact dans Greeting, full sur profil), `BadgeGrid` 4 colonnes avec verrouillé/débloqué, `BadgeUnlockedModal` (12 particules Reanimated, `useReduceMotion` → haptic only)
- **Synthèse hebdo** : `WeeklyProgressBar` 7 dots sous StatsRow home (apparaît si `last7.length === 7`), notification locale dimanche 19h via `expo-notifications` (opt-in, no-op web)
- **Stats profil** : `ProfileStatsSection` remplace les 3 StatCards locaux — `WeeklySparkline` (react-native-svg, 28j), 6 StatCards, top 3 catégories
- **Cartes éducatives** : `EducationalCard` triggered par additifs/ingrédients/score, `findRelevantCards` priorise warning > informative > positive (max 2 par fiche)
- **Transparence** : écran `app/methodology.tsx` (lien depuis ScoreCircle "Comment ce score est calculé ?" + SettingsRow profil), 6 sections (Mission, Food, Cosmetic, Sources, FAQ, CTA)
- **Migration** : `010_gamification.sql` (colonne `product_type` sur scan_history + tables `user_badges` & `user_streaks` RLS)

## Données médicales enrichies via NotebookLM (cross-référencées EFSA/ANSES/IARC)
- **Méthode** : extraction des listes d'additifs Corinne Gouget depuis le notebook `medecine`, puis cross-référence systématique avec EFSA, ANSES (stratégie PE 2019) et IARC monographs. Retenu **uniquement** quand les agences officielles convergent avec Gouget sur le risque. Source citée = EFSA / ANSES / IARC / eur-lex **uniquement** ; **jamais** Gouget (test garde-fou dans `additives-db-enriched.test.ts`)
- **35 additifs ajoutés à `additives-db.ts`** (avant : 22 entrées → après : 57) :
  - Colorants (6) : E127, E131, E142, E161g, E173, E180
  - Conservateurs blockers (4) : E216, E217 (parabènes interdits UE 2006/52), E230 (retrait UE 2014, règlement 1129/2011), E240 formaldéhyde (IARC groupe 1)
  - Conservateurs surveillés (4) : E210 (benzène + vit. C), E211 (Southampton/McCann 2007 → blocker enfant), E214, E215 (parabènes PE potentiels)
  - Sulfites (8) : E220-E228 (allergène EU listé, asthme → blocker enfant)
  - Antioxydants (3) : E310 gallate de propyle, E320 BHA (IARC 2B + ANSES PE), E321 BHT
  - Émulsifiants risque microbiote (3) : E407 carraghénanes, E433 polysorbate 80, E466 CMC (Chassaing/Gewirtz 2015 + Chassaing 2021)
  - Aluminium (2) : E520, E541 (DHTP EFSA 2008 dépassée chez l'enfant)
  - Nano/talc (2) : E551 SiO₂ (préoccupation nano EFSA 2018), E553b talc (IARC 2B périnée)
  - Exhausteurs cocktail (2) : E627, E631 (low/10, surveillance E621)
  - Édulcorant (1) : E952 cyclamate (blocker enceinte)
- **Rétrogradation E954 saccharine** : high/40 → moderate/25, isBlocker=false (IARC reclassée groupe 3 en 1999, preuves humaines insuffisantes ; DJA EFSA 5 mg/kg pc/j conservée)
- **Tests** : `src/lib/scoring/__tests__/additives-db-enriched.test.ts` → 40 tests, dont 1 garde global "aucune source ne cite Gouget"
- **Total tests projet** : 288 → **328 verts** (aucune régression)
- **Règle source** : tout ajout futur d'additif doit citer ≥ 1 URL publique EFSA / ANSES / IARC / eur-lex / DOI revue à comité de lecture. Jamais d'auteur militant, jamais de blog, jamais de TikTok
- **Cartes éducatives Beauvillard cross-référencées** : 9 cartes ajoutées à `content-database.ts` (22 → 31) après extraction du livre *Le médecin des pauvres* (1912). Sources retenues = Cochrane, EFSA, ANSES, ANSM, EMA — **jamais Beauvillard** (test garde-fou anti-Beauvillard dans `content-database-enriched.test.ts`).
  - Positives (4) : `garlic_cardio` (Cochrane), `cruciferous` (EFSA), `berries_antioxidant` (EFSA), `calming_herbs` (EMA)
  - Warnings (5) : `honey_infant_warning` (Cochrane + ANSES botulisme <1an), `licorice_bp` (EFSA 2008 hypertension), `st_johns_wort_interactions` (ANSM interactions médicamenteuses), `wild_mushrooms` (ANSES), `ultra_processed_risk` (ANSES + NutriNet-Santé)
  - **Total tests projet** : 328 → **370 verts** (+42 dans `content-database-enriched.test.ts`)

## Features Stores / Compatibilité / Confiance
- **Listes par enseigne** : écran `app/store/[slug].tsx`, section "Enseignes" sur l'explore (2 colonnes), cache local 5min, fallback liste vide silencieux
- **Mode "Ce que je peux manger"** : toggle 100g/Compatibles sur category + store screens (style `NutrientBreakdown`), banner sur fiche produit, compteur "X / Y compatibles"
- **Confiance & signalement** : `ConfidenceBadge` sous le header produit, `ReportButton` discret avec modal slide (5 raisons FR + description optionnelle), pas de photo MVP
- **Adapter user→compat** : `userProfileToCompatibilityProfile` mappe `diabetic→diabete`, `pregnant→enceinte`, `child→bebe` ; renvoie `null` si standard sans allergie pour masquer le toggle
- **Migration** : `009_stores_confidence_reports.sql` (table `product_reports` RLS + table `stores` seedée idempotente)

## Sprint 1 — Corrections audit (avril 2026)
Audit global a remonté score 62/100 → corrections livrées : **score cible ~80/100**, débloque TestFlight.

- **Migration `012_security_fixes.sql`** (idempotente) :
  - C-001 : RLS activée sur `products` / `additives` / `swap_categories` / `swap_rules` (advisor `rls_disabled_in_public` éliminé)
  - Policy `products` : SELECT public + INSERT/UPDATE pour `authenticated` (cache OFF côté client préservé)
  - C-002 : drop FK `scan_history_barcode_fkey → products` (bloquait les barcodes cosmétiques absents de products)
  - C-003 : DELETE policy `scan_history` (RGPD art. 17 — droit à l'effacement)
  - C-004 : colonnes `consent_at` + `cgu_version` sur `user_profiles` (RGPD art. 7 — preuve consentement)
- **API OFF** : tous les appels passent par `fr.openfoodfacts.org` (le sous-domaine `world.` bloque les requêtes anonymes en 503/429). `SourceLink` / `ProductNotFound` gardent `world.` (liens canoniques SEO visibles user).
- **Scanner cosmétique (C-007)** : helper `fetchProductMultiSource(barcode)` dans `src/lib/api/openfoodfacts.ts` cascade OFF→OBF, route `/product/{code}?type=food|cosmetic`. `app/(tabs)/scan.tsx` utilise désormais `expo-camera`.
- **Premium gate (C-005)** :
  - Hook `usePremium()` dans `src/lib/premium/premium-gate.ts` lit la table `subscriptions` (`plan='premium' AND status IN ('active','trialing')`)
  - Flag `__DEV_UNLOCK_PREMIUM__ = false` exporté du même fichier — pour tester en local comme premium, flipper à `true` (NE JAMAIS commit à `true`)
  - 3 lectures `subscription_tier` remplacées dans `app/settings/subscription.tsx`, `app/(tabs)/profile.tsx`, `app/(tabs)/history.tsx`
  - `app/settings/subscription.tsx` converti en écran info (plus de bouton "S'abonner" — App Store Guideline 3.1.1). RevenueCat deferred Sprint 2
- **Sécurité / RGPD** :
  - `SUPABASE_SERVICE_ROLE_KEY` retirée de `.env.local` (n'était pas utilisée côté client)
  - Checkbox CGU obligatoire dans `app/auth/register.tsx` (constante `CGU_VERSION = '1.0'` exportée de `auth.ts`, helper `saveConsentForUser` pour différé)
- **Scoring word boundaries (B-002)** : `compatibility-engine.ts` utilise désormais des lookarounds Unicode `(?<!\p{L})…(?!\p{L})` au lieu de `\b` ASCII (gère "blé"/"céleri"/"sésame"). Helper `escapeRegExp` + `matchesWord`.
- **Polish** : `ErrorBoundary` (class component) wrap le `<Stack>` racine, `useReduceMotion` dans `ScoreCircle`, fontes normalisées `'Inter-Regular'` → `'Inter'` (6 occurrences), 3 composants morts supprimés (`BarcodeScanner`, `ScanOverlay`, `AdditiveCard`).
- **Cleanup deps** : `react-native-vision-camera` désinstallé + plugin retiré d'`app.json` (le scanner utilise `expo-camera`).
- **Tests** : 417 → **444 verts** (+27 nouveaux : 3 useProductStore product_type, 3 fetchProductMultiSource, 3 ErrorBoundary, 6 CGU register, 5 word boundaries, 7 usePremium).

## Sprint 2 — Allégé (avril 2026)
Score audit 80 → cible ~88/100. 5 items livrés en parallèle (Agents A+B), Sentry séquentiel (Agent C).

- **Wrapper réseau résilient (B-005)** : `src/lib/api/fetch-with-timeout.ts` (timeout 8s + 2 retries + backoff exponentiel + 429/Retry-After + listener manuel sur AbortSignal externe — `AbortSignal.any` non garanti en Hermes). `FetchTimeoutError` exporté avec `attempts`. 5 fichiers API migrés (`openfoodfacts.ts`, `openbeautyfacts.ts`, `search.ts`, `stores.ts`, `smart-alternatives.ts`) — `console.warn` retirés, fallback silencieux (cache stale pour stores).
- **Store ranking parallélisé (B-006)** : helper `promiseAllWithConcurrency` dans `src/lib/api/store-ranking.ts` (Promise.allSettled par batches de 3, ordre préservé, fallback `[]` sur rejet).
- **Split product screen (B-012)** : `app/product/[barcode].tsx` 927 → 546 lignes (-41%). Routeur garde toutes les data hooks + effects. Nouveaux purs : `src/components/product/FoodProductView.tsx` (394 lignes) et `CosmeticProductView.tsx` (88 lignes). FadeIn delays préservés exactement (140/220/280/340/420/500/540/580/620/640/700/760/820/880/940/980 pour food).
- **FlatList anti-patterns (B-015)** :
  - `app/(tabs)/explore.tsx` : `FlatList scrollEnabled={false}` dans ScrollView remplacé par `<View>{results.map(...)}</View>`
  - `app/(tabs)/history.tsx` : `HISTORY_ITEM_HEIGHT = 90`, `getItemLayout` + `windowSize=5` + `removeClippedSubviews` + `maxToRenderPerBatch=10` + `initialNumToRender=15`
  - `app/(tabs)/favorites.tsx` : `FAVORITE_ITEM_HEIGHT = 232`, `getItemLayout` adapté à `numColumns=2` (offset = `HEIGHT * Math.floor(index/2)`)
- **Sentry + logger (M-001)** :
  - `src/lib/monitoring/sentry.ts` : `initSentry()` (DSN via `EXPO_PUBLIC_SENTRY_DSN`, bail silencieux si manquant, `tracesSampleRate: 0.2`, `sendDefaultPii: false`), `captureError()` (forward uniquement si `!__DEV__`), `addBreadcrumb()`
  - **R8 — filtre PII strict** : `beforeSend` strip `event.user.email`/`ip_address`/`username` (garde `id` UUID), drop tout event/breadcrumb dont `message` ou `data.url` contient `barcode` ; `beforeBreadcrumb` drop navigation vers `/health-profile`, `/auth`, `/onboarding`
  - `src/lib/utils/logger.ts` : `debug`/`info`/`warn`/`error` — wrappers fins sur `addBreadcrumb` + `captureError`. JAMAIS de `console.*` (R5)
  - `__mocks__/@sentry/react-native.ts` : mock manuel Jest, `jest.mock('@sentry/react-native')` activé dans `jest.setup.js`
  - `app.json` : plugin `["@sentry/react-native/expo", { "organization": "lyxiria", "project": "vivo" }]`
  - `app/_layout.tsx` : `initSentry()` au boot. `ErrorBoundary.tsx` : `captureError` dans `componentDidCatch` (avant le `console.error` fallback). `fetch-with-timeout.ts` : `addBreadcrumb` avant le throw final (sans URL — R8)
- **Tests** : 444 → **465 verts** (+21 nouveaux : 7 fetch-with-timeout, 3 store-ranking-parallel, 2 FoodProductView, 1 CosmeticProductView, 5 sentry, 3 logger).
- **Items reportés Sprint 3+** : RevenueCat (paywall masqué côté UI), PostHog, GDPR export/portabilité, OTA updates, robustesse mot de passe.

## Alternatives Premium dynamiques (avril 2026)
Refonte de la section "Meilleures alternatives" sur la fiche produit : du statique vers une vraie reco OFF avec cascade hiérarchique + NOVA + additifs. 488 → **508 tests verts** (+20).

- **Backend** :
  - `src/lib/api/smart-alternatives.ts` rewrite — type `Alternative` enrichi (`score`, `scoreDelta`, `category`, `novaGroup`, `additivesCount`), suppression de `AlternativeProduct`/`grade`/`proxyScore`. Signature `findAlternatives(barcode, categoriesTags: string[], currentScore)`.
  - **Cascade hiérarchique** (max 3 tentatives) : essai du tag le plus spécifique → fallback parent si <5 valides → parent du parent. Court-circuit dès qu'une tentative ≥5. Best-effort sur la plus longue tentative isolée si jamais ≥5 (pas d'agrégation cross-tag — préserve la cohérence sémantique).
  - **Filtres OFF** : `page_size=30 sort_by=popularity_key fields=code,product_name,brands,image_url,nutrition_grades,nova_group,additives_n countries_tags=france`. Suppression du filtre serveur `nutrition_grades_tags=a,b,c` (trop excluant) — filtrage client (a..e + delta strict positif + image_url + product_name non vides).
  - **Coercions** : `nova_group` peut arriver en string OFF → `Number()` + `Number.isFinite`. `additives_n` absent → 0.
  - **Tri final** : `score` desc puis `additivesCount` asc (égalité → moins d'additifs gagne). Slice 5.
  - **Cache** LRU 10min/100 entrées, clé `${barcode}::${categoriesTags.join(',')}::${currentScore}`.
  - `getAlternativesTitle(score)` : <50 "🔄 Des alternatives bien meilleures existent" / <80 "🔄 Des alternatives plus saines existent" / ≥80 "🔄 Alternatives dans cette catégorie".
  - `src/lib/api/openfoodfacts.ts` : ajout `fetchProductCategoriesTags(barcode): Promise<string[]>` (ancien `fetchProductCategoryTag` conservé inchangé).
- **Frontend** :
  - `src/components/premium/AlternativeCard.tsx` refonte — layout horizontal compact (max 85px), image 64×64 (`expo-image` fallback `<Leaf>` sage). Badges row : `MiniScoreCircle` 32px + delta pill `+X` + **NOVA badge contextuel** (1-2 sage, 3 orange `#B96B00`, 4 rouge `#B5311E`) + **compteur additifs tri-état** (0=`✅ 0 additif` sage, 1-3=`X additif(s)` neutre, 4+=`⚠️ X additifs` orange). Accessibility label enrichi.
  - `src/components/premium/AlternativesSection.tsx` refonte — props pures (plus de fetch interne), nouveau hook `useAlternatives` orchestre. Skeleton 3 cards 85px en `isLoading`. Empty array → `null`. Premium = 5 cards en stack vertical (FadeIn cascade `100*index`). Free = 1 card opacity 0.25 + teaser pluriel adaptatif `"et X autres alternative(s) premium…"` + `<PremiumPaywall>`. Suppression du seuil dur `score < 70` — la section reste visible quand des alternatives existent à tout score.
  - `src/lib/api/use-alternatives.ts` nouveau — hook cancellable `(barcode, categoriesTags, currentScore) → { alternatives, isLoading }`.
  - `src/components/product/FoodProductView.tsx` : prop `categoryTag: string | null` → `categoriesTags: string[]`, branche `useAlternatives`. **Suppression** du `<PrimaryCTA "Voir les alternatives">` (devenu redondant) et de `onPressSwap`.
  - `app/product/[barcode].tsx` : switch `fetchProductCategoryTag` → `fetchProductCategoriesTags`, pass `categoriesTags={categoryTagsQuery.data ?? []}`.
- **Tests** : 488 → **508 verts** (+20 : 19 smart-alternatives complets, +2 openfoodfacts/fetchProductCategoriesTags, 4 AlternativeCard, 8 AlternativesSection, 2 FoodProductView adaptés). Aucune régression.

## Pages légales (mai 2026)
- **CGU** : `app/settings/cgu.tsx` — 10 articles, version 1.0, dernière mise à jour 3 mai 2026. Accessible depuis `/settings/legal` et la checkbox d'inscription.
- **Politique de Confidentialité** : `app/settings/privacy.tsx` — 12 articles RGPD (art. 6, 9, 15-21), version 1.0, dernière mise à jour 3 mai 2026. Inclut tableaux des données collectées / sous-traitants / durées de conservation. Lien CNIL fonctionnel.
- **Pas de GlassCard** sur ces écrans (lecture longue → fond cream uniforme).
- **Tests** : aucun nouveau test (texte statique). 546 tests verts maintenus.

## Système 2 tiers Premium + Expert (mai 2026)
Refonte du paywall : passage de 1 tier (Premium 29,99€/an) à 2 tiers (Premium 29,99€/an + Expert Plantes 49,99€/an). 550 → **569 tests verts** (+19).

- **Backend** :
  - `src/lib/premium/premium-gate.ts` (133 → 321 lignes) : type `SubscriptionTier = 'free' | 'premium' | 'expert'`, `TIER_HIERARCHY {free:0, premium:1, expert:2}`, `FEATURE_TIER` mapping, **17 features** (8 Premium + 9 Expert), helper `subscriptionRowToTier`, `getUserTier()` (source de vérité async), `isPremiumUser` gardé en alias backward-compat (true pour premium ET expert), `canAccessFeature(tier, key)` avec hiérarchie (Expert hérite de Premium), `getFeatureLimit(tier, key)`, hook `usePremium()` exposant `{tier, isPremium, isExpert, isLoading, canAccess}`.
  - **Catalogue Premium (8)** : `store_full_ranking`, `store_comparison`, `smart_alternatives`, `unlimited_history`, `food_journal`, `advanced_stats`, `export_data`, `priority_support`.
  - **Catalogue Expert (9)** : `plant_database`, `herbal_remedies`, `plant_alternatives`, `cosmetic_actives`, `pregnancy_safety`, `children_safety`, `interaction_warnings`, `expert_articles`, `expert_consultation`. Sources EFSA/EMA/ANSM/ANSES dans les descriptions FR.
  - `src/lib/hooks/usePremium.ts` (25 → 46 lignes) : userId-explicite, mocke `getUserTier`, même shape de retour.
  - `__DEV_UNLOCK_PREMIUM__ = false` → renvoie `'expert'` (top tier) si flippé à true en local. NE JAMAIS commit à `true`.
  - **Migration `013_expert_tier.sql`** (idempotente) : DROP + ADD CHECK constraint `subscriptions_plan_check` pour autoriser `'expert'` en plus de `'free' | 'premium'`.
- **Frontend** :
  - `src/components/premium/PremiumPaywall.tsx` (141 → 511 lignes) refonte BREAKING : nouvelles props `{featureKey: PremiumFeatureKey, previewContent?, onUpgrade: (tier) => void, compact?: boolean}`. Logique : lookup `FEATURE_TIER[featureKey]` détermine quel tier afficher en primary. Mode normal = 2 cartes (primary + cross-sell secondary). Mode compact = 1 carte horizontale.
  - **Design Premium** : border `rgba(139, 173, 139, 0.32)` sage, fond `rgba(139, 173, 139, 0.06)`, CTA `Colors.sage`, icône `Sparkles`. Pricing **29,99€/an · ~2,50€/mois**.
  - **Design Expert** : border `rgba(196, 168, 130, 0.6)` earth/gold, fond `rgba(196, 168, 130, 0.10)`, CTA `Colors.earth`, icône `Leaf`, badge **🌿 RECOMMANDÉ** en pill earth top-right. Pricing **49,99€/an · ~4,17€/mois**.
  - `app/settings/subscription.tsx` (355 → 562 lignes) refonte avec **3 états** : `tier='free'` → 2 cartes side-by-side (stacked si width<380px) ; `tier='premium'` → confirm card "Tu es Premium" + cross-sell Expert ; `tier='expert'` → confirm-only "Tu es Expert 🌿". Section FREE_FEATURES conservée en haut.
  - **3 consumers migrés** : `app/store/[slug].tsx`, `app/store-ranking.tsx`, `src/components/premium/AlternativesSection.tsx` — passage `title/description/onUnlock` → `featureKey/onUpgrade`.
  - Garantie persistante R3 : "Le scanner et le score restent TOUJOURS gratuits ✅" sur chaque paywall.
- **Tests** : 550 → **569 verts** (+19 net : +13 backend gate/hooks, +5 PremiumPaywall, +1 store-ranking adapté). Aucune régression.

## Vivo Recap mensuel + Mode Scan Choc viral (mai 2026)
Deux features Premium pensées partage social/conversion virale. 569 → **577 tests verts** (+8). Catalogue Premium étendu : 8 → 10 features (`vivo_recap` + `scan_choc`).

- **Premium gate étendu** :
  - `src/lib/premium/premium-gate.ts` : ajout des 2 clés `vivo_recap` et `scan_choc` au type `PremiumFeatureKey`, à `FEATURE_TIER` (tier='premium'), au catalogue `PREMIUM_FEATURES`. **19 features totales** (10 Premium + 9 Expert).
  - Test `'expose les 19 clés attendues'` mis à jour.
- **Dépendances natives** : `react-native-view-shot` + `expo-sharing` installées via `npx expo install`. ⚠️ Incompatibles avec Expo Go → tests runtime nécessitent un dev client.
- **Vivo Recap mensuel** (Agent 1) :
  - `src/lib/stats/monthly-recap.ts` — calculateur pur. Type `MonthlyRecap {monthLabel, totalScans, averageScore (round), worstProduct, bestProduct, avoidCount (<40), excellentCount (≥75), badge: 'detective'|'eclaire'|'curieux', topBrand, topCategory}`. Filtre fuseau Europe/Paris. Badge : ≥30 detective, ≥15 eclaire, sinon curieux. Tie-break = première occurrence.
  - `src/lib/stats/use-monthly-recap.ts` — hook React Query (queryKey `['monthly-recap', userId, year, month]`, staleTime 5min). Joint `products` pour récupérer name/brand → `productLookup`. Bornes month UTC `Date.UTC(year, month, 1)` → `Date.UTC(year, month+1, 1)`.
  - `app/recap/monthly.tsx` — fullscreen story. LinearGradient `#2D4A2D → #8BAD8B`, **8 cartes FadeIn cascade** 100/200/.../800 dans un `<View ref>` capturé via `captureRef` puis `Sharing.shareAsync` (mimeType png, format png quality 1, result tmpfile). Empty state 0 scans → CTA scanner. Free tier → preview opacity 0.3 + `<PremiumPaywall featureKey="vivo_recap" />`. Default = mois précédent (jan→dec previous year auto).
  - `app/(tabs)/index.tsx` : banner conditionnel après tagline si `recap.totalScans >= 5` (visible tout le mois, pas de cutoff jour). Icône `BarChart3` + "Ton Recap de [monthLabel] est prêt !".
  - `app/(tabs)/profile.tsx` : SettingsRow "Voir mon Recap mensuel" (BarChart3) entre "Mon abonnement" et "Comment Vivo note".
  - **Tests** : `src/lib/stats/__tests__/monthly-recap.test.ts` 6 cas (empty, 30+ scans detective, 15-29 eclaire, <15 curieux, filtrage year/month, worstProduct/bestProduct/topBrand/topCategory).
- **Mode Scan Choc viral** (Agent 2) :
  - `src/components/premium/ShareableCard.tsx` — wrapper `<ViewShot ref>` + bouton "Partager" sage qui capture en PNG tmpfile et appelle `Sharing.shareAsync`. Réutilisable.
  - `src/components/premium/ScanChocCard.tsx` — carte 9:16 portrait. LinearGradient `#DC2626 → #991B1B` rouge intense. Header "⚠️ ATTENTION" Bricolage-Bold 24, image 200×200, score 72px Bricolage-Bold blanc, productName 22px, **3 problèmes** (rows bg `rgba(0,0,0,0.18)` borderRadius 14), section alternative optionnelle (bg sage 0.95). Footer "Scan tes courses sur Vivo".
  - `app/scan-choc/[barcode].tsx` — route dynamique. `usePremium` → free render `<PremiumPaywall featureKey="scan_choc" />` ; premium/expert fetch produit + score + helper `detectProblems(product, result)` exporté avec **priorité stricte** : `additivesCount≥5` (💀) → `novaGroup===4` (🍳) → seed oils (🛢️) → excès macros (🍬) → fallbacks score `<30` (⚠️ Très mal noté) / `<50` (⚠️ Mal noté). Slice top 3.
  - `src/components/product/FoodProductView.tsx` : ajout banner auto-toast `score<40 && tier!=='free'` (5s, dedup `useRef<Set<string>>` in-memory). Bouton discret "Partager le scan" navigant vers `/scan-choc/[barcode]` visible **all tiers** (gating sur la destination).
  - **Tests** : `src/components/premium/__tests__/ScanChocCard.test.tsx` 2 cas (rendu nom + 3 problèmes, score affiché). FoodProductView test mocks ajoutés (usePremium, useAlternatives, useAuthStore, expo-router) pour ne pas péter les 2 tests existants.
- **Tests projet** : 569 → **577 verts** (+8 net : +6 monthly-recap, +2 ScanChocCard, 0 régression sur 564 historiques).

## Encyclopédie des Plantes + Chercheur de Remèdes (mai 2026)
Première feature exclusive Tier Expert. 577 → **625 tests verts** (+48). Aucune régression. Stack data statique 100% (R10), sources EMA HMPC / EFSA / Cochrane / PubMed / ANSES uniquement (jamais Beauvillard/Clément/O'Neill — garde-fou test).

- **Data + Logique** :
  - `src/data/plant-encyclopedia.ts` (901 lignes) — Types `PlantEntry`, `PlantCategory` (`respiratory|digestive|nervous|circulatory|skin|urinary|general`), `EvidenceLevel` (`well-established|traditional|efsa-claim|preliminary`). `PLANT_ENCYCLOPEDIA: PlantEntry[]` avec **40 fiches** sourcées. Helpers `getPlantById`, `getPlantsByCategory`, `searchPlants`. Couverture : nervous 7, digestive 6, respiratory 7, skin 5, circulatory 4, urinary 3, general 8.
  - `src/lib/remedies/remedy-finder.ts` (134 lignes) — Type `RemedyCategory {id, labelFr, emoji, description, keywords: string[], plantIds: string[]}`. **8 catégories** : sleep, digestion, stress, cough, skin, circulation, energy, immunity. **30 IDs canoniques** consommés par les catégories (chamomile, valerian, linden, passionflower, hops, melissa, peppermint, fennel, anise, caraway, artichoke, chicory, lavender, thyme, ivy, plantain, elderflower, mallow, marshmallow, calendula, burdock, borage, aloe_vera, red_vine, horse_chestnut, garlic, rosemary, nettle, ginger, turmeric). Helpers `findRemedies(categoryId)`, `searchRemedies(query)` (substring sur labelFr + description + keywords).
  - **Garde-fous tests** : (a) URLs whitelistées (ema.europa.eu, efsa.europa.eu, cochrane.org/cochranelibrary.com, pubmed.ncbi.nlm.nih.gov, anses.fr, ansm.sante.fr, who.int) ; (b) **anti-Beauvillard/Clément/O'Neill** strict ; (c) langage R5-safe (jamais "soigne/guérit/traite/remplace") ; (d) 30 IDs canoniques présents.
  - **R5 ABSOLUE** : "propriétés documentées", "usage traditionnel reconnu", "favorise", "contribue à". Jamais d'allégation thérapeutique.
- **Premium gate** : `plant_database` et `herbal_remedies` étaient déjà dans `FEATURE_TIER` (tier='expert', cf Sprint 2 tiers). Aucune modification du gate.
- **Frontend (4 écrans + 1 composant)** :
  - `app/plants/index.tsx` — Index encyclopédie. Search bar + grille 7 catégories filtrables + liste plantes via `<PlantListCard>`. **Expert gate** : free/premium voient les 3 premières plantes en clair + le reste opacity 0.25 pointerEvents="none" (max 8) + `<PremiumPaywall featureKey="plant_database" />`.
  - `app/plants/[id].tsx` — Fiche détaillée. 7 sections en GlassCard (FadeIn cascade) : Catégorie, Propriétés documentées, Usage traditionnel, Partie utilisée, Préparation, Contre-indications (border red light), Interactions médicamenteuses. Footer source + lien externe (Linking). **Expert gate** : free/premium voient sections 1+2 (properties tronqué 80 chars) + paywall ; expert voit tout.
  - `app/remedies/index.tsx` — Chercheur. Grille 8 catégories visibles toutes (pas de blur). **Expert gate** : tap-to-paywall (la grille reste cliquable, mais ouvre `<PremiumPaywall featureKey="herbal_remedies" />` au lieu de naviguer).
  - `app/remedies/[categoryId].tsx` — Résultats. Header catégorie + liste `<PlantListCard>` via `findRemedies`. **Expert gate** : 2 premiers en clair + reste opacity 0.25 + paywall.
  - `src/components/plants/PlantListCard.tsx` (128 lignes) — Row 70px : avatar emoji 32px (cercle sage 0.12) + nameFr/nameLatin + badge `evidenceLevel` (4 variantes locales : well-established #2E7D32, traditional sage textMuted, efsa-claim #5B7B9E, preliminary muted earth). Wrapper FadeIn delay configurable.
  - **Disclaimer footer** sur chaque écran : *"Ces informations sont fournies à titre éducatif. Elles ne remplacent pas un avis médical. Consultez un professionnel de santé."*
- **Entrées navigation** :
  - `app/(tabs)/explore.tsx` : nouvelle section "🌿 Plantes médicinales" (sous-titre "Encyclopédie sourcée EMA · Tier Expert") **entre Catégories et Enseignes**. 2 cards (📖 Encyclopédie / 🔍 Remèdes) avec FadeIn cascade 230/270.
  - `app/(tabs)/profile.tsx` : section conditionnelle "Mon espace Expert 🌿" si `tier === 'expert'`, entre ProfileStatsSection et Paramètres. 2 SettingsRow (Encyclopédie / Chercheur).
- **Tests** : 577 → **625 verts** (+48 : 40 plant-encyclopedia + 4 remedy-finder + 2 PlantListCard + helpers/garde-fous). Pas de régression. `npx expo export` OK.

## Protocoles bien-être 21 jours (mai 2026)
Deuxième feature exclusive Tier Expert. 625 → **640 tests verts** (+15). Aucune régression. **5 protocoles guidés** (sommeil 😴, digestion 🫃, stress 😰, énergie ⚡, peau 🧴) × 21 jours, rotation 7 plantes × 3 cycles. Stockage progression 100% AsyncStorage (R10 — pas de Supabase). 1 protocole actif à la fois. R5 absolu : "favoriser/contribuer" uniquement, jamais "soigner/guérir/traiter".

- **Premium gate étendu** : 19 → **20 features** (10 Premium + 10 Expert). Ajout de `protocols_21days` dans `PremiumFeatureKey`, `FEATURE_TIER` (tier='expert'), catalogue `PREMIUM_FEATURES`. Test count update.
- **Data + Logique** (Agent 1) :
  - `src/data/protocols.ts` (574 lignes) — Types `Protocol`, `ProtocolDay`. `PROTOCOLS: Protocol[]` array (5 × 21 = **105 entrées uniques**). Helper `getProtocolById`. Chaque jour = `{day, plantId, recipeFr, tipFr}`. Variation par cycle : C1 posologie de base, C2 variantes/décoctions, C3 intégration quotidienne. Plantes consommées (avec substitutions validées vs brief initial) :
    - **sleep** : chamomile, valerian, linden, melissa, passionflower, hops, lavender
    - **digestion** : peppermint, fennel, anise, caraway, chicory, artichoke, **ginger** (sub coriandre)
    - **stress** : melissa, passionflower, lavender, hops, valerian, chamomile, linden
    - **energy** : rosemary, nettle, ginger, turmeric, **ginseng** (sub avoine), **green_tea** (sub carotte), peppermint
    - **skin** : calendula, burdock, borage, aloe_vera, chamomile, nettle, **witch_hazel** (sub pissenlit)
  - `src/lib/protocols/protocol-progress.ts` (171 lignes) — Persistence AsyncStorage. Keys `'@vivo_protocol_active'` / `'@vivo_protocol_history'`. 5 fonctions : `getActiveProtocol`, `startProtocol` (auto-abandon de l'actif courant), `completeDay` (feeling 1-5, auto-complete à 21), `abandonProtocol`, `getProtocolHistory`.
  - `src/lib/protocols/use-protocol.ts` (122 lignes) — Hook React. Calcul `todayDay` via UTC ms simple `Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000) + 1` (capped 21). Expose `{activeProtocol, todayDay, todayPlant, todayRecipe, todayTip, isRestDay, completeToday, startProtocol, abandon, history, isLoading}`.
  - **Garde-fou R5** : test `/soigne|guérit|guerit|traite |remplace|cure |médicament/i` global sur tous les `recipeFr` + `tipFr` de `PROTOCOLS`.
- **Frontend (2 écrans + 2 composants)** (Agent 2) :
  - `src/components/protocols/DayCircle.tsx` (187 lignes) — Cercle 36×36 borderRadius 18, **5 status visuels** (`completed-good` sage, `completed-ok` earth, `today` cream + pulse Reanimated, `future` muted, `missed` red light). Pulse désactivée via `useReduceMotion`. testID="day-circle".
  - `src/components/protocols/ProtocolCard.tsx` (189 lignes) — GlassCard avec emoji 40px + title/desc + chip "21 jours". Progress bar si `isActive`, pill "EN COURS" earth, opacity 0.4 si `isDisabled` (un autre protocole déjà actif).
  - `app/protocols/index.tsx` (247 lignes) — Liste 5 protocoles + highlight de l'actif. **Expert gate** : free/premium voient 1 preview en clair + 4 blurred opacity 0.25 + `<PremiumPaywall featureKey="protocols_21days" />`.
  - `app/protocols/[id].tsx` (708 lignes) — Calendrier 21 jours (3×7 grille DayCircle) + section "Aujourd'hui" (plante + recette + tip + tracker feeling 5 emojis 😫😕😐🙂😁) + boutons "Démarrer" / "Continuer" + section progression avec moyenne feeling + barre. "Abandonner" via `Alert.alert` confirmation. Expert gate strict.
- **Entrées navigation** :
  - `app/(tabs)/explore.tsx` : section "🌿 Plantes médicinales" passe de 2 → **3 cards** (Encyclopédie 📖 / Remèdes 🔍 / Protocoles 📅). Style `gridCellThird: { width: '32%' }` ajouté.
  - `app/(tabs)/profile.tsx` : 3e SettingsRow "Mes Protocoles" (icône `Calendar`) ajouté dans la section conditionnelle Expert.
  - `app/(tabs)/index.tsx` : banner conditionnel "Jour {currentDay}/21 — {titleFr}" après Recap banner (delay 170, entre Recap 150 et StatsRow). Visible uniquement si `tier === 'expert'` ET `activeProtocol !== null`.
- **R9 — Aucune nouvelle dépendance** : AsyncStorage v2.2.0 déjà installé. 0 npm install.
- **Tests** : 625 → **640 verts** (+15 : +6 protocols data garde-fou + 6 protocol-progress AsyncStorage + 4 components). Pas de régression. `tsc --noEmit` clean. `npx expo export` OK (11.5MB bundle).

## 5 features Expert finales — Herbier · Rappels · Score Naturalité · Plante semaine · Recettes (mai 2026)
Bouclage du tier Expert avec 5 features pensées rétention quotidienne et engagement long. 640 → **660 tests verts** (+20). Aucune régression. Stockage 100% AsyncStorage (R10), aucune nouvelle dépendance npm (R9), texte 100% R5-safe (garde-fou regex sur les 30 recettes).

- **Premium gate étendu** : 20 → **25 features** (10 Premium + 15 Expert). Ajout des 5 clés `cure_reminders`, `my_herbarium`, `naturality_score`, `plant_of_week`, `wellness_recipes` dans `PremiumFeatureKey`, `FEATURE_TIER` (toutes 'expert'), catalogue `PREMIUM_FEATURES`. Test count update.

- **Data + Logique** (Agent 1) :
  - `src/data/wellness-recipes.ts` (631 lignes) — Types `WellnessRecipe`, `RecipeCategory` (sleep/digestion/stress/energy/skin/immunity/detox), `RecipeDifficulty`. **30 recettes** réparties (sleep 5 · digestion 5 · stress 4 · energy 4 · skin 4 · immunity 4 · detox 4). Helpers `getRecipeById`, `getRecipesByCategory`, `searchRecipes`. Chaque recette : `{id, titleFr, emoji, category, plantIds, ingredientsFr, preparationFr, durationMinutes, timingFr, benefitsFr, difficulty}`. Garde-fou test : tous les `plantIds` ∈ `PLANT_ENCYCLOPEDIA.id` + regex anti-claim `/(?<!dis)\bsoigne\b|guérit|guerit|\btraite\b|remplace|\bmédicament\b/i`.
  - `src/lib/naturality/naturality-score.ts` (59 lignes) — Pure function `detectNaturalIngredients(ingredientsList): NaturalityMatch[]`. Word-boundary Unicode `(?<!\p{L})…(?!\p{L})` avec flag `iu` (case-insensitive + unicode). Match nameFr ET nameLatin exacts. Déduplique par plantId. R5-safe par construction.
  - `src/lib/herbarium/herbarium-store.ts` (120 lignes) — CRUD AsyncStorage. Key `'@vivo_herbarium'`. API : `getHerbarium`, `addToHerbarium(plantId, note?)` idempotent, `removeFromHerbarium`, `updateNote`, `isInHerbarium`. Notes troncées à 200 chars en écriture.
  - `src/lib/reminders/reminder-store.ts` (221 lignes) — CRUD AsyncStorage + lazy-require `expo-notifications` (graceful : si module absent → `notificationId: null`). Key `'@vivo_reminders'`. API : `getReminders`, `createReminder(plantId, durationDays: 7|14|21|30)` schedule daily 9h, `markTodayDone` ajoute `YYYY-MM-DD` dedupliqué + auto-complete à `markedDays.length >= durationDays`, `deleteReminder` cancel notif + supprime.
  - `src/lib/plants/plant-of-week.ts` (31 lignes) — Pure deterministic. `getPlantOfWeek(now: Date = new Date())` calcule `Math.floor((utcMidnightToday - utcJan1) / 86_400_000) / 7` modulo `PLANT_ENCYCLOPEDIA.length`. Tous les jours d'une même tranche de 7 jours UTC depuis le 1er janvier renvoient la même plante. Date injectable pour tests déterministes.

- **Frontend** (Agents 2 + 3) :
  - `src/components/naturality/NaturalityBadge.tsx` (223 lignes) — Auto-gating via `usePremium()`. Si `detectNaturalIngredients(...).length === 0` → `null`. Sinon, GlassCard `<Leaf>` sage avec count pluriel adaptatif ("1 plante bénéfique détectée" / "N plantes bénéfiques détectées"). Expert : tap révèle inline une liste expandable, chaque plante Pressable → `/plants/[id]`. Free/premium : opacity 0.4 + icône `<Lock>` + tap → paywall inline `featureKey="naturality_score"`.
  - `src/components/herbarium/HerbariumNoteModal.tsx` (168 lignes) — Modal RN slide-from-bottom, TextInput multiline maxLength=200, compteur live, boutons Annuler/Enregistrer.
  - `src/components/home/PlantOfWeekCard.tsx` (166 lignes) — GlassCard sage avec chip "🌿 Plante de la semaine" + emoji 32 + nameFr Bricolage-Bold + nameLatin italic + 2 lignes properties. Expert tap → `/plants/[id]`. Free/premium : opacity 0.3 + overlay `<Lock>` + tap → écran abonnement.
  - `src/components/recipes/RecipeTimer.tsx` (166 lignes) — Countdown `mm:ss` via `useState` + `setInterval` avec cleanup `clearInterval` strict dans `useEffect` return. Boutons Lancer/Pause/Réinitialiser. Auto-stop à 0 (pas de Vibration → R9).
  - `app/herbarium/index.tsx` (372 lignes) — Liste `<PlantListCard>` + note Inter 12 italic + boutons `<Trash2>`/`<Edit3>` (Alert.alert confirm). Empty state CTA "Voir l'encyclopédie". Expert gate via `<PremiumPaywall featureKey="my_herbarium" />`. Disclaimer médical.
  - `app/reminders/index.tsx` (773 lignes) — Liste cures GlassCard avec emoji + "Jour X/Y" + barre progression sage + status badge + boutons "Pris ✅" (désactivé si `isMarkedToday`) / `<Trash2>`. Bouton flottant `+` ouvre modal create (picker plante ScrollView + 4 chips durée 7/14/21/30j). Expert gate. Disclaimer.
  - `app/recipes/index.tsx` (445 lignes) — TextInput search + ScrollView 7 chips catégories + cards avec emoji + chip difficulty + chip durée. Expert gate strict (preview 1 + 4 lockés + paywall). Disclaimer.
  - `app/recipes/[id].tsx` (425 lignes) — Hero emoji 64 + chips + 5 sections GlassCard FadeIn cascade (Ingrédients / Préparation / Plantes utilisées via `<PlantListCard>` cliquables / `<RecipeTimer>` / Bénéfices / Quand consommer). Empty state "Recette introuvable" + bouton retour. Expert gate. Disclaimer.

- **Entrées navigation** :
  - `app/plants/[id].tsx` : 2 boutons Expert ajoutés en bas de fiche — "Ajouter à mon herbier 🌿" (toggle `isInHerbarium`, désactivé si déjà ajouté) + "Créer un rappel de cure 💊" → `/reminders`. Visibles uniquement si `tier === 'expert'`.
  - `src/components/product/FoodProductView.tsx` : `<NaturalityBadge>` inséré après section Ingrédients (delay 880).
  - `src/components/product/CosmeticProductView.tsx` : `<NaturalityBadge>` inséré après section score (delay 180) — particulièrement utile pour matcher les noms latins INCI ("Matricaria recutita extract").
  - `app/(tabs)/explore.tsx` : section "🌿 Plantes médicinales" passe de 3 → **6 cards** (3×2) : Encyclopédie 📖 / Remèdes 🔍 / Protocoles 📅 / Herbier 🌿 / Rappels 💊 / Recettes ☕. Style `gridCellThird: { width: '32%' }` réutilisé.
  - `app/(tabs)/profile.tsx` : section Expert passe de 3 → **6 SettingsRow** (Encyclopédie / Chercheur / Protocoles / Herbier / Rappels / Recettes Bien-être).
  - `app/(tabs)/index.tsx` : `<PlantOfWeekCard>` inséré à `delay={230}` entre TopByCategorySection (200) et le bloc CTA principal.

- **R9 — Aucune nouvelle dépendance** : `expo-notifications` ~0.32.16 + AsyncStorage v2.2.0 déjà installés. 0 npm install.
- **Tests** : 640 → **660 verts** (+20 : +12 Agent 1 [4 wellness-recipes + 4 naturality-score + 2 herbarium-store + 2 reminder-store] + 5 Agent 2 [4 NaturalityBadge + 1 herbarium screen] + 3 Agent 3 [2 plant-of-week + 1 recipes screen]). Pas de régression. `tsc --noEmit` clean. `npx expo export --platform web` OK (11.7MB bundle).

## 4 features Premium finales — Famille · Historique illimité · Export PDF · Stats Avancées (mai 2026)
Bouclage du tier Premium avec 4 features pensées rétention et utilité famille. 660 → **681 tests verts** (+21). Aucune régression. Migration 014, +1 install autorisée (`expo-print` ~15.0.8). 25 features inchangées en taille (rename `food_journal` → `family_mode`, `export_data` → `export_pdf`).

- **Premium gate** : `src/lib/premium/premium-gate.ts` — rename des 2 placeholders côté `PremiumFeatureKey`, `FEATURE_TIER`, `PREMIUM_FEATURES`. Total reste 25 features (10 Premium + 15 Expert). Catalog plus propre, plus de placeholders fantômes.
  - `family_mode` : "Mode Famille" — *Crée jusqu'à 4 profils familiaux avec leurs allergies et restrictions, et bascule entre eux d'un tap.*
  - `export_pdf` : "Export PDF" — *Génère un rapport santé PDF de tes 30 derniers jours, prêt à partager avec ton médecin.*

- **Migration `014_family_profiles.sql`** (idempotente, à appliquer manuellement dans Supabase SQL Editor) :
  - Table `public.family_profiles` : `id uuid pk`, `user_id uuid fk auth.users on delete cascade`, `name text NOT NULL CHECK length 1-50`, `avatar_emoji text NOT NULL DEFAULT '🧑'`, `age_group text CHECK IN ('adult','child','baby','pregnant')`, `allergies text[] DEFAULT '{}'`, `conditions text[] DEFAULT '{}'`, `is_active boolean DEFAULT false`, `created_at`, `updated_at`
  - **RLS** : 4 policies (select/insert/update/delete) `auth.uid() = user_id`
  - **Trigger 1** `enforce_max_family_profiles` BEFORE INSERT — refuse au-delà de 4 (`RAISE EXCEPTION P0001`)
  - **Trigger 2** `enforce_single_active_family_profile` BEFORE INSERT/UPDATE OF is_active — désactive les autres profils du user dans la même transaction (atomique)
  - **Trigger 3** `set_updated_at_family_profiles` BEFORE UPDATE — auto-bump `updated_at`
  - 2 index : `idx_family_profiles_user_id` (lookup) + index partiel `idx_family_profiles_active WHERE is_active = true`

- **Backend** (Agent 1 — 4 modules + 13 tests, livré 660 → 675 = +15) :
  - `src/lib/family/family-store.ts` (212 lignes) — 6 hooks React Query + 5 helpers internes exportés (`fetchFamilyProfiles`, `createFamilyProfile`, `updateFamilyProfile`, `deleteFamilyProfile`, `setActiveFamilyProfile`). Constante `MAX_FAMILY_PROFILES = 4`. `useActiveFamilyProfile` dérive de `useFamilyProfiles` côté React (pas de query séparée). `useSetActiveFamilyProfile` update juste `{ is_active: true }` — le trigger DB désactive les autres.
  - `src/lib/export/generate-pdf.ts` (264 lignes) — `generateHealthReportHtml(data): string` pure (testable Jest, escape HTML XSS) + `exportHealthReportPdf(data): Promise<void>` lazy-require `expo-print` + `expo-sharing`. 6 sections HTML : header, période, KPI 4 chiffres, top 5 scannés, top 5 à éviter, badges, footer.
  - `src/lib/stats/advanced-stats.ts` (270 lignes) — `calculateAdvancedStats(scans, now?)` autonome (helpers Paris dupliqués pour ne pas coupler à `profile-stats-engine.ts`). 6 métriques : `trend28d` (28 points + slope régression linéaire), `distribution` 5 buckets (excellent ≥85, good 70-84, mid 50-69, poor 30-49, bad <30), `topCategories` & `topBrands` (top 5, tie-break count desc puis avgScore desc), `streak` (current/longest jours consécutifs Paris), `toxicExposure` (totalPenalties + uniqueAdditives + worstAdditive sur 30j depuis `penalties_snapshot`).
  - `src/lib/stores/__tests__/useScanHistory.test.tsx` — 1 test garde-fou : `useScanHistory({limit: 30})` applique `.limit(30)` server-side, `useScanHistory({limit: undefined})` omet `.limit`. Confirme la gate Premium-vs-free déjà câblée dans `app/(tabs)/history.tsx` (lignes 44, 49-52, 442-486).

- **Frontend** (Agent 2 — 6 livrables UI + 2 tests, livré 675 → 681 = +6) :
  - `app/family/index.tsx` — Liste max 4 profils + tap pour activer + edit pin → `/family/edit?id={id}` + bouton "+ Nouveau profil" (caché si ≥4). Skeleton loading, empty state, paywall `family_mode` pour free.
  - `app/family/edit.tsx` — Form create/edit. 8 emojis avatar (🧑/👨/👩/🧒/👶/🤰/👴/👵), nom maxLength=50, 4 chips age_group, 14 allergènes EU + 7 conditions multi-select. Boutons Créer/Annuler ou Enregistrer/Supprimer (Alert.alert confirm). Validation nom non vide. Échec mutation → Alert "max 4 profils ?".
  - `app/stats/index.tsx` — Dashboard 6 sections : KPI strip (totalScans / averageScore / streak), sparkline 28j Catmull-Rom (couleur trend selon slope), distribution 5 buckets colorés, top 5 catégories/marques en rows, exposition toxique (GlassCard tone="warning" si totalPenalties > 50). Empty state si 0 scans + paywall `advanced_stats`.
  - `src/components/home/FamilyProfilePills.tsx` — ScrollView horizontal de pills compactes (avatar 18px + nom Inter-SemiBold 12), pill active sage, dernière pill "+ Gérer" → `/family`. Render `null` si tier='free' OU profiles.length=0 (auto-gating).
  - `src/lib/scoring/use-active-compat-profile.ts` — Hook unifié : profil familial actif prime sur `useProfileStore`, fallback `userProfileToCompatibilityProfile(profile)` sinon. Renvoie `null` si rien à filtrer. **Pas encore branché** côté call-sites existants (history/category/store) — c'est un AJOUT pour les futures intégrations.
  - `app/(tabs)/profile.tsx` : 3 SettingsRow ajoutés — Mode Famille (`Users` icon) → `/family`, Statistiques avancées (`BarChart3`) → `/stats`, Exporter mon rapport PDF (`FileText`) → `handleExportPdf` qui construit `HealthReportData` (userName, periodLabel FR, stats sur 30j, top 5 desc/asc par score, badges earned via `useUserBadges`). Free tier → push `/settings/subscription` ou Alert paywall.
  - `app/(tabs)/index.tsx` : `<FamilyProfilePills>` en `<FadeIn delay={60}>` au-dessus du Greeting. Composant gère lui-même le `null` (auto-gating).

- **Tests** : 660 → **681 verts** (+21 : Agent 1 +15 [6 family-store + 3 generate-pdf + 5 advanced-stats + 1 useScanHistory], Agent 2 +6 [3 FamilyProfilePills + 3 stats-index]). Aucune régression. `tsc --noEmit` clean. `npx expo export --platform web` OK (11.8MB bundle).

- **R9 — 1 install autorisée par le plan validé** : `expo-print` ~15.0.8 (dépendance Native standard SDK, requise pour `printToFileAsync`). `expo-sharing` ~14.0.8 déjà présent.

- **À faire côté Hector** : appliquer la migration `014_family_profiles.sql` dans Supabase Dashboard → SQL Editor → New query → Run, puis vérifier "Success" avant que le Mode Famille soit utilisable en prod.

## Packaging Risk + Conglomerate Tracing (mai 2026)
Deux features GRATUITES qui enrichissent la fiche produit avec des données toxicologiques (matériaux d'emballage) et de transparence corporate (maison-mère). 691 → **723 tests verts** (+32). Aucune régression. R9 ✓ (zéro nouvelle dépendance). R10 ✓ (data 100% statique pour packaging, cache mémoire infini pour conglomerate).

- **Feature 1 — Packaging Risk** 📦 :
  - `src/data/packaging-risks.ts` (293 lignes) — Knowledge base de **14 matériaux** (13 spécifiques + 1 fallback `unknown_plastic`) typés `PackagingMaterial` avec `riskLevel: 'low'|'moderate'|'high'`. Sources EFSA/ANSES/ECHA/CIRC/eur-lex/OMS uniquement (test garde-fou anti-Gouget/Beauvillard/Clément/O'Neill + allowlist regex `/efsa|anses|echa|circ|iarc|oms|eur-lex|ansm/i`).
  - **Couverture** : pet (moderate), hdpe (low), pvc (high — phtalates ECHA SVHC + chlorure de vinyle CIRC G1), ldpe (low), pp (low), ps (high — styrène CIRC 2A), metal_can (moderate — BPA/BPS), aluminium (moderate — PTWI OMS), tetra_pak (moderate), plastic_film (moderate), bioplastic (low), glass (low — inerte), cardboard (low), unknown_plastic (moderate fallback).
  - Helper `detectPackagingRisk(components: PackagingComponent[])` : consomme `packagings[]` (matériau + forme + `food_contact`), **plus `packaging_tags`** — voir « Source packaging » ci-dessous. Normalise `material` (strip lang prefix + NFD + diacritics), match par substring dans `tagPatterns[]`, déduplique par `id`. `qualifiedBy` exige matériau ET forme pour les entrées qu'un matériau seul n'identifie pas (`en:metal` + `en:can` → `metal_can`). Fallback `unknown_plastic` si plastique générique et aucun polymère précis. Tri : contact alimentaire d'abord, puis risque desc, puis ordre du catalogue. Plafonné à `MAX_DETECTED_MATERIALS = 3`.
  - `src/components/product/PackagingSection.tsx` — GlassCard avec header `📦 Emballage analysé`, ligne par matériau (nom + chip risk tri-état rouge/orange/sage + 2 concerns max + tip + indicateur recyclable), footer `Sources : EFSA · ANSES · …` (max 5). Renvoie `null` si rien matché → la section n'apparaît pas.
- **Feature 2 — Conglomerate Tracing** 🏢 :
  - `src/lib/api/conglomerate.ts` (218 lignes) — Résolution maison-mère via Wikidata en 2 temps : (1) REST `wbsearchentities` pour ranker l'entité demandée (premier résultat) ; (2) SPARQL VALUES single-hop sur P127 (owned by) | P749 (parent organization), puis P17 (country) → P298 (ISO 3166-1 alpha-3) sur le owner. Pas de récursion (Wikidata timeout en pratique) — on retourne le parent IMMÉDIAT cohérent (Coca-Cola → The Coca-Cola Company → US, et non Berkshire Hathaway via P127 chain).
  - **Cache module-level** `Map<string, ConglomerateInfo | null>` infini en mémoire, clé = `brandName.trim().toLowerCase()`. Cache les résultats négatifs aussi (`null`) pour éviter de re-spammer Wikidata. Ne cache PAS les erreurs réseau (autorise un retry plus tard via `FetchTimeoutError → null` non-cached).
  - Type `ConglomerateInfo { ownerName, ownerWikidataId, countryCode: string|null, countryName: string|null }`. Coercion `iso3` → `null` si pas `/^[A-Z]{3}$/`.
  - `countryCodeToFlag(code)` — accepte alpha-2 ("FR") ou alpha-3 ("FRA"). Mapping `ISO3_TO_ISO2` interne sur ~52 pays courants en agro/cosmétique. Conversion via Regional Indicator Symbols Unicode (codepoint 0x1F1E6 + offset). Renvoie `''` si conversion impossible.
  - User-Agent `Vivo/1.0 (https://vivo.lyxiria.com; tech@lyxiria.com)` pour politesse Wikidata. Timeout 5s, pas de retries (`fetchWithTimeout` retries: 0).
  - `src/components/product/ConglomerateSection.tsx` — GlassCard `🏢 Maison-mère`. Skeleton 2 barres pendant la résolution Wikidata. Owner name + drapeau emoji + countryName + lien `Voir sur Wikidata` → `Linking.openURL('https://www.wikidata.org/wiki/{Q-ID}')`. Pas de drapeau si `countryCode === null` (R3 plan validé). Renvoie `null` si owner introuvable ou brand vide.
- **Pipeline data** *(source corrigée mai 2026 — voir « Source packaging » ci-dessous)* :
  - `fetchProductPackagings(barcode)` dans `src/lib/api/openfoodfacts.ts` (`fields=packagings`), `fetchCosmeticPackagings(barcode)` dans `openbeautyfacts.ts`. Les deux passent par `normalizePackagings()` exporté de `packaging-risks.ts`.
  - `app/product/[barcode].tsx` : 2 `useQuery` (food + cosmetic) staleTime 24h, props `packagings={…data ?? []}` propagées vers les vues.

- **Source packaging — `packagings[]`, jamais `packaging_tags`** :
  - `packaging_tags` est un champ hérité qui aplatit matériaux, formes et mentions de recyclage sans lien entre eux, et se révèle fréquemment erroné. Sur la Cristaline `3274080005003` il contient `["en:aluminium-can", "en:hdpefilm-packet", "en:ppfilm-wrapper", "en:ldpe-film"]` → la fiche affichait « Aluminium » sur une bouteille en PET. Le matching était juste ; la donnée était fausse.
  - Mesuré sur 100 produits FR : `packagings[]` présent sur **85 %**, `packaging_tags` sur 76 %. Changer de source **augmente** la couverture. Un seul produit avait des tags sans `packagings[]`.
  - **Aucun repli** sur `packaging_tags` : si `packagings[]` est absent, la section disparaît. Verrouillé par un test dans `openfoodfacts.test.ts`.
  - **`food_contact`** : seul un `0` EXPLICITE exclut un composant. Le champ est absent sur ~40 % des composants observés (1→79, 0→40, absent→78) ; le traiter comme « pas de contact » viderait la moitié du catalogue. Absent = inconnu = conservé.
  - **`recyclable: boolean | null`** — tri-état. `null` = la recyclabilité dépend de la composition réelle, que la donnée ne précise pas → `PackagingSection` affiche « Recyclabilité inconnue » en ton neutre (icône `HelpCircle`), jamais « Non recyclable ». Trois entrées sont passées à `null` : `unknown_plastic` (générique par définition, et `en:plastic` = 42 % des matériaux), `plastic_film` (son propre concern dit « variable selon la composition »), `bioplastic` (« PLA, etc. » recouvre des polymères au sort opposé). **Seuls `pvc` et `ps` gardent `false`** : leur exclusion des filières est documentée. Test allowlist décroissante — toute nouvelle entrée à `false` fait échouer la suite.
  - **Test d'ancrage** : `packaging-risks.test.ts` fige le cas Cristaline réel → PET + HDPE, **jamais d'aluminium**.
  - `ScoringInput.packaging_material` a été retiré (`types.ts`) : le moteur ne l'a jamais lu et le champ laissait croire que l'emballage entrait dans le score. `Product.packaging_material` est conservé — c'est le champ OFF brut.
- **Intégration** :
  - `FoodProductView` : delays `900` (Packaging) / `920` (Conglomerate). Suite du chain décalée `940 (share scan) / 960 (report) / 1000 (source link) / 1040 (attribution)`.
  - `CosmeticProductView` : delays `200` (Packaging) / `220` (Conglomerate). Educational cards et footer décalés `260 + i*120 / 260 (report) / 300 (source) / 340 (attribution)`.
- **Tests** : 691 → **723 verts** (+32 net : 12 packaging-risks data layer + 13 conglomerate API [4 countryCodeToFlag + 9 getConglomerateOwner avec cache positif/négatif/network-error] + 3 PackagingSection UI + 4 ConglomerateSection UI). `tsc --noEmit` clean. `npx expo export --platform web` OK (7MB bundle web).
- **GRATUIT** : aucune des deux features n'est gatée premium/expert. Cohérent avec règle "Les filtres allergènes sont GRATUITS" — la transparence sur l'emballage et la maison-mère relève du même principe.

## Dette identifiée (non corrigée, à arbitrer)

### Le filtre « Ce que je peux manger » compte les produits non vérifiés comme compatibles
`checkCompatibility` expose depuis mai 2026 un champ `verificationStatus: 'verified' | 'insufficient_data'`
(`src/lib/api/types.ts`), qui distingue « vérifié et compatible » de « pas pu être vérifié faute de liste
d'ingrédients ». La fiche produit l'exploite : `CompatibilityBanner` affiche un troisième état neutre
« Vérification impossible » au lieu de « Compatible avec votre profil ».

**Deux consommateurs ne le lisent pas encore** et se contentent de `isCompatible`, qui répond seulement à
« existe-t-il un blocker ? » — donc `true` quand rien n'a pu être contrôlé :
- `app/(tabs)/history.tsx:85` — `if (!compat.isCompatible) set.add(row.barcode)`
- `src/lib/scoring/profile-filters.ts:19` — `checkCompatibility(...).isCompatible`

**Conséquence** : un utilisateur allergique qui active le toggle « Compatibles » sur l'historique, une
catégorie ou une enseigne voit apparaître des produits dont les allergènes n'ont jamais été vérifiés.

**Pourquoi ce n'est pas corrigé** : `isCompatible` a été volontairement gelé pour ne pas modifier la
sémantique d'un champ consommé ailleurs, et ces deux fichiers étaient hors du périmètre du lot.
**Correction proposée** : faire lire `verificationStatus` aux deux call-sites et exclure — ou baliser —
les produits `insufficient_data` dans les listes filtrées. Ne PAS changer `isCompatible`.

### `ScoreComparison` tient une quatrième échelle de score
Le lot « cohérence » de mai 2026 a unifié trois échelles : le verdict (`getScoreVerdict`), le libellé lu
par les lecteurs d'écran (`ScoreCircle`, ex-`COLOR_LABEL`) et les couleurs de l'écran OCR
(ex-`ocrScoreColor`, seuils 75/50/30). `ScoreComparison` n'était dans aucun des périmètres et diverge
encore sur deux points :

- `src/components/product/ScoreComparison.tsx:77` — la légende de l'axe affiche **« Danger »** là où
  `getScoreVerdict` dit « À éviter ». Même incohérence que celle corrigée dans `ScoreCircle`.
- `src/components/product/ScoreComparison.tsx:67` — le dégradé est en palette **v1**
  (`#F44336, #FF9800, #FFC107, #4CAF50`) alors que le marqueur posé dessus prend sa couleur de
  `scoreColor`, passé en **v2**. À 45, le chiffre est `#A8500B` sur une bande `#FF9800`.

**Attention** : corriger la légende fait échouer `src/components/product/__tests__/ScoreComparison.test.tsx:17`
(`expect(getByText('Danger')).toBeTruthy()`) — le test doit être adapté dans le même commit. Corriger le
dégradé sort le fichier de l'allowlist de `theme-guard.test.ts` (même règle que `ScoreCircle.tsx:88`) :
retirer aussi la ligne de l'allowlist, sinon l'assertion « aucune entrée périmée » échoue.

## Conventions
- TypeScript strict (`strict: true`)
- Nommage : PascalCase pour composants, camelCase pour fonctions/variables
- Fichiers composants : PascalCase.tsx
- Fichiers utils/lib : kebab-case.ts
- Pas de `any` — typer tout
- Tests avec Jest + React Native Testing Library
- TDD pour le moteur de scoring

## Commandes
```bash
npx expo start                    # Dev server
npx expo start --ios              # iOS simulator
npx expo start --android          # Android emulator
npx expo export                   # Build check (TOUJOURS avant commit)
npx jest                          # Tests
npx jest --coverage               # Tests + coverage
eas build --platform ios          # Build iOS
eas build --platform android      # Build Android
```

## Migrations Supabase
1. Claude Code crée le fichier dans `supabase/migrations/XXX_nom.sql`
2. Hector copie le SQL : `cat supabase/migrations/XXX.sql`
3. Colle dans Supabase → SQL Editor → New query → Run
4. Vérifie "Success" avant de continuer

## Design
- Style : épuré, nature, santé (PAS dark premium)
- Palette : Vert sauge (#8BAD8B), blanc cassé (#FAFAF7), terre (#C4A882)
- Scores : Vert (#4CAF50), Jaune (#FFC107), Orange (#FF9800), Rouge (#F44336)
- Typo : Inter (corps) + Bricolage Grotesque (titres)
- Coins arrondis : 16-20px
- Icônes : Lucide Icons

## Règles absolues
- Le scan est TOUJOURS gratuit et illimité (leçon Exposr/MyFitnessPal)
- Les filtres allergènes sont GRATUITS (pas derrière le paywall comme Yuka)
- Le scoring ne permet AUCUNE compensation (un poison reste un poison)
- France first — toutes les strings en français
- Chaque pénalité doit avoir une source scientifique accessible
- Jamais de console.log en production
- Jamais de `Array.fill(sameObject)` — utiliser `Array.from()`

## Leçons de LegitVision (ne pas répéter)
- RLS Supabase bloque les routes API → utiliser le client admin (service_role) dans les Edge Functions
- Toujours vérifier le build AVANT de commit
- Ne JAMAIS laisser Perplexity ou autre IA toucher le repo ou la DB
- Les logos externes ne chargent pas de manière fiable → toujours en local dans assets/
