import { Linking, Pressable, Text, View } from 'react-native';
import { ExternalLink, RotateCw } from 'lucide-react-native';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SearchNotFound } from '@/src/components/illustrations/SearchNotFound';
import { Colors } from '@/src/constants/colors';

interface ProductNotFoundProps {
  barcode?: string;
  onRetry: () => void;
  onBack: () => void;
}

export function ProductNotFound({ barcode, onRetry, onBack }: ProductNotFoundProps) {
  function openOpenFoodFacts() {
    void Linking.openURL(
      `https://world.openfoodfacts.org/cgi/product.pl?code=${barcode ?? ''}&action=display`,
    );
  }

  return (
    <ScreenContainer scroll>
      <View style={{ flex: 1, justifyContent: 'center', gap: 24, paddingVertical: 24 }}>
        <FadeIn delay={0}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <SearchNotFound size={148} />
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <View style={{ alignItems: 'center', gap: 10, maxWidth: 340, alignSelf: 'center' }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 26,
                color: Colors.text,
                textAlign: 'center',
                letterSpacing: -0.5,
              }}
            >
              Produit introuvable
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 15,
                color: Colors.textMuted,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              Le code-barres {barcode ?? ''} n'est pas encore référencé sur Open Food Facts. Tu
              peux l'ajouter en quelques secondes pour aider la communauté.
            </Text>
          </View>
        </FadeIn>

        <View style={{ gap: 12, marginTop: 8 }}>
          <FadeIn delay={260}>
            <PrimaryCTA
              label="Contribuer sur Open Food Facts"
              onPress={openOpenFoodFacts}
              icon={<ExternalLink color="#FFFFFF" size={18} strokeWidth={2.2} />}
              accessibilityHint="Ouvre la fiche de contribution Open Food Facts"
            />
          </FadeIn>

          <FadeIn delay={340}>
            <SecondaryButton
              label="Réessayer"
              onPress={onRetry}
              icon={<RotateCw color={Colors.textMuted} size={18} strokeWidth={2.2} />}
              accessibilityHint="Recharge la fiche produit"
            />
          </FadeIn>

          <FadeIn delay={420}>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Revenir en arrière"
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 14,
                  color: Colors.textMuted,
                  textDecorationLine: 'underline',
                }}
              >
                Scanner un autre code
              </Text>
            </Pressable>
          </FadeIn>
        </View>
      </View>
    </ScreenContainer>
  );
}
