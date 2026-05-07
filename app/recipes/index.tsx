/**
 * Recettes Bien-être ☕ — index avec recherche + filtre catégorie (tier Expert).
 *
 * Pattern Expert gate :
 *   • free / premium : aperçu 1ère recette + reste verrouillé + paywall featureKey="wellness_recipes"
 *   • expert         : liste complète + recherche + filtres catégorie
 */

import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import {
  WELLNESS_RECIPES,
  searchRecipes,
  type RecipeCategory,
  type WellnessRecipe,
} from '@/src/data/wellness-recipes';

const CATEGORY_LABELS: Record<RecipeCategory, { labelFr: string; emoji: string }> = {
  sleep: { labelFr: 'Sommeil', emoji: '😴' },
  digestion: { labelFr: 'Digestion', emoji: '🫃' },
  stress: { labelFr: 'Stress', emoji: '😰' },
  energy: { labelFr: 'Énergie', emoji: '⚡' },
  skin: { labelFr: 'Peau', emoji: '🧴' },
  immunity: { labelFr: 'Immunité', emoji: '🛡️' },
  detox: { labelFr: 'Détox', emoji: '🌿' },
};

const CATEGORY_ORDER: RecipeCategory[] = [
  'sleep',
  'digestion',
  'stress',
  'energy',
  'skin',
  'immunity',
  'detox',
];

const FREE_PREVIEW = 1;
const FREE_LOCKED_LIMIT = 5;

export default function RecipesIndexScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | null>(null);

  const filtered: WellnessRecipe[] = useMemo(() => {
    const trimmed = query.trim();
    let base: WellnessRecipe[];
    if (trimmed.length >= 2) {
      base = searchRecipes(trimmed);
    } else if (activeCategory) {
      base = WELLNESS_RECIPES.filter((r) => r.category === activeCategory);
    } else {
      base = WELLNESS_RECIPES;
    }
    return [...base].sort((a, b) => a.titleFr.localeCompare(b.titleFr, 'fr'));
  }, [query, activeCategory]);

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  function handleCategory(cat: RecipeCategory) {
    setActiveCategory((prev) => (prev === cat ? null : cat));
  }

  function handleRecipePress(id: string) {
    router.push(`/recipes/${id}`);
  }

  const previewItems = isExpert ? filtered : filtered.slice(0, FREE_PREVIEW);
  const lockedItems = isExpert
    ? []
    : filtered.slice(FREE_PREVIEW, FREE_LOCKED_LIMIT);
  const showPaywall = !isExpert && filtered.length > 0;

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
            <Text style={styles.title}>Recettes Bien-être ☕</Text>
            <Text style={styles.subtitle}>
              30 préparations à base de plantes
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <GlassCard style={styles.searchWrap}>
            <Search size={18} color={Colors.textMuted} strokeWidth={2.2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher une recette..."
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel="Rechercher une recette"
            />
          </GlassCard>
        </FadeIn>

        <FadeIn delay={180}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {CATEGORY_ORDER.map((catKey) => {
              const cat = CATEGORY_LABELS[catKey];
              const active = activeCategory === catKey;
              return (
                <Pressable
                  key={catKey}
                  onPress={() => handleCategory(catKey)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={cat.labelFr}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {cat.labelFr}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FadeIn>

        <FadeIn delay={240}>
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionTitle}>
              {activeCategory
                ? CATEGORY_LABELS[activeCategory].labelFr
                : query.trim().length >= 2
                  ? 'Résultats'
                  : 'Toutes les recettes'}
            </Text>

            {filtered.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aucune recette</Text>
                <Text style={styles.emptyText}>
                  {query.trim().length >= 2
                    ? 'Essaie une autre recherche.'
                    : 'Choisis une autre catégorie.'}
                </Text>
              </GlassCard>
            ) : (
              <View style={{ gap: 10 }}>
                {previewItems.map((recipe, index) => (
                  <RecipeRowCard
                    key={recipe.id}
                    recipe={recipe}
                    delay={Math.min(index * 40, 240)}
                    onPress={() => handleRecipePress(recipe.id)}
                  />
                ))}
                {lockedItems.length > 0 ? (
                  <View
                    style={{ gap: 10, opacity: 0.25 }}
                    pointerEvents="none"
                  >
                    {lockedItems.map((recipe) => (
                      <RecipeRowCard
                        key={recipe.id}
                        recipe={recipe}
                        onPress={() => undefined}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            )}

            {showPaywall ? (
              <View style={{ marginTop: 12 }}>
                <PremiumPaywall
                  featureKey="wellness_recipes"
                  onUpgrade={handleUpgrade}
                />
              </View>
            ) : null}
          </View>
        </FadeIn>

        <FadeIn delay={320}>
          <Text style={styles.disclaimer}>
            Ces informations sont fournies à titre éducatif. Elles ne remplacent
            pas un avis médical. Consultez un professionnel de santé.
          </Text>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}

interface RecipeRowCardProps {
  recipe: WellnessRecipe;
  onPress: () => void;
  delay?: number;
}

function RecipeRowCard({ recipe, onPress, delay = 0 }: RecipeRowCardProps) {
  const a11y = `${recipe.titleFr}, ${CATEGORY_LABELS[recipe.category].labelFr}, ${recipe.durationMinutes} minutes`;
  const difficultyLabel = recipe.difficulty === 'easy' ? 'Facile' : 'Moyen';
  const difficultyStyle =
    recipe.difficulty === 'easy' ? styles.diffEasy : styles.diffMedium;

  return (
    <FadeIn delay={delay}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
      >
        <GlassCard style={styles.row}>
          <Text style={styles.rowEmoji}>{recipe.emoji}</Text>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {recipe.titleFr}
            </Text>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTiming} numberOfLines={1}>
                {recipe.timingFr}
              </Text>
            </View>
            <View style={styles.rowChips}>
              <View style={[styles.tag, difficultyStyle]}>
                <Text style={styles.tagText}>{difficultyLabel}</Text>
              </View>
              <View style={[styles.tag, styles.tagDuration]}>
                <Text style={styles.tagDurationText}>
                  {recipe.durationMinutes} min
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </Pressable>
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
  title: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 26,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 18,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter',
    color: Colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  chipActive: {
    borderColor: Colors.sage,
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
  },
  chipEmoji: {
    fontSize: 14,
    lineHeight: 18,
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.sage,
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 18,
  },
  rowEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  rowTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  rowMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowTiming: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  rowChips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  diffEasy: {
    backgroundColor: 'rgba(139, 173, 139, 0.16)',
  },
  diffMedium: {
    backgroundColor: 'rgba(196, 168, 130, 0.18)',
  },
  tagDuration: {
    backgroundColor: 'rgba(91, 123, 158, 0.12)',
  },
  tagDurationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
    color: '#5B7B9E',
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
