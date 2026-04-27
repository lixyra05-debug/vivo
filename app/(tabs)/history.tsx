import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Search, TrendingDown, TrendingUp, X } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Input } from '@/src/components/ui/Input';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { ScanHistoryCard } from '@/src/components/product/ScanHistoryCard';
import { EmptyBasket } from '@/src/components/illustrations/EmptyBasket';
import { Colors } from '@/src/constants/colors';
import { checkCompatibility } from '@/src/lib/scoring/compatibility-engine';
import { userProfileToCompatibilityProfile } from '@/src/lib/scoring/profile-adapter';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import { usePremium } from '@/src/lib/premium/premium-gate';
import {
  dedupeByBarcode,
  useScanHistory,
  useToggleFavorite,
  type ScanHistoryRow,
} from '@/src/lib/stores/useProductStore';
import type { PenaltyDetail, ScoringResult } from '@/src/lib/api/types';
import { ScanLine } from 'lucide-react-native';

const FREE_LIMIT = 30;

type FilterKey = 'all' | 'avoid' | 'excellent' | 'incompatible';

interface ChipDef {
  key: FilterKey;
  label: string;
  count: number;
}

export default function HistoryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const { isPremium } = usePremium();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const query = useScanHistory({
    userId: user?.id,
    limit: isPremium ? undefined : FREE_LIMIT,
  });
  const toggleFavorite = useToggleFavorite(user?.id);

  const compatProfile = useMemo(
    () => userProfileToCompatibilityProfile(profile),
    [profile],
  );

  const incompatibleBarcodes = useMemo(() => {
    if (!compatProfile) return new Set<string>();
    const set = new Set<string>();
    for (const row of query.data ?? []) {
      if (!row.product) continue;
      const fakeResult: ScoringResult = {
        score_final: row.score_at_scan,
        score_color:
          row.score_at_scan >= 70
            ? 'green'
            : row.score_at_scan >= 50
              ? 'yellow'
              : row.score_at_scan >= 25
                ? 'orange'
                : 'red',
        nova_group: row.product.nova_group ?? 0,
        penalties: Array.isArray(row.penalties_snapshot)
          ? (row.penalties_snapshot as PenaltyDetail[])
          : [],
        blockers: [],
        seed_oils_detected: [],
        clean_labeling_alerts: [],
        profile_adjustments: [],
      };
      const compat = checkCompatibility(row.product, fakeResult, compatProfile);
      if (!compat.isCompatible) set.add(row.barcode);
    }
    return set;
  }, [query.data, compatProfile]);

  const { rows, filtered, reachedLimit, counts, insight } = useMemo(() => {
    const allRows = dedupeByBarcode(query.data ?? []);
    const q = search.trim().toLowerCase();
    const searched = q
      ? allRows.filter((r) => {
          const name = r.product?.name?.toLowerCase() ?? '';
          const brand = r.product?.brand?.toLowerCase() ?? '';
          return name.includes(q) || brand.includes(q);
        })
      : allRows;

    const counters = {
      all: searched.length,
      avoid: searched.filter((r) => r.score_at_scan < 30).length,
      excellent: searched.filter((r) => r.score_at_scan > 80).length,
      incompatible: searched.filter((r) => incompatibleBarcodes.has(r.barcode)).length,
    };

    const filteredRows = searched.filter((r) => {
      if (filter === 'all') return true;
      if (filter === 'avoid') return r.score_at_scan < 30;
      if (filter === 'excellent') return r.score_at_scan > 80;
      if (filter === 'incompatible') return incompatibleBarcodes.has(r.barcode);
      return true;
    });

    const total = searched.length;
    const insightData =
      total > 0
        ? {
            total,
            excellentPct: Math.round((counters.excellent / total) * 100),
            avoidPct: Math.round((counters.avoid / total) * 100),
          }
        : null;

    return {
      rows: allRows,
      filtered: filteredRows,
      reachedLimit: !isPremium && allRows.length >= FREE_LIMIT,
      counts: counters,
      insight: insightData,
    };
  }, [query.data, search, filter, isPremium, incompatibleBarcodes]);

  const chips: ChipDef[] = [
    { key: 'all', label: 'Tous', count: counts.all },
    { key: 'avoid', label: 'À éviter', count: counts.avoid },
    { key: 'excellent', label: 'Excellents', count: counts.excellent },
    ...(compatProfile
      ? ([{ key: 'incompatible', label: 'Incompatibles', count: counts.incompatible }] as const)
      : []),
  ];

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

        {rows.length > 0 ? (
          <FadeIn delay={140}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              accessibilityRole="tablist"
              accessibilityLabel="Filtres rapides"
            >
              {chips.map((chip) => {
                const active = filter === chip.key;
                return (
                  <Pressable
                    key={chip.key}
                    onPress={() => setFilter(chip.key)}
                    accessibilityRole="tab"
                    accessibilityLabel={`${chip.label} (${chip.count})`}
                    accessibilityState={{ selected: active }}
                    hitSlop={6}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      backgroundColor: active ? Colors.sage : '#F3F3EC',
                      borderColor: active ? Colors.sage : '#D6DECC',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter-SemiBold',
                        fontSize: 12,
                        color: active ? '#FFFFFF' : Colors.textMuted,
                      }}
                    >
                      {chip.label}
                      {chip.count > 0 ? ` (${chip.count})` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </FadeIn>
        ) : null}

        {insight ? (
          <FadeIn delay={180}>
            <GlassCard
              style={{
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {insight.excellentPct >= insight.avoidPct ? (
                <TrendingUp color={Colors.score.green} size={16} strokeWidth={2.4} />
              ) : (
                <TrendingDown color={Colors.score.orange} size={16} strokeWidth={2.4} />
              )}
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 12,
                  color: Colors.textMuted,
                  flex: 1,
                  lineHeight: 17,
                }}
              >
                Sur tes {insight.total} derniers scans : {insight.excellentPct}% excellents,{' '}
                {insight.avoidPct}% à éviter
              </Text>
            </GlassCard>
          </FadeIn>
        ) : null}

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
        ) : filtered.length === 0 ? (
          <View style={{ marginTop: 24, alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-SemiBold',
                fontSize: 16,
                color: Colors.text,
              }}
            >
              Aucun scan dans ce filtre
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: Colors.textMuted,
                textAlign: 'center',
              }}
            >
              Choisis un autre filtre pour voir d'autres scans.
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
