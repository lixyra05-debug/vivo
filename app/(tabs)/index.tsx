import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Greeting } from '@/src/components/home/Greeting';
import { OrganicBlob } from '@/src/components/home/OrganicBlob';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { StatsRow } from '@/src/components/home/StatsRow';

const BLOB_SIZE = 320;
const HALO_SIZE = 360;

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll>
      <View className="flex-1 gap-10 pt-2">
        <Greeting />

        <View
          className="items-center justify-center"
          style={{ height: BLOB_SIZE + 40 }}
          accessibilityElementsHidden={Platform.OS === 'ios' ? false : undefined}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: HALO_SIZE,
              height: HALO_SIZE,
              borderRadius: HALO_SIZE / 2,
              backgroundColor: '#E2EBE2',
              opacity: 0.55,
              shadowColor: '#8BAD8B',
              shadowOpacity: 0.28,
              shadowRadius: 40,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            }}
          />
          <OrganicBlob size={BLOB_SIZE} />
        </View>

        <StatsRow />

        <View className="mt-auto">
          <PrimaryCTA
            label="Lancer le scan"
            icon={<ScanLine color="#FFFFFF" size={20} strokeWidth={2.2} />}
            onPress={() => router.push('/(tabs)/scan')}
            accessibilityHint="Ouvre la caméra pour scanner un produit"
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
