import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Flag, X } from 'lucide-react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { useToast } from '@/src/components/common/ToastProvider';
import { Colors } from '@/src/constants/colors';
import { submitProductReport } from '@/src/lib/api/reports';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import type { ReportType } from '@/src/lib/api/types';

interface ReportButtonProps {
  barcode: string;
  reportCount?: number;
}

interface OptionDef {
  value: ReportType;
  labelFr: string;
}

const OPTIONS: OptionDef[] = [
  { value: 'wrong_name', labelFr: 'Nom incorrect' },
  { value: 'wrong_photo', labelFr: 'Photo incorrecte' },
  { value: 'wrong_ingredients', labelFr: 'Ingrédients incorrects' },
  { value: 'wrong_nutrition', labelFr: 'Valeurs nutritionnelles incorrectes' },
  { value: 'other', labelFr: 'Autre' },
];

export function ReportButton({ barcode, reportCount }: ReportButtonProps) {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function openSheet() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    setSelected(null);
    setDescription('');
    setErrorMsg(null);
    setOpen(true);
  }

  function closeSheet() {
    setOpen(false);
  }

  function handleSelect(value: ReportType) {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    setSelected(value);
    setErrorMsg(null);
  }

  async function handleSubmit() {
    if (!user || !selected) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await submitProductReport({
        barcode,
        userId: user.id,
        reportType: selected,
        description: description.trim() || null,
      });
      if (res.ok) {
        setOpen(false);
        toast.success('Merci pour votre signalement');
      } else {
        setErrorMsg(res.error ?? 'Erreur lors du signalement');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  }

  const counterText =
    typeof reportCount === 'number' && reportCount > 0
      ? ` (${reportCount} signalement${reportCount > 1 ? 's' : ''})`
      : '';

  const submitDisabled =
    submitting ||
    !selected ||
    (selected === 'other' && description.trim().length === 0);

  return (
    <>
      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel="Signaler une erreur sur ce produit"
        style={styles.triggerRow}
        hitSlop={8}
      >
        <Flag color={Colors.textMuted} size={14} strokeWidth={2.2} />
        <Text style={styles.triggerText}>
          Signaler une erreur{counterText}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.backdrop} onPress={closeSheet} accessibilityLabel="Fermer">
          <Pressable
            onPress={() => undefined}
            style={styles.sheetWrap}
            accessibilityViewIsModal
          >
            <GlassCard style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Signaler une erreur</Text>
                <Pressable
                  onPress={closeSheet}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                  style={styles.closeButton}
                >
                  <X color={Colors.text} size={18} strokeWidth={2.2} />
                </Pressable>
              </View>

              {!user ? (
                <View style={{ gap: 12 }}>
                  <Text style={styles.notLoggedIn}>
                    Connectez-vous pour signaler une erreur sur un produit.
                  </Text>
                  <Pressable
                    onPress={closeSheet}
                    accessibilityRole="button"
                    accessibilityLabel="Fermer"
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Fermer</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.optionsList}>
                    {OPTIONS.map((opt) => {
                      const isSelected = selected === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => handleSelect(opt.value)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                          accessibilityLabel={opt.labelFr}
                          style={styles.optionRow}
                        >
                          <View
                            style={[
                              styles.radioOuter,
                              isSelected ? styles.radioOuterActive : undefined,
                            ]}
                          >
                            {isSelected ? <View style={styles.radioInner} /> : null}
                          </View>
                          <Text style={styles.optionLabel}>{opt.labelFr}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder={
                      selected === 'other'
                        ? 'Description (requise)'
                        : 'Description (optionnelle)'
                    }
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={styles.textInput}
                    accessibilityLabel="Description du signalement"
                  />

                  {errorMsg ? (
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  ) : null}

                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={closeSheet}
                      accessibilityRole="button"
                      accessibilityLabel="Annuler"
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>Annuler</Text>
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <PrimaryCTA
                        label={submitting ? 'Envoi…' : 'Envoyer'}
                        onPress={handleSubmit}
                        disabled={submitDisabled}
                      />
                    </View>
                  </View>
                </>
              )}
            </GlassCard>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  triggerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sheet: {
    padding: 18,
    borderRadius: 24,
    gap: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F3EC',
  },
  optionsList: {
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#C8D5C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.sage,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: Colors.sage,
  },
  optionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  textInput: {
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F3F3EC',
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.score.red,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F3F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  notLoggedIn: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
