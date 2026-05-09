/**
 * PackagingSection — affiche les risques d'emballage détectés via OFF/OBF tags.
 *
 * Run `detectPackagingRisk` sur les tags packaging du produit. Retourne `null`
 * si rien n'est détecté (cas le plus fréquent — beaucoup de produits OFF/OBF
 * n'ont pas leurs tags packaging structurés). Sinon, GlassCard avec une row
 * par matériau : nom, chip risk, premier concern, tip, indicateur recyclable.
 *
 * Sources EFSA / ANSES / ECHA / CIRC / OMS / eur-lex affichées en footer.
 */

import { StyleSheet, Text, View } from 'react-native';
import { Package, Recycle, AlertCircle, Lightbulb } from 'lucide-react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import {
  detectPackagingRisk,
  type PackagingRiskLevel,
} from '@/src/data/packaging-risks';

interface PackagingSectionProps {
  packagingTags: string[] | null | undefined;
}

const RISK_CHIP_STYLE: Record<
  PackagingRiskLevel,
  { bg: string; fg: string; label: string }
> = {
  high: {
    bg: 'rgba(244, 67, 54, 0.12)',
    fg: '#B5311E',
    label: 'Risque élevé',
  },
  moderate: {
    bg: 'rgba(255, 152, 0, 0.14)',
    fg: '#B96B00',
    label: 'Risque modéré',
  },
  low: {
    bg: 'rgba(139, 173, 139, 0.18)',
    fg: '#3A6B3A',
    label: 'Risque faible',
  },
};

export function PackagingSection({ packagingTags }: PackagingSectionProps) {
  const tags = Array.isArray(packagingTags) ? packagingTags : [];
  const materials = detectPackagingRisk(tags);

  if (materials.length === 0) return null;

  const allSources = Array.from(
    new Set(materials.flatMap((m) => m.sources)),
  ).slice(0, 5);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <Package color={Colors.text} size={18} strokeWidth={2.2} />
        <Text style={styles.title}>Emballage analysé</Text>
      </View>
      <Text style={styles.subtitle}>
        Risques toxicologiques associés aux matériaux détectés.
      </Text>

      <View style={styles.materialsList}>
        {materials.map((m) => {
          const chip = RISK_CHIP_STYLE[m.riskLevel];
          return (
            <View key={m.id} style={styles.materialRow}>
              <View style={styles.materialHeader}>
                <Text style={styles.materialName}>{m.nameFr}</Text>
                <View style={[styles.chip, { backgroundColor: chip.bg }]}>
                  <Text style={[styles.chipText, { color: chip.fg }]}>
                    {chip.label}
                  </Text>
                </View>
              </View>

              {m.concerns.slice(0, 2).map((c) => (
                <View key={c} style={styles.concernRow}>
                  <AlertCircle
                    color={Colors.textMuted}
                    size={13}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.concernText}>{c}</Text>
                </View>
              ))}

              <View style={styles.tipRow}>
                <Lightbulb color={Colors.sage} size={13} strokeWidth={2.2} />
                <Text style={styles.tipText}>{m.tip}</Text>
              </View>

              <View style={styles.recyclableRow}>
                <Recycle
                  color={m.recyclable ? Colors.score.green : Colors.textMuted}
                  size={13}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.recyclableText,
                    {
                      color: m.recyclable
                        ? Colors.score.green
                        : Colors.textMuted,
                    },
                  ]}
                >
                  {m.recyclable ? 'Recyclable' : 'Non recyclable'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sourcesFooter}>Sources : {allSources.join(' · ')}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  materialsList: {
    gap: 14,
  },
  materialRow: {
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 235, 226, 0.7)',
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  materialName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
    flexShrink: 1,
  },
  chip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  concernRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  concernText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    flex: 1,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  tipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
    flex: 1,
  },
  recyclableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  recyclableText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  sourcesFooter: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    paddingTop: 4,
  },
});
