# PRD — [APP_NAME] : Scanner Nutritionnel Intelligent
## Version 1.0 — Avril 2026
## Auteur : Hector Volant (LYXIRIA) × Claude

---

## 1. VISION PRODUIT

### 1.1 Pitch
[APP_NAME] est un scanner nutritionnel mobile qui analyse les produits alimentaires via code-barres et attribue un **score de santé sur 100** basé sur la toxicologie réelle des ingrédients — pas sur le Nutri-Score. Contrairement à Yuka, l'algorithme ne permet jamais à un nutriment positif de compenser un poison.

### 1.2 Positionnement
**"Yuka, mais scientifiquement honnête."**
- Yuka : score basé sur le Nutri-Score (60%) + additifs (30%) + bio (10%). Permet la compensation. Ignore les huiles de graines. Aucune personnalisation.
- [APP_NAME] : score basé sur un système de pénalités toxicologiques sans compensation. Détecte les huiles de graines. S'adapte au profil utilisateur (diabète, sportif, enfant, femme enceinte).

### 1.3 Marché cible
- **Phase 1 (MVP)** : France — 67M d'habitants, marché mature (Yuka née ici), forte sensibilité aux UPF
- **Phase 2** : Belgique, Suisse, Canada francophone
- **Phase 3** : International (EN, ES, DE)

### 1.4 Utilisateur cible
- 18-45 ans, soucieux de leur santé
- Parents achetant pour leurs enfants
- Sportifs et personnes avec conditions (diabète, intolérances)
- Déçus de Yuka qui veulent plus de rigueur

---

## 2. STACK TECHNIQUE

### 2.1 Architecture

```
┌─────────────────────────────────────────────────┐
│                  MOBILE APP                      │
│          React Native / Expo (SDK 52+)           │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Scanner  │  │ Scoring  │  │  Profil User  │  │
│  │(VisionCam│  │  Engine  │  │  + Settings   │  │
│  │+ ML Kit) │  │ (local)  │  │               │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
└───────────────────┬─────────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────────┐
│                BACKEND (Supabase)                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   Auth   │  │PostgreSQL│  │   Storage     │  │
│  │(Google   │  │(products,│  │  (images,     │  │
│  │ OAuth +  │  │ additifs,│  │   cache)      │  │
│  │ email)   │  │ scores)  │  │               │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│  ┌──────────┐  ┌──────────┐                      │
│  │Edge Func │  │ Realtime │                      │
│  │(API OFF, │  │(sync     │                      │
│  │ scoring) │  │ favoris) │                      │
│  └──────────┘  └──────────┘                      │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│              SERVICES EXTERNES                    │
│  ┌──────────────┐  ┌────────────────────┐        │
│  │Open Food     │  │ Stripe             │        │
│  │Facts API     │  │ (abonnements)      │        │
│  │(produits FR) │  │                    │        │
│  └──────────────┘  └────────────────────┘        │
└─────────────────────────────────────────────────┘
```

### 2.2 Stack détaillée

| Couche | Technologie | Justification |
|--------|------------|---------------|
| **Mobile** | React Native + Expo (SDK 52+) | Cross-platform iOS+Android dès le jour 1, écosystème riche |
| **Langage** | TypeScript strict | Type safety, meilleure DX |
| **Navigation** | Expo Router (file-based) | Cohérent avec l'expérience Next.js d'Hector |
| **UI** | NativeWind (Tailwind pour RN) + React Native Paper | Design system cohérent, familier pour Hector |
| **Scanner** | react-native-vision-camera + ML Kit Barcode | Gratuit, performant, migration Scandit possible plus tard |
| **State** | Zustand + React Query (TanStack) | Léger, performant, cache intelligent |
| **Backend** | Supabase (West EU — Ireland) | Auth, PostgreSQL, Storage, Edge Functions, Realtime |
| **BDD produits** | Open Food Facts API (v2) | 4M+ produits, gratuit, fort en France, licence ODbL |
| **Paiements** | Stripe + RevenueCat | RevenueCat gère les IAP iOS/Android natifs |
| **Analytics** | PostHog (self-hosted ou cloud) | Open source, funnels, rétention |
| **Crash reports** | Sentry | Standard industrie pour RN |
| **CI/CD** | EAS Build + EAS Submit | Pipeline Expo natif, OTA updates |
| **Notifications** | Expo Notifications + OneSignal | Push cross-platform |

### 2.3 Structure du projet

