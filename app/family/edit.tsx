/**
 * Mode Famille — création/édition d'un profil familial (Premium tier).
 *
 * `id === 'new'` → mode création (form vide, valeurs par défaut).
 * `id === uuid` → mode édition (pré-rempli depuis `useFamilyProfiles().data`).
 *
 * Allergènes : 14 clés Annexe II du Règlement (UE) n°1169/2011, mêmes clés
 * consommées par `compatibility-engine` (gluten, lactose, …).
 *
 * Conditions : 7 valeurs reconnues par le moteur (diabete, enceinte, bebe,
 * coeliaque, ibs_fodmap, hypertension, cholesterol).
 *
 * Free / Premium-non-éligible : `<PremiumPaywall featureKey="family_mode" />`.
 */

import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, Trash2 } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Input } from '@/src/components/ui/Input';
import { TappableChip } from '@/src/components/onboarding/TappableChip';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { usePremium } from '@/src/lib/hooks/usePremium';
import {
  useCreateFamilyProfile,
  useDeleteFamilyProfile,
  useFamilyProfiles,
  useUpdateFamilyProfile,
  type FamilyAgeGroup,
  type FamilyProfile,
} from '@/src/lib/family/family-store';

// ─── Constantes UI ──────────────────────────────────────────────────────────

const AVATAR_EMOJIS: readonly string[] = [
  '🧑',
  '👨',
  '👩',
  '🧒',
  '👶',
  '🤰',
  '👴',
  '👵',
];

interface AgeGroupOption {
  value: FamilyAgeGroup;
  label: string;
}

const AGE_GROUPS: readonly AgeGroupOption[] = [
  { value: 'adult', label: 'Adulte' },
  { value: 'child', label: 'Enfant' },
  { value: 'baby', label: 'Bébé' },
  { value: 'pregnant', label: 'Femme enceinte' },
];

// 14 allergènes Annexe II Règlement UE 1169/2011 (mêmes clés que compatibility-engine).
interface AllergenOption {
  key: string;
  label: string;
}

const ALLERGENS: readonly AllergenOption[] = [
  { key: 'gluten', label: 'Gluten' },
  { key: 'lactose', label: 'Lactose' },
  { key: 'arachides', label: 'Arachides' },
  { key: 'fruits_a_coque', label: 'Fruits à coque' },
  { key: 'soja', label: 'Soja' },
  { key: 'oeufs', label: 'Œufs' },
  { key: 'poisson', label: 'Poisson' },
  { key: 'crustaces', label: 'Crustacés' },
  { key: 'celeri', label: 'Céleri' },
  { key: 'moutarde', label: 'Moutarde' },
  { key: 'sesame', label: 'Sésame' },
  { key: 'sulfites', label: 'Sulfites' },
  { key: 'lupin', label: 'Lupin' },
  { key: 'mollusques', label: 'Mollusques' },
];

// 7 conditions reconnues par le moteur de compatibilité.
interface ConditionOption {
  key: string;
  label: string;
}

const CONDITIONS: readonly ConditionOption[] = [
  { key: 'diabete', label: 'Diabète' },
  { key: 'enceinte', label: 'Femme enceinte' },
  { key: 'bebe', label: 'Bébé' },
  { key: 'coeliaque', label: 'Cœliaque' },
  { key: 'ibs_fodmap', label: 'IBS / FODMAP' },
  { key: 'hypertension', label: 'Hypertension' },
  { key: 'cholesterol', label: 'Cholestérol' },
];

// ─── Écran ──────────────────────────────────────────────────────────────────

