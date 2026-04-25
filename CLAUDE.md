# Vivo — Scanner Nutritionnel Intelligent

## Contexte
App mobile React Native/Expo de scanning nutritionnel pour le marché français. Score de santé 0-100 basé sur un algorithme de pénalités toxicologiques (pas le Nutri-Score). Détecte les additifs dangereux, les huiles de graines, le clean labeling, et adapte le score au profil santé de l'utilisateur. Concurrent direct de Yuka avec une approche scientifiquement plus rigoureuse.

## Stack
- **Mobile** : React Native + Expo SDK 52+ (TypeScript strict)
- **Navigation** : Expo Router (file-based)
- **UI** : NativeWind (Tailwind pour RN) + React Native Paper
- **Scanner** : react-native-vision-camera + ML Kit Barcode
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

## Features Stores / Compatibilité / Confiance
- **Listes par enseigne** : écran `app/store/[slug].tsx`, section "Enseignes" sur l'explore (2 colonnes), cache local 5min, fallback liste vide silencieux
- **Mode "Ce que je peux manger"** : toggle 100g/Compatibles sur category + store screens (style `NutrientBreakdown`), banner sur fiche produit, compteur "X / Y compatibles"
- **Confiance & signalement** : `ConfidenceBadge` sous le header produit, `ReportButton` discret avec modal slide (5 raisons FR + description optionnelle), pas de photo MVP
- **Adapter user→compat** : `userProfileToCompatibilityProfile` mappe `diabetic→diabete`, `pregnant→enceinte`, `child→bebe` ; renvoie `null` si standard sans allergie pour masquer le toggle
- **Migration** : `009_stores_confidence_reports.sql` (table `product_reports` RLS + table `stores` seedée idempotente)

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
