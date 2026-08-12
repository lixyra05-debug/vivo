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
import { PlantListCard } from '@/src/components/plants/PlantListCard';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import {
  PLANT_CATEGORIES,
  PLANT_ENCYCLOPEDIA,
  searchPlants,
  type PlantCategory,
  type PlantEntry,
} from '@/src/data/plant-encyclopedia';

const CATEGORY_ORDER: PlantCategory[] = [
  'respiratory',
  'digestive',
  'nervous',
  'circulatory',
  'skin',
  'urinary',
  'general',
];

const FREE_PREVIEW = 3;
const FREE_LOCKED_LIMIT = 8;

export default function PlantsIndexScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PlantCategory | null>(
    null,
  );

  const filtered: PlantEntry[] = useMemo(() => {
    const trimmed = query.trim();
    let base: PlantEntry[];
    if (trimmed.length >= 2) {
      base = searchPlants(trimmed);
    } else if (activeCategory) {
      base = PLANT_ENCYCLOPEDIA.filter((p) => p.category === activeCategory);
    } else {
      base = PLANT_ENCYCLOPEDIA;
    }
    return [...base].sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr'));
  }, [query, activeCategory]);

  const previewItems = isExpert ? filtered : filtered.slice(0, FREE_PREVIEW);
  const lockedItems = isExpert
    ? []
    : filtered.slice(FREE_PREVIEW, FREE_LOCKED_LIMIT);
  const showPaywall = !isExpert && filtered.length > FREE_PREVIEW;

  function handleCategory(cat: PlantCategory) {
    setActiveCategory((prev) => (prev === cat ? null : cat));
  }

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  function handlePlantPress(id: string) {
    router.push(`/plants/${id}`);
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
            <Text style={styles.title}>Encyclopédie des Plantes</Text>
            <Text style={styles.subtitle}>40+ plantes médicinales</Text>
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <GlassCard style={styles.searchWrap}>
            <Search size={18} color={Colors.textMuted} strokeWidth={2.2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher une plante..."
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel="Rechercher une plante"
            />
          </GlassCard>
        </FadeIn>

        <FadeIn delay={180}>
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionTitle}>Catégories</Text>
            <View style={styles.grid}>
              {CATEGORY_ORDER.map((catKey) => {
                const cat = PLANT_CATEGORIES[catKey];
                const active = activeCategory === catKey;
                return (
                  <Pressable
                    key={catKey}
                    onPress={() => handleCategory(catKey)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={cat.labelFr}
                    style={[
                      styles.gridCell,
                      styles.categoryCard,
                      active && styles.categoryCardActive,
                    ]}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        active && styles.categoryLabelActive,
                      ]}
                    >
                      {cat.labelFr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={240}>
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionTitle}>
              {activeCategory
                ? PLANT_CATEGORIES[activeCategory].labelFr
                : query.trim().length >= 2
                  ? 'Résultats'
                  : 'Toutes les plantes'}
            </Text>

            {filtered.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aucune plante</Text>
                <Text style={styles.emptyText}>
                  {query.trim().length >= 2
                    ? 'Essaie une autre recherche.'
                    : "L'encyclopédie est en cours de chargement."}
                </Text>
              </GlassCard>
            ) : (
              <ScrollView
                horizontal={false}
                scrollEnabled={false}
                contentContainerStyle={{ gap: 10 }}
              >
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
              </ScrollView>
            )}

            {showPaywall ? (
              <View style={{ marginTop: 12 }}>
                <PremiumPaywall
                  featureKey="plant_database"
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
  sectionTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCell: {
    width: '48%',
    flexGrow: 0,
  },
  categoryCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
    gap: 6,
  },
  categoryCardActive: {
    borderColor: Colors.sage,
    backgroundColor: 'rgba(139, 173, 139, 0.12)',
  },
  categoryEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  categoryLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  categoryLabelActive: {
    color: Colors.textMuted,
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
