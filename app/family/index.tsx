/**
 * Mode Famille — liste des profils familiaux (Premium tier).
 *
 * Crée jusqu'à 4 profils familiaux et bascule entre eux. Chaque profil porte
 * ses propres allergies et conditions, qui pilotent le filtre "Ce que je peux manger"
 * via `useActiveCompatProfile` (côté futur consumer).
 *
 * Free / Premium-non-éligible : `<PremiumPaywall featureKey="family_mode" />`
 * — la liste reste cachée, seuls le titre et la garantie restent visibles.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Pencil, Plus, Users } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { usePremium } from '@/src/lib/hooks/usePremium';
import {
  MAX_FAMILY_PROFILES,
  useFamilyProfiles,
  useSetActiveFamilyProfile,
  type FamilyAgeGroup,
  type FamilyProfile,
} from '@/src/lib/family/family-store';

const AGE_GROUP_LABELS: Record<FamilyAgeGroup, string> = {
  adult: 'Adulte',
  child: 'Enfant',
  baby: 'Bébé',
  pregnant: 'Femme enceinte',
};

export default function FamilyIndexScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier, isLoading: tierLoading } = usePremium(userId);
  const profilesQuery = useFamilyProfiles(userId);
  const setActive = useSetActiveFamilyProfile(userId);

  const isFree = tier === 'free';
  const profiles = profilesQuery.data ?? [];
  const canAddMore = profiles.length < MAX_FAMILY_PROFILES;

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  function handleEdit(id: string) {
    router.push(`/family/edit?id=${id}`);
  }

  function handleNew() {
    router.push('/family/edit?id=new');
  }

  function handleSetActive(profile: FamilyProfile) {
    if (profile.is_active) return;
    setActive.mutate(profile.id);
  }

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
            <Text style={styles.title}>Mode Famille</Text>
            <Text style={styles.subtitle}>
              Crée jusqu&apos;à {MAX_FAMILY_PROFILES} profils familiaux
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
          <FamilyContent
            isLoading={profilesQuery.isLoading}
            profiles={profiles}
            canAddMore={canAddMore}
            onTapProfile={handleSetActive}
            onEditProfile={handleEdit}
            onAddNew={handleNew}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

interface FamilyContentProps {
  isLoading: boolean;
  profiles: FamilyProfile[];
  canAddMore: boolean;
  onTapProfile: (profile: FamilyProfile) => void;
  onEditProfile: (id: string) => void;
  onAddNew: () => void;
}

function FamilyContent({
  isLoading,
  profiles,
  canAddMore,
  onTapProfile,
  onEditProfile,
  onAddNew,
}: FamilyContentProps) {
  if (isLoading) {
    return (
      <View style={{ gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={80} radius={20} />
        ))}
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <FadeIn delay={120}>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Users color={Colors.sage} size={48} strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>Aucun profil familial</Text>
          <Text style={styles.emptyBody}>
            Ajoute ton premier profil pour commencer à personnaliser tes scans
            par membre de la famille.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Créer un profil"
            onPress={onAddNew}
            style={({ pressed }) => [
              styles.emptyCta,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Plus color="#FFFFFF" size={18} strokeWidth={2.4} />
            <Text style={styles.emptyCtaText}>Créer un profil</Text>
          </Pressable>
        </View>
      </FadeIn>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {profiles.map((profile, index) => (
        <FadeIn
          key={profile.id}
          delay={Math.min(120 + index * 100, 540)}
        >
          <ProfileRow
            profile={profile}
            onTap={() => onTapProfile(profile)}
            onEdit={() => onEditProfile(profile.id)}
          />
        </FadeIn>
      ))}

      {canAddMore ? (
        <FadeIn delay={Math.min(120 + profiles.length * 100, 600)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nouveau profil familial"
            onPress={onAddNew}
            style={({ pressed }) => [
              styles.addBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Plus color={Colors.sage} size={18} strokeWidth={2.4} />
            <Text style={styles.addBtnText}>Nouveau profil</Text>
          </Pressable>
        </FadeIn>
      ) : (
        <FadeIn delay={Math.min(120 + profiles.length * 100, 600)}>
          <Text style={styles.maxText}>
            Maximum {MAX_FAMILY_PROFILES} profils atteint
          </Text>
        </FadeIn>
      )}
    </View>
  );
}

interface ProfileRowProps {
  profile: FamilyProfile;
  onTap: () => void;
  onEdit: () => void;
}

function ProfileRow({ profile, onTap, onEdit }: ProfileRowProps) {
  return (
    <GlassCard
      style={[
        styles.profileCard,
        profile.is_active ? styles.profileCardActive : null,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Activer le profil ${profile.name}`}
        accessibilityState={{ selected: profile.is_active }}
        onPress={onTap}
        style={({ pressed }) => [
          styles.profileTapZone,
          pressed && !profile.is_active && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.avatarEmoji}>{profile.avatar_emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName} numberOfLines={1}>
            {profile.name}
          </Text>
          <Text style={styles.profileGroup}>
            {AGE_GROUP_LABELS[profile.age_group]}
          </Text>
        </View>
        {profile.is_active ? (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>ACTIF</Text>
          </View>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Modifier le profil ${profile.name}`}
        onPress={onEdit}
        hitSlop={10}
        style={({ pressed }) => [
          styles.editBtn,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Pencil color={Colors.textMuted} size={16} strokeWidth={2.2} />
      </Pressable>
    </GlassCard>
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
    fontSize: 30,
    color: Colors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
  },
  profileCard: {
    minHeight: 80,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileCardActive: {
    borderColor: 'rgba(139, 173, 139, 0.45)',
    backgroundColor: 'rgba(139, 173, 139, 0.08)',
  },
  profileTapZone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  avatarEmoji: {
    fontSize: 36,
    lineHeight: 42,
  },
  profileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  profileGroup: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.sage,
  },
  activePillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#ECECDF',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(139, 173, 139, 0.55)',
    backgroundColor: 'rgba(139, 173, 139, 0.06)',
  },
  addBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.sage,
    letterSpacing: 0.2,
  },
  maxText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.4,
    marginTop: 6,
  },
  emptyBody: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.sage,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    marginTop: 6,
  },
  emptyCtaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
