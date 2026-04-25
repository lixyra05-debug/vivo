/**
 * Écran "Comment Vivo note les produits".
 *
 * Sections : Header, Mission, Scoring alimentaire, Scoring cosmétique,
 * Sources scientifiques, FAQ accordéon, Indépendance.
 */

import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { GradientHeader } from '@/src/components/ui/GradientHeader';
import { Colors } from '@/src/constants/colors';
import { SCORING_METHODOLOGY } from '@/src/lib/education/transparency';

const WEIGHT_COLORS: Record<string, string> = {
  nova: '#8BAD8B',
  additives: '#FF9800',
  macros: '#FFC107',
  oils: '#C4A882',
  bonus: '#4CAF50',
  endocrine: '#F44336',
  irritant: '#FF9800',
  allergen: '#FFC107',
  silicone: '#C4A882',
  preservative: '#587858',
};

const WEIGHT_LABELS_FR: Record<string, string> = {
  nova: 'Niveau de transformation (NOVA)',
  additives: 'Additifs controversés',
  macros: 'Profil nutritionnel',
  oils: 'Huiles de graines',
  bonus: 'Bonus (bio, oméga-3...)',
  endocrine: 'Perturbateurs endocriniens',
  irritant: 'Tensioactifs irritants',
  allergen: 'Allergènes connus',
  silicone: 'Silicones occlusifs',
  preservative: 'Conservateurs',
};

interface WeightBarProps {
  axisKey: string;
  weight: number;
}

function WeightBar({ axisKey, weight }: WeightBarProps) {
  const color = WEIGHT_COLORS[axisKey] ?? Colors.sage;
  const label = WEIGHT_LABELS_FR[axisKey] ?? axisKey;
  return (
    <View style={styles.weightRow}>
      <Text style={styles.weightLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.weightTrack}>
        <View
          style={[
            styles.weightFill,
            { backgroundColor: color, width: `${Math.min(weight * 2, 100)}%` },
          ]}
        />
      </View>
      <Text style={[styles.weightValue, { color }]}>{weight}%</Text>
    </View>
  );
}