```
app-nutrition/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/                   # Tab navigator
│   │   ├── scan.tsx              # Écran principal scanner
│   │   ├── history.tsx           # Historique des scans
│   │   ├── favorites.tsx         # Produits favoris
│   │   └── profile.tsx           # Profil & paramètres
│   ├── product/[barcode].tsx     # Détail produit (score, ingrédients)
│   ├── swap/[barcode].tsx        # Alternatives (Smart Swaps)
│   ├── onboarding/               # Flow d'onboarding (profil santé)
│   │   ├── welcome.tsx
│   │   ├── health-profile.tsx
│   │   └── allergies.tsx
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── settings/
│   │   ├── subscription.tsx
│   │   └── health-profile.tsx
│   └── _layout.tsx               # Root layout
├── src/
│   ├── components/
│   │   ├── scanner/
│   │   │   ├── BarcodeScanner.tsx
│   │   │   └── ScanOverlay.tsx
│   │   ├── product/
│   │   │   ├── ScoreCircle.tsx        # Cercle de score animé
│   │   │   ├── IngredientsList.tsx     # Liste avec codes couleur
│   │   │   ├── AdditiveCard.tsx        # Détail d'un additif + source
│   │   │   ├── NovaBadge.tsx           # Badge NOVA 1-4
│   │   │   ├── SeedOilAlert.tsx        # Alerte huiles de graines
│   │   │   └── SmartSwapCard.tsx       # Carte alternative
│   │   ├── ui/                         # Composants UI réutilisables
│   │   └── common/
│   ├── lib/
│   │   ├── scoring/
│   │   │   ├── engine.ts              # ⚡ CŒUR : moteur de scoring
│   │   │   ├── additives-db.ts        # Base des 700+ additifs + pénalités
│   │   │   ├── nova-classifier.ts     # Classification NOVA 1-4
│   │   │   ├── seed-oils.ts           # Détection huiles de graines
│   │   │   ├── clean-labeling.ts      # NLP détection vocabulaire trompeur
│   │   │   └── profiles.ts            # Modificateurs par profil utilisateur
│   │   ├── api/
│   │   │   ├── openfoodfacts.ts       # Client OFF API v2
│   │   │   ├── supabase.ts            # Client Supabase
│   │   │   └── types.ts               # Types partagés
│   │   ├── stores/
│   │   │   ├── useAuthStore.ts
│   │   │   ├── useProductStore.ts
│   │   │   └── useProfileStore.ts
│   │   └── utils/
│   │       ├── portions.ts            # Calcul portions réelles
│   │       └── formatting.ts
│   ├── constants/
│   │   ├── colors.ts                  # Palette nature/santé
│   │   ├── fonts.ts
│   │   └── scoring-rules.ts           # Constantes de scoring
│   └── hooks/
│       ├── useBarcodeScan.ts
│       ├── useProductScore.ts
│       └── useSmartSwaps.ts
├── supabase/
│   └── migrations/
│       ├── 001_users_profiles.sql
│       ├── 002_products_cache.sql
│       ├── 003_additives_database.sql
│       ├── 004_scan_history.sql
│       └── 005_subscriptions.sql
├── assets/
│   ├── fonts/
│   ├── images/
│   └── icons/
├── CLAUDE.md                          # ⚡ Config Claude Code
├── app.json                           # Config Expo
├── eas.json                           # Config EAS Build
├── tsconfig.json
└── package.json
```

---

## 3. ALGORITHME DE SCORING (CŒUR DU PRODUIT)

> **Source** : Document NotebookLM d'Hector — base scientifique stricte.

### 3.1 Formule centrale

```
SCORE_FINAL = MAX(0, 100 - P_NOVA - P_ADDITIFS - P_MACROS - P_SEED_OILS)
```

Le score démarre à **100** et ne fait que descendre. Aucune compensation possible : un additif toxique ne peut PAS être compensé par des fibres ou des protéines.

### 3.2 Pénalité NOVA (P_NOVA) — Plafond de transformation

| Classification | Description | Plafond du score |
|---------------|-------------|-----------------|
| NOVA 1 | Aliments bruts ou peu transformés | Aucun plafond (100/100 possible) |
| NOVA 2 | Ingrédients culinaires transformés | Plafond 80/100 |
| NOVA 3 | Aliments transformés | Plafond 60/100 |
| NOVA 4 | Ultra-transformés (UPF) | **Plafond 30/100** |

**Détection automatique NOVA 4** — un produit bascule en UPF si on détecte :
- Cracking/Fractionnement : protéines hydrolysées, amidons modifiés, isolats de fibres
- Foisonnement (Overrun) : émulsifiants dans les glaces
- Irradiation : mention "traité par rayonnements ionisants"
- Point G (Gras-Glucose-Glutamate) : présence simultanée de sucres rapides + graisses raffinées + exhausteurs

### 3.3 Pénalité Additifs (P_ADDITIFS) — Liste noire

**Additifs bloquants (score = 0/100 immédiat) :**

