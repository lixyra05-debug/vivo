/**
 * Fiche détaillée d'une recette bien-être (tier Expert).
 *
 * Sections (FadeIn cascade) :
 *   1. Hero (emoji XL + titre + chips catégorie / difficulty / durée)
 *   2. Ingrédients
 *   3. Préparation
 *   4. Plantes utilisées (PlantListCard cliquables)
 *   5. RecipeTimer
 *   6. Bénéfices
 *   7. Quand consommer ?
 *   8. Disclaimer médical
 *
 * Free / Premium → PremiumPaywall featureKey="wellness_recipes".
 * Recette absente → écran "Recette introuvable" + retour.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { PlantListCard } from '@/src/components/plants/PlantListCard';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { RecipeTimer } from '@/src/components/recipes/RecipeTimer';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import {
  getRecipeById,
  type RecipeCategory,
  type WellnessRecipe,
} from '@/src/data/wellness-recipes';
import { getPlantById } from '@/src/data/plant-encyclopedia';

const CATEGORY_LABELS: Record<RecipeCategory, { labelFr: string; emoji: string }> = {
  sleep: { labelFr: 'Sommeil', emoji: '😴' },
  digestion: { labelFr: 'Digestion', emoji: '🫃' },
  stress: { labelFr: 'Stress', emoji: '😰' },
  energy: { labelFr: 'Énergie', emoji: '⚡' },
  skin: { labelFr: 'Peau', emoji: '🧴' },
  immunity: { labelFr: 'Immunité', emoji: '🛡️' },
  detox: { labelFr: 'Détox', emoji: '🌿' },
};

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const recipe = id ? getRecipeById(id) : undefined;

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  if (!recipe) {
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
            <Text style={styles.notFoundTitle}>Recette introuvable</Text>
            <Text style={styles.notFoundText}>
              Cette recette n'existe pas ou n'est plus disponible.
            </Text>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={({ pressed }) => [styles.ctaSage, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.ctaSageText}>Retour</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

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
            <RecipeHero recipe={recipe} />
          </FadeIn>

          <FadeIn delay={120}>
            <PremiumPaywall
              featureKey="wellness_recipes"
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

  const plantsForRecipe = recipe.plantIds
    .map((pid) => getPlantById(pid))
    .filter((p): p is NonNullable<ReturnType<typeof getPlantById>> => p != null);

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 16 }}>
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
          <RecipeHero recipe={recipe} />
        </FadeIn>

        <RecipeSection delay={140} title="Ingrédients">
          <View style={{ gap: 8 }}>
            {recipe.ingredientsFr.map((line, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <View style={styles.bullet} />
                <Text style={styles.ingredientText}>{line}</Text>
              </View>
            ))}
          </View>
        </RecipeSection>

        <RecipeSection delay={220} title="Préparation">
          <Text style={styles.bodyText}>{recipe.preparationFr}</Text>
        </RecipeSection>

        {plantsForRecipe.length > 0 ? (
          <FadeIn delay={300}>
            <View style={{ gap: 10 }}>
              <Text style={styles.sectionTitle}>Plantes utilisées</Text>
              <View style={{ gap: 10 }}>
                {plantsForRecipe.map((plant, index) => (
                  <PlantListCard
                    key={plant.id}
                    plant={plant}
                    onPress={() => router.push(`/plants/${plant.id}`)}
                    delay={Math.min(index * 60, 240)}
                  />
                ))}
              </View>
            </View>
          </FadeIn>
        ) : null}

        <RecipeSection delay={380} title="Timer de préparation">
          <RecipeTimer durationMinutes={recipe.durationMinutes} />
        </RecipeSection>

        <RecipeSection delay={460} title="Bénéfices">
          <Text style={styles.bodyText}>{recipe.benefitsFr}</Text>
        </RecipeSection>

        <RecipeSection delay={540} title="Quand consommer ?">
          <Text style={styles.bodyText}>{recipe.timingFr}</Text>
        </RecipeSection>

        <FadeIn delay={620}>
          <Text style={styles.disclaimer}>
            Ces informations sont fournies à titre éducatif. Elles ne remplacent
            pas un avis médical. Consultez un professionnel de santé.
          </Text>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}

interface RecipeHeroProps {
  recipe: WellnessRecipe;
}

function RecipeHero({ recipe }: RecipeHeroProps) {
  const cat = CATEGORY_LABELS[recipe.category];
  const difficultyLabel = recipe.difficulty === 'easy' ? 'Facile' : 'Moyen';
  const difficultyStyle =
    recipe.difficulty === 'easy' ? styles.diffEasy : styles.diffMedium;

  return (
    <View style={styles.hero}>
      <Text style={styles.heroEmoji}>{recipe.emoji}</Text>
      <Text style={styles.heroTitle}>{recipe.titleFr}</Text>
      <View style={styles.heroChips}>
        <View style={styles.chipCategory}>
          <Text style={styles.chipCategoryEmoji}>{cat.emoji}</Text>
          <Text style={styles.chipCategoryText}>{cat.labelFr}</Text>
        </View>
        <View style={[styles.chipBase, difficultyStyle]}>
          <Text style={styles.chipText}>{difficultyLabel}</Text>
        </View>
        <View style={[styles.chipBase, styles.chipDuration]}>
          <Clock color="#5B7B9E" size={12} strokeWidth={2.4} />
          <Text style={styles.chipDurationText}>
            {recipe.durationMinutes} min
          </Text>
        </View>
      </View>
    </View>
  );
}

interface RecipeSectionProps {
  delay: number;
  title: string;
  children: React.ReactNode;
}

function RecipeSection({ delay, title, children }: RecipeSectionProps) {
  return (
    <FadeIn delay={delay}>
      <GlassCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={{ marginTop: 10 }}>{children}</View>
      </GlassCard>
    </FadeIn>
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
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  heroEmoji: {
    fontSize: 64,
    lineHeight: 72,
  },
  heroTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 24,
    color: Colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  heroChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  chipBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
  },
  chipCategoryEmoji: {
    fontSize: 13,
    lineHeight: 17,
  },
  chipCategoryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.sage,
    letterSpacing: 0.2,
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  diffEasy: {
    backgroundColor: 'rgba(139, 173, 139, 0.14)',
  },
  diffMedium: {
    backgroundColor: 'rgba(196, 168, 130, 0.18)',
  },
  chipDuration: {
    backgroundColor: 'rgba(91, 123, 158, 0.12)',
  },
  chipDurationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#5B7B9E',
    letterSpacing: 0.2,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 18,
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  bodyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sage,
    marginTop: 8,
  },
  ingredientText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  notFoundTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
  },
  notFoundText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  ctaSage: {
    backgroundColor: Colors.sage,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 8,
  },
  ctaSageText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
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
