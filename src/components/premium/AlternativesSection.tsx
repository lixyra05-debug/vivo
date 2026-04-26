import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { AlternativeCard } from './AlternativeCard';
import { PremiumPaywall } from './PremiumPaywall';
import {
  findAlternatives,
  type AlternativeProduct,
} from '@/src/lib/api/smart-alternatives';
import { Colors } from '@/src/constants/colors';

interface AlternativesSectionProps {
  scannedBarcode: string;
  categoryTag: string | null | undefined;
  currentScore: number;
  isPremium: boolean;
  onUnlock: () => void;
  onPressAlt: (barcode: string) => void;
}

const SCORE_THRESHOLD = 70;

export function AlternativesSection({
  scannedBarcode,
  categoryTag,
  currentScore,
  isPremium,
  onUnlock,
  onPressAlt,
}: AlternativesSectionProps) {
  const [alts, setAlts] = useState<AlternativeProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  const shouldFetch = currentScore < SCORE_THRESHOLD && Boolean(categoryTag);

  useEffect(() => {
    if (!shouldFetch) {
      setAlts([]);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    findAlternatives(scannedBarcode, categoryTag, currentScore)
      .then((res) => {
        if (cancelled) return;
        setAlts(res);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setAlts([]);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [shouldFetch, scannedBarcode, categoryTag, currentScore]);

  if (currentScore >= SCORE_THRESHOLD) return null;
  if (!loaded) return null;
  if (alts.length === 0) return null;

  const visibleAlts = isPremium ? alts.slice(0, 3) : alts.slice(0, 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Leaf color={Colors.sage} size={18} strokeWidth={2.4} />
        <Text style={styles.title}>Meilleures alternatives</Text>
      </View>
      <Text style={styles.subtitle}>
        Des produits similaires mieux notés que celui-ci.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleAlts.map((alt) => (
          <AlternativeCard key={alt.barcode} alt={alt} onPress={onPressAlt} />
        ))}
      </ScrollView>

      {!isPremium ? (
        <PremiumPaywall
          title="Voir toutes les alternatives"
          description="Accédez aux 3 produits classés par delta de score, mis à jour en continu via Open Food Facts."
          onUnlock={onUnlock}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  scrollContent: {
    gap: 12,
    paddingVertical: 4,
  },
});
