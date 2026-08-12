/**
 * Mon Herbier 🌿 — liste des plantes sauvegardées par l'utilisateur (tier Expert).
 *
 * Stockage : AsyncStorage (R10) via `herbarium-store`. Free / Premium voient
 * un PremiumPaywall (featureKey="my_herbarium") à la place du contenu.
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { PlantListCard } from '@/src/components/plants/PlantListCard';
import { HerbariumNoteModal } from '@/src/components/herbarium/HerbariumNoteModal';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import {
  getHerbarium,
  removeFromHerbarium,
  updateNote,
  type HerbariumEntry,
} from '@/src/lib/herbarium/herbarium-store';
import { getPlantById } from '@/src/data/plant-encyclopedia';

export default function HerbariumScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const [entries, setEntries] = useState<HerbariumEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await getHerbarium();
    setEntries(data);
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

  function handleRemove(plantId: string, nameFr: string) {
    Alert.alert(
      'Retirer cette plante ?',
      `${nameFr} sera retirée de ton herbier. Tu pourras la rajouter à tout moment.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            await removeFromHerbarium(plantId);
            await refresh();
          },
        },
      ],
    );
  }

  function handleEdit(plantId: string) {
    setEditingPlantId(plantId);
  }

  async function handleSaveNote(note: string) {
    if (!editingPlantId) return;
    await updateNote(editingPlantId, note);
    setEditingPlantId(null);
    await refresh();
  }

  function handlePlantPress(plantId: string) {
    router.push(`/plants/${plantId}`);
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
              <Text style={styles.title}>Mon Herbier</Text>
              <Text style={styles.subtitle}>Tes plantes favorites</Text>
            </View>
          </FadeIn>

          <FadeIn delay={120}>
            <PremiumPaywall
              featureKey="my_herbarium"
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
  const editingEntry = editingPlantId
    ? entries.find((e) => e.plantId === editingPlantId) ?? null
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
          <View style={{ gap: 4 }}>
            <Text style={styles.title}>Mon Herbier</Text>
            <Text style={styles.subtitle}>Tes plantes favorites</Text>
          </View>
        </FadeIn>

        {!isLoading && entries.length === 0 ? (
          <FadeIn delay={120}>
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Votre herbier est vide.</Text>
              <Text style={styles.emptyBody}>
                Explorez l'encyclopédie pour ajouter des plantes.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voir l'encyclopédie"
                onPress={() => router.push('/plants')}
                style={({ pressed }) => [
                  styles.ctaSage,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.ctaSageText}>Voir l'encyclopédie</Text>
              </Pressable>
            </GlassCard>
          </FadeIn>
        ) : null}

        {entries.length > 0 ? (
          <View style={{ gap: 14 }}>
            {entries.map((entry, index) => {
              const plant = getPlantById(entry.plantId);
              if (!plant) return null;
              return (
                <FadeIn
                  key={entry.plantId}
                  delay={Math.min(120 + index * 60, 480)}
                >
                  <View style={{ gap: 6 }}>
                    <PlantListCard
                      plant={plant}
                      onPress={() => handlePlantPress(entry.plantId)}
                    />
                    {entry.note.trim().length > 0 ? (
                      <Text style={styles.noteText}>« {entry.note} »</Text>
                    ) : null}
                    <View style={styles.actionsRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Modifier la note pour ${plant.nameFr}`}
                        onPress={() => handleEdit(entry.plantId)}
                        style={({ pressed }) => [
                          styles.actionBtn,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Edit3
                          color={Colors.sage}
                          size={14}
                          strokeWidth={2.4}
                        />
                        <Text style={styles.actionBtnText}>
                          {entry.note.trim().length > 0
                            ? 'Modifier'
                            : 'Ajouter une note'}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Retirer ${plant.nameFr} de l'herbier`}
                        onPress={() =>
                          handleRemove(entry.plantId, plant.nameFr)
                        }
                        style={({ pressed }) => [
                          styles.actionBtn,
                          styles.actionBtnDanger,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Trash2
                          color={Colors.score.red}
                          size={14}
                          strokeWidth={2.4}
                        />
                        <Text style={styles.actionBtnDangerText}>Retirer</Text>
                      </Pressable>
                    </View>
                  </View>
                </FadeIn>
              );
            })}
          </View>
        ) : null}

        <FadeIn delay={420}>
          <Text style={styles.disclaimer}>
            Ces informations sont fournies à titre éducatif. Elles ne
            remplacent pas un avis médical. Consultez un professionnel de
            santé.
          </Text>
        </FadeIn>
      </View>

      <HerbariumNoteModal
        visible={editingPlantId !== null}
        plantId={editingPlantId ?? ''}
        initialNote={editingEntry?.note ?? ''}
        onClose={() => setEditingPlantId(null)}
        onSave={handleSaveNote}
      />
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
  noteText: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.12)',
  },
  actionBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.sage,
    letterSpacing: 0.2,
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
  },
  actionBtnDangerText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.score.red,
    letterSpacing: 0.2,
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
