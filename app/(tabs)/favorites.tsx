import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ScanHistoryCard } from '@/src/components/product/ScanHistoryCard';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import {
  dedupeByBarcode,
  useScanHistory,
  useToggleFavorite,
  type ScanHistoryRow,
} from '@/src/lib/stores/useProductStore';

export default function FavoritesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const query = useScanHistory({ userId: user?.id, onlyFavorites: true });
  const toggle = useToggleFavorite(user?.id);

  const favorites = useMemo(() => dedupeByBarcode(query.data ?? []), [query.data]);

  function renderItem({ item }: { item: ScanHistoryRow }) {
    return (
      <ScanHistoryCard
        name={item.product?.name ?? null}
        brand={item.product?.brand ?? null}
        imageUrl={item.product?.image_url ?? null}
        score={item.score_at_scan}
        scannedAt={item.scanned_at}
        isFavorite
        onToggleFavorite={() =>
          toggle.mutate({ barcode: item.barcode, next: false })
        }
        onPress={() => router.push(`/product/${item.barcode}`)}
      />
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 gap-4">
        <View className="gap-1">
          <Text className="font-display text-3xl font-bold text-sage-800">Favoris</Text>
          <Text className="text-sage-700">
            Les produits que tu veux retrouver en un clin d'œil.
          </Text>
        </View>

        {query.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={Colors.sage} size="large" />
          </View>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ gap: 10, paddingBottom: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => query.refetch()}
                tintColor={Colors.sage}
              />
            }
            ListEmptyComponent={
              <View className="mt-16 items-center gap-3 px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-sage-50">
                  <Heart color={Colors.sage} size={28} />
                </View>
                <Text className="text-center font-semibold text-sage-800">
                  Aucun favori pour l'instant
                </Text>
                <Text className="text-center text-sm text-sage-600">
                  Touche le cœur depuis la fiche d'un produit pour l'ajouter ici.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
