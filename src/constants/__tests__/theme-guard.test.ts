/**
 * Garde-fou R6 — aucune couleur en dur hors du fichier de tokens.
 *
 * L'app compte encore 102 fichiers écrits avant le Design System v2. Les
 * interdire d'un coup ferait échouer ce test dès sa naissance ; les ignorer
 * laisserait la dette invisible. D'où l'allowlist décroissante :
 *
 *   • un fichier NON listé qui introduit un hex        → échec
 *   • un fichier listé qui n'en contient PLUS          → échec (retirer la ligne)
 *
 * La liste ne peut donc que rétrécir. Sa longueur EST le backlog chiffré de la
 * phase 2 : 102 → 0.
 *
 * 106 → 102 : la refonte de la home a sorti `app/(tabs)/index.tsx`,
 * `AnimatedVivoBrand`, `FamilyProfilePills` et `TopByCategorySection`.
 * `PrimaryCTA` reste listé volontairement : son variant `default` conserve à
 * l'identique le dégradé v1 pour les 15 écrans encore hors périmètre.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const SCANNED_DIRS = ['src/components', 'app'];
const HEX = /#[0-9A-Fa-f]{3,8}\b/;

/**
 * Fichiers antérieurs au Design System v2. NE JAMAIS AJOUTER DE LIGNE ICI :
 * tout nouveau code doit importer ses couleurs depuis `src/constants/theme.ts`.
 */
const LEGACY = [
  'app/(tabs)/explore.tsx',
  'app/(tabs)/favorites.tsx',
  'app/(tabs)/history.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/scan.tsx',
  'app/+html.tsx',
  'app/_layout.tsx',
  'app/auth/login.tsx',
  'app/auth/register.tsx',
  'app/category/[slug].tsx',
  'app/family/edit.tsx',
  'app/family/index.tsx',
  'app/herbarium/index.tsx',
  'app/landing.tsx',
  'app/methodology.tsx',
  'app/ocr/analyzing.tsx',
  'app/ocr/result.tsx',
  'app/onboarding/_layout.tsx',
  'app/onboarding/allergies.tsx',
  'app/onboarding/health-profile.tsx',
  'app/onboarding/welcome.tsx',
  'app/plants/[id].tsx',
  'app/plants/index.tsx',
  'app/product/[barcode].tsx',
  'app/protocols/[id].tsx',
  'app/protocols/index.tsx',
  'app/recap/monthly.tsx',
  'app/recipes/[id].tsx',
  'app/recipes/index.tsx',
  'app/remedies/[categoryId].tsx',
  'app/remedies/index.tsx',
  'app/reminders/index.tsx',
  'app/scan-choc/[barcode].tsx',
  'app/settings/cgu.tsx',
  'app/settings/health-disclaimer.tsx',
  'app/settings/health-profile.tsx',
  'app/settings/legal.tsx',
  'app/settings/privacy.tsx',
  'app/settings/subscription.tsx',
  'app/stats/index.tsx',
  'app/store-ranking.tsx',
  'app/store/[slug].tsx',
  'src/components/common/ErrorBoundary.tsx',
  'src/components/common/ToastProvider.tsx',
  'src/components/education/EducationalCard.tsx',
  'src/components/explore/CategoryRankCard.tsx',
  'src/components/explore/CompatibilityToggle.tsx',
  'src/components/explore/FeaturedProductCard.tsx',
  'src/components/explore/HistoryTypeTabs.tsx',
  'src/components/explore/SearchResultCard.tsx',
  'src/components/gamification/BadgeGrid.tsx',
  'src/components/gamification/WeeklyProgressBar.tsx',
  'src/components/health/HealthConsentModal.tsx',
  'src/components/herbarium/HerbariumNoteModal.tsx',
  'src/components/home/BlobSvgFallback.tsx',
  'src/components/home/OrganicBlob.tsx',
  'src/components/home/PrimaryCTA.tsx',
  'src/components/illustrations/EmptyBasket.tsx',
  'src/components/illustrations/EmptyHeart.tsx',
  'src/components/illustrations/GoogleIcon.tsx',
  'src/components/illustrations/LeafBouquet.tsx',
  'src/components/illustrations/SearchNotFound.tsx',
  'src/components/naturality/NaturalityBadge.tsx',
  'src/components/navigation/CustomTabBar.tsx',
  'src/components/onboarding/TappableChip.tsx',
  'src/components/onboarding/TappableSelectableCard.tsx',
  'src/components/plants/PlantListCard.tsx',
  'src/components/premium/AlternativeCard.tsx',
  'src/components/premium/AlternativesSection.tsx',
  'src/components/premium/PremiumPaywall.tsx',
  'src/components/premium/ScanChocCard.tsx',
  'src/components/premium/ShareableCard.tsx',
  'src/components/product/CosmeticResultView.tsx',
  'src/components/product/FavoriteGridCard.tsx',
  'src/components/product/FoodProductView.tsx',
  'src/components/product/IngredientRiskMap.tsx',
  'src/components/product/MiniScoreCircle.tsx',
  'src/components/product/NutrientBar.tsx',
  'src/components/product/NutrientBreakdown.tsx',
  'src/components/product/PackagingSection.tsx',
  'src/components/product/PenaltyCard.tsx',
  'src/components/product/ProductHeader.tsx',
  'src/components/product/ProductNotFound.tsx',
  'src/components/product/ReportButton.tsx',
  'src/components/product/ScanHistoryCard.tsx',
  'src/components/product/ScoreBreakdownChart.tsx',
  'src/components/product/ScoreCircle.tsx',
  'src/components/product/ScoreComparison.tsx',
  'src/components/product/UltraTransformedTag.tsx',
  'src/components/profile/SettingsRow.tsx',
  'src/components/protocols/DayCircle.tsx',
  'src/components/protocols/ProtocolCard.tsx',
  'src/components/recipes/RecipeTimer.tsx',
  'src/components/stats/ProfileStatsSection.tsx',
  'src/components/stats/StatCard.tsx',
  'src/components/stats/WeeklySparkline.tsx',
  'src/components/ui/Button.tsx',
  'src/components/ui/GradientHeader.tsx',
  'src/components/ui/Input.tsx',
  'src/components/ui/ProgressDots.tsx',
  'src/components/ui/SecondaryButton.tsx',
  'src/components/ui/Skeleton.tsx',
];

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      collectSourceFiles(rel, acc);
    } else if (/\.tsx?$/.test(entry.name)) {
      acc.push(rel);
    }
  }
  return acc;
}

const FILES = SCANNED_DIRS.flatMap((d) => collectSourceFiles(d));
const WITH_HEX = FILES.filter((f) => HEX.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));

describe('R6 — aucune couleur en dur hors du fichier de tokens', () => {
  it('balaie bien un corpus non vide', () => {
    expect(FILES.length).toBeGreaterThan(100);
  });

  it('aucun fichier hors allowlist n’introduit de hex', () => {
    const offenders = WITH_HEX.filter((f) => !LEGACY.includes(f));
    expect(offenders).toEqual([]);
  });

  it('l’allowlist ne contient aucune entrée périmée (elle ne fait que rétrécir)', () => {
    const stale = LEGACY.filter((f) => !WITH_HEX.includes(f));
    expect(stale).toEqual([]);
  });

  it('les briques du Design System sont exemptes de hex', () => {
    const CORE = [
      'src/components/ui/Icon.tsx',
      'src/components/ui/GlassCard.tsx',
    ];
    for (const f of CORE) {
      expect([f, HEX.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))]).toEqual([f, false]);
    }
  });
});
