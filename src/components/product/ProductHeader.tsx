import { StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Leaf } from 'lucide-react-native';
import { Colors, scoreColor } from '@/src/constants/colors';

interface ProductHeaderProps {
  name?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  score: number;
  isOrganic: boolean;
  category?: string | null;
}

export function ProductHeader({
  name,
  brand,
  imageUrl,
  score,
  isOrganic,
  category,
}: ProductHeaderProps) {
  const displayName = name && name.trim().length > 0 ? name : 'Produit';
  const color = scoreColor(score);
  const haloColor = `${color}14`;

  const a11yLabel = `${displayName}${brand ? `, ${brand}` : ''}${isOrganic ? ', produit bio' : ''}`;

  return (
    <View style={styles.container} accessibilityLabel={a11yLabel}>
      <View style={styles.imageZone}>
        <View style={[styles.halo, { backgroundColor: haloColor }]} />
        {imageUrl ? (
          <ExpoImage
            source={{ uri: imageUrl }}
            style={styles.productImage}
            contentFit="contain"
            transition={300}
            accessibilityLabel={`Image de ${displayName}`}
          />
        ) : (
          <View style={styles.fallbackImage}>
            <Leaf color={Colors.sage} size={48} strokeWidth={1.6} />
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {displayName}
      </Text>

      {brand ? <Text style={styles.brand}>{brand}</Text> : null}

      {(isOrganic || category) ? (
        <View style={styles.chipsRow}>
          {isOrganic ? (
            <View style={styles.chipBio}>
              <Text style={styles.chipBioText}>Bio</Text>
            </View>
          ) : null}
          {category ? (
            <View style={styles.chipCategory}>
              <Text style={styles.chipCategoryText} numberOfLines={1}>
                {category}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  imageZone: {
    position: 'relative',
    width: 260,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
  },
  productImage: {
    width: 180,
    height: 180,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#587858',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  fallbackImage: {
    width: 180,
    height: 180,
    borderRadius: 24,
    backgroundColor: '#F3F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 24,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    paddingHorizontal: 16,
  },
  brand: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  chipBio: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#E2EBE2',
  },
  chipBioText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#405A40',
  },
  chipCategory: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F3F3EC',
    maxWidth: 240,
  },
  chipCategoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#405A40',
  },
});
