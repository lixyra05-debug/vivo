import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Leaf } from 'lucide-react-native';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { signInWithEmail, signInWithGoogle } from '@/src/lib/api/auth';
import { Colors } from '@/src/constants/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !submitting;

  async function handleLogin() {
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      Alert.alert('Connexion impossible', err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert('Connexion Google', err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="flex-1 justify-center gap-6">
        <View className="items-center gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-sage-100">
            <Leaf color={Colors.sage} size={32} />
          </View>
          <Text className="font-display text-3xl font-bold text-sage-800">Vivo</Text>
          <Text className="text-center text-sage-700">
            Scannez vos produits. Comprenez ce que vous mangez.
          </Text>
        </View>

        <View className="gap-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="vous@exemple.fr"
          />
          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <Button
            label="Se connecter"
            onPress={handleLogin}
            loading={submitting}
            disabled={!canSubmit}
          />
        </View>

        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-cream-300" />
          <Text className="text-xs uppercase tracking-wider text-sage-600">ou</Text>
          <View className="h-px flex-1 bg-cream-300" />
        </View>

        <Button
          label="Continuer avec Google"
          onPress={handleGoogle}
          variant="outline"
          loading={googleLoading}
        />

        <View className="flex-row justify-center gap-1">
          <Text className="text-sage-700">Pas encore de compte ?</Text>
          <Link href="/auth/register" className="font-semibold text-sage-600">
            Créer un compte
          </Link>
        </View>
      </View>
    </ScreenContainer>
  );
}
