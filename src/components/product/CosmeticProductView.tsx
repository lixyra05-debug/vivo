import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { CosmeticResultView } from './CosmeticResultView';
import { ConfidenceBadge } from './ConfidenceBadge';
import { CompatibilityBanner } from './CompatibilityBanner';
import { ReportButton } from './ReportButton';
import { SourceLink } from './SourceLink';
import { PackagingSection } from './PackagingSection';
import { ConglomerateSection } from './ConglomerateSection';
import { EducationalCard } from '@/src/components/education/EducationalCard';
import { NaturalityBadge } from '@/src/components/naturality/NaturalityBadge';
import { Colors } from '@/src/constants/colors';
import type { PackagingComponent } from '@/src/data/packaging-risks';
import type { CosmeticProduct, CosmeticScoringResult } from '@/src/lib/api/types';
import type { getCosmeticConfidence } from '@/src/lib/api/confidence';
import type { checkCompatibility } from '@/src/lib/scoring/compatibility-engine';
import { getCosmeticVerificationStatus } from '@/src/lib/scoring/cosmetic-verification';
import type { EducationalCard as EducationalCardType } from '@/src/lib/gamification/types';

export interface CosmeticProductViewProps {
  product: CosmeticProduct;
  result: CosmeticScoringResult;
  confidence: ReturnType<typeof getCosmeticConfidence> | null;
  compatibilityResult: ReturnType<typeof checkCompatibility> | null;
  educationalCards: EducationalCardType[];
  packagings: PackagingComponent[];
  onPressMethodology: () => void;
}

export function CosmeticProductView({
  product,
  result,
  confidence,
  compatibilityResult,
  educationalCards,
  packagings,
  onPressMethodology,
}: CosmeticProductViewProps) {
  const router = useRouter();
  // S3-3 — sans ingrédient évalué, le 100 du moteur ne mesure rien : la fiche
  // n'en tire ni le vert de compatibilité, ni une carte qui commente la note.
  // `isCompatible` et `verificationStatus` (D11) gardent leur sens, et les
  // états « Incompatible » et « Vérification impossible » restent rendus.
  const evaluated = getCosmeticVerificationStatus(product) === 'verified';
  // L'état vert du bandeau : compatible ET vérifié (cf. CompatibilityBanner).
  const greenBanner =
    compatibilityResult?.isCompatible === true &&
    compatibilityResult.verificationStatus !== 'insufficient_data';
  const cards = evaluated
    ? educationalCards
    : educationalCards.filter((card) => card.trigger.type !== 'score');
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
      {product.ingredients_inci ? (
        <FadeIn delay={180}>
          <NaturalityBadge
            ingredientsList={product.ingredients_inci}
            onPressPlant={(plantId) => router.push(`/plants/${plantId}`)}
          />
        </FadeIn>
      ) : null}
      <FadeIn delay={200}>
        <PackagingSection packagings={packagings} />
      </FadeIn>
      <FadeIn delay={220}>
        <ConglomerateSection brandName={product.brand} />
      </FadeIn>
      {confidence ? (
        <FadeIn delay={120}>
          <View style={{ alignItems: 'center' }}>
            <ConfidenceBadge confidence={confidence} size="small" />
          </View>
        </FadeIn>
      ) : null}
      {compatibilityResult && (evaluated || !greenBanner) ? (
        <FadeIn delay={160}>
          <CompatibilityBanner result={compatibilityResult} />
        </FadeIn>
      ) : null}
      {cards.map((card, i) => (
        <FadeIn key={card.id} delay={260 + i * 120}>
          <EducationalCard card={card} />
        </FadeIn>
      ))}
      <FadeIn delay={260 + cards.length * 120}>
        <ReportButton barcode={product.barcode} />
      </FadeIn>
      <FadeIn delay={300 + cards.length * 120}>
        <SourceLink
          barcode={product.barcode}
          source="obf"
          lastUpdated={product.obf_last_updated ?? product.updated_at}
        />
      </FadeIn>
      <FadeIn delay={340 + cards.length * 120}>
        <Pressable
          onPress={() => Linking.openURL('https://world.openbeautyfacts.org')}
          accessibilityRole="link"
          accessibilityLabel="Ouvrir Open Beauty Facts"
          hitSlop={6}
        >
          <Text style={styles.attribution}>
            Données produit : © Open Beauty Facts contributors
          </Text>
        </Pressable>
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
  attribution: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.sageVivid,
    textAlign: 'center',
  },
});
