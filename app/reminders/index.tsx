/**
 * Mes Rappels 💊 — gestion des cures de plantes (tier Expert).
 *
 * Stockage : AsyncStorage (R10) via `reminder-store`. Une cure = plante +
 * durée (7/14/21/30 jours) avec marquage quotidien dédupliqué par YYYY-MM-DD.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Plus, Trash2, X } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import {
  createReminder,
  deleteReminder,
  getReminders,
  markTodayDone,
  type CureDuration,
  type CureReminder,
} from '@/src/lib/reminders/reminder-store';
import {
  PLANT_ENCYCLOPEDIA,
  getPlantById,
} from '@/src/data/plant-encyclopedia';

const PLANT_PICKER_LIMIT = 20;
const DURATIONS: CureDuration[] = [7, 14, 21, 30];

function isMarkedToday(reminder: CureReminder): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return reminder.markedDays.includes(today);
}

function getStatusLabel(reminder: CureReminder): { label: string; color: string; bg: string } {
  if (reminder.status === 'completed') {
    return {
      label: 'TERMINÉE',
      color: Colors.earth,
      bg: 'rgba(196, 168, 130, 0.20)',
    };
  }
  if (reminder.status === 'abandoned') {
    return {
      label: 'ABANDONNÉE',
      color: Colors.textMuted,
      bg: 'rgba(88, 120, 88, 0.10)',
    };
  }
  return {
    label: 'ACTIVE',
    color: Colors.sage,
    bg: 'rgba(139, 173, 139, 0.16)',
  };
}

export default function RemindersScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const [reminders, setReminders] = useState<CureReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    const data = await getReminders();
    setReminders(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isExpert) {
      setIsLoading(false);
      return;
    }
    refresh();
  }, [isExpert, refresh]);

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  async function handleCreate(plantId: string, duration: CureDuration) {
    await createReminder(plantId, duration);
    setCreateModalOpen(false);
    await refresh();
  }

  async function handleMarkDone(reminderId: string) {
    await markTodayDone(reminderId);
    await refresh();
  }

  function handleDelete(reminderId: string, plantName: string) {
    Alert.alert(
      'Supprimer cette cure ?',
      `La cure de ${plantName} sera supprimée définitivement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteReminder(reminderId);
            await refresh();
          },
        },
      ],
    );
  }

  // ─── Free / Premium → paywall ──────────────────────────────────────────
  if (!isExpert) {
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
              <Text style={styles.title}>Mes Rappels 💊</Text>
              <Text style={styles.subtitle}>Suivi de tes cures de plantes</Text>
            </View>
          </FadeIn>

          <FadeIn delay={120}>
            <PremiumPaywall
              featureKey="cure_reminders"
              onUpgrade={handleUpgrade}
            />
          </FadeIn>

          <FadeIn delay={200}>
            <Text style={styles.disclaimer}>
              Ces informations sont fournies à titre éducatif. Elles ne
              remplacent pas un avis médical. Consultez un professionnel de
              santé.
            </Text>
          </FadeIn>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Expert ───────────────────────────────────────────────────────────
  return (
    <ScreenContainer scroll>
      <View style={{ gap: 18 }}>
        <FadeIn delay={0}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={styles.backButton}
            >
              <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              onPress={() => setCreateModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Créer un nouveau rappel"
              style={({ pressed }) => [
                styles.addButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Plus color="#FFFFFF" size={18} strokeWidth={2.6} />
              <Text style={styles.addButtonText}>Nouvelle cure</Text>
            </Pressable>
          </View>
        </FadeIn>

        <FadeIn delay={60}>
          <View style={{ gap: 4 }}>
            <Text style={styles.title}>Mes Rappels 💊</Text>
            <Text style={styles.subtitle}>Suivi de tes cures de plantes</Text>
          </View>
        </FadeIn>

        {!isLoading && reminders.length === 0 ? (
          <FadeIn delay={120}>
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aucune cure en cours.</Text>
              <Text style={styles.emptyBody}>
                Crée ton premier rappel pour suivre une cure.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Créer un rappel"
                onPress={() => setCreateModalOpen(true)}
                style={({ pressed }) => [
                  styles.ctaSage,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.ctaSageText}>Créer un rappel</Text>
              </Pressable>
            </GlassCard>
          </FadeIn>
        ) : null}

        {reminders.map((reminder, index) => (
          <FadeIn
            key={reminder.id}
            delay={Math.min(120 + index * 60, 480)}
          >
            <ReminderCard
              reminder={reminder}
              onMarkDone={() => handleMarkDone(reminder.id)}
              onDelete={(name) => handleDelete(reminder.id, name)}
            />
          </FadeIn>
        ))}

        <FadeIn delay={520}>
          <Text style={styles.disclaimer}>
            Ces informations sont fournies à titre éducatif. Elles ne
            remplacent pas un avis médical. Consultez un professionnel de
            santé.
          </Text>
        </FadeIn>
      </View>

      <CreateReminderModal
        visible={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </ScreenContainer>
  );
}

interface ReminderCardProps {
  reminder: CureReminder;
  onMarkDone: () => void;
  onDelete: (plantName: string) => void;
}

function ReminderCard({ reminder, onMarkDone, onDelete }: ReminderCardProps) {
  const plant = getPlantById(reminder.plantId);
  const plantName = plant?.nameFr ?? 'Plante';
  const emoji = plant?.emoji ?? '🌿';
  const completedDays = reminder.markedDays.length;
  const progressPct = Math.max(
    0,
    Math.min(100, (completedDays / reminder.durationDays) * 100),
  );
  const status = getStatusLabel(reminder);
  const markedToday = isMarkedToday(reminder);
  const isActive = reminder.status === 'active';

  return (
    <GlassCard style={styles.reminderCard}>
      <View style={styles.reminderHeader}>
        <Text style={styles.reminderEmoji}>{emoji}</Text>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.reminderName} numberOfLines={1}>
            {plantName}
          </Text>
          <Text style={styles.reminderProgress}>
            Jour {completedDays}/{reminder.durationDays}
          </Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: status.bg }]}
        >
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.progressOuter}>
        <View
          style={[styles.progressInner, { width: `${progressPct}%` }]}
        />
      </View>

      <View style={styles.reminderActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            markedToday ? 'Déjà pris aujourd\'hui' : 'Marquer comme pris'
          }
          accessibilityState={{ disabled: !isActive || markedToday }}
          disabled={!isActive || markedToday}
          onPress={onMarkDone}
          style={({ pressed }) => [
            styles.markBtn,
            (!isActive || markedToday) && styles.markBtnDisabled,
            pressed && isActive && !markedToday && { opacity: 0.85 },
          ]}
        >
          <Check color="#FFFFFF" size={14} strokeWidth={2.6} />
          <Text style={styles.markBtnText}>
            {markedToday ? 'Pris ✅' : 'Marquer pris'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Supprimer la cure de ${plantName}`}
          onPress={() => onDelete(plantName)}
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Trash2 color={Colors.score.red} size={14} strokeWidth={2.4} />
        </Pressable>
      </View>
    </GlassCard>
  );
}

interface CreateReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (plantId: string, duration: CureDuration) => void;
}

function CreateReminderModal({
  visible,
  onClose,
  onCreate,
}: CreateReminderModalProps) {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<CureDuration>(21);

  const plants = useMemo(
    () => PLANT_ENCYCLOPEDIA.slice(0, PLANT_PICKER_LIMIT),
    [],
  );

  function reset() {
    setSelectedPlantId(null);
    setSelectedDuration(21);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    if (!selectedPlantId) return;
    onCreate(selectedPlantId, selectedDuration);
    reset();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvelle cure</Text>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <X color={Colors.textMuted} size={18} strokeWidth={2.4} />
            </Pressable>
          </View>

          <Text style={styles.modalLabel}>Choisis une plante</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plantPickerRow}
          >
            {plants.map((p) => {
              const active = p.id === selectedPlantId;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Choisir ${p.nameFr}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelectedPlantId(p.id)}
                  style={({ pressed }) => [
                    styles.plantChip,
                    active && styles.plantChipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.plantChipEmoji}>{p.emoji}</Text>
                  <Text
                    style={[
                      styles.plantChipName,
                      active && styles.plantChipNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {p.nameFr}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.modalLabel}>Durée</Text>
          <View style={styles.durationsRow}>
            {DURATIONS.map((d) => {
              const active = d === selectedDuration;
              return (
                <Pressable
                  key={d}
                  accessibilityRole="button"
                  accessibilityLabel={`${d} jours`}
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelectedDuration(d)}
                  style={({ pressed }) => [
                    styles.durationBtn,
                    active && styles.durationBtnActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      styles.durationText,
                      active && styles.durationTextActive,
                    ]}
                  >
                    {d}j
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Créer le rappel"
            accessibilityState={{ disabled: !selectedPlantId }}
            disabled={!selectedPlantId}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              !selectedPlantId && styles.submitBtnDisabled,
              pressed && selectedPlantId !== null && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.submitBtnText}>Créer le rappel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sage,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
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
  emptyCard: {
    padding: 20,
    gap: 10,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  ctaSage: {
    backgroundColor: Colors.sage,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 4,
  },
  ctaSageText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  reminderCard: {
    padding: 16,
    gap: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  reminderName: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  reminderProgress: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.sage,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    letterSpacing: 1.2,
  },
  progressOuter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    backgroundColor: Colors.sage,
    borderRadius: 3,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sage,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
  },
  markBtnDisabled: {
    backgroundColor: 'rgba(139, 173, 139, 0.35)',
  },
  markBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.2)',
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

  // ── Modal ──
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(43, 62, 43, 0.55)',
  },
  modalCard: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    gap: 14,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  modalLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  plantPickerRow: {
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  plantChip: {
    minWidth: 96,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  plantChipActive: {
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
    borderColor: Colors.sage,
  },
  plantChipEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  plantChipName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.text,
  },
  plantChipNameActive: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.sage,
  },
  durationsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  durationBtnActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
  },
  durationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.textMuted,
  },
  durationTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: Colors.sage,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(139, 173, 139, 0.35)',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
