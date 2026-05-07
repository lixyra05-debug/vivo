/**
 * Liste des Protocoles 21 jours (tier Expert).
 *
 * Pattern Expert gate :
 *   • free / premium : 1ère card preview (opacity normale) + 4 autres lockées + paywall
 *   • expert         : toutes les cards visibles, état actif/désactivé selon protocole en cours
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ProtocolCard } from '@/src/components/protocols/ProtocolCard';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProtocol } from '@/src/lib/protocols/use-protocol';
import { PROTOCOLS, getProtocolById } from '@/src/data/protocols';

export default function ProtocolsListScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const { activeProtocol } = useProtocol();
  const activeId = activeProtocol?.protocolId ?? null;
  const activeDef = activeId ? getProtocolById(activeId) ?? null : null;
  const activeCurrentDay = activeProtocol?.currentDay ?? 0;
  const progressPct = Math.max(
    0,
    Math.min(100, (activeCurrentDay / 21) * 100),
  );

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  function handleProtocolPress(id: string) {
    router.push(`/protocols/${id}`);
  }

  // En mode non-expert : preview de la 1ère card + reste verrouillé
  const previewProtocols = isExpert ? PROTOCOLS : PROTOCOLS.slice(0, 1);
  const lockedProtocols = isExpert ? [] : PROTOCOLS.slice(1);

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 18 }}>
        <FadeIn delay={0}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backButton}
          >
            <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
          </Pressable>
        </FadeIn>

        <FadeIn delay={60}>
          <View style={{ gap: 4 }}>
            <Text style={styles.title}>🌿 Protocoles 21 jours</Text>
            <Text style={styles.subtitle}>
              5 programmes guidés sourcés EMA
            </Text>
          </View>
        </FadeIn>

        {isExpert && activeProtocol && activeDef ? (
          <FadeIn delay={120}>
            <GlassCard style={styles.activeHighlight}>
              <View style={styles.activeHeader}>
                <Text style={styles.activeEmoji}>{activeDef.emoji}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.activeTitle} numberOfLines={1}>
                    {activeDef.titleFr}
                  </Text>
                  <Text style={styles.activeSubtitle}>
                    Jour {activeCurrentDay}/21
                  </Text>
                </View>
              </View>
              <View style={styles.progressOuter}>
                <View
                  style={[styles.progressInner, { width: `${progressPct}%` }]}
                />
              </View>
              <Pressable
                onPress={() => handleProtocolPress(activeProtocol.protocolId)}
                accessibilityRole="button"
                accessibilityLabel="Continuer mon protocole"
                style={({ pressed }) => [
                  styles.continueRow,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.continueText}>Continuer</Text>
                <ChevronRight color={Colors.sage} size={16} strokeWidth={2.4} />
              </Pressable>
            </GlassCard>
          </FadeIn>
        ) : null}

        <View style={{ gap: 12 }}>
          {previewProtocols.map((p, index) => {
            const isActiveCard = activeId === p.id;
            const isDisabledCard = activeId !== null && !isActiveCard;
            return (
              <FadeIn key={p.id} delay={Math.min(180 + index * 80, 540)}>
                <ProtocolCard
                  protocol={p}
                  isActive={isActiveCard}
                  isDisabled={isDisabledCard && isExpert}
                  progress={isActiveCard ? activeProtocol : null}
                  onPress={() => handleProtocolPress(p.id)}
                />
              </FadeIn>
            );
          })}

          {lockedProtocols.length > 0 ? (
            <View
              style={{ gap: 12, opacity: 0.25 }}
              pointerEvents="none"
            >
              {lockedProtocols.map((p) => (
                <ProtocolCard
                  key={p.id}
                  protocol={p}
                  onPress={() => undefined}
                />
              ))}
            </View>
          ) : null}
        </View>

        {!isExpert ? (
          <FadeIn delay={420}>
            <PremiumPaywall
              featureKey="protocols_21days"
              onUpgrade={handleUpgrade}
            />
          </FadeIn>
        ) : null}

        <FadeIn delay={500}>
          <Text style={styles.disclaimer}>
            Ces informations sont fournies à titre éducatif. Elles ne remplacent
            pas un avis médical. Consultez un professionnel de santé.
          </Text>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
  },
  activeHighlight: {
    padding: 16,
    gap: 12,
    borderColor: 'rgba(139, 173, 139, 0.45)',
    borderWidth: 2,
    backgroundColor: 'rgba(139, 173, 139, 0.08)',
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  activeTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  activeSubtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.sage,
  },
  progressOuter: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    backgroundColor: Colors.sage,
    borderRadius: 4,
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  continueText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.sage,
  },
  disclaimer: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
