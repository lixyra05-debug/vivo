import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Share,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink, Heart, Leaf, ScanLine, Share2 } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/common/ToastProvider';
import { ScoreCircle } from '@/src/components/product/ScoreCircle';
import { NovaBadge } from '@/src/components/product/NovaBadge';
import { AdditiveCard } from '@/src/components/product/AdditiveCard';
import { SeedOilAlert } from '@/src/components/product/SeedOilAlert';
import { Colors } from '@/src/constants/colors';
import { productToScoringInput } from '@/src/lib/api/openfoodfacts';
import { calculateScore, findAdditive } from '@/src/lib/scoring/engine';
import { supabase } from '@/src/lib/api/supabase';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useProfileStore } from '@/src/lib/stores/useProfileStore';
import {
  useProduct,
  useRecordScan,
  useToggleFavorite,
} from '@/src/lib/stores/useProductStore';
import type { UserProfile } from '@/src/lib/api/types';

export default function ProductScreen() {
  const router = useRouter();
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const productQuery = useProduct(barcode ?? null);
  const recordScan = useRecordScan(user?.id);
  const toggleFavorite = useToggleFavorite(user?.id);

  const toast = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [scanRecorded, setScanRecorded] = useState(false);

  const userProfile: UserProfile = useMemo(
    () => ({
      type: profile?.health_profile ?? 'standard',
      allergies: profile?.allergies ?? [],
      intolerances: profile?.intolerances ?? [],
    }),
    [profile]
  );

  const result = useMemo(() => {
    if (!productQuery.data) return null;
    return calculateScore(productToScoringInput(productQuery.data), userProfile);
  }, [productQuery.data, userProfile]);

  useEffect(() => {
    if (!user || !barcode || !result || scanRecorded) return;
    setScanRecorded(true);
    recordScan.mutate({
      barcode,
      score: result.score_final,
      profile: userProfile.type,
      penalties: result.penalties,
    });
  }, [user, barcode, result, scanRecorded, recordScan, userProfile.type]);

  useEffect(() => {
    if (!user || !barcode) return;
    let cancelled = false;
    void supabase
      .from('scan_history')
      .select('is_favorite')
      .eq('user_id', user.id)
      .eq('barcode', barcode)
      .eq('is_favorite', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setIsFavorite(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, barcode]);

  async function onToggleFavorite() {
    if (!user || !barcode) return;
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      await toggleFavorite.mutateAsync({ barcode, next });
      toast.show(next ? 'Ajouté aux favoris' : 'Retiré des favoris');
    } catch (err) {
      setIsFavorite(!next);
      Alert.alert('Favoris', err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }

  async function handleShare() {
    if (!productQuery.data || !result) return;
    try {
      await Share.share({
        message: `${productQuery.data.name ?? 'Produit'} — Score Vivo ${result.score_final}/100`,
      });
    } catch {
      // ignore
    }
  }

  if (productQuery.isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.sage} size="large" />
          <Text className="mt-4 text-sage-700">Analyse en cours…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!productQuery.data || !result) {
    return (
      <ScreenContainer scroll>
        <View className="flex-1 items-center justify-center gap-6 py-10">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-cream-200">
            <ScanLine color={Colors.textMuted} size={40} />
          </View>
          <Text className="font-display text-2xl font-bold text-sage-800">
            Produit introuvable
          </Text>
          <Text className="max-w-sm text-center leading-6 text-sage-700">
            Le code-barres {barcode} n'a pas été trouvé dans la base Open Food Facts.
            Il est peut-être nouveau ou pas encore référencé.
          </Text>

          <View className="w-full gap-3">
            <Button label="Réessayer" onPress={() => productQuery.refetch()} />
            <Button
              label="Saisir un autre code"
              variant="outline"
              onPress={() => router.replace('/(tabs)/scan')}
            />
            <Button
              label="Contribuer sur Open Food Facts"
              variant="ghost"
              icon={<ExternalLink color={Colors.sage} size={16} />}
              onPress={() => {
                void Linking.openURL(
                  `https://world.openfoodfacts.org/cgi/product.pl?code=${barcode ?? ''}&action=display`
                );
              }}
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const product = productQuery.data;
  const additivePenalties = result.penalties.filter((p) => p.category === 'additive');
  const otherPenalties = result.penalties.filter(
    (p) => p.category !== 'additive' && p.points > 0
  );

  return (
    <ScreenContainer scroll>
      <View className="gap-6">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft color={Colors.text} size={20} />
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable
              onPress={onToggleFavorite}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
            >
              <Heart
                color={isFavorite ? Colors.score.red : Colors.text}
                fill={isFavorite ? Colors.score.red : 'transparent'}
                size={20}
              />
            </Pressable>
            <Pressable
              onPress={handleShare}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Partager ce produit"
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
            >
              <Share2 color={Colors.text} size={20} />
            </Pressable>
          </View>
        </View>

        <View className="items-center gap-3">
          {product.image_url ? (
            <ExpoImage
              source={{ uri: product.image_url }}
              style={{ width: 120, height: 120, borderRadius: 18 }}
              contentFit="contain"
              transition={250}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              accessibilityLabel={`Image de ${product.name ?? 'produit'}`}
            />
          ) : null}
          <Text className="font-display text-2xl font-bold text-sage-800 text-center">
            {product.name ?? 'Produit'}
          </Text>
          {product.brand ? (
            <Text className="text-sage-700">{product.brand}</Text>
          ) : null}
        </View>

        <View className="items-center gap-3">
          <ScoreCircle score={result.score_final} />
          {result.nova_group ? (
            <NovaBadge group={result.nova_group as 1 | 2 | 3 | 4} />
          ) : null}
        </View>

        {result.blockers.length > 0 ? (
          <View className="rounded-vivo bg-score-red/10 p-4">
            <Text className="font-semibold text-score-red">Bloquants détectés</Text>
            {result.blockers.map((b) => (
              <Text key={b} className="mt-1 text-sm text-sage-800">• {b}</Text>
            ))}
          </View>
        ) : null}

        <SeedOilAlert oils={result.seed_oils_detected} />

        {result.clean_labeling_alerts.length > 0 ? (
          <View className="rounded-vivo bg-score-yellow/10 p-4 gap-1">
            <Text className="font-semibold text-sage-800">Clean labeling</Text>
            {result.clean_labeling_alerts.map((a) => (
              <Text key={a} className="text-sm text-sage-700">⚠️ {a}</Text>
            ))}
          </View>
        ) : null}

        {additivePenalties.length > 0 ? (
          <View className="gap-3">
            <Text className="font-display text-lg font-semibold text-sage-800">Additifs</Text>
            {additivePenalties.map((p) => {
              const entry = findAdditive(p.code);
              return (
                <AdditiveCard
                  key={p.code}
                  code={p.code}
                  nameFr={entry?.nameFr ?? p.label}
                  penalty={p.points}
                  descriptionShort={entry?.descriptionShortFr ?? p.label}
                />
              );
            })}
          </View>
        ) : null}

        {otherPenalties.length > 0 ? (
          <View className="gap-2 rounded-vivo bg-white p-4">
            <Text className="font-display text-lg font-semibold text-sage-800">Pénalités</Text>
            {otherPenalties.map((p) => (
              <View key={`${p.code}-${p.label}`} className="flex-row justify-between">
                <Text className="flex-1 text-sage-800">{p.label}</Text>
                <Text className="text-sage-600">-{Math.round(p.points)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {result.profile_adjustments.length > 0 ? (
          <View className="gap-1 rounded-vivo bg-sage-50 p-4">
            <Text className="font-semibold text-sage-800">Ajustements profil</Text>
            {result.profile_adjustments.map((a) => (
              <Text key={a} className="text-sm text-sage-700">• {a}</Text>
            ))}
          </View>
        ) : null}

        <Button
          label="Voir les alternatives"
          onPress={() => router.push(`/swap/${product.barcode}`)}
          icon={<Leaf color="#fff" size={18} />}
        />
      </View>
    </ScreenContainer>
  );
}
