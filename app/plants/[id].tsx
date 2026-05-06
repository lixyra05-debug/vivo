import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { EVIDENCE_STYLES } from '@/src/components/plants/PlantListCard';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import {
  PLANT_CATEGORIES,
  getPlantById,
  type PlantEntry,
} from '@/src/data/plant-encyclopedia';

const FREE_PROPERTIES_PREVIEW = 80;

export default function PlantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const plant = id ? getPlantById(id) : undefined;

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  if (!plant) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, gap: 18 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backButton}
          >
            <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
          </Pressable>
          <View style={styles.center}>
            <Text style={styles.notFoundTitle}>Plante introuvable</Text>
            <Text style={styles.notFoundText}>
              Cette plante n'existe pas ou n'est plus disponible.
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 16 }}>
        <FadeIn delay={0}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backButton}
          >
            <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
          </Pressable>
        </FadeIn>

        <FadeIn delay={60}>
          <View style={styles.header}>
            <Text style={styles.emojiXl}>{plant.emoji}</Text>
            <Text style={styles.nameFr}>{plant.nameFr}</Text>
            <Text style={styles.nameLatin}>{plant.nameLatin}</Text>
          </View>
        </FadeIn>

        <PlantSection delay={100} title="Catégorie">
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryEmoji}>
              {PLANT_CATEGORIES[plant.category].emoji}
            </Text>
            <Text style={styles.categoryLabel}>
              {PLANT_CATEGORIES[plant.category].labelFr}
            </Text>
          </View>
        </PlantSection>

        <PlantSection delay={200} title="Propriétés documentées">
          <Text style={styles.bodyText}>
            {isExpert
              ? plant.properties
              : truncate(plant.properties, FREE_PROPERTIES_PREVIEW)}
          </Text>
        </PlantSection>

        {isExpert ? (
          <ExpertSections plant={plant} />
        ) : (
          <FadeIn delay={300}>
            <View style={{ marginTop: 4 }}>
              <PremiumPaywall
                featureKey="plant_database"
                onUpgrade={handleUpgrade}
              />
            </View>
          </FadeIn>
        )}

        {isExpert ? (
          <FadeIn delay={900}>
            <GlassCard style={styles.sourceCard}>
              <View
                style={[
                  styles.evidencePill,
                  { backgroundColor: EVIDENCE_STYLES[plant.evidenceLevel].bg },
                ]}
              >
                <Text
                  style={[
                    styles.evidencePillText,
                    { color: EVIDENCE_STYLES[plant.evidenceLevel].text },
                  ]}
                >
                  {EVIDENCE_STYLES[plant.evidenceLevel].labelFr}
                </Text>
              </View>
              <Text style={styles.sourceLabel}>Source</Text>
              <Text style={styles.sourceName}>{plant.source}</Text>
              <Pressable
                onPress={() => Linking.openURL(plant.sourceUrl).catch(() => undefined)}
                accessibilityRole="link"
                accessibilityLabel={`Ouvrir la source ${plant.source}`}
                style={({ pressed }) => [
                  styles.sourceLink,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <ExternalLink size={14} color={Colors.sage} strokeWidth={2.4} />
                <Text style={styles.sourceLinkText} numberOfLines={1}>
                  {plant.sourceUrl}
                </Text>
              </Pressable>
            </GlassCard>
          </FadeIn>
        ) : null}

        <FadeIn delay={isExpert ? 980 : 360}>
          <Text style={styles.disclaimer}>
            Ces informations sont fournies à titre éducatif. Elles ne remplacent
            pas un avis médical. Consultez un professionnel de santé.
          </Text>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}

interface ExpertSectionsProps {
  plant: PlantEntry;
}

function ExpertSections({ plant }: ExpertSectionsProps) {
  return (
    <>
      <PlantSection delay={300} title="Usage traditionnel">
        <Text style={styles.bodyText}>{plant.traditionalUse}</Text>
      </PlantSection>

      <PlantSection delay={400} title="Partie utilisée">
        <Text style={styles.bodyText}>{plant.partUsed}</Text>
      </PlantSection>

      <PlantSection delay={500} title="Préparation">
        <Text style={styles.bodyText}>{plant.preparation}</Text>
      </PlantSection>

      <FadeIn delay={600}>
        <GlassCard style={styles.contraindicationCard}>
          <Text style={styles.sectionTitle}>Contre-indications</Text>
          <Text style={[styles.bodyText, { color: '#7B1F1F' }]}>
            {plant.contraindications}
          </Text>
        </GlassCard>
      </FadeIn>

      <PlantSection delay={700} title="Interactions médicamenteuses">
        <Text style={styles.bodyText}>
          {plant.interactions ?? 'Aucune interaction notable documentée.'}
        </Text>
      </PlantSection>
    </>
  );
}

interface PlantSectionProps {
  delay: number;
  title: string;
  children: React.ReactNode;
}

function PlantSection({ delay, title, children }: PlantSectionProps) {
  return (
    <FadeIn delay={delay}>
      <GlassCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </GlassCard>
    </FadeIn>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
    shadowColor: '#587858',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 60,
  },
  notFoundTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
  },
  notFoundText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  emojiXl: {
    fontSize: 48,
    lineHeight: 56,
  },
  nameFr: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 28,
    color: Colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  nameLatin: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  sectionCard: {
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  bodyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(139, 173, 139, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  contraindicationCard: {
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.06)',
    borderColor: 'rgba(244, 67, 54, 0.24)',
  },
  sourceCard: {
    padding: 16,
    gap: 6,
  },
  evidencePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  evidencePillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  sourceLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  sourceName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sourceLinkText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.sage,
    flex: 1,
  },
  disclaimer: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
