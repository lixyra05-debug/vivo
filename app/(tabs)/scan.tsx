import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { Button } from '@/src/components/ui/Button';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useToast } from '@/src/components/common/ToastProvider';
import { Colors } from '@/src/constants/colors';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export default function ScanScreen() {
  const router = useRouter();
  const toast = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(true);
  const [manual, setManual] = useState('');
  const lastScan = useRef<{ value: string; at: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => setActive(false);
    }, [])
  );

  function handleBarcode({ data }: { data: string }) {
    if (!data) return;
    const now = Date.now();
    if (lastScan.current && lastScan.current.value === data && now - lastScan.current.at < 3000) {
      return;
    }
    lastScan.current = { value: data, at: now };
    setActive(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    toast.show('Code-barres détecté — analyse en cours');
    router.push(`/product/${data}`);
  }

  function submitManual() {
    const code = manual.trim();
    if (!code) return;
    if (!/^\d{6,14}$/.test(code)) {
      Alert.alert('Code invalide', 'Saisis un code-barres EAN/UPC (6-14 chiffres).');
      return;
    }
    router.push(`/product/${code}`);
  }

  if (Platform.OS === 'web') {
    return (
      <ScreenContainer>
        <View className="flex-1 gap-6">
          <View className="gap-2">
            <Text className="font-display text-3xl font-bold text-sage-800">Scanner</Text>
            <Text className="text-sage-700">
              Le scanner caméra n'est disponible que sur mobile. Saisis un code-barres pour tester.
            </Text>
          </View>
          <TextInput
            value={manual}
            onChangeText={setManual}
            keyboardType="number-pad"
            placeholder="Ex : 5449000000996"
            placeholderTextColor={Colors.textMuted}
            className="rounded-2xl bg-white px-4 py-3 text-base text-sage-800"
            accessibilityLabel="Saisie manuelle du code-barres"
          />
          <Button label="Analyser" onPress={submitManual} />
        </View>
      </ScreenContainer>
    );
  }

  if (!permission) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-sage-700">Initialisation de la caméra…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center gap-4">
          <ScanLine color={Colors.sage} size={48} accessibilityLabel="Icône scanner" />
          <Text className="font-display text-2xl text-sage-800">Accès caméra</Text>
          <Text className="text-center text-sage-700">
            Vivo a besoin de la caméra pour scanner les codes-barres.
          </Text>
          <Button label="Autoriser la caméra" onPress={requestPermission} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View className="flex-1 bg-black" accessibilityLabel="Vue caméra scanner">
      {active ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
          onBarcodeScanned={handleBarcode}
        />
      ) : (
        <View className="flex-1 bg-black" />
      )}
      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        <View
          className="h-48 w-72 rounded-vivo border-2 border-white/70"
          accessibilityLabel="Zone de cadrage du code-barres"
        />
      </View>
      <View className="absolute left-0 right-0 top-16 items-center">
        <Text className="rounded-full bg-black/50 px-4 py-2 text-white">
          Cadre le code-barres
        </Text>
      </View>
      <View className="absolute bottom-10 left-6 right-6 gap-3">
        <TextInput
          value={manual}
          onChangeText={setManual}
          keyboardType="number-pad"
          placeholder="Saisie manuelle (EAN)"
          placeholderTextColor="#9AA59A"
          className="rounded-2xl bg-white/95 px-4 py-3 text-base text-sage-800"
          accessibilityLabel="Saisie manuelle du code-barres"
        />
        <Pressable
          onPress={submitManual}
          accessibilityRole="button"
          accessibilityLabel="Analyser ce code-barres"
          className="items-center justify-center rounded-2xl bg-sage-400 py-3"
        >
          <Text className="font-semibold text-white">Analyser ce code</Text>
        </Pressable>
      </View>
    </View>
  );
}
