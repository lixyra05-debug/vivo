import { Linking, Platform, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ExternalLink } from 'lucide-react-native';
import { Colors } from '@/src/constants/colors';

interface Props {
  barcode: string;
  source: 'off' | 'obf';
  lastUpdated?: string | null;
}

const FR_MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

export function formatFrenchDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDate();
  const month = FR_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function SourceLink({ barcode, source, lastUpdated }: Props) {
  const url =
    source === 'off'
      ? `https://world.openfoodfacts.org/product/${barcode}`
      : `https://world.openbeautyfacts.org/product/${barcode}`;
  const sourceLabel = source === 'off' ? 'Open Food Facts' : 'Open Beauty Facts';
  const formatted = formatFrenchDate(lastUpdated);

  function handlePress() {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    Linking.openURL(url).catch(() => undefined);
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={`Voir la fiche sur ${sourceLabel}`}
      style={styles.row}
    >
      <Text style={styles.text}>
        Source : {sourceLabel}
        {formatted ? ` · MAJ ${formatted}` : ''}
      </Text>
      <ExternalLink color={Colors.textMuted} size={12} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
});
