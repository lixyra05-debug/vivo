import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <View className="flex-1 items-center justify-center bg-cream px-6">
        <Text className="font-display text-2xl text-sage-800">Écran introuvable.</Text>
        <Link href="/(tabs)/scan" className="mt-4">
          <Text className="text-sage-600">Retour à l'accueil</Text>
        </Link>
      </View>
    </>
  );
}
