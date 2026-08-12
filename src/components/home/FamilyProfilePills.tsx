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
import { Icon } from '@/src/components/ui/Icon';
import { Palette, Radius, Spacing, Type, withAlpha } from '@/src/constants/theme';
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
        <Icon name="Plus" size="sm" color="sageVivid" />
        <Text style={[styles.pillLabel, styles.pillLabelManage]}>Gérer</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 36,
  },
  /* La pill active portait du blanc sur `sage` : 2,49:1, illisible. Le fond
   * passe sur `sageVivid`, qui tient 4,80:1 avec le libellé clair. */
  pillActive: {
    backgroundColor: Palette.sageVivid,
    borderColor: Palette.sageVivid,
  },
  pillInactive: {
    backgroundColor: withAlpha(Palette.surfaceRaised, 0.85),
    borderColor: Palette.borderCard,
  },
  pillManage: {
    backgroundColor: withAlpha(Palette.sage, 0.08),
    borderColor: withAlpha(Palette.sage, 0.45),
    borderStyle: 'dashed',
  },
  pillEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  pillLabel: {
    ...Type.caption,
    fontFamily: 'Inter-SemiBold',
    maxWidth: 120,
  },
  pillLabelActive: {
    color: Palette.textOnDark,
  },
  pillLabelInactive: {
    color: Palette.textPrimary,
  },
  pillLabelManage: {
    color: Palette.sageVivid,
  },
});
