import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/src/constants/colors';

export type HistoryType = 'all' | 'food' | 'cosmetic';

interface HistoryTypeTabsProps {
  value: HistoryType;
  onChange: (next: HistoryType) => void;
  counts: { all: number; food: number; cosmetic: number };
}

interface TabDef {
  key: HistoryType;
  label: string;
  count: number;
  a11y: string;
}

export function HistoryTypeTabs({ value, onChange, counts }: HistoryTypeTabsProps) {
  const tabs: TabDef[] = [
    { key: 'all', label: 'Tous', count: counts.all, a11y: 'Tous les scans' },
    {
      key: 'food',
      label: 'Alimentation',
      count: counts.food,
      a11y: 'Scans Alimentation',
    },
    {
      key: 'cosmetic',
      label: 'Cosmétiques',
      count: counts.cosmetic,
      a11y: 'Scans Cosmétiques',
    },
  ];

  function handleSelect(next: HistoryType) {
    if (next === value) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    onChange(next);
  }

  return (
    <View
      style={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel="Filtrer par type de produit"
    >
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handleSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.a11y} (${tab.count})`}
            accessibilityState={{ selected: active }}
            hitSlop={6}
            style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
          >
            <Text
              style={[
                styles.label,
                active ? styles.labelActive : styles.labelInactive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
            <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
              <Text
                style={[
                  styles.badgeText,
                  active ? styles.badgeTextActive : styles.badgeTextInactive,
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#F3F3EC',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#587858',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillInactive: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 12,
  },
  labelActive: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.text,
  },
  labelInactive: {
    fontFamily: 'Inter-Medium',
    color: Colors.textMuted,
  },
  badge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(139, 173, 139, 0.18)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(120, 120, 110, 0.12)',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  badgeTextActive: {
    color: Colors.sage,
  },
  badgeTextInactive: {
    color: Colors.textMuted,
  },
});
