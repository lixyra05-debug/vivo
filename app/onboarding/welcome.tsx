import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { BlobSvgFallback } from '@/src/components/home/BlobSvgFallback';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Colors } from '@/src/constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View className="flex-1 justify-between" style={{ paddingVertical: 12 }}>
        <View className="flex-1 items-center justify-center" style={{ gap: 32 }}>
          <FadeIn delay={0}>
            <BlobSvgFallback size={220} />
          </FadeIn>

          <FadeIn delay={180}>
            <View className="items-center" style={{ gap: 6 }}>
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-Bold',
                  fontSize: 36,
                  color: Colors.text,
                  letterSpacing: -1,
                }}
              >
                Scannez.
              </Text>
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-Bold',
                  fontSize: 36,
                  color: Colors.text,
                  letterSpacing: -1,
                }}
              >
                Comprenez.
              </Text>
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-Bold',
                  fontSize: 36,
                  color: Colors.sage,
                  letterSpacing: -1,
                }}
              >
                Choisissez.
              </Text>
            </View>
          </FadeIn>

          <FadeIn delay={340}>
            <Text
              className="text-center"
              style={{
                fontFamily: 'Inter',
                fontSize: 15,
                color: Colors.textMuted,
                lineHeight: 22,
                maxWidth: 320,
              }}
            >
              Un score sur 100 basé sur la toxicologie réelle des ingrédients — pas sur le Nutri-Score.
            </Text>
          </FadeIn>
        </View>

        <FadeIn delay={460}>
          <PrimaryCTA
            label="Commencer"
            onPress={() => router.push('/onboarding/health-profile')}
            icon={<ArrowRight color="#FFFFFF" size={18} strokeWidth={2.2} />}
            accessibilityHint="Passe à l'étape suivante"
          />
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}
