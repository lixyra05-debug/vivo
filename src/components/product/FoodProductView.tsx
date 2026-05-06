import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Share2, Sparkles } from 'lucide-react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScoreCircle } from './ScoreCircle';
import { NovaBadge } from './NovaBadge';
import { UltraTransformedTag } from './UltraTransformedTag';
import { SeedOilAlert } from './SeedOilAlert';
import { IngredientsList } from './IngredientsList';
import { PenaltyCard } from './PenaltyCard';
import { ScoreComparison } from './ScoreComparison';
import { ScoreBreakdownChart } from './ScoreBreakdownChart';
import { NutrientBreakdown } from './NutrientBreakdown';
import { IngredientRiskMap } from './IngredientRiskMap';
import { ReportButton } from './ReportButton';
import { SourceLink } from './SourceLink';
import { EducationalCard } from '@/src/components/education/EducationalCard';
import { AlternativesSection } from '@/src/components/premium/AlternativesSection';
import { Colors, scoreColor } from '@/src/constants/colors';
import { findAdditive } from '@/src/lib/scoring/engine';
import { getScoreVerdict } from '@/src/lib/scoring/display-helpers';
import { useAlternatives } from '@/src/lib/api/use-alternatives';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { usePremium } from '@/src/lib/hooks/usePremium';
import type { Product, ScoringResult } from '@/src/lib/api/types';
import type { EducationalCard as EducationalCardType } from '@/src/lib/gamification/types';

export interface FoodProductViewProps {
  product: Product;
  result: ScoringResult;
  educationalCards: EducationalCardType[];
  categoriesTags: string[];
  isPremium: boolean;
  onUnlockPremium: () => void;
  onPressAlternative: (barcode: string) => void;
  onPressMethodology: () => void;
}

const SHOCK_TOAST_THRESHOLD = 40;
const SHOCK_TOAST_DURATION_MS = 5000;