export default function FamilyEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : 'new';
  const isCreate = id === 'new' || id.length === 0;

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier, isLoading: tierLoading } = usePremium(userId);
  const profilesQuery = useFamilyProfiles(userId);
  const createMutation = useCreateFamilyProfile(userId);
  const updateMutation = useUpdateFamilyProfile(userId);
  const deleteMutation = useDeleteFamilyProfile(userId);

  const isFree = tier === 'free';

  const existingProfile: FamilyProfile | null = useMemo(() => {
    if (isCreate) return null;
    return profilesQuery.data?.find((p) => p.id === id) ?? null;
  }, [isCreate, id, profilesQuery.data]);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATAR_EMOJIS[0]);
  const [ageGroup, setAgeGroup] = useState<FamilyAgeGroup>('adult');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(isCreate);

  // Pré-remplit le formulaire en mode édition dès que la query résout.
  useEffect(() => {
    if (isCreate || hydrated) return;
    if (!existingProfile) return;
    setName(existingProfile.name);
    setAvatar(existingProfile.avatar_emoji);
    setAgeGroup(existingProfile.age_group);
    setAllergies(existingProfile.allergies);
    setConditions(existingProfile.conditions);
    setHydrated(true);
  }, [isCreate, hydrated, existingProfile]);

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  function toggleAllergy(key: string) {
    setAllergies((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  }

  function toggleCondition(key: string) {
    setConditions((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      Alert.alert('Nom requis', 'Donne un nom à ton profil familial.');
      return;
    }
    try {
      if (isCreate) {
        await createMutation.mutateAsync({
          name: trimmed,
          avatar_emoji: avatar,
          age_group: ageGroup,
          allergies,
          conditions,
        });
      } else {
        await updateMutation.mutateAsync({
          id,
          name: trimmed,
          avatar_emoji: avatar,
          age_group: ageGroup,
          allergies,
          conditions,
        });
      }
      router.back();
    } catch {
      Alert.alert(
        'Enregistrement impossible',
        'Vérifie ta connexion. Le maximum est de 4 profils familiaux.',
      );
    }
  }

  function handleDelete() {
    if (isCreate) return;
    Alert.alert(
      'Supprimer ce profil ?',
      'Cette action est définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(id, {
              onSuccess: () => router.back(),
              onError: () => {
                Alert.alert(
                  'Suppression impossible',
                  'Réessaie dans un instant.',
                );
              },
            });
          },
        },
      ],
    );
  }

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

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
            <Text style={styles.title}>
              {isCreate ? 'Nouveau profil' : 'Modifier le profil'}
            </Text>
            <Text style={styles.subtitle}>
              Personnalise les scans pour ce membre de la famille
            </Text>
          </View>
        </FadeIn>

        {!tierLoading && isFree ? (
          <FadeIn delay={120}>
            <PremiumPaywall
              featureKey="family_mode"
              onUpgrade={handleUpgrade}
            />
          </FadeIn>
        ) : (
          <>
            <FadeIn delay={120}>
              <GlassCard style={styles.card}>
                <Text style={styles.sectionLabel}>Avatar</Text>
                <View style={styles.avatarGrid}>
                  {AVATAR_EMOJIS.map((emoji) => {
                    const selected = emoji === avatar;
                    return (
                      <Pressable
                        key={emoji}
                        onPress={() => setAvatar(emoji)}
                        accessibilityRole="button"
                        accessibilityLabel={`Choisir l'avatar ${emoji}`}
                        accessibilityState={{ selected }}
                        style={({ pressed }) => [
                          styles.avatarBtn,
                          selected && styles.avatarBtnSelected,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text style={styles.avatarBtnEmoji}>{emoji}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={180}>
              <GlassCard style={styles.card}>
                <Text style={styles.sectionLabel}>Nom</Text>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex : Léa"
                  maxLength={50}
                  autoCapitalize="words"
                />
              </GlassCard>
            </FadeIn>

            <FadeIn delay={240}>
              <GlassCard style={styles.card}>
                <Text style={styles.sectionLabel}>Tranche d&apos;âge</Text>
                <View style={styles.chipsRow}>
                  {AGE_GROUPS.map((group) => (
                    <TappableChip
                      key={group.value}
                      label={group.label}
                      selected={ageGroup === group.value}
                      onPress={() => setAgeGroup(group.value)}
                    />
                  ))}
                </View>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={300}>
              <GlassCard style={styles.card}>
                <Text style={styles.sectionLabel}>Allergies & intolérances</Text>
                <Text style={styles.sectionHint}>
                  Vivo bloquera les produits qui contiennent ces allergènes.
                </Text>
                <View style={styles.chipsRow}>
                  {ALLERGENS.map((allergen) => (
                    <TappableChip
                      key={allergen.key}
                      label={allergen.label}
                      selected={allergies.includes(allergen.key)}
                      onPress={() => toggleAllergy(allergen.key)}
                    />
                  ))}
                </View>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={360}>
              <GlassCard style={styles.card}>
                <Text style={styles.sectionLabel}>Conditions de santé</Text>
                <Text style={styles.sectionHint}>
                  Le score sera adapté pour ce profil (informatif, pas médical).
                </Text>
                <View style={styles.chipsRow}>
                  {CONDITIONS.map((condition) => (
                    <TappableChip
                      key={condition.key}
                      label={condition.label}
                      selected={conditions.includes(condition.key)}
                      onPress={() => toggleCondition(condition.key)}
                    />
                  ))}
                </View>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={420}>
              <View style={{ gap: 12 }}>
                <PrimaryCTA
                  label={
                    isSubmitting
                      ? 'Enregistrement…'
                      : isCreate
                        ? 'Créer le profil'
                        : 'Enregistrer'
                  }
                  onPress={handleSubmit}
                  icon={<Check color="#FFFFFF" size={18} strokeWidth={2.4} />}
                  disabled={isSubmitting}
                />
                {isCreate ? (
                  <SecondaryButton
                    label="Annuler"
                    onPress={() => router.back()}
                  />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Supprimer le profil"
                    onPress={handleDelete}
                    disabled={isDeleting}
                    style={({ pressed }) => [
                      styles.deleteBtn,
                      (pressed || isDeleting) && { opacity: 0.7 },
                    ]}
                  >
                    <Trash2
                      color={Colors.score.red}
                      size={16}
                      strokeWidth={2.2}
                    />
                    <Text style={styles.deleteBtnText}>
                      {isDeleting ? 'Suppression…' : 'Supprimer ce profil'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </FadeIn>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

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
    fontSize: 28,
    color: Colors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
  },
  card: {
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    marginTop: -4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  avatarBtn: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7E7DA',
  },
  avatarBtnSelected: {
    borderColor: Colors.sage,
    backgroundColor: 'rgba(139, 173, 139, 0.12)',
  },
  avatarBtnEmoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 67, 54, 0.4)',
    backgroundColor: 'rgba(244, 67, 54, 0.05)',
  },
  deleteBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.score.red,
    letterSpacing: 0.2,
  },
});