| Code | Nom | Motif |
|------|-----|-------|
| E951 | Aspartame | Neurotoxique, métabolisé en méthanol puis formaldéhyde |
| E621 | Glutamate monosodique | Excitotoxine (noms cachés : extrait de levure, arôme naturel, protéines hydrolysées, maltodextrine) |
| E171 | Dioxyde de titane | Nanoparticule génotoxique franchissant les barrières biologiques |
| — | PFAS / Bisphénols | Polluants éternels, perturbateurs endocriniens |

**Additifs à pénalité forte :**

| Code | Nom | Pénalité |
|------|-----|---------|
| E955 | Sucralose | -50 pts |
| E249-E252 | Nitrites/Nitrates | -50 pts |
| E120 | Cochenille | -40 pts |
| E102, E104, E110, E122, E124, E129, E133 | Colorants azoïques | -40 pts chacun |
| E150c, E150d | Caramel ammoniacal | -30 pts |
| E330 | Acide citrique (si industriel) | -20 pts |

**Effet cocktail** : si 2+ additifs toxiques sont détectés ensemble, la pénalité totale est **multipliée par 2**.

### 3.4 Pénalité Macros (P_MACROS)

Calculées sur la **portion réelle** (pas la portion théorique de l'emballage) :

```
Charge_Réelle = (Valeur_pour_100g / 100) × Portion_Moyenne_Réelle
```

| Nutriment | Pénalité | Condition |
|-----------|---------|-----------|
| Sucres raffinés / sirops | -2 pts par gramme | Toujours |
| Graisses saturées raffinées | -2 pts par gramme | Si issues de palme, coco fractionnée, etc. |
| Sel industriel | -5 pts | Si excès (seuil configurable) |
| Protéines | +1 pt par gramme | **UNIQUEMENT si NOVA 1** (aliment brut) |
| Fibres | +1 pt par gramme | **UNIQUEMENT si NOVA 1** (aliment brut) |

### 3.5 Pénalité Huiles de Graines (P_SEED_OILS)

| Détection | Pénalité | Motif |
|-----------|---------|-------|
| Huile raffinée (soja, colza, tournesol, palme, maïs) | -30 pts | Extraction à l'hexane (neurotoxique) |
| Si huile raffinée à >200°C (désodorisée) | -40 pts supplémentaires | Esters de 3-MCPD et glycidol (génotoxiques) |

Total possible pour une huile raffinée désodorisée : **-70 pts**.

### 3.6 Personnalisation par profil

Le score de base est recalculé selon le profil actif de l'utilisateur :

| Profil | Modifications |
|--------|--------------|
| **Standard** | Algorithme par défaut |
| **Diabète / Perte de poids** | Pénalités doublées sur édulcorants intenses + sirop glucose-fructose = malus max |
| **Sportif** | Blocage strict aspartame + glutamate (excitotoxines → arythmie). Bonus aliments vivants (fruits) |
| **Enfant / Femme enceinte** | Tolérance ZÉRO : colorants azoïques, aspartame, métaux lourds, PFAS = 0/100 immédiat |
| **Intolérances (Crohn, arthrose)** | Lourde pénalité lactose/caséine + gluten |

### 3.7 Détection du Clean Labeling (NLP)

L'app doit traquer le vocabulaire trompeur via NLP sur `ingredients_list_raw` :

| Terme affiché | Ce que c'est vraiment |
|--------------|----------------------|
| "Extrait de levure" | MSG caché |
| "Arôme naturel" | Potentiellement MSG ou excitotoxine |
| "Protéines hydrolysées" | MSG caché + indicateur NOVA 4 |
| "Maltodextrine" | Sucre déguisé à index glycémique > glucose |
| "Bouillon" | Souvent MSG caché |
| "Huile végétale" | Souvent huile de graines raffinée non spécifiée |

### 3.8 Implémentation TypeScript du moteur

```typescript
// src/lib/scoring/engine.ts — PSEUDO-CODE STRUCTUREL

interface ScoringInput {
  barcode: string;
  ingredients_raw: string;
  additives_tags: string[];         // ["en:e621", "en:e150c"]
  nova_group: 1 | 2 | 3 | 4;
  macros_100g: {
    sugars: number;
    saturated_fat: number;
    salt: number;
    proteins: number;
    fiber: number;
  };
  portion_grams: number;            // Portion réelle estimée
  oil_types: string[];              // ["palm", "sunflower", "rapeseed"]
  is_organic: boolean;
  packaging_material?: string;
}

interface UserProfile {
  type: 'standard' | 'diabetic' | 'athlete' | 'child' | 'pregnant' | 'intolerant';
  allergies: string[];               // ["gluten", "lactose"]
  intolerances: string[];
}

interface ScoringResult {
  score_final: number;               // 0-100
  score_color: 'green' | 'yellow' | 'orange' | 'red';
  nova_group: number;
  penalties: PenaltyDetail[];        // Liste détaillée de chaque pénalité
  blockers: string[];                // Additifs qui bloquent à 0
  seed_oils_detected: string[];
  clean_labeling_alerts: string[];   // Termes trompeurs détectés
  profile_adjustments: string[];     // Ajustements liés au profil
}

function calculateScore(input: ScoringInput, profile: UserProfile): ScoringResult {
  let score = 100;
  const penalties: PenaltyDetail[] = [];
  const blockers: string[] = [];

  // 1. CHECK BLOCKERS (additifs qui forcent 0/100)
  // Si trouvé → score = 0, early return avec détails

  // 2. APPLY NOVA CEILING
  // NOVA 4 → score = min(score, 30)
  // NOVA 3 → score = min(score, 60)

  // 3. CALCULATE P_ADDITIFS
  // Pour chaque additif dans additives_tags → soustraire la pénalité
  // Si 2+ additifs toxiques → multiplier par 2 (effet cocktail)

  // 4. CALCULATE P_MACROS (sur portion réelle)
  // charge = (value_100g / 100) * portion_grams
  // sucres: -2 * charge_sucres
  // graisses sat: -2 * charge_sat_fat (si raffinées)
  // sel: -5 si excès

  // 5. BONUS CONDITIONNEL (NOVA 1 uniquement)
  // protéines: +1 * grammes
  // fibres: +1 * grammes

  // 6. P_SEED_OILS
  // Détection dans oil_types et ingredients_raw
  // -30 si raffinée, -40 additionnel si désodorisée

  // 7. CLEAN LABELING NLP
  // Scanner ingredients_raw pour termes trompeurs

  // 8. PROFILE ADJUSTMENTS
  // Modifier les pénalités selon le profil actif

  // 9. CLAMP
  // score = Math.max(0, Math.min(100, score))

  return {
    score_final: score,
    score_color: getColor(score),
    // ...
  };
}

function getColor(score: number): string {
  if (score >= 70) return 'green';     // Bon
  if (score >= 50) return 'yellow';    // Moyen
  if (score >= 25) return 'orange';    // Mauvais
  return 'red';                         // Danger
}
```

---

## 4. SCHÉMA DE BASE DE DONNÉES (Supabase PostgreSQL)

### 4.1 Tables principales

```sql
-- 001_users_profiles.sql

-- Profils utilisateurs étendus (au-delà de auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  health_profile TEXT NOT NULL DEFAULT 'standard'
    CHECK (health_profile IN ('standard', 'diabetic', 'athlete', 'child', 'pregnant', 'intolerant')),
  allergies TEXT[] DEFAULT '{}',
  intolerances TEXT[] DEFAULT '{}',
  preferred_portion_size TEXT DEFAULT 'realistic',  -- 'label' | 'realistic' | 'custom'
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at TIMESTAMPTZ,
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

```sql
-- 002_products_cache.sql

-- Cache local des produits Open Food Facts (évite les appels API répétés)
CREATE TABLE public.products (
  barcode TEXT PRIMARY KEY,
  name TEXT,
  brand TEXT,
  image_url TEXT,
  ingredients_raw TEXT,               -- Texte brut des ingrédients
  additives_tags TEXT[] DEFAULT '{}', -- ["en:e621", "en:e150c"]
  nova_group SMALLINT,                -- 1, 2, 3, ou 4
  nutriscore_grade TEXT,              -- Pour comparaison avec Yuka
  -- Macros pour 100g
  energy_kcal_100g NUMERIC,
  sugars_100g NUMERIC,
  saturated_fat_100g NUMERIC,
  salt_100g NUMERIC,
  proteins_100g NUMERIC,
  fiber_100g NUMERIC,
  -- Données spécifiques à notre scoring
  oil_types TEXT[] DEFAULT '{}',      -- ["palm", "sunflower_refined"]
  portion_grams NUMERIC,              -- Portion réelle estimée
  packaging_material TEXT,
  is_organic BOOLEAN DEFAULT FALSE,
  -- Métadonnées
  off_last_updated TIMESTAMPTZ,       -- Dernière MAJ sur Open Food Facts
  our_score INTEGER,                  -- Score calculé (profil standard)
  our_score_computed_at TIMESTAMPTZ,
  scan_count INTEGER DEFAULT 0,       -- Popularité locale
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_name ON public.products USING gin(to_tsvector('french', name));
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_products_nova ON public.products(nova_group);
CREATE INDEX idx_products_score ON public.products(our_score);
```

```sql
-- 003_additives_database.sql

-- Base de données des 700+ additifs avec pénalités
CREATE TABLE public.additives (
  code TEXT PRIMARY KEY,               -- "e621", "e951"
  name_fr TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,              -- "colorant", "conservateur", "edulcorant", "exhausteur", "emulsifiant"
  risk_level TEXT NOT NULL
    CHECK (risk_level IN ('blocker', 'high', 'moderate', 'low', 'safe')),
  penalty_points INTEGER NOT NULL DEFAULT 0,  -- 0 = blocker (score → 0)
  is_blocker BOOLEAN NOT NULL DEFAULT FALSE,
  description_short_fr TEXT,           -- Explication courte affichée sous le score
  description_detailed_fr TEXT,        -- Explication détaillée (bouton "En savoir plus")
  scientific_sources TEXT[],           -- URLs des sources scientifiques
  hidden_names TEXT[] DEFAULT '{}',    -- Noms cachés / clean labeling ["extrait de levure", "arôme naturel"]
  profiles_extra_penalty JSONB DEFAULT '{}',
    -- Ex: {"child": "blocker", "diabetic": "double", "athlete": "blocker"}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data : les additifs critiques
INSERT INTO public.additives (code, name_fr, category, risk_level, penalty_points, is_blocker, description_short_fr, hidden_names, profiles_extra_penalty) VALUES
  ('e951', 'Aspartame', 'edulcorant', 'blocker', 0, TRUE,
   'Neurotoxique métabolisé en méthanol puis formaldéhyde.',
   '{"arôme artificiel"}',
   '{"child": "blocker", "pregnant": "blocker", "athlete": "blocker"}'),
  ('e621', 'Glutamate monosodique', 'exhausteur', 'blocker', 0, TRUE,
   'Excitotoxine. Noms cachés fréquents sur les étiquettes.',
   '{"extrait de levure", "arôme naturel", "protéines hydrolysées", "maltodextrine", "bouillon"}',
   '{"child": "blocker", "athlete": "blocker"}'),
  ('e171', 'Dioxyde de titane', 'colorant', 'blocker', 0, TRUE,
   'Nanoparticule génotoxique. Interdit en France depuis 2020.',
   '{}', '{}'),
  ('e955', 'Sucralose', 'edulcorant', 'high', 50, FALSE,
   'Organochloré mutagène perturbant le microbiote.',
   '{}', '{"diabetic": "blocker"}'),
  ('e250', 'Nitrite de sodium', 'conservateur', 'high', 50, FALSE,
   'Forme des nitrosamines cancérogènes (cancer colorectal).',
   '{}', '{"child": "blocker"}'),
  ('e120', 'Cochenille', 'colorant', 'high', 40, FALSE,
   'Allergène sévère. Risque de choc anaphylactique.',
   '{"carmin", "acide carminique"}', '{}'),
  ('e150c', 'Caramel ammoniacal', 'colorant', 'moderate', 30, FALSE,
   'Contient du 4-MEI, immunotoxique.',
   '{}', '{}'),
  ('e330', 'Acide citrique', 'acidifiant', 'moderate', 20, FALSE,
   'Issu de moisissures Aspergillus niger. Facilite le passage de l''aluminium dans le cerveau.',
   '{}', '{}')
ON CONFLICT (code) DO NOTHING;
-- NOTE: La table complète des 700+ additifs sera importée via un script de seed séparé
```

```sql
-- 004_scan_history.sql

CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL REFERENCES public.products(barcode),
  score_at_scan INTEGER NOT NULL,
  profile_used TEXT NOT NULL,          -- Profil actif au moment du scan
  penalties_snapshot JSONB,            -- Snapshot des pénalités pour cet scan
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scan_history_user ON public.scan_history(user_id, scanned_at DESC);
CREATE INDEX idx_scan_history_barcode ON public.scan_history(barcode);

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own history"
  ON public.scan_history FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history"
  ON public.scan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history"
  ON public.scan_history FOR UPDATE
  USING (auth.uid() = user_id);
```

```sql
-- 005_smart_swaps.sql

-- Alternatives brutes (gratuites, toujours disponibles)
CREATE TABLE public.swap_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name_fr TEXT NOT NULL,      -- "Boisson sucrée", "Céréales petit-déj", "Snack salé"
  swap_type TEXT NOT NULL DEFAULT 'brut',  -- 'brut' | 'product'
  -- Pour les swaps bruts (MVP gratuit)
  brut_alternatives JSONB,             -- [{"name": "Eau + citron frais", "why": "Hydratation sans sucre ni additif"}, ...]
  -- Pour les swaps produits (premium)
  product_barcodes TEXT[] DEFAULT '{}', -- Barcodes des alternatives scannables
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Règles de swap : quel type de produit → quelle catégorie de swap
CREATE TABLE public.swap_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_keywords TEXT[] NOT NULL,    -- Mots-clés dans le nom/catégorie du produit scanné
  trigger_nova_min SMALLINT DEFAULT 3, -- NOVA minimum pour déclencher un swap
  swap_category_id UUID REFERENCES public.swap_categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

```sql
-- 006_subscriptions.sql

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  revenue_cat_id TEXT,                 -- ID RevenueCat pour IAP
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'premium')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 5. FONCTIONNALITÉS MVP

### 5.1 Gratuit (tous les utilisateurs)

| Feature | Description |
|---------|------------|
| **Scan barcode illimité** | Scanner un code-barres et obtenir le score 0-100 instantanément. JAMAIS de limite de scans gratuits (leçon d'Exposr). |
| **Score de santé 0-100** | Cercle animé avec code couleur (vert/jaune/orange/rouge) |
| **Détail des pénalités** | Liste de chaque pénalité appliquée avec explication courte |
| **Badge NOVA** | Affichage clair du niveau de transformation (1 à 4) |
| **Alerte huiles de graines** | Signal visuel fort si huiles raffinées détectées |
| **Alerte clean labeling** | Signal si vocabulaire trompeur détecté (MSG caché, etc.) |
| **"En savoir plus"** | Bouton ouvrant les sources scientifiques détaillées pour chaque pénalité |
| **Profil santé basique** | Choix du profil (standard, diabétique, sportif, enfant, enceinte, intolérant) |
| **Smart Swaps bruts** | Alternatives en aliments bruts (fruits, noix, graines germées) — toujours gratuit |
| **Historique** | 30 derniers scans |
| **Filtres allergènes** | Alertes gluten, lactose, arachides — GRATUIT (contrairement à Yuka !) |

### 5.2 Premium (~3,99€/mois ou 29,99€/an)

| Feature | Description |
|---------|------------|
| **Smart Swaps produits** | Alternatives de vrais produits scannables en magasin avec leur score |
| **Historique illimité** | Tous les scans conservés |
| **Journal alimentaire** | Suivi quotidien simplifié (score moyen de la journée) |
| **Comparateur** | Comparer 2 produits côte à côte |
| **Export PDF** | Exporter son journal en PDF |
| **Sans publicité** | (si pub en gratuit — à valider) |
| **Widgets iOS/Android** | Score du dernier scan en widget home screen |

### 5.3 Hors scope MVP (V2+)

- Scan photo d'étiquettes par IA (Claude Vision API)
- Cosmétiques et produits ménagers
- Scan AR d'un rayon entier
- Recettes / meal planning
- Intégration CGM (capteurs de glucose)
- Social features (partage, classements)
- Mode restaurant (scan du menu)
- B2B dashboard pour les marques

---

## 6. DESIGN & UX

### 6.1 Direction artistique

**Style** : Épuré, nature, santé — l'opposé du dark premium de LegitVision.

| Élément | Spécification |
|---------|--------------|
| **Palette principale** | Vert sauge (#8BAD8B), blanc cassé (#FAFAF7), terre (#C4A882) |
| **Palette scores** | Vert (#4CAF50), Jaune (#FFC107), Orange (#FF9800), Rouge (#F44336) |
| **Fond** | Blanc cassé / crème très léger — jamais blanc pur |
| **Typographie** | Inter (corps) + Bricolage Grotesque (titres) — Google Fonts, gratuites |
| **Icônes** | Lucide Icons (cohérent avec shadcn, familier pour Hector) |
| **Coins** | Arrondis généreux (borderRadius: 16-20) |
| **Ombres** | Subtiles, organiques (shadow-sm) |
| **Illustrations** | Flat, végétales, minimalistes |
| **Animations** | Score circle reveal animé (react-native-reanimated) |

### 6.2 Flow utilisateur principal

```
Ouverture app
    ↓
[Premier lancement ?]
    ├── OUI → Onboarding (3 écrans)
    │         1. "Scannez. Comprenez. Choisissez."
    │         2. Choix du profil santé
    │         3. Allergies/intolérances (optionnel)
    │         → Inscription (email ou Google OAuth)
    ↓
Tab Scanner (écran par défaut)
    ↓
[User scanne un code-barres]
    ↓
Recherche dans cache Supabase
    ├── TROUVÉ → Calcul score local
    ├── PAS TROUVÉ → Appel Open Food Facts API
    │                 ├── TROUVÉ → Sauvegarde cache + Calcul score
    │                 └── PAS TROUVÉ → Écran "Produit inconnu"
    │                                  → Proposer contribution (photo)
    ↓
ÉCRAN RÉSULTAT
    ┌──────────────────────────────────┐
    │  [Image produit]  Nom + Marque   │
    │                                   │
    │     ╔═══════════╗                 │
    │     ║   72/100  ║  ← Score animé │
    │     ╚═══════════╝                 │
    │  🟢 Bon pour votre profil        │
    │                                   │
    │  ⚠️ NOVA 3 — Transformé          │
    │                                   │
    │  📋 PÉNALITÉS                     │
    │  ├─ E150c Caramel ammoniacal -30 │
    │  ├─ Sucres 12g/portion     -24   │
    │  └─ Huile de palme         -30   │
    │                                   │
    │  [En savoir plus →]               │
    │                                   │
    │  🔄 ALTERNATIVES                  │
    │  ├─ 🥜 Noix + fruits secs        │
    │  ├─ 🍎 Pomme fraîche             │
    │  └─ 🔒 Voir produits (Premium)   │
    │                                   │
    │  [♡ Favoris]  [📤 Partager]       │
    └──────────────────────────────────┘
```

---

## 7. PLAN DE DÉVELOPPEMENT (5 PHASES)

### Phase 1 — Setup & Foundation (Semaine 1-2)

**Objectif** : Projet Expo configuré, navigation, auth, design system.

```bash
# Commandes de setup
npx create-expo-app@latest app-nutrition --template tabs
cd app-nutrition
npx expo install expo-router expo-camera react-native-vision-camera
npx expo install @supabase/supabase-js
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install nativewind tailwindcss
npm install zustand @tanstack/react-query
```

- [ ] Initialiser le projet Expo avec TypeScript
- [ ] Configurer NativeWind (Tailwind pour RN)
- [ ] Créer le design system (couleurs, typo, composants UI de base)
- [ ] Configurer Supabase (projet, migrations 001-006, RLS)
- [ ] Implémenter l'auth (email + Google OAuth via Supabase)
- [ ] Créer le flow d'onboarding (3 écrans + choix profil santé)
- [ ] Configurer Expo Router (tabs : Scan, Historique, Favoris, Profil)
- [ ] Écrire le CLAUDE.md

### Phase 2 — Scanner & Scoring Engine (Semaine 3-4)

**Objectif** : Scanner fonctionnel + algorithme de scoring complet.

- [ ] Intégrer react-native-vision-camera + ML Kit Barcode
- [ ] Implémenter le client Open Food Facts API v2
- [ ] Créer le cache produits dans Supabase (table products)
- [ ] **CŒUR** : Implémenter `src/lib/scoring/engine.ts` (formule complète)
- [ ] Implémenter `additives-db.ts` (700+ additifs avec pénalités)
- [ ] Implémenter `nova-classifier.ts` (détection NOVA 1-4)
- [ ] Implémenter `seed-oils.ts` (détection huiles de graines)
- [ ] Implémenter `clean-labeling.ts` (NLP termes trompeurs)
- [ ] Implémenter `profiles.ts` (modificateurs par profil)
- [ ] Tests unitaires du moteur de scoring (TDD)

### Phase 3 — Product Screen & Smart Swaps (Semaine 5-6)

**Objectif** : Écran résultat complet + alternatives.

- [ ] Créer `ScoreCircle.tsx` (cercle animé avec Reanimated)
- [ ] Créer `IngredientsList.tsx` (avec codes couleur par risque)
- [ ] Créer `AdditiveCard.tsx` (détail + "En savoir plus" → sources)
- [ ] Créer `NovaBadge.tsx`
- [ ] Créer `SeedOilAlert.tsx`
- [ ] Implémenter les Smart Swaps bruts (catégories d'aliments)
- [ ] Implémenter les Smart Swaps produits (premium — requête Supabase produits à bon score dans même catégorie)
- [ ] Seeder la table `swap_categories` avec les alternatives brutes
- [ ] Écran comparateur (premium)

### Phase 4 — Historique, Favoris & Subscription (Semaine 7-8)

**Objectif** : Persistence, favoris, paywall.

- [ ] Implémenter l'historique des scans (table scan_history)
- [ ] Écran historique avec recherche et filtres
- [ ] Système de favoris (toggle sur l'écran produit)
- [ ] Intégrer RevenueCat pour les IAP iOS/Android
- [ ] Configurer Stripe comme fallback web
- [ ] Créer le paywall screen (premium features)
- [ ] Implémenter le journal alimentaire simplifié (score moyen quotidien)
- [ ] Deep linking (partage d'un produit via URL)

### Phase 5 — Polish, Test & Launch (Semaine 9-10)

**Objectif** : Production-ready, soumission stores.

- [ ] Tests end-to-end (Detox ou Maestro)
- [ ] Performance audit (temps de scan < 500ms, cold start < 2s)
- [ ] Accessibilité (VoiceOver/TalkBack)
- [ ] Localisation FR complète
- [ ] Préparer les assets stores (screenshots, description, vidéo preview)
- [ ] Configurer EAS Build (iOS + Android)
- [ ] Configurer EAS Submit
- [ ] Soumettre sur App Store + Google Play
- [ ] Landing page web (Vercel, même stack que LegitVision)
- [ ] Setup PostHog analytics + Sentry crash reports
- [ ] Setup CGU / Mentions légales / Politique de confidentialité (RGPD)

---

## 8. INTÉGRATION OPEN FOOD FACTS API

### 8.1 Endpoint principal

```
GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
```

### 8.2 Champs à extraire

```typescript
interface OFFProduct {
  code: string;                          // Barcode
  product_name: string;
  brands: string;
  image_url: string;
  ingredients_text: string;              // → ingredients_raw
  additives_tags: string[];              // → additives_tags
  nova_group: number;                    // → nova_group
  nutriscore_grade: string;
  nutriments: {
    'energy-kcal_100g': number;
    'sugars_100g': number;
    'saturated-fat_100g': number;
    'salt_100g': number;
    'proteins_100g': number;
    'fiber_100g': number;
  };
  serving_size: string;                  // "30g" → à parser
  packaging: string;                     // "plastique", "carton"
  labels_tags: string[];                 // Contient "en:organic" si bio
  categories_tags: string[];             // Pour le matching Smart Swaps
}
```

### 8.3 Rate limiting & cache

- Open Food Facts : pas de rate limit strict, mais respecter 100 req/min
- **Stratégie** : cache Supabase avec TTL de 7 jours. Si le produit est dans le cache et < 7 jours, pas d'appel API.
- User-Agent obligatoire : `[APP_NAME]/1.0 (contact@lyxiria.com)`

---

## 9. MONÉTISATION

### 9.1 Stratégie recommandée

| Phase | Modèle | Prix |
|-------|--------|------|
| **MVP (0-10K users)** | Freemium — scan gratuit illimité, premium pour extras | 3,99€/mois ou 29,99€/an |
| **Croissance (10K-100K)** | Idem + affiliation produits sains | Idem + commissions |
| **Scale (100K+)** | B2B white-label pour corporate wellness | Sur devis |

### 9.2 Pourquoi ces prix

- Yuka Premium : ~15€/an (mais scan déjà gratuit et complet)
- Oasis : $47/an (jugé trop cher)
- Sweet spot identifié : **29,99€/an** (2,50€/mois effectif)
- Le scan DOIT rester gratuit et complet — c'est le moat de Yuka et la leçon d'Exposr

### 9.3 Revenue projections (conservatrices)

| Mois | Users | Conversion 3% | MRR |
|------|-------|---------------|-----|
| M3 | 5 000 | 150 premium | 598€ |
| M6 | 20 000 | 600 premium | 2 394€ |
| M12 | 50 000 | 1 500 premium | 5 985€ |
| M18 | 100 000 | 3 000 premium | 11 970€ |

---

## 10. KPIs & MÉTRIQUES

| Métrique | Cible MVP | Outil |
|----------|----------|-------|
| Rétention J7 | > 30% | PostHog |
| Scans / utilisateur / semaine | > 5 | PostHog |
| Temps de scan (barcode → score) | < 800ms | Sentry Performance |
| Crash rate | < 1% | Sentry |
| Conversion free → premium | > 3% | RevenueCat |
| NPS | > 40 | In-app survey |
| Note App Store | > 4.5 | Monitoring |

---

## 11. RISQUES & MITIGATIONS

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Open Food Facts down/lent | Scans échouent | Cache agressif (7 jours) + fallback offline sur les produits déjà scannés |
| Scoring contesté (trop sévère) | Bad reviews, perte de crédibilité | Sources scientifiques accessibles pour CHAQUE pénalité. Transparence totale. |
| Procès d'une marque alimentaire | Juridique | Disclaimer clair : "Information, pas conseil médical". Scoring basé sur études publiées. |
| Apple/Google rejettent l'app | Retard de lancement | Suivre les guidelines à la lettre. Pas de claims médicaux directs. |
| Yuka copie les features | Perte de différenciation | Itérer plus vite. Personnalisation + rigueur scientifique sont des moats structurels. |
| Base d'additifs incomplète | Scoring imprécis | Commencer avec les 100 plus courants, itérer. Permettre les contributions utilisateurs. |

---

## 12. NOTES POUR CLAUDE CODE

### Ce que Claude Code doit savoir :

1. **Hector utilise `ultrathink`** à la fin de chaque prompt pour la réflexion maximale.
2. **Un problème = un prompt** — ne pas mélanger les corrections.
3. **Jamais 2 agents sur le même fichier** (Agent Teams).
4. **Build avant commit** — vérifier que `npx expo export` passe.
5. **Le moteur de scoring est le cœur** — il doit être testé en TDD avec des cas réels.
6. **Les migrations SQL** : Claude Code crée le fichier, Hector le copie dans Supabase SQL Editor.
7. **RevenueCat** gère les IAP natifs iOS/Android — Stripe est pour le web uniquement.
8. **NativeWind** = Tailwind pour React Native. Syntaxe identique à Tailwind CSS mais via `className` prop.
9. **Le design est "nature/santé"** — pas le dark premium de LegitVision. Tons verts, blancs cassés, organiques.
10. **France first** — toutes les strings en français, locale FR par défaut.
