import { useMemo } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { FavoriteGridCard } from '@/src/components/product/FavoriteGridCard';
import { EmptyHeart } from '@/src/components/illustrations/EmptyHeart';
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

  function confirmRemove(item: ScanHistoryRow) {
    Alert.alert(
      'Retirer ce favori ?',
      item.product?.name
        ? `${item.product.name} sera retiré de tes favoris.`
        : 'Ce produit sera retiré de tes favoris.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => toggle.mutate({ barcode: item.barcode, next: false }),
        },
      ],
    );
  }

  function renderItem({ item, index }: { item: ScanHistoryRow; index: number }) {
    return (
      <FadeIn delay={Math.min((index % 6) * 70, 360)} style={{ flex: 1 }}>
        <FavoriteGridCard
          name={item.product?.name ?? null}
          brand={item.product?.brand ?? null}
          imageUrl={item.product?.image_url ?? null}
          score={item.score_at_scan}
          onPress={() => router.push(`/product/${item.barcode}`)}
          onLongPress={() => confirmRemove(item)}
        />
      </FadeIn>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, gap: 16 }}>
        <FadeIn delay={0}>
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 30,
                color: Colors.text,
                letterSpacing: -0.6,
              }}
            >
              Favoris
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 14,
                color: Colors.textMuted,
              }}
            >
              {favorites.length > 0
                ? `${favorites.length} produit${favorites.length > 1 ? 's' : ''} à retrouver en un clin d'œil`
                : 'Les produits que tu veux retrouver en un clin d\u2019œil'}
            </Text>
          </View>
        </FadeIn>

        {query.isLoading ? (
          <View style={{ flex: 1, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton height={220} radius={22} />
              <Skeleton height={220} radius={22} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton height={220} radius={22} />
              <Skeleton height={220} radius={22} />
            </View>
          </View>
        ) : favorites.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <FadeIn delay={120}>
              <EmptyHeart size={148} />
            </FadeIn>
            <FadeIn delay={220}>
              <View style={{ alignItems: 'center', gap: 8, maxWidth: 300 }}>
                <Text
                  style={{
                    fontFamily: 'BricolageGrotesque-Bold',
                    fontSize: 22,
                    color: Colors.text,
                    textAlign: 'center',
                    letterSpacing: -0.4,
                  }}
                >
                  Aucun favori pour l'instant
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 14,
                    color: Colors.textMuted,
                    textAlign: 'center',
                    lineHeight: 21,
                  }}
                >
                  Depuis la fiche d'un produit, touche le cœur pour l'enregistrer ici.
                </Text>
              </View>
            </FadeIn>
            <FadeIn delay={340} style={{ alignSelf: 'stretch', paddingHorizontal: 16 }}>
              <PrimaryCTA
                label="Découvrir des produits"
                onPress={() => router.push('/(tabs)/scan')}
                icon={<ScanLine color="#FFFFFF" size={18} strokeWidth={2.2} />}
              />
            </FadeIn>
          </View>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => query.refetch()}
                tintColor={Colors.sage}
                colors={[Colors.sage]}
                title="Actualisation…"
                titleColor={Colors.textMuted}
              />
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
