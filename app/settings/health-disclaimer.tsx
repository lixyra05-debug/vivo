import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';
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
    <GlassCard style={{ padding: 18, gap: 10 }}>
      <Text
        style={{
          fontFamily: 'BricolageGrotesque-SemiBold',
          fontSize: 17,
          color: Colors.text,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
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
    </GlassCard>
  );
}

export default function HealthDisclaimerScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 18 }}>
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
              Avertissements santé
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <GlassCard
            tone="info"
            style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}
          >
            <View style={styles.warningIconWrap}>
              <ShieldAlert color="#B58900" size={20} strokeWidth={2.2} />
            </View>
            <Text
              style={{
                flex: 1,
                fontFamily: 'Inter',
                fontSize: 13,
                color: Colors.textMuted,
                lineHeight: 20,
              }}
            >
              Ces informations sont importantes pour ta sécurité. Prends le
              temps de les lire.
            </Text>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={160}>
          <Section title="Information générale">
            Vivo est un outil de bien-être et d'information nutritionnelle. Il
            ne fournit pas de conseil médical, de diagnostic ou de traitement et
            n'est pas un dispositif médical au sens du Règlement (UE) 2017/745.
          </Section>
        </FadeIn>

        <FadeIn delay={240}>
          <Section title="Score Vivo">
            Le score Vivo (0-100) est calculé selon une méthodologie
            propriétaire basée sur les additifs, le niveau de transformation
            (NOVA), et les ingrédients controversés. Ce score est purement
            informatif et ne constitue ni un avis médical ni une recommandation
            nutritionnelle individualisée. La méthodologie complète est
            consultable dans la section « Comment ce score est calculé ? ».
          </Section>
        </FadeIn>

        <FadeIn delay={320}>
          <Section title="Plantes et protocoles bien-être">
            Les informations sur les plantes médicinales et les protocoles
            bien-être ont une visée éducative. Elles ne sont pas destinées à
            diagnostiquer, traiter, guérir ou prévenir une maladie. Certaines
            plantes peuvent interagir avec des médicaments ou être
            contre-indiquées. Demandez toujours l'avis de votre médecin ou
            pharmacien avant d'utiliser des plantes à des fins thérapeutiques.
          </Section>
        </FadeIn>

        <FadeIn delay={400}>
          <Section title="Consultez un professionnel">
            Utilisez toujours Vivo en complément, et non à la place, d'un avis
            médical. Avant toute décision ayant un impact sur votre santé,
            consultez un médecin, un pharmacien ou un diététicien-nutritionniste.
          </Section>
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
