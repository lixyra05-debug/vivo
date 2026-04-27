import { Image, StyleSheet, Text, View } from 'react-native';

const LOGO_MAP: Record<string, number> = {
  aldi: require('@/assets/logos/stores/aldi.png'),
  auchan: require('@/assets/logos/stores/auchan.png'),
  carrefour: require('@/assets/logos/stores/carrefour.png'),
  casino: require('@/assets/logos/stores/casino.png'),
  franprix: require('@/assets/logos/stores/franprix.png'),
  intermarche: require('@/assets/logos/stores/intermarche.png'),
  leclerc: require('@/assets/logos/stores/leclerc.png'),
  lidl: require('@/assets/logos/stores/lidl.png'),
  monoprix: require('@/assets/logos/stores/monoprix.png'),
  picard: require('@/assets/logos/stores/picard.png'),
};

export type StoreLogoVariant = 'card' | 'header';

interface StoreLogoProps {
  slug: string;
  emoji: string;
  variant?: StoreLogoVariant;
  testID?: string;
}

const SIZES: Record<StoreLogoVariant, { width: number; height: number; emojiFontSize: number; emojiLineHeight: number }> = {
  card:   { width: 80, height: 44, emojiFontSize: 36, emojiLineHeight: 42 },
  header: { width: 96, height: 56, emojiFontSize: 48, emojiLineHeight: 54 },
};

export function StoreLogo({ slug, emoji, variant = 'card', testID }: StoreLogoProps) {
  const source = LOGO_MAP[slug];
  const dims = SIZES[variant];

  if (source) {
    return (
      <View
        style={[styles.container, { width: dims.width, height: dims.height }]}
        accessibilityRole="image"
        accessibilityLabel={`Logo ${slug}`}
        testID={testID}
      >
        <Image
          source={source}
          style={styles.image}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
    );
  }

  return (
    <Text
      style={{ fontSize: dims.emojiFontSize, lineHeight: dims.emojiLineHeight }}
      allowFontScaling={false}
      testID={testID}
    >
      {emoji}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
