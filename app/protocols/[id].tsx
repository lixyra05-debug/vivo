/**
 * Détail d'un Protocole 21 jours.
 *
 * Sections (selon état) :
 *   • Header (emoji + titre + description)
 *   • Calendrier 21 jours (toujours visible, statuts dérivés)
 *   • "Aujourd'hui — Jour X" (si protocole actif sur cet id ET tier expert)
 *   • "Démarrer ce protocole" (si pas d'actif sur cet id)
 *   • "Progression" (si actif sur cet id)
 *   • Bouton "Abandonner" (si actif sur cet id)
 *   • Disclaimer médical
 *
 * Expert gate : si tier !== 'expert' → header + calendrier preview + paywall.
 */

import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { DayCircle, type DayCircleStatus } from '@/src/components/protocols/DayCircle';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProtocol } from '@/src/lib/protocols/use-protocol';
import { getProtocolById } from '@/src/data/protocols';
import { PLANT_ENCYCLOPEDIA } from '@/src/data/plant-encyclopedia';

const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const FEELING_EMOJIS = ['😫', '😕', '😐', '🙂', '😁'];

export default function ProtocolDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const {
    activeProtocol,
    completeToday,
    startProtocol,
    abandon,
  } = useProtocol();

  const protocol = id ? getProtocolById(id) : undefined;

  const isActiveOnThis =
    activeProtocol !== null && activeProtocol.protocolId === id;
  const otherActive =
    activeProtocol !== null && activeProtocol.protocolId !== id;

  const currentDay = activeProtocol?.currentDay ?? 0;
  const completedDays = activeProtocol?.completedDays ?? [];
  const feelings = activeProtocol?.feelings ?? {};

  const todayPlant = (() => {
    if (!isActiveOnThis || !protocol || currentDay < 1 || currentDay > 21) return null;
    const def = protocol.days[currentDay - 1];
    return PLANT_ENCYCLOPEDIA.find((p) => p.id === def.plantId) ?? null;
  })();
  const todayDef =
    isActiveOnThis && protocol && currentDay >= 1 && currentDay <= 21
      ? protocol.days[currentDay - 1]
      : null;

  const todayCompleted =
    isActiveOnThis && completedDays.includes(currentDay);

  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  async function handleCompleteDay() {
    if (selectedFeeling === null || todayCompleted) return;
    setBusy(true);
    try {
      await completeToday(selectedFeeling);
      setSelectedFeeling(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    if (!id) return;
    setBusy(true);
    try {
      await startProtocol(id);
    } finally {
      setBusy(false);
    }
  }

  function handleAbandonConfirm() {
    Alert.alert(
      'Abandonner le protocole ?',
      'Ta progression actuelle sera enregistrée dans ton historique.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Abandonner',
          style: 'destructive',
          onPress: () => {
            void abandon();
          },
        },
      ],
    );
  }

  if (!protocol) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, gap: 18 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backButton}
          >
            <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
          </Pressable>
          <View style={styles.center}>
            <Text style={styles.notFoundTitle}>Protocole introuvable</Text>
            <Text style={styles.notFoundText}>
              Ce protocole n'existe pas ou n'est plus disponible.
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const dayStatuses = computeDayStatuses({
    isActiveOnThis,
    currentDay,
    completedDays,
    feelings,
  });

  // Bien-être moyen sur les feelings enregistrés
  const feelingValues = Object.values(feelings);
  const avgFeeling =
    feelingValues.length > 0
      ? Math.round(
          (feelingValues.reduce((a, b) => a + b, 0) / feelingValues.length) *
            10,
        ) / 10
      : null;

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
          <View style={styles.header}>
            <Text style={styles.emojiXl}>{protocol.emoji}</Text>
            <Text style={styles.titleFr}>{protocol.titleFr}</Text>
            <Text style={styles.descriptionFr}>{protocol.descriptionFr}</Text>
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <GlassCard style={styles.calendarCard}>
            <Text style={styles.sectionTitle}>Calendrier 21 jours</Text>
            <View style={styles.weekLabels}>
              {WEEK_LABELS.map((label, idx) => (
                <Text key={`${label}-${idx}`} style={styles.weekLabel}>
                  {label}
                </Text>
              ))}
            </View>
            <View style={{ gap: 8 }}>
              {[0, 1, 2].map((row) => (
                <View key={row} style={styles.calendarRow}>
                  {[0, 1, 2, 3, 4, 5, 6].map((col) => {
                    const day = row * 7 + col + 1;
                    return (
                      <DayCircle
                        key={day}
                        day={day}
                        status={dayStatuses[day - 1]}
                        feeling={feelings[day]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </GlassCard>
        </FadeIn>

        {!isExpert ? (
          <FadeIn delay={200}>
            <PremiumPaywall
              featureKey="protocols_21days"
              onUpgrade={handleUpgrade}
            />
          </FadeIn>
        ) : null}

        {isExpert && isActiveOnThis && todayDef ? (
          <FadeIn delay={200}>
            <GlassCard style={styles.todayCard}>
              <Text style={styles.sectionTitle}>
                Aujourd'hui — Jour {currentDay}
              </Text>

              {todayPlant ? (
                <Pressable
                  onPress={() => router.push(`/plants/${todayPlant.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Voir la fiche ${todayPlant.nameFr}`}
                  style={({ pressed }) => [
                    styles.plantRow,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.plantEmoji}>{todayPlant.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.plantNameFr} numberOfLines={1}>
                      {todayPlant.nameFr}
                    </Text>
                    <Text style={styles.plantNameLatin} numberOfLines={1}>
                      {todayPlant.nameLatin}
                    </Text>
                  </View>
                </Pressable>
              ) : null}

              <View style={styles.recipeRow}>
                <Text style={styles.recipeIcon}>☕</Text>
                <Text style={styles.recipeText}>{todayDef.recipeFr}</Text>
              </View>

              <View style={styles.recipeRow}>
                <Text style={styles.recipeIcon}>💡</Text>
                <Text style={styles.recipeText}>{todayDef.tipFr}</Text>
              </View>

              <View style={styles.feelingsBlock}>
                <Text style={styles.feelingsLabel}>
                  Comment te sens-tu aujourd'hui ?
                </Text>
                <View style={styles.feelingsRow}>
                  {FEELING_EMOJIS.map((emoji, idx) => {
                    const value = idx + 1;
                    const persisted = feelings[currentDay];
                    const selected = todayCompleted
                      ? persisted === value
                      : selectedFeeling === value;
                    return (
                      <Pressable
                        key={value}
                        onPress={() => {
                          if (todayCompleted) return;
                          setSelectedFeeling(value);
                        }}
                        disabled={todayCompleted}
                        accessibilityRole="button"
                        accessibilityLabel={`Ressenti ${value} sur 5`}
                        accessibilityState={{ selected }}
                        style={[
                          styles.feelingPress,
                          selected && styles.feelingPressSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.feelingEmoji,
                            selected && styles.feelingEmojiSelected,
                          ]}
                        >
                          {emoji}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                onPress={handleCompleteDay}
                disabled={selectedFeeling === null || todayCompleted || busy}
                accessibilityRole="button"
                accessibilityLabel="Marquer le jour comme complété"
                accessibilityState={{
                  disabled: selectedFeeling === null || todayCompleted || busy,
                }}
                style={({ pressed }) => [
                  styles.completeButton,
                  (selectedFeeling === null || todayCompleted || busy) &&
                    styles.completeButtonDisabled,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.completeButtonText}>
                  {todayCompleted ? 'Jour déjà complété' : 'Jour complété ✅'}
                </Text>
              </Pressable>
            </GlassCard>
          </FadeIn>
        ) : null}

        {isExpert && !isActiveOnThis ? (
          <FadeIn delay={240}>
            <GlassCard style={styles.startCard}>
              <Text style={styles.sectionTitle}>Démarrer ce protocole</Text>
              {otherActive ? (
                <Text style={styles.warningText}>
                  Tu as déjà un protocole en cours. Démarrer celui-ci
                  remplacera ton protocole actuel.
                </Text>
              ) : (
                <Text style={styles.startDescription}>
                  21 jours, une plante par jour, une recette et un conseil.
                  Aucune obligation — tu peux abandonner à tout moment.
                </Text>
              )}
              <Pressable
                onPress={handleStart}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Démarrer le protocole"
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && { opacity: 0.85 },
                  busy && styles.completeButtonDisabled,
                ]}
              >
                <Text style={styles.completeButtonText}>
                  Démarrer le protocole 🌱
                </Text>
              </Pressable>
            </GlassCard>
          </FadeIn>
        ) : null}

        {isExpert && isActiveOnThis && feelingValues.length > 0 ? (
          <FadeIn delay={300}>
            <GlassCard style={styles.progressCard}>
              <Text style={styles.sectionTitle}>Progression</Text>
              {avgFeeling !== null ? (
                <Text style={styles.avgFeeling}>
                  Bien-être moyen : {avgFeeling}/5 ⭐
                </Text>
              ) : null}
              <View style={styles.miniBarRow}>
                {dayStatuses.map((status, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.miniBarCell,
                      { backgroundColor: miniBarColor(status) },
                    ]}
                  />
                ))}
              </View>
            </GlassCard>
          </FadeIn>
        ) : null}

        {isExpert && isActiveOnThis ? (
          <FadeIn delay={360}>
            <Pressable
              onPress={handleAbandonConfirm}
              accessibilityRole="button"
              accessibilityLabel="Abandonner le protocole"
              style={({ pressed }) => [
                styles.abandonButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.abandonText}>Abandonner</Text>
            </Pressable>
          </FadeIn>
        ) : null}

        <FadeIn delay={420}>
          <Text style={styles.disclaimer}>
            Ces informations sont fournies à titre éducatif. Elles ne remplacent
            pas un avis médical. Consultez un professionnel de santé.
          </Text>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}

interface ComputeStatusesArgs {
  isActiveOnThis: boolean;
  currentDay: number;
  completedDays: number[];
  feelings: Record<number, number>;
}

function computeDayStatuses(args: ComputeStatusesArgs): DayCircleStatus[] {
  const { isActiveOnThis, currentDay, completedDays, feelings } = args;
  const out: DayCircleStatus[] = [];
  for (let day = 1; day <= 21; day += 1) {
    if (!isActiveOnThis) {
      out.push('future');
      continue;
    }
    if (day < currentDay && completedDays.includes(day)) {
      const f = feelings[day] ?? 0;
      out.push(f >= 4 ? 'completed-good' : 'completed-ok');
    } else if (day === currentDay) {
      // Si le jour courant est complété, on l'affiche aussi comme completed
      if (completedDays.includes(day)) {
        const f = feelings[day] ?? 0;
        out.push(f >= 4 ? 'completed-good' : 'completed-ok');
      } else {
        out.push('today');
      }
    } else if (day > currentDay) {
      out.push('future');
    } else {
      out.push('missed');
    }
  }
  return out;
}

function miniBarColor(status: DayCircleStatus): string {
  switch (status) {
    case 'completed-good':
      return Colors.sage;
    case 'completed-ok':
      return 'rgba(139, 173, 139, 0.4)';
    case 'missed':
      return 'rgba(244, 67, 54, 0.3)';
    case 'today':
    case 'future':
    default:
      return Colors.cream;
  }
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 60,
  },
  notFoundTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
  },
  notFoundText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  emojiXl: {
    fontSize: 48,
    lineHeight: 56,
  },
  titleFr: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 24,
    color: Colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  descriptionFr: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  calendarCard: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: 8,
  },
  weekLabel: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  todayCard: {
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(139, 173, 139, 0.08)',
    borderColor: 'rgba(139, 173, 139, 0.32)',
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  plantEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  plantNameFr: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  plantNameLatin: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontSize: 12,
    color: Colors.textMuted,
  },
  recipeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  recipeIcon: {
    fontSize: 18,
    lineHeight: 24,
  },
  recipeText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
  },
  feelingsBlock: {
    gap: 8,
    marginTop: 4,
  },
  feelingsLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },
  feelingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  feelingPress: {
    padding: 6,
    borderRadius: 999,
  },
  feelingPressSelected: {
    backgroundColor: 'rgba(139, 173, 139, 0.2)',
  },
  feelingEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  feelingEmojiSelected: {
    transform: [{ scale: 1.3 }],
  },
  completeButton: {
    backgroundColor: Colors.sage,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  startCard: {
    padding: 16,
    gap: 12,
  },
  startDescription: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textMuted,
  },
  warningText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
    color: '#B5311E',
  },
  startButton: {
    backgroundColor: Colors.sage,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    padding: 16,
    gap: 12,
  },
  avgFeeling: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  miniBarRow: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    gap: 1,
  },
  miniBarCell: {
    flex: 1,
    height: '100%',
  },
  abandonButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  abandonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.score.red,
    opacity: 0.7,
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
