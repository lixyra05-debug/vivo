/**
 * Écran résultat OCR — affiche l'analyse Claude Vision.
 *
 * Sections (FadeIn cascade) :
 *   1. Header back + titre
 *   2. Score circle + chip productType
 *   3. Summary
 *   4. Concerns (warning) — si non vide
 *   5. Positives (success) — si non vide
 *   6. Ingredients chips (tap → Alert avec reason)
 *   7. Disclaimer R6
 *   8. Actions (rescan + share via ShareableCard)
 */

import { useEffect, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ScanLine,
} from 'lucide-react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { ShareableCard } from '@/src/components/premium/ShareableCard';
import { Colors, scoreColor } from '@/src/constants/colors';
import { useOcrSessionStore } from '@/src/lib/stores/useOcrSessionStore';
import type {
  OcrAnalysisResult,
  OcrIngredient,
  OcrRiskLevel,
} from '@/src/types/ocr-analysis';

const DISCLAIMER =
  "Cette analyse est indicative. Consulte l'emballage pour les informations officielles. En cas de doute médical, consulte un professionnel de santé.";

interface RiskStyle {
  bg: string;
  text: string;
}

const RISK_STYLES: Record<OcrRiskLevel, RiskStyle> = {
  safe: { bg: 'rgba(76,175,80,0.14)', text: '#2E7D32' },
  caution: { bg: 'rgba(255,152,0,0.16)', text: '#B96B00' },
  avoid: { bg: 'rgba(244,67,54,0.14)', text: '#B5311E' },
};

export default function OcrResultScreen() {
  const router = useRouter();
  const result = useOcrSessionStore((s) => s.result);
  const clear = useOcrSessionStore((s) => s.clear);

  // Redirect home if no result in store
  useEffect(() => {
    if (!result) {
      router.replace('/(tabs)/scan');
    }
  }, [result, router]);

  if (!result) {
    return null;
  }

  return <OcrResultContent result={result} onScanAgain={() => {
    clear();
    router.replace('/(tabs)/scan');
  }} onBack={() => router.back()} />;
}

interface OcrResultContentProps {
  result: OcrAnalysisResult;
  onScanAgain: () => void;
  onBack: () => void;
}

