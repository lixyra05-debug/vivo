import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { SearchResultCard } from '@/src/components/explore/SearchResultCard';
import { CategoryCard } from '@/src/components/explore/CategoryCard';
import { StoreCard } from '@/src/components/explore/StoreCard';
import { Colors } from '@/src/constants/colors';
import { CATEGORIES } from '@/src/lib/api/categories';
import { searchProducts } from '@/src/lib/api/search';
import { getAllStores } from '@/src/lib/api/stores';
import type { SearchResult, StoreDef } from '@/src/lib/api/types';

type FilterType = 'all' | 'food' | 'cosmetic';

const FILTER_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: 'all', label: 'Tout' },
  { value: 'food', label: 'Aliments' },
  { value: 'cosmetic', label: 'Cosmétiques' },
];

const DEBOUNCE_MS = 400;
const FIVE_MIN_MS = 5 * 60 * 1000;

export default function ExploreScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [type, setType] = useState<FilterType>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const hasSearch = debouncedQuery.length >= 2;

  const searchQuery = useQuery({
    queryKey: ['search', debouncedQuery, type] as const,
    queryFn: () => searchProducts({ query: debouncedQuery, type }),
    enabled: hasSearch,
    staleTime: FIVE_MIN_MS,
  });

  const filteredCategories = useMemo(() => {
    if (type === 'all') return CATEGORIES;
    return CATEGORIES.filter((c) => c.type === type);
  }, [type]);

  function handleFilterChange(next: FilterType) {
    if (next === type) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    setType(next);
  }

  function handleResultPress(result: SearchResult) {
    router.push(`/product/${result.barcode}?type=${result.type}`);
  }

  function handleCategoryPress(slug: string) {
    router.push(`/category/${slug}`);
  }

  function handleStorePress(slug: string) {
    router.push(`/store/${slug}`);
  }

  function handleStoreRankingPress() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    router.push('/store-ranking');
  }

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 18 }}>
        <FadeIn delay={0}>
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 28,
                color: Colors.text,
                letterSpacing: -0.6,
              }}
            >
              Explorer
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 14,
                color: Colors.textMuted,
              }}
            >
              Cherche, compare, découvre
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <GlassCard style={styles.searchWrap}>
            <Search size={18} color={Colors.textMuted} strokeWidth={2.2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Nom du produit, marque..."
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel="Rechercher un produit"
            />
          </GlassCard>
        </FadeIn>

        <FadeIn delay={140}>
          <View style={styles.chipsRow}>
            {FILTER_OPTIONS.map((opt) => {
              const active = opt.value === type;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleFilterChange(opt.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={opt.label}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </FadeIn>

        {hasSearch ? (
          <SearchResultsSection
            isLoading={searchQuery.isLoading || searchQuery.isFetching}
            results={searchQuery.data ?? []}
            onPress={handleResultPress}
          />
        ) : (
          <>
            <CategoriesSection
              categories={filteredCategories}
              onPress={handleCategoryPress}
            />
            <StoresSection
              stores={getAllStores()}
              onPress={handleStorePress}
              onRankingPress={handleStoreRankingPress}
            />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

interface SearchResultsSectionProps {
  isLoading: boolean;
  results: SearchResult[];
  onPress: (r: SearchResult) => void;
}

function SearchResultsSection({ isLoading, results, onPress }: SearchResultsSectionProps) {
  return (
    <View style={{ gap: 12 }}>
      <FadeIn delay={180}>
        <Text style={styles.sectionTitle}>Résultats</Text>
      </FadeIn>
      {isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={88} radius={20} />
          ))}
        </View>
      ) : results.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptyText}>
            Essaie une autre recherche ou choisis une catégorie.
          </Text>
        </GlassCard>
      ) : (
        <View style={{ gap: 10 }}>
          {results.map((item, index) => (
            <FadeIn key={`${item.type}-${item.barcode}`} delay={Math.min(index * 40, 280)}>
              <SearchResultCard result={item} onPress={() => onPress(item)} />
            </FadeIn>
          ))}
        </View>
      )}
    </View>
  );
}

interface CategoriesSectionProps {
  categories: typeof CATEGORIES;
  onPress: (slug: string) => void;
}

function CategoriesSection({ categories, onPress }: CategoriesSectionProps) {
  return (
    <View style={{ gap: 12 }}>
      <FadeIn delay={180}>
        <Text style={styles.sectionTitle}>Catégories</Text>
      </FadeIn>
      <View style={styles.grid}>
        {categories.map((cat, index) => (
          <FadeIn key={cat.slug} delay={Math.min(220 + index * 40, 720)} style={styles.gridCell}>
            <CategoryCard category={cat} onPress={() => onPress(cat.slug)} />
          </FadeIn>
        ))}
      </View>
    </View>
  );
}

interface StoresSectionProps {
  stores: StoreDef[];
  onPress: (slug: string) => void;
  onRankingPress: () => void;
}

function StoresSection({ stores, onPress, onRankingPress }: StoresSectionProps) {
  return (
    <View style={{ gap: 12 }}>
      <FadeIn delay={200}>
        <View style={styles.storesHeader}>
          <View style={{ gap: 2, flex: 1 }}>
            <Text style={styles.sectionTitle}>Enseignes</Text>
            <Text style={styles.sectionSubtitle}>Top produits par magasin</Text>
          </View>
          <Pressable
            onPress={onRankingPress}
            accessibilityRole="button"
            accessibilityLabel="Voir le classement des supermarchés"
            style={({ pressed }) => [
              styles.rankingButton,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Trophy color={Colors.sage} size={16} strokeWidth={2.4} />
            <Text style={styles.rankingButtonText}>Classement</Text>
          </Pressable>
        </View>
      </FadeIn>
      <View style={styles.grid}>
        {stores.map((store, index) => (
          <FadeIn key={store.slug} delay={Math.min(240 + index * 40, 720)} style={styles.gridCell}>
            <StoreCard store={store} onPress={() => onPress(store.slug)} />
          </FadeIn>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  chipActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
  },
  chipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
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
  storesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(139, 173, 139, 0.14)',
  },
  rankingButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.sage,
    letterSpacing: 0.2,
  },
});
