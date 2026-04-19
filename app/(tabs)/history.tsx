import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Search, X } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Input } from '@/src/components/ui/Input';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { ScanHistoryCard } from '@/src/components/product/ScanHistoryCard';
import { EmptyBasket } from '@/src/components/illustrations/EmptyBasket';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import {
  dedupeByBarcode,
  useScanHistory,
  useToggleFavorite,
  type ScanHistoryRow,
} from '@/src/lib/stores/useProductStore';
import { ScanLine } from 'lucide-react-native';

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
  const toggleFavorite = useToggleFavorite(user?.id);

  const { rows, filtered, reachedLimit } = useMemo(() => {
    const allRows = dedupeByBarcode(query.data ?? []);
    const q = search.trim().toLowerCase();
    const filteredRows = q
      ? allRows.filter((r) => {
          const name = r.product?.name?.toLowerCase() ?? '';
          const brand = r.product?.brand?.toLowerCase() ?? '';
          return name.includes(q) || brand.includes(q);
        })
      : allRows;
    return {
      rows: allRows,
      filtered: filteredRows,
      reachedLimit: !isPremium && allRows.length >= FREE_LIMIT,
    };
  }, [query.data, search, isPremium]);

  function renderItem({ item, index }: { item: ScanHistoryRow; index: number }) {
    return (
      <FadeIn delay={Math.min(index * 40, 280)}>
        <ScanHistoryCard
          name={item.product?.name ?? null}
          brand={item.product?.brand ?? null}
          imageUrl={item.product?.image_url ?? null}
          score={item.score_at_scan}
          scannedAt={item.scanned_at}
          isFavorite={item.is_favorite}
          onPress={() => router.push(`/product/${item.barcode}`)}
          onToggleFavorite={() =>
            toggleFavorite.mutate({ barcode: item.barcode, next: !item.is_favorite })
          }
        />
      </FadeIn>
    );
  }

  const hasResults = filtered.length > 0;
  const noSearchResults = search.trim().length > 0 && filtered.length === 0 && rows.length > 0;

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
              Historique
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 14,
                color: Colors.textMuted,
              }}
            >
              {isPremium
                ? `Tous tes scans (${rows.length})`
                : `Tes ${Math.min(rows.length, FREE_LIMIT)} derniers scans`}
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <GlassCard style={{ paddingHorizontal: 6, paddingVertical: 6 }}>
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un produit ou une marque"
              autoCorrect={false}
              autoCapitalize="none"
              leftIcon={<Search size={18} color={Colors.textMuted} />}
              rightIcon={
                search.length > 0 ? (
                  <Pressable
                    onPress={() => setSearch('')}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Effacer la recherche"
                  >
                    <X size={16} color={Colors.textMuted} />
                  </Pressable>
                ) : undefined
              }
              style={{ borderWidth: 0 } as never}
            />
          </GlassCard>
        </FadeIn>

        {query.isLoading ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <FadeIn key={i} delay={i * 60}>
                <Skeleton height={80} radius={20} />
              </FadeIn>
            ))}
          </View>
        ) : rows.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <FadeIn delay={120}>
              <EmptyBasket size={148} />
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
                  Aucun scan pour le moment
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
                  Scanne ton premier produit pour voir apparaître son analyse ici.
                </Text>
              </View>
            </FadeIn>
            <FadeIn delay={340} style={{ alignSelf: 'stretch', paddingHorizontal: 16 }}>
              <PrimaryCTA
                label="Scanner un produit"
                onPress={() => router.push('/(tabs)/scan')}
                icon={<ScanLine color="#FFFFFF" size={18} strokeWidth={2.2} />}
              />
            </FadeIn>
          </View>
        ) : noSearchResults ? (
          <View style={{ marginTop: 24, alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-SemiBold',
                fontSize: 16,
                color: Colors.text,
              }}
            >
              Aucun résultat
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: Colors.textMuted,
                textAlign: 'center',
              }}
            >
              Aucun produit ne correspond à « {search.trim()} ».
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
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
            ListFooterComponent={
              reachedLimit ? (
                <FadeIn delay={100}>
                  <Pressable
                    onPress={() => router.push('/settings/subscription')}
                    accessibilityRole="button"
                    accessibilityLabel="Passer en Premium pour conserver tout l'historique"
                    style={{ marginTop: 12 }}
                  >
                    <GlassCard tone="info" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 999,
                          backgroundColor: 'rgba(196, 168, 130, 0.2)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Lock color={Colors.earth} size={18} strokeWidth={2.2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: 'BricolageGrotesque-SemiBold',
                            fontSize: 14,
                            color: Colors.text,
                          }}
                        >
                          Historique limité aux {FREE_LIMIT} derniers scans
                        </Text>
                        <Text
                          style={{
                            fontFamily: 'Inter',
                            fontSize: 12,
                            color: Colors.textMuted,
                            marginTop: 2,
                          }}
                        >
                          Passe en Premium pour tout conserver.
                        </Text>
                      </View>
                    </GlassCard>
                  </Pressable>
                </FadeIn>
              ) : null
            }
            ListEmptyComponent={
              hasResults ? null : (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter', color: Colors.textMuted }}>
                    Aucun produit.
                  </Text>
                </View>
              )
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