export function FoodProductView({
  product,
  result,
  educationalCards,
  categoriesTags,
  isPremium,
  onUnlockPremium,
  onPressAlternative,
  onPressMethodology,
}: FoodProductViewProps) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const { alternatives, isLoading: alternativesLoading } = useAlternatives(
    product.barcode,
    categoriesTags,
    result.score_final,
  );
  const additivePenalties = result.penalties.filter((p) => p.category === 'additive');
  const otherPenalties = result.penalties.filter(
    (p) => p.category !== 'additive' && p.points > 0,
  );
  const hasPenalties = additivePenalties.length > 0 || otherPenalties.length > 0;
  const scoreHex = scoreColor(result.score_final);
  const verdict = getScoreVerdict(result.score_final);

  // Auto-toast Scan Choc — affiché une seule fois par barcode pour les users payants.
  const toastedBarcodesRef = useRef<Set<string>>(new Set());
  const [showShockToast, setShowShockToast] = useState(false);

  useEffect(() => {
    if (
      result.score_final < SHOCK_TOAST_THRESHOLD &&
      tier !== 'free' &&
      !toastedBarcodesRef.current.has(product.barcode)
    ) {
      toastedBarcodesRef.current.add(product.barcode);
      setShowShockToast(true);
      const timer = setTimeout(
        () => setShowShockToast(false),
        SHOCK_TOAST_DURATION_MS,
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [result.score_final, product.barcode, tier]);

  function goToScanChoc() {
    setShowShockToast(false);
    router.push(`/scan-choc/${product.barcode}`);
  }

  return (
    <>
      {showShockToast ? (
        <FadeIn delay={0}>
          <Pressable
            onPress={goToScanChoc}
            accessibilityRole="button"
            accessibilityLabel="Voir la carte partageable du scan choc"
            style={({ pressed }) => [
              styles.shockToast,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.shockToastTitle}>
              🚨 Produit choc détecté !
            </Text>
            <Text style={styles.shockToastBody}>Voir la carte partageable</Text>
          </Pressable>
        </FadeIn>
      ) : null}

      <FadeIn delay={140}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={styles.scoreHaloWrap}>
            <View style={[styles.scoreHalo, { backgroundColor: `${scoreHex}14` }]} />
            <ScoreCircle score={result.score_final} size={200} strokeWidth={14} />
          </View>
          <Text
            style={{
              fontFamily: 'BricolageGrotesque-SemiBold',
              fontSize: 20,
              color: scoreHex,
              letterSpacing: -0.3,
            }}
          >
            {verdict.label}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: Colors.textMuted,
              textAlign: 'center',
              paddingHorizontal: 24,
              lineHeight: 19,
            }}
          >
            {verdict.description}
          </Text>
          {result.nova_group ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
              }}
            >
              <NovaBadge group={result.nova_group as 1 | 2 | 3 | 4} />
              {result.nova_group === 4 ? (
                <FadeIn delay={300}>
                  <UltraTransformedTag novaGroup={result.nova_group} />
                </FadeIn>
              ) : null}
            </View>
          ) : null}
          <Pressable
            onPress={onPressMethodology}
            accessibilityRole="link"
            accessibilityLabel="Comment ce score est calculé"
            hitSlop={6}
          >
            <Text style={styles.methodologyLink}>
              Comment ce score est calculé ? →
            </Text>
          </Pressable>
        </View>
      </FadeIn>

      <FadeIn delay={220}>
        <ScoreComparison score={result.score_final} delay={0} />
      </FadeIn>

      {result.blockers.length > 0 ||
      (result.nova_group === 4 && additivePenalties.length > 0) ? (
        <FadeIn delay={280}>
          <GlassCard tone="danger" style={{ padding: 16, gap: 6 }}>
            {result.blockers.length > 0 ? (
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-SemiBold',
                  fontSize: 15,
                  color: Colors.score.red,
                }}
              >
                Bloquants détectés
              </Text>
            ) : null}
            {result.nova_group === 4 && additivePenalties.length > 0 ? (
              <Text
                style={{
                  fontFamily: 'Inter-SemiBold',
                  fontSize: 13,
                  color: Colors.score.red,
                }}
              >
                Ultra-transformé + {additivePenalties.length} additif
                {additivePenalties.length > 1 ? 's' : ''} à risque
              </Text>
            ) : null}
            {result.blockers.map((b) => (
              <Text
                key={b}
                style={{ fontFamily: 'Inter', fontSize: 13, color: Colors.text }}
              >
                • {b}
              </Text>
            ))}
          </GlassCard>
        </FadeIn>
      ) : null}

      {result.penalties.length > 0 ? (
        <FadeIn delay={340}>
          <ScoreBreakdownChart
            penalties={result.penalties}
            finalScore={result.score_final}
            delay={0}
          />
        </FadeIn>
      ) : null}

      <FadeIn delay={420}>
        <NutrientBreakdown
          macros={{
            sugars: product.sugars_100g ?? undefined,
            saturated_fat: product.saturated_fat_100g ?? undefined,
            salt: product.salt_100g ?? undefined,
            proteins: product.proteins_100g ?? undefined,
            fiber: product.fiber_100g ?? undefined,
          }}
          energyKcal={product.energy_kcal_100g ?? undefined}
          portionGrams={product.portion_grams ?? 100}
        />
      </FadeIn>

      {product.ingredients_raw ? (
        <FadeIn delay={500}>
          <IngredientRiskMap
            ingredientsRaw={product.ingredients_raw ?? ''}
            delay={0}
          />
        </FadeIn>
      ) : null}

      {educationalCards.map((card, i) => (
        <FadeIn key={card.id} delay={540 + i * 120}>
          <EducationalCard card={card} />
        </FadeIn>
      ))}

      {hasPenalties ? (
        <FadeIn delay={580}>
          <View style={{ gap: 12 }}>
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-Bold',
                  fontSize: 20,
                  color: Colors.text,
                  letterSpacing: -0.3,
                }}
              >
                Pourquoi ce score
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: Colors.textMuted,
                }}
              >
                Les éléments qui pèsent sur la note.
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              {additivePenalties.map((p) => {
                const entry = findAdditive(p.code);
                const isBlocker = entry?.isBlocker ?? false;
                return (
                  <PenaltyCard
                    key={p.code}
                    code={p.code}
                    title={entry?.nameFr ?? p.label}
                    points={p.points}
                    description={entry?.descriptionShortFr ?? p.label}
                    detailed={entry?.descriptionDetailedFr}
                    sources={entry?.scientificSources}
                    severity={isBlocker ? 'blocker' : undefined}
                  />
                );
              })}
              {otherPenalties.map((p) => (
                <PenaltyCard
                  key={`${p.code}-${p.label}`}
                  title={p.label}
                  points={p.points}
                />
              ))}
            </View>
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={620}>
        <AlternativesSection
          alternatives={alternatives}
          isPremium={isPremium}
          currentScore={result.score_final}
          isLoading={alternativesLoading}
          onUnlock={onUnlockPremium}
          onPressAlt={onPressAlternative}
        />
      </FadeIn>

      {result.seed_oils_detected.length > 0 ? (
        <FadeIn delay={640}>
          <SeedOilAlert oils={result.seed_oils_detected} />
        </FadeIn>
      ) : null}

      {result.clean_labeling_alerts.length > 0 ? (
        <FadeIn delay={700}>
          <GlassCard tone="info" style={{ padding: 16, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles color="#B58900" size={18} strokeWidth={2.2} />
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-SemiBold',
                  fontSize: 15,
                  color: Colors.text,
                }}
              >
                Clean labeling suspect
              </Text>
            </View>
            <View style={{ gap: 4 }}>
              {result.clean_labeling_alerts.map((a) => (
                <Text
                  key={a}
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: Colors.textMuted,
                    lineHeight: 19,
                  }}
                >
                  • {a}
                </Text>
              ))}
            </View>
          </GlassCard>
        </FadeIn>
      ) : null}

      {result.profile_adjustments.length > 0 ? (
        <FadeIn delay={760}>
          <GlassCard style={{ padding: 16, gap: 6 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-SemiBold',
                fontSize: 15,
                color: Colors.text,
              }}
            >
              Ajustements liés à ton profil
            </Text>
            {result.profile_adjustments.map((a) => (
              <Text
                key={a}
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: Colors.textMuted,
                  lineHeight: 19,
                }}
              >
                • {a}
              </Text>
            ))}
          </GlassCard>
        </FadeIn>
      ) : null}

      {product.ingredients_raw ? (
        <FadeIn delay={820}>
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-SemiBold',
                fontSize: 16,
                color: Colors.text,
              }}
            >
              Ingrédients
            </Text>
            <IngredientsList ingredientsRaw={product.ingredients_raw} />
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={920}>
        <Pressable
          onPress={goToScanChoc}
          accessibilityRole="button"
          accessibilityLabel="Partager le scan"
          style={({ pressed }) => [
            styles.shareScanButton,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Share2 color={Colors.text} size={16} strokeWidth={2.2} />
          <Text style={styles.shareScanLabel}>Partager le scan</Text>
        </Pressable>
      </FadeIn>

      <FadeIn delay={940}>
        <ReportButton barcode={product.barcode} />
      </FadeIn>

      <FadeIn delay={980}>
        <SourceLink
          barcode={product.barcode}
          source="off"
          lastUpdated={product.off_last_updated ?? product.updated_at}
        />
      </FadeIn>
    </>
  );
}

const styles = StyleSheet.create({
  scoreHaloWrap: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreHalo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
  },
  methodologyLink: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  shockToast: {
    backgroundColor: 'rgba(244, 67, 54, 0.96)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 2,
    shadowColor: '#7F1D1D',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  shockToastTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  shockToastBody: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.92,
  },
  shareScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2EBE2',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  shareScanLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 0.2,
  },
});