function OcrResultContent({ result, onScanAgain, onBack }: OcrResultContentProps) {
  // Même échelle que le reste de l'app (70 / 50 / 25). L'écran avait la
  // sienne (75 / 50 / 30) : un 72 s'affichait en jaune ici et en vert sur une
  // fiche produit, pour une valeur identique.
  const scoreHex = useMemo(() => scoreColor(result.score), [result.score]);
  const productLabel = result.productType === 'cosmetic' ? '🧴 Cosmétique' : '🥗 Aliment';

  function handleIngredientPress(ing: OcrIngredient) {
    Alert.alert(ing.name, ing.reason);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={({ pressed }) => [
                styles.headerBack,
                pressed && { opacity: 0.7 },
              ]}
            >
              <ChevronLeft color={Colors.text} size={26} strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.headerTitle}>Analyse de l'étiquette</Text>
            <View style={styles.headerSpacer} />
          </View>
        </FadeIn>

        {/* Score + product type */}
        <FadeIn delay={80}>
          <View style={styles.scoreWrap}>
            <View
              style={[
                styles.scoreCircle,
                { borderColor: scoreHex, backgroundColor: `${scoreHex}14` },
              ]}
            >
              <Text style={[styles.scoreValue, { color: scoreHex }]}>
                {result.score}
              </Text>
              <Text style={styles.scoreUnit}>/100</Text>
            </View>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{productLabel}</Text>
            </View>
          </View>
        </FadeIn>

        {/* Summary */}
        <FadeIn delay={160}>
          <Text style={styles.summary}>{result.summary}</Text>
        </FadeIn>

        {/* Concerns */}
        {result.concerns.length > 0 ? (
          <FadeIn delay={240}>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <AlertTriangle color="#FF9800" size={20} strokeWidth={2.2} />
                <Text style={styles.sectionTitle}>Points d'attention</Text>
              </View>
              <View style={styles.bulletList}>
                {result.concerns.map((concern, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: '#FF9800' }]}>•</Text>
                    <Text style={styles.bulletText}>{concern}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </FadeIn>
        ) : null}

        {/* Positives */}
        {result.positives.length > 0 ? (
          <FadeIn delay={320}>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <CheckCircle2 color="#4CAF50" size={20} strokeWidth={2.2} />
                <Text style={styles.sectionTitle}>Points favorables</Text>
              </View>
              <View style={styles.bulletList}>
                {result.positives.map((positive, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: '#4CAF50' }]}>•</Text>
                    <Text style={styles.bulletText}>{positive}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </FadeIn>
        ) : null}

        {/* Ingredients */}
        {result.ingredients.length > 0 ? (
          <FadeIn delay={400}>
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionTitleStandalone}>Ingrédients analysés</Text>
              <View style={styles.chipsWrap}>
                {result.ingredients.map((ing, idx) => {
                  const style = RISK_STYLES[ing.riskLevel];
                  return (
                    <Pressable
                      key={`${ing.name}-${idx}`}
                      onPress={() => handleIngredientPress(ing)}
                      accessibilityRole="button"
                      accessibilityLabel={`${ing.name} — ${ing.reason}`}
                      style={({ pressed }) => [
                        styles.chip,
                        { backgroundColor: style.bg },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: style.text }]}>
                        {ing.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </FadeIn>
        ) : null}

        {/* Disclaimer */}
        <FadeIn delay={480}>
          <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
        </FadeIn>

        {/* Actions */}
        <FadeIn delay={560}>
          <View style={styles.actionsWrap}>
            <PrimaryCTA
              label="Scanner une autre étiquette"
              onPress={onScanAgain}
              icon={<ScanLine color="#FFFFFF" size={18} strokeWidth={2.2} />}
              accessibilityHint="Retour à l'écran de scan"
            />

            <ShareableCard filename={`vivo-analyse-${result.score}`}>
              <View style={styles.shareCard}>
                <View
                  style={[
                    styles.shareScoreCircle,
                    { borderColor: scoreHex, backgroundColor: `${scoreHex}14` },
                  ]}
                >
                  <Text style={[styles.shareScoreValue, { color: scoreHex }]}>
                    {result.score}
                  </Text>
                  <Text style={styles.shareScoreUnit}>/100</Text>
                </View>
                <Text style={styles.shareSummary} numberOfLines={4}>
                  {result.summary}
                </Text>
                {result.concerns.length > 0 ? (
                  <View style={styles.shareBullets}>
                    {result.concerns.slice(0, 3).map((concern, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Text style={[styles.bulletDot, { color: '#FF9800' }]}>•</Text>
                        <Text style={styles.shareBulletText} numberOfLines={2}>
                          {concern}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <View style={styles.shareSignature}>
                  <Text style={styles.shareSignatureBrand}>Vivo</Text>
                  <Text style={styles.shareSignatureTagline}>
                    Scan tes courses sur Vivo
                  </Text>
                </View>
              </View>
            </ShareableCard>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBack: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  headerSpacer: { width: 44 },
  scoreWrap: {
    alignItems: 'center',
    gap: 12,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.6,
  },
  scoreUnit: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(139,173,139,0.12)',
  },
  typeChipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.sage,
    letterSpacing: 0.2,
  },
  summary: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  sectionCard: {
    padding: 18,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
    letterSpacing: 0.2,
  },
  sectionTitleStandalone: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
    letterSpacing: 0.2,
    paddingHorizontal: 4,
  },
  bulletList: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 0.1,
  },
  disclaimer: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    paddingHorizontal: 4,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionsWrap: {
    gap: 12,
    marginTop: 8,
  },

  // Shareable layout
  shareCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
    alignItems: 'center',
  },
  shareScoreCircle: {
    width: 96,
    height: 96,
    borderRadius: 999,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareScoreValue: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  shareScoreUnit: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
  shareSummary: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  shareBullets: {
    width: '100%',
    gap: 6,
  },
  shareBulletText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
  },
  shareSignature: {
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  shareSignatureBrand: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 18,
    color: Colors.sage,
    letterSpacing: 0.4,
  },
  shareSignatureTagline: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
});
