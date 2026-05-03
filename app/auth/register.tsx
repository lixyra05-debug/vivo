import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Check, Lock, Mail, UserPlus } from 'lucide-react-native';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { Input } from '@/src/components/ui/Input';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { FadeIn } from '@/src/components/ui/FadeIn';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { LeafBouquet } from '@/src/components/illustrations/LeafBouquet';
import { GoogleIcon } from '@/src/components/illustrations/GoogleIcon';
import { CGU_VERSION, signInWithGoogle, signUpWithEmail } from '@/src/lib/api/auth';
import { Colors } from '@/src/constants/colors';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordError =
    password.length > 0 && password.length < 6 ? 'Minimum 6 caractères' : null;
  const canSubmit =
    email.trim().length > 0 && password.length >= 6 && accepted && !submitting;

  async function handleRegister() {
    if (!accepted) {
      setSubmitError(
        'Vous devez accepter les conditions pour créer un compte.',
      );
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { needsConfirmation } = await signUpWithEmail(email, password, {
        consentAt: new Date().toISOString(),
        cguVersion: CGU_VERSION,
      });
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
    if (!accepted) {
      setSubmitError(
        'Vous devez accepter les conditions pour créer un compte.',
      );
      return;
    }
    setSubmitError(null);
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

        <FadeIn delay={210}>
          <Pressable
            onPress={() => {
              setAccepted((v) => !v);
              setSubmitError(null);
            }}
            accessibilityRole="checkbox"
            accessibilityLabel="J'accepte les CGU et la Politique de confidentialité"
            accessibilityState={{ checked: accepted }}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              paddingHorizontal: 4,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: accepted ? Colors.sage : Colors.border,
                backgroundColor: accepted ? Colors.sage : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              {accepted ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
            </View>
            <Text
              style={{
                flex: 1,
                fontFamily: 'Inter',
                fontSize: 13,
                lineHeight: 19,
                color: Colors.textMuted,
              }}
            >
              {"J'ai lu et j'accepte les "}
              <Link href={'/settings/cgu' as Href} asChild>
                <Text
                  style={{
                    color: Colors.text,
                    textDecorationLine: 'underline',
                    fontFamily: 'Inter-SemiBold',
                  }}
                >
                  CGU
                </Text>
              </Link>
              {' et la '}
              <Link href={'/settings/privacy' as Href} asChild>
                <Text
                  style={{
                    color: Colors.text,
                    textDecorationLine: 'underline',
                    fontFamily: 'Inter-SemiBold',
                  }}
                >
                  Politique de confidentialité
                </Text>
              </Link>
              .
            </Text>
          </Pressable>
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

        {submitError ? (
          <Text
            accessibilityLiveRegion="polite"
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: Colors.score.red,
              textAlign: 'center',
              marginTop: -8,
            }}
          >
            {submitError}
          </Text>
        ) : null}

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
