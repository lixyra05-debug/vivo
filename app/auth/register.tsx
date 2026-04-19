import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Lock, Mail, UserPlus } from 'lucide-react-native';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { Input } from '@/src/components/ui/Input';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { LeafBouquet } from '@/src/components/illustrations/LeafBouquet';
import { GoogleIcon } from '@/src/components/illustrations/GoogleIcon';
import { signInWithGoogle, signUpWithEmail } from '@/src/lib/api/auth';
import { Colors } from '@/src/constants/colors';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordError =
    password.length > 0 && password.length < 6 ? 'Minimum 6 caractères' : null;
  const canSubmit = email.trim().length > 0 && password.length >= 6 && !submitting;

  async function handleRegister() {
    setSubmitting(true);
    try {
      const { needsConfirmation } = await signUpWithEmail(email, password);
      if (needsConfirmation) {
        Alert.alert(
          'Vérifiez votre email',
          'Un lien de confirmation vous a été envoyé. Cliquez dessus pour activer votre compte.',
        );
      }
    } catch (err) {
      Alert.alert(
        'Inscription impossible',
        err instanceof Error ? err.message : 'Erreur inconnue',
      );
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
                fontSize: 30,
                color: Colors.text,
                letterSpacing: -0.6,
                textAlign: 'center',
              }}
            >
              Crée ton compte
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
              Quelques secondes pour commencer à scanner.
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
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="6 caractères minimum"
              error={passwordError}
              leftIcon={<Lock size={18} color={Colors.textMuted} />}
            />
          </GlassCard>
        </FadeIn>

        <FadeIn delay={260}>
          <PrimaryCTA
            label={submitting ? 'Création…' : "S'inscrire"}
            onPress={handleRegister}
            icon={<UserPlus color="#FFFFFF" size={18} strokeWidth={2.2} />}
            disabled={!canSubmit}
            accessibilityHint="Crée un nouveau compte Vivo"
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
            accessibilityHint="Te crée un compte avec Google"
          />
        </FadeIn>

        <FadeIn delay={460}>
          <View className="flex-row justify-center" style={{ gap: 6 }}>
            <Text style={{ fontFamily: 'Inter', fontSize: 14, color: Colors.textMuted }}>
              Déjà inscrit ?
            </Text>
            <Link href="/auth/login" asChild>
              <Pressable accessibilityRole="link">
                <Text
                  style={{
                    fontFamily: 'Inter-SemiBold',
                    fontSize: 14,
                    color: Colors.textMuted,
                    textDecorationLine: 'underline',
                  }}
                >
                  Se connecter
                </Text>
              </Pressable>
            </Link>
          </View>
        </FadeIn>
      </View>
    </ScreenContainer>
  );
}
