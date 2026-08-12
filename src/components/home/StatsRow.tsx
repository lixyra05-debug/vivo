/**
 * StatsRow — les trois chiffres clés de l'utilisateur.
 *
 * v2 : le chiffre monte en `h1` (28) et le libellé descend en `micro` (11).
 * L'écart 28 → 11 est ce qui rend la donnée lisible en une fixation, là où le
 * couple 24/12 précédent faisait lire les deux lignes avec le même effort.
 * La carte passe en `flat` : c'est un bloc de service, pas un héros.
 */

import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Palette, Spacing, Type } from '@/src/constants/theme';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useUserStats } from '@/src/lib/stores/useProductStore';
import { formatStats } from '@/src/lib/home/formatters';

interface StatCellProps {
  value: string;
  label: string;
}

function StatCell({ value, label }: StatCellProps) {
  return (
    <View style={styles.cell}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export function StatsRow() {
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useUserStats(user?.id);
  const display = formatStats(stats);

  return (
    <GlassCard
      variant="flat"
      style={styles.card}
      accessibilityLabel="Tes statistiques de scan"
    >
      <StatCell value={display.scans} label="Scans" />
      <Divider />
      <StatCell value={display.average} label="Score moyen" />
      <Divider />
      <StatCell value={display.bad} label="À éviter" />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  value: {
    ...Type.h1,
    color: Palette.ink,
  },
  label: {
    ...Type.micro,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: Spacing.xxl,
    alignSelf: 'center',
    backgroundColor: Palette.borderSoft,
  },
});
