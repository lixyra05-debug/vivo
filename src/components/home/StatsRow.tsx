import { Text, View } from 'react-native';
import { useAuthStore } from '@/src/lib/stores/useAuthStore';
import { useUserStats } from '@/src/lib/stores/useProductStore';
import { formatStats } from '@/src/lib/home/formatters';

interface StatCellProps {
  value: string;
  label: string;
}

function StatCell({ value, label }: StatCellProps) {
  return (
    <View className="flex-1 items-center">
      <Text
        className="text-2xl text-sage-800"
        style={{ fontFamily: 'BricolageGrotesque-SemiBold' }}
      >
        {value}
      </Text>
      <Text
        className="mt-1 text-xs text-sage-600"
        style={{ fontFamily: 'Inter-Medium', letterSpacing: 0.4 }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function Divider() {
  return <View className="h-8 w-px self-center bg-cream-400/60" />;
}

export function StatsRow() {
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useUserStats(user?.id);
  const display = formatStats(stats);

  return (
    <View
      className="flex-row items-center justify-between rounded-3xl bg-cream-200/80 px-5 py-5"
      accessibilityLabel="Tes statistiques de scan"
    >
      <StatCell value={display.scans} label="Scans" />
      <Divider />
      <StatCell value={display.average} label="Score moyen" />
      <Divider />
      <StatCell value={display.bad} label="À éviter" />
    </View>
  );
}
