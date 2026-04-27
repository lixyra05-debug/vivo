import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { CosmeticResultView } from './CosmeticResultView';
import { ConfidenceBadge } from './ConfidenceBadge';
import { CompatibilityBanner } from './CompatibilityBanner';
import { ReportButton } from './ReportButton';
import { SourceLink } from './SourceLink';
import { EducationalCard } from '@/src/components/education/EducationalCard';
import { Colors } from '@/src/constants/colors';
import type { CosmeticProduct, CosmeticScoringResult } from '@/src/lib/api/types';
import type { getCosmeticConfidence } from '@/src/lib/api/confidence';
import type { checkCompatibility } from '@/src/lib/scoring/compatibility-engine';
import type { EducationalCard as EducationalCardType } from '@/src/lib/gamification/types';

export interface CosmeticProductViewProps {
  product: CosmeticProduct;
  result: CosmeticScoringResult;
  confidence: ReturnType<typeof getCosmeticConfidence> | null;
  compatibilityResult: ReturnType<typeof checkCompatibility> | null;
  educationalCards: EducationalCardType[];
  onPressMethodology: () => void;
}

export function CosmeticProductView({
  product,
  result,
  confidence,
  compatibilityResult,
  educationalCards,
  onPressMethodology,
}: CosmeticProductViewProps) {
  return (
    <>
      <CosmeticResultView product={product} result={result} profile="standard" />
      <FadeIn delay={80}>
        <View style={{ alignItems: 'center' }}>
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
      {confidence ? (
        <FadeIn delay={120}>
          <View style={{ alignItems: 'center' }}>
            <ConfidenceBadge confidence={confidence} size="small" />
          </View>
        </FadeIn>
      ) : null}
      {compatibilityResult ? (
        <FadeIn delay={160}>
          <CompatibilityBanner result={compatibilityResult} />
        </FadeIn>
      ) : null}
      {educationalCards.map((card, i) => (
        <FadeIn key={card.id} delay={200 + i * 120}>
          <EducationalCard card={card} />
        </FadeIn>
      ))}
      <FadeIn delay={200 + educationalCards.length * 120}>
        <ReportButton barcode={product.barcode} />
      </FadeIn>
      <FadeIn delay={240 + educationalCards.length * 120}>
        <SourceLink
          barcode={product.barcode}
          source="obf"
          lastUpdated={product.obf_last_updated ?? product.updated_at}
        />
      </FadeIn>
    </>
  );
}

const styles = StyleSheet.create({
  methodologyLink: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});
