import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Lock, LogIn, Mail } from 'lucide-react-native';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { Input } from '@/src/components/ui/Input';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { LeafBouquet } from '@/src/components/illustrations/LeafBouquet';
import { GoogleIcon } from '@/src/components/illustrations/GoogleIcon';
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
      <View className="flex-1 justify-center" style={{ gap: 24 }}>
        <FadeIn delay={0}>
          <View className="items-center" style={{ gap: 16 }}>
            <LeafBouquet size={120} />
            <Text
              style={{
                fontFamily: 'BricolageGrotesque-Bold',
                fontSize: 36,
                color: Colors.text,
                letterSpacing: -0.8,
              }}
            >
              Vivo
            </Text>
            <Text
              className="text-center"
              style={{
                fontFamily: 'Inter',
                fontSize: 15,
                color: Colors.textMuted,
                lineHeight: 22,
                maxWidth: 280,
              }}
            >
              Scannez vos produits. Comprenez ce que vous mangez.
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={140}>
          <GlassCard style={{ padding: 20, gap: 14 }}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="vous@exemple.fr"
              leftIcon={<Mail size={18} color={Colors.textMuted} />}
            />
            <Input
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              placeholder="••••••••"
              leftIcon={<Lock size={18} color={Colors.textMuted} />}
            />
          </GlassCard>
        </FadeIn>

        <FadeIn delay={260}>
          <PrimaryCTA
            label={submitting ? 'Connexion…' : 'Se connecter'}
            onPress={handleLogin}
            icon={<LogIn color="#FFFFFF" size={18} strokeWidth={2.2} />}
            disabled={!canSubmit}
            accessibilityHint="Te connecte à ton compte Vivo"
          />
        </FadeIn>

        <FadeIn delay={340}>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <View className="h-px flex-1 bg-cream-300" />
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontSize: 11,
                color: Colors.textMuted,
                letterSpacing: 2,
              }}
            >
              OU
            </Text>
            <View className="h-px flex-1 bg-cream-300" />
          </View>
        </FadeIn>

        <FadeIn delay={400}>
          <SecondaryButton
            label={googleLoading ? 'Chargement…' : 'Continuer avec Google'}
            onPress={handleGoogle}
            icon={<GoogleIcon size={18} />}
            loading={googleLoading}
            accessibilityHint="Te connecte avec ton compte Google"
          />
        </FadeIn>

        <FadeIn delay={460}>
          <View className="flex-row justify-center" style={{ gap: 6 }}>
            <Text style={{ fontFamily: 'Inter', fontSize: 14, color: Colors.textMuted }}>
              Pas encore de compte ?
            </Text>
            <Link href="/auth/register" asChild>
              <Pressable accessibilityRole="link">
                <Text
                  style={{
                    fontFamily: 'Inter-SemiBold',
                    fontSize: 14,
                    color: Colors.textMuted,
                    textDecorationLine: 'underline',
                  }}
                >
                  Créer un compte
                </Text>
              </Pressable>
            </Link>
          </View>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}
