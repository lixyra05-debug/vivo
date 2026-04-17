import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Lock } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ScanHistoryCard } from '@/src/components/product/ScanHistoryCard';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import {
  dedupeByBarcode,
  useScanHistory,
  type ScanHistoryRow,
} from '@/src/lib/stores/useProductStore';

const FREE_LIMIT = 30;

export default function HistoryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const isPremium = profile?.subscription_tier === 'premium';
  const [search, setSearch] = useState('');

  const query = useScanHistory({
    userId: user?.id,
    limit: isPremium ? undefined : FREE_LIMIT,
  });

  const filtered = useMemo(() => {
    const rows = dedupeByBarcode(query.data ?? []);
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = r.product?.name?.toLowerCase() ?? '';
      const brand = r.product?.brand?.toLowerCase() ?? '';
      return name.includes(q) || brand.includes(q);
    });
  }, [query.data, search]);

  function renderItem({ item }: { item: ScanHistoryRow }) {
    return (
      <ScanHistoryCard
        name={item.product?.name ?? null}
        brand={item.product?.brand ?? null}
        imageUrl={item.product?.image_url ?? null}
        score={item.score_at_scan}
        scannedAt={item.scanned_at}
        onPress={() => router.push(`/product/${item.barcode}`)}
      />
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 gap-4">
        <View className="gap-1">
          <Text className="font-display text-3xl font-bold text-sage-800">Historique</Text>
          <Text className="text-sage-700">
            {isPremium ? 'Tous tes scans' : `Tes ${FREE_LIMIT} derniers scans`}
          </Text>
        </View>

        <View className="flex-row items-center gap-2 rounded-2xl bg-white px-4 py-3">
          <Search color={Colors.textMuted} size={18} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un produit ou une marque"
            placeholderTextColor={Colors.textMuted}
            className="flex-1 text-base text-sage-800"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {query.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={Colors.sage} size="large" />
          </View>
        ) : (
          <FlatList
            data={filtered}
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
              <View className="mt-10 items-center gap-2">
                <Text className="text-center text-sage-700">
                  {search
                    ? 'Aucun produit ne correspond.'
                    : 'Aucun scan pour le moment. Commence par scanner un produit.'}
                </Text>
              </View>
            }
            ListFooterComponent={
              !isPremium && (query.data?.length ?? 0) >= FREE_LIMIT ? (
                <View className="mt-4 flex-row items-center gap-2 rounded-vivo bg-sage-50 p-4">
                  <Lock color={Colors.sage} size={18} />
                  <Text className="flex-1 text-sm text-sage-700">
                    Passe en Premium pour conserver l'historique complet.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
