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
