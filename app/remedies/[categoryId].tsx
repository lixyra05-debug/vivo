import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { PlantListCard } from '@/src/components/plants/PlantListCard';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import {
  REMEDY_CATEGORIES,
  findRemedies,
} from '@/src/lib/remedies/remedy-finder';

const FREE_PREVIEW = 2;

export default function RemedyCategoryScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const category = REMEDY_CATEGORIES.find((c) => c.id === categoryId);

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  function handlePlantPress(id: string) {
    router.push(`/plants/${id}`);
  }

  if (!category) {
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
            <Text style={styles.notFoundTitle}>Catégorie introuvable</Text>
            <Text style={styles.notFoundText}>
              Cette catégorie n'existe pas ou n'est plus disponible.
            </Text>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={({ pressed }) => [
                styles.backCta,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.backCtaText}>Retour</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const plants = findRemedies(category.id);
  const previewItems = isExpert ? plants : plants.slice(0, FREE_PREVIEW);
  const lockedItems = isExpert ? [] : plants.slice(FREE_PREVIEW);
  const showPaywall = !isExpert && plants.length > 0;

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
            <Text style={styles.emojiXl}>{category.emoji}</Text>
            <Text style={styles.title}>{category.labelFr}</Text>
            <Text style={styles.description}>{category.description}</Text>
          </View>
        </FadeIn>

        {plants.length === 0 ? (
          <FadeIn delay={140}>
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aucune plante</Text>
              <Text style={styles.emptyText}>
                Aucune plante disponible pour le moment.
              </Text>
            </GlassCard>
          </FadeIn>
        ) : (
          <FadeIn delay={140}>
            <View style={{ gap: 10 }}>
              {previewItems.map((plant, index) => (
                <PlantListCard
                  key={plant.id}
                  plant={plant}
                  onPress={() => handlePlantPress(plant.id)}
                  delay={Math.min(index * 40, 240)}
                />
              ))}
              {lockedItems.length > 0 ? (
                <View
                  style={{ gap: 10, opacity: 0.25 }}
                  pointerEvents="none"
                >
                  {lockedItems.map((plant) => (
                    <PlantListCard
                      key={plant.id}
                      plant={plant}
                      onPress={() => undefined}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </FadeIn>
        )}

        {showPaywall ? (
          <FadeIn delay={220}>
            <View style={{ marginTop: 4 }}>
              <PremiumPaywall
                featureKey="herbal_remedies"
                onUpgrade={handleUpgrade}
              />
            </View>
          </FadeIn>
        ) : null}

        <FadeIn delay={300}>
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
  header: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  emojiXl: {
    fontSize: 40,
    lineHeight: 48,
  },
  title: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 24,
    color: Colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  backCta: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.sage,
  },
  backCtaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
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
