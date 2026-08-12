/**
 * PackagingSection — affiche les risques d'emballage détectés.
 *
 * Consomme `packagings[]` d'OFF/OBF (un composant = un matériau + une forme +
 * un contact alimentaire) et non plus `packaging_tags`, dont les entrées à
 * plat pouvaient annoncer « Aluminium » sur une bouteille en PET.
 *
 * Retourne `null` quand rien n'est détecté — y compris quand `packagings[]`
 * est absent du produit. Aucun repli sur l'ancienne source : mieux vaut pas de
 * section qu'une section fausse.
 *
 * Sources EFSA / ANSES / ECHA / CIRC / OMS / eur-lex affichées en footer.
 */

import { StyleSheet, Text, View } from 'react-native';
import {
  Package,
  Recycle,
  AlertCircle,
  HelpCircle,
  Lightbulb,
} from 'lucide-react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Colors } from '@/src/constants/colors';
import {
  detectPackagingRisk,
  type PackagingComponent,
  type PackagingRiskLevel,
} from '@/src/data/packaging-risks';

interface PackagingSectionProps {
  packagings: PackagingComponent[] | null | undefined;
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

export const RECYCLABILITY_UNKNOWN_LABEL = 'Recyclabilité inconnue';

/**
 * Trois états, pas deux. `null` signifie que la recyclabilité dépend de la
 * composition réelle, que la donnée OFF ne précise pas — l'afficher comme
 * « Non recyclable » transformerait une absence de donnée en verdict, sur des
 * matériaux génériques qui représentent 42 % des composants observés.
 *
 * L'état inconnu est neutre : même gris que « Non recyclable », mais une icône
 * différente, pour qu'il ne se lise pas comme un jugement atténué.
 */
function RecyclabilityRow({ recyclable }: { recyclable: boolean | null }) {
  if (recyclable === null) {
    return (
      <View style={styles.recyclableRow}>
        <HelpCircle color={Colors.textMuted} size={13} strokeWidth={2.2} />
        <Text style={[styles.recyclableText, { color: Colors.textMuted }]}>
          {RECYCLABILITY_UNKNOWN_LABEL}
        </Text>
      </View>
    );
  }

  const color = recyclable ? Colors.score.green : Colors.textMuted;
  return (
    <View style={styles.recyclableRow}>
      <Recycle color={color} size={13} strokeWidth={2.2} />
      <Text style={[styles.recyclableText, { color }]}>
        {recyclable ? 'Recyclable' : 'Non recyclable'}
      </Text>
    </View>
  );
}

export function PackagingSection({ packagings }: PackagingSectionProps) {
  const components = Array.isArray(packagings) ? packagings : [];
  const materials = detectPackagingRisk(components);

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

              <RecyclabilityRow recyclable={m.recyclable} />
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
