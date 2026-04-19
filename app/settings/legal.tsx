import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react-native';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Colors } from '@/src/constants/colors';

interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          fontFamily: 'BricolageGrotesque-SemiBold',
          fontSize: 18,
          color: Colors.text,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function Paragraph({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: 'Inter',
        fontSize: 14,
        color: Colors.text,
        lineHeight: 22,
      }}
    >
      {children}
    </Text>
  );
}

export default function LegalScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 22 }}>
        <FadeIn delay={0}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={styles.backButton}
            >
              <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
            </Pressable>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 22,
                color: Colors.text,
                letterSpacing: -0.4,
                flex: 1,
              }}
            >
              Mentions légales
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <GlassCard
            tone="info"
            style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}
          >
            <View style={styles.warningIconWrap}>
              <AlertTriangle color="#B58900" size={20} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text
                style={{
                  fontFamily: 'BricolageGrotesque-SemiBold',
                  fontSize: 15,
                  color: Colors.text,
                }}
              >
                Avertissement santé
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: Colors.textMuted,
                  lineHeight: 20,
                }}
              >
                Vivo fournit des informations nutritionnelles à titre indicatif uniquement. Les
                scores et analyses ne constituent en aucun cas un avis médical, un diagnostic ou
                une recommandation de traitement. Consulte un professionnel de santé pour toute
                question médicale.
              </Text>
            </View>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={160}>
          <Section title="Conditions générales d'utilisation">
            <Paragraph>
              En utilisant Vivo, tu acceptes que le service est fourni « en l'état ». LYXIRIA
              ne garantit pas l'exactitude ou l'exhaustivité des données nutritionnelles
              provenant d'Open Food Facts, une base collaborative.
            </Paragraph>
            <Paragraph>
              Le score Vivo est calculé selon un algorithme de pénalités toxicologiques basé sur
              des études scientifiques publiées. Il ne remplace pas le jugement d'un
              professionnel de santé.
            </Paragraph>
            <Paragraph>
              Le scan de produits est gratuit et illimité. Les fonctionnalités premium
              (Smart Swaps, historique illimité, comparateur) sont soumises à un abonnement
              payant.
            </Paragraph>
          </Section>
        </FadeIn>

        <FadeIn delay={240}>
          <Section title="Données personnelles">
            <Paragraph>
              Vivo collecte uniquement les données nécessaires au fonctionnement du service :
              adresse email, profil santé, historique de scans. Ces données sont stockées sur
              Supabase (région EU — Irlande) et ne sont jamais partagées avec des tiers à des
              fins commerciales.
            </Paragraph>
            <Paragraph>
              Conformément au RGPD, tu disposes d'un droit d'accès, de rectification et de
              suppression de tes données. Contacte contact@lyxiria.com pour exercer ces droits.
            </Paragraph>
          </Section>
        </FadeIn>

        <FadeIn delay={320}>
          <Section title="Données nutritionnelles">
            <Paragraph>
              Les données produits proviennent d'Open Food Facts, une base de données libre et
              collaborative sous licence ODbL. Vivo n'est pas affiliée à Open Food Facts.
            </Paragraph>
          </Section>
        </FadeIn>

        <FadeIn delay={400}>
          <Section title="Éditeur">
            <Paragraph>
              LYXIRIA — Hector Volant{'\n'}Contact : contact@lyxiria.com
            </Paragraph>
          </Section>
        </FadeIn>

        <FadeIn delay={480}>
          <SecondaryButton
            label="Politique de confidentialité"
            onPress={() => {
              void Linking.openURL('https://lyxiria.com/privacy');
            }}
            icon={<ExternalLink color={Colors.textMuted} size={18} strokeWidth={2.2} />}
            accessibilityHint="Ouvre la politique dans le navigateur"
          />
        </FadeIn>

        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            color: Colors.textMuted,
            textAlign: 'center',
            opacity: 0.7,
            marginTop: 4,
          }}
        >
          Vivo v1.0.0 — LYXIRIA © 2026
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    shadowColor: '#587858',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  warningIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 193, 7, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