interface FaqItemProps {
  questionFr: string;
  answerFr: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItem({ questionFr, answerFr, isOpen, onToggle }: FaqItemProps) {
  return (
    <GlassCard style={styles.faqCard}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={questionFr}
        style={styles.faqHeader}
      >
        <Text style={styles.faqQuestion}>{questionFr}</Text>
        {isOpen ? (
          <ChevronUp color={Colors.textMuted} size={18} strokeWidth={2.2} />
        ) : (
          <ChevronDown color={Colors.textMuted} size={18} strokeWidth={2.2} />
        )}
      </Pressable>
      {isOpen ? <Text style={styles.faqAnswer}>{answerFr}</Text> : null}
    </GlassCard>
  );
}

export default function MethodologyScreen() {
  const router = useRouter();
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const food = SCORING_METHODOLOGY.food;
  const cosmetic = SCORING_METHODOLOGY.cosmetic;

  function openSource(url: string) {
    if (Platform.OS === 'web') return;
    WebBrowser.openBrowserAsync(url).catch(() => undefined);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <GradientHeader height={120}>
        <View style={styles.headerInner}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backBtn}
          >
            <ArrowLeft color={Colors.text} size={20} strokeWidth={2.2} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Comment Vivo note les produits</Text>
            <Text style={styles.headerSubtitle}>Notre algorithme expliqué</Text>
          </View>
        </View>
      </GradientHeader>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={0}>
          <GlassCard style={styles.missionCard}>
            <View style={styles.missionHeader}>
              <Scale color={Colors.sage} size={18} strokeWidth={2.2} />
              <Text style={styles.cardTitle}>Notre mission</Text>
            </View>
            <Text style={styles.body}>
              Vivo applique un système de pénalités scientifiques à partir d'une base 100.
              Aucune compensation entre critères : un poison reste un poison.
            </Text>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={100}>
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Scoring alimentaire</Text>
            <Text style={styles.formula}>{food.formulaFr}</Text>
            <View style={{ gap: 10, marginTop: 4 }}>
              {Object.entries(food.weights).map(([key, weight]) => (
                <WeightBar key={key} axisKey={key} weight={weight} />
              ))}
            </View>
            <View style={styles.thresholdsRow}>
              <ThresholdPill label="Excellent" min={food.thresholds.excellent} color={Colors.score.green} />
              <ThresholdPill label="Bon" min={food.thresholds.good} color={Colors.score.yellow} />
              <ThresholdPill label="Moyen" min={food.thresholds.mediocre} color={Colors.score.orange} />
              <ThresholdPill label="À éviter" min={food.thresholds.bad} color={Colors.score.red} />
            </View>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={180}>
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Scoring cosmétique</Text>
            <Text style={styles.formula}>{cosmetic.formulaFr}</Text>
            <View style={{ gap: 10, marginTop: 4 }}>
              {Object.entries(cosmetic.weights).map(([key, weight]) => (
                <WeightBar key={key} axisKey={key} weight={weight} />
              ))}
            </View>
            <View style={styles.thresholdsRow}>
              <ThresholdPill label="Excellent" min={cosmetic.thresholds.excellent} color={Colors.score.green} />
              <ThresholdPill label="Bon" min={cosmetic.thresholds.good} color={Colors.score.yellow} />
              <ThresholdPill label="Moyen" min={cosmetic.thresholds.mediocre} color={Colors.score.orange} />
              <ThresholdPill label="À éviter" min={cosmetic.thresholds.bad} color={Colors.score.red} />
            </View>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={260}>
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Sources scientifiques</Text>
            <View style={{ gap: 6, marginTop: 6 }}>
              {[...food.sources, ...cosmetic.sources].map((src) => (
                <Pressable
                  key={src.url}
                  onPress={() => openSource(src.url)}
                  accessibilityRole="link"
                  accessibilityLabel={src.name}
                  style={styles.sourceRow}
                >
                  <Text style={styles.sourceText}>{src.name}</Text>
                  <ExternalLink color={Colors.textMuted} size={14} strokeWidth={2.2} />
                </Pressable>
              ))}
            </View>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={340}>
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionLabel}>Questions fréquentes</Text>
            {SCORING_METHODOLOGY.faq.map((entry, i) => (
              <FaqItem
                key={entry.questionFr}
                questionFr={entry.questionFr}
                answerFr={entry.answerFr}
                isOpen={openFaqIdx === i}
                onToggle={() =>
                  setOpenFaqIdx((prev) => (prev === i ? null : i))
                }
              />
            ))}
          </View>
        </FadeIn>

        <FadeIn delay={420}>
          <GlassCard tone="info" style={styles.sectionCard}>
            <View style={styles.missionHeader}>
              <ShieldCheck color={Colors.sage} size={18} strokeWidth={2.2} />
              <Text style={styles.cardTitle}>Indépendance</Text>
            </View>
            <Text style={styles.body}>
              Vivo ne reçoit aucun financement de marque ni d'industriel. Le scoring est
              public et auditable. Aucun produit n'est mis en avant contre rémunération.
            </Text>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={500}>
          <View style={styles.footer}>
            <Sparkles color={Colors.sage} size={14} strokeWidth={2.2} />
            <Text style={styles.footerText}>
              Vivo — un scoring scientifique, pour ta santé.
            </Text>
          </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

interface ThresholdPillProps {
  label: string;
  min: number;
  color: string;
}

function ThresholdPill({ label, min, color }: ThresholdPillProps) {
  return (
    <View
      style={[
        styles.thresholdPill,
        { backgroundColor: `${color}1A`, borderColor: `${color}55` },
      ]}
    >
      <Text style={[styles.thresholdLabel, { color }]}>{label}</Text>
      <Text style={styles.thresholdValue}>≥{min}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 19,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
  },
  missionCard: {
    padding: 16,
    gap: 8,
  },
  sectionCard: {
    padding: 16,
    gap: 10,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  formula: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.text,
    backgroundColor: '#F2F2EB',
    padding: 10,
    borderRadius: 12,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.text,
    width: 110,
  },
  weightTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EEEEE3',
    overflow: 'hidden',
  },
  weightFill: {
    height: 8,
    borderRadius: 4,
  },
  weightValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    width: 36,
    textAlign: 'right',
  },
  thresholdsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  thresholdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  thresholdLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
  thresholdValue: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.textMuted,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEE3',
  },
  sourceText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    paddingRight: 12,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    paddingLeft: 4,
  },
  faqCard: {
    padding: 14,
    gap: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  faqAnswer: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.textMuted,
    opacity: 0.8,
  },
});
