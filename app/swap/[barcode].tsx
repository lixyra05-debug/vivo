import { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Leaf, Sparkles } from 'lucide-react-native';
import { Button } from '@/src/components/ui/Button';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SmartSwapCard } from '@/src/components/product/SmartSwapCard';
import { Colors } from '@/src/constants/colors';
import { useProduct } from '@/src/lib/stores/useProductStore';
import {
  fetchSwapCategories,
  fetchSwapRules,
  matchCategoriesForProduct,
  type SwapCategory,
} from '@/src/lib/api/swaps';

const FALLBACK_ALTERNATIVES = [
  { emoji: '🍎', name: 'Pomme fraîche de saison', why: 'NOVA 1, fibres + vitamines' },
  { emoji: '🥜', name: 'Poignée d\'amandes nature', why: 'Graisses saines, rassasiantes' },
  { emoji: '🥕', name: 'Carottes croquantes', why: 'Bêta-carotène, aucun additif' },
];

export default function SwapScreen() {
  const router = useRouter();
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const productQuery = useProduct(barcode ?? null);

  const categoriesQuery = useQuery({
    queryKey: ['swap_categories'],
    queryFn: fetchSwapCategories,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const rulesQuery = useQuery({
    queryKey: ['swap_rules'],
    queryFn: fetchSwapRules,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const matched = useMemo(() => {
    if (!productQuery.data || !categoriesQuery.data || !rulesQuery.data) return [];
    return matchCategoriesForProduct(
      productQuery.data,
      categoriesQuery.data,
      rulesQuery.data
    );
  }, [productQuery.data, categoriesQuery.data, rulesQuery.data]);

  const isLoading =
    productQuery.isLoading || categoriesQuery.isLoading || rulesQuery.isLoading;

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.sage} size="large" />
          <Text className="mt-4 text-sage-700">Recherche d'alternatives…</Text>
        </View>
      </ScreenContainer>
    );
  }

  function renderCategory(cat: SwapCategory) {
    const alternatives = cat.brut_alternatives ?? [];
    return (
      <View key={cat.id} className="gap-3">
        <View className="flex-row items-center gap-2">
          <Leaf color={Colors.sage} size={18} />
          <Text className="font-display text-lg font-semibold text-sage-800">
            {cat.category_name_fr}
          </Text>
        </View>
        <View className="gap-2">
          {alternatives.map((alt, idx) => (
            <SmartSwapCard
              key={`${cat.id}-${idx}`}
              name={`${alt.emoji ? alt.emoji + ' ' : ''}${alt.name}`}
              why={alt.why}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer scroll>
      <View className="gap-6">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft color={Colors.text} size={20} />
          </Pressable>
          <View className="flex-1">
            <Text className="font-display text-2xl font-bold text-sage-800">
              Alternatives naturelles
            </Text>
            {productQuery.data ? (
              <Text className="text-sage-700" numberOfLines={1}>
                À la place de {productQuery.data.name ?? 'ce produit'}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center gap-2 rounded-vivo bg-sage-50 p-4">
          <Sparkles color={Colors.sage} size={18} />
          <Text className="flex-1 text-sm text-sage-700">
            Privilégie les aliments bruts (NOVA 1). Les Smart Swaps produits arrivent en Premium.
          </Text>
        </View>

        {matched.length > 0 ? (
          matched.map(renderCategory)
        ) : (
          <View className="gap-3">
            <Text className="font-display text-lg font-semibold text-sage-800">
              Idées universelles
            </Text>
            <View className="gap-2">
              {FALLBACK_ALTERNATIVES.map((alt) => (
                <SmartSwapCard
                  key={alt.name}
                  name={`${alt.emoji} ${alt.name}`}
                  why={alt.why}
                />
              ))}
            </View>
          </View>
        )}

        <Button
          label="Retour au produit"
          variant="outline"
          onPress={() => router.back()}
        />
      </View>
    </ScreenContainer>
  );
}
