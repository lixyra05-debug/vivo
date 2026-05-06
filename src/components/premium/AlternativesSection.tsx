import { StyleSheet, Text, View } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { AlternativeCard } from './AlternativeCard';
import { PremiumPaywall } from './PremiumPaywall';
import { FadeIn } from '@/src/components/ui/FadeIn';
import {
  getAlternativesTitle,
  type Alternative,
} from '@/src/lib/api/smart-alternatives';
import { Colors } from '@/src/constants/colors';

interface AlternativesSectionProps {
  alternatives: Alternative[];
  isPremium: boolean;
  currentScore: number;
  isLoading: boolean;
  onUnlock: () => void;
  onPressAlt: (barcode: string) => void;
}

const SKELETON_LINES = 3;

export function AlternativesSection({
  alternatives,
  isPremium,
  currentScore,
  isLoading,
  onUnlock,
  onPressAlt,
}: AlternativesSectionProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header currentScore={currentScore} />
        <View testID="alternatives-skeleton" style={styles.list}>
          {Array.from({ length: SKELETON_LINES }).map((_, i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      </View>
    );
  }

  if (alternatives.length === 0) {
    return null;
  }

  if (isPremium) {
    return (
      <View style={styles.container}>
        <Header currentScore={currentScore} />
        <View style={styles.list}>
          {alternatives.map((alt, index) => (
            <FadeIn key={alt.barcode} delay={100 * index}>
              <AlternativeCard alt={alt} onPress={onPressAlt} />
            </FadeIn>
          ))}
        </View>
      </View>
    );
  }

  // Free
  const teaser = alternatives[0];
  const remaining = alternatives.length - 1;
  return (
    <View style={styles.container}>
      <Header currentScore={currentScore} />
      <View
        testID="alternatives-free-preview"
        pointerEvents="none"
        style={styles.freePreview}
      >
        <AlternativeCard alt={teaser} onPress={onPressAlt} />
      </View>
      {remaining > 0 ? (
        <Text style={styles.teaser}>
          et {remaining} autre{remaining > 1 ? 's' : ''} alternative
          {remaining > 1 ? 's' : ''} premium…
        </Text>
      ) : null}
      <PremiumPaywall
        featureKey="smart_alternatives"
        onUpgrade={() => onUnlock()}
      />
    </View>
  );
}

interface HeaderProps {
  currentScore: number;
}

function Header({ currentScore }: HeaderProps) {
  return (
    <View>
      <View style={styles.headerRow}>
        <Leaf color={Colors.sage} size={18} strokeWidth={2.4} />
        <Text style={styles.title}>{getAlternativesTitle(currentScore)}</Text>
      </View>
      <Text style={styles.subtitle}>
        Des produits similaires mieux notés que celui-ci.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
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
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  list: {
    gap: 10,
  },
  skeletonCard: {
    height: 85,
    backgroundColor: '#EAEDE3',
    borderRadius: 18,
  },
  freePreview: {
    opacity: 0.25,
  },
  teaser: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
