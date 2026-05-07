/**
 * FamilyProfilePills — bandeau horizontal des profils familiaux (Mode Famille).
 *
 * Affichage conditionnel :
 *   - tier === 'free' → render `null` (rien ne fuite côté UI gratuite)
 *   - profiles.length === 0 → render `null` (zero state géré par /family)
 *   - sinon : ScrollView horizontal de pills, le profil actif badgé sage,
 *     dernière pill = "+ Gérer" qui ouvre /family
 *
 * Tap sur un profil non actif → `useSetActiveFamilyProfile.mutate(profileId)`.
 * Le trigger DB désactive automatiquement les autres (cf. migration 014).
 */

import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { usePremium } from '@/src/lib/hooks/usePremium';
import {
  useFamilyProfiles,
  useSetActiveFamilyProfile,
  type FamilyProfile,
} from '@/src/lib/family/family-store';

export function FamilyProfilePills() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const profilesQuery = useFamilyProfiles(userId);
  const setActive = useSetActiveFamilyProfile(userId);

  const profiles = profilesQuery.data ?? [];

  // Free tier : rien ne fuite (les pills sont une feature Premium).
  if (tier === 'free') return null;
  // Aucun profil : on laisse l'écran /family gérer le zero state.
  if (profiles.length === 0) return null;

  function handleTap(profile: FamilyProfile) {
    if (profile.is_active) return;
    setActive.mutate(profile.id);
  }

  function handleManage() {
    router.push('/family');
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel="Profils familiaux"
    >
      {profiles.map((profile) => {
        const active = profile.is_active;
        return (
          <Pressable
            key={profile.id}
            onPress={() => handleTap(profile)}
            accessibilityRole="tab"
            accessibilityLabel={`Profil ${profile.name}`}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.pill,
              active ? styles.pillActive : styles.pillInactive,
              pressed && !active && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.pillEmoji}>{profile.avatar_emoji}</Text>
            <Text
              style={[
                styles.pillLabel,
                active ? styles.pillLabelActive : styles.pillLabelInactive,
              ]}
              numberOfLines={1}
            >
              {profile.name}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={handleManage}
        accessibilityRole="button"
        accessibilityLabel="Gérer les profils familiaux"
        style={({ pressed }) => [
          styles.pill,
          styles.pillManage,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Plus color={Colors.sage} size={14} strokeWidth={2.4} />
        <Text style={[styles.pillLabel, styles.pillLabelManage]}>Gérer</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
  },
  pillActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
  },
  pillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: '#E2EBE2',
  },
  pillManage: {
    backgroundColor: 'rgba(139, 173, 139, 0.08)',
    borderColor: 'rgba(139, 173, 139, 0.45)',
    borderStyle: 'dashed',
  },
  pillEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  pillLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
    maxWidth: 120,
  },
  pillLabelActive: {
    color: '#FFFFFF',
  },
  pillLabelInactive: {
    color: Colors.text,
  },
  pillLabelManage: {
    color: Colors.sage,
  },
});
