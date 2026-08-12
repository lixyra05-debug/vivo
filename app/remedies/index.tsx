import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { GradientHeader } from '@/src/components/ui/GradientHeader';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { PremiumPaywall } from '@/src/components/premium/PremiumPaywall';
import { Colors } from '@/src/constants/colors';
import { usePremium } from '@/src/lib/hooks/usePremium';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { REMEDY_CATEGORIES } from '@/src/lib/remedies/remedy-finder';

export default function RemediesIndexScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { tier } = usePremium(userId);
  const isExpert = tier === 'expert';

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  function handleUpgrade(targetTier: 'premium' | 'expert') {
    router.push(`/settings/subscription?tier=${targetTier}`);
  }

  function handleCategoryPress(id: string) {
    if (isExpert) {
      router.push(`/remedies/${id}`);
      return;
    }
    setSelectedCategoryId(id);
  }

  return (
    <ScreenContainer scroll>
      <View style={{ gap: 18 }}>
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
          <GradientHeader height={120}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Chercheur de Remèdes</Text>
              <Text style={styles.subtitle}>8 catégories de bien-être</Text>
            </View>
          </GradientHeader>
        </FadeIn>

        <FadeIn delay={140}>
          <View style={styles.grid}>
            {REMEDY_CATEGORIES.map((cat, index) => {
              const a11y = `${cat.labelFr} — ${cat.description}`;
              return (
                <FadeIn
                  key={cat.id}
                  delay={Math.min(180 + index * 40, 540)}
                  style={styles.gridCell}
                >
                  <Pressable
                    onPress={() => handleCategoryPress(cat.id)}
                    accessibilityRole="button"
                    accessibilityLabel={a11y}
                    style={({ pressed }) => [
                      styles.pressable,
                      pressed && styles.pressed,
                    ]}
                  >
                    <GlassCard style={styles.categoryCard}>
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={styles.categoryLabel}>{cat.labelFr}</Text>
                      <Text
                        style={styles.categoryDescription}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {cat.description}
                      </Text>
                    </GlassCard>
                  </Pressable>
                </FadeIn>
              );
            })}
          </View>
        </FadeIn>

        {!isExpert && selectedCategoryId !== null ? (
          <FadeIn delay={0}>
            <View style={{ marginTop: 4 }}>
              <PremiumPaywall
                featureKey="herbal_remedies"
                onUpgrade={handleUpgrade}
              />
            </View>
          </FadeIn>
        ) : null}

        <FadeIn delay={420}>
          <Text style={styles.disclaimer}>
            Ces informations sont fournies à titre éducatif. Elles ne remplacent
            pas un avis médical. Consultez un professionnel de santé.
          </Text>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
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
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 4,
  },
  title: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 26,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCell: {
    width: '48%',
    flexGrow: 0,
  },
  pressable: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
  },
  categoryCard: {
    padding: 14,
    borderRadius: 16,
    minHeight: 130,
    alignItems: 'flex-start',
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  categoryLabel: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  categoryDescription: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
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
