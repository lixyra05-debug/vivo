import { Pressable, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Heart, Package } from 'lucide-react-native';
import { MiniScoreCircle } from './MiniScoreCircle';
import { Colors } from '@/src/constants/colors';

interface Props {
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  score: number;
  scannedAt: string;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) {
    return `Aujourd'hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ScanHistoryCard({
  name,
  brand,
  imageUrl,
  score,
  scannedAt,
  isFavorite,
  onPress,
  onToggleFavorite,
}: Props) {
  const displayName = name ?? 'Produit inconnu';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}${brand ? `, ${brand}` : ''}. Score ${score} sur 100. ${formatDate(scannedAt)}`}
      accessibilityHint="Appuyer pour voir le détail du produit"
      className="flex-row items-center gap-3 rounded-vivo bg-white p-3 active:bg-cream-200"
      style={{
        shadowColor: '#8BAD8B',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-cream-200">
        {imageUrl ? (
          <ExpoImage
            source={{ uri: imageUrl }}
            style={{ width: 56, height: 56 }}
            contentFit="contain"
            transition={200}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            accessibilityLabel={`Photo de ${displayName}`}
          />
        ) : (
          <Package color={Colors.textMuted} size={22} />
        )}
      </View>
      <View className="flex-1" accessibilityElementsHidden>
        <Text className="font-semibold text-sage-800" numberOfLines={1}>
          {displayName}
        </Text>
        {brand ? (
          <Text className="text-xs text-sage-600" numberOfLines={1}>
            {brand}
          </Text>
        ) : null}
        <Text className="mt-1 text-xs text-sage-500">{formatDate(scannedAt)}</Text>
      </View>
      {onToggleFavorite ? (
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="h-9 w-9 items-center justify-center rounded-full bg-cream-200"
        >
          <Heart
            color={isFavorite ? Colors.score.red : Colors.textMuted}
            fill={isFavorite ? Colors.score.red : 'transparent'}
            size={18}
          />
        </Pressable>
      ) : null}
      <View accessibilityElementsHidden>
        <MiniScoreCircle score={score} />
      </View>
    </Pressable>
  );
}
