import { Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Colors } from '@/src/constants/colors';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-display text-lg font-bold text-sage-800">{title}</Text>
      {children}
    </View>
  );
}

export default function LegalScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scroll>
      <View className="gap-6">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <ArrowLeft color={Colors.text} size={20} />
          </Pressable>
          <Text className="font-display text-2xl font-bold text-sage-800">
            Mentions légales
          </Text>
        </View>

        <View
          className="rounded-vivo bg-score-yellow/10 p-4"
          accessibilityRole="alert"
          accessibilityLabel="Avertissement : Vivo fournit des informations, pas des conseils médicaux."
        >
          <Text className="font-semibold text-sage-800">Avertissement santé</Text>
          <Text className="mt-1 text-sm leading-5 text-sage-700">
            Vivo fournit des informations nutritionnelles à titre indicatif uniquement.
            Les scores et analyses ne constituent en aucun cas un avis médical,
            un diagnostic ou une recommandation de traitement. Consultez un
            professionnel de santé pour toute question médicale.
          </Text>
        </View>

        <Section title="Conditions Générales d'Utilisation">
          <Text className="text-sm leading-5 text-sage-700">
            En utilisant Vivo, vous acceptez que le service est fourni « en l'état ».
            LYXIRIA ne garantit pas l'exactitude ou l'exhaustivité des données
            nutritionnelles issues d'Open Food Facts, une base collaborative.
          </Text>
          <Text className="text-sm leading-5 text-sage-700">
            Le score Vivo est calculé selon un algorithme de pénalités toxicologiques
            basé sur des études scientifiques publiées. Il ne remplace pas le
            jugement d'un professionnel de santé.
          </Text>
          <Text className="text-sm leading-5 text-sage-700">
            Le scan de produits est gratuit et illimité. Les fonctionnalités premium
            (Smart Swaps produits, historique illimité, comparateur) sont soumises
            à un abonnement payant.
          </Text>
        </Section>

        <Section title="Données personnelles">
          <Text className="text-sm leading-5 text-sage-700">
            Vivo collecte uniquement les données nécessaires au fonctionnement du
            service : adresse email, profil santé, historique de scans. Ces données
            sont stockées sur Supabase (région EU — Irlande) et ne sont jamais
            partagées avec des tiers à des fins commerciales.
          </Text>
          <Text className="text-sm leading-5 text-sage-700">
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification
            et de suppression de vos données. Contactez contact@lyxiria.com pour
            exercer ces droits.
          </Text>
        </Section>

        <Section title="Données nutritionnelles">
          <Text className="text-sm leading-5 text-sage-700">
            Les données produits proviennent d'Open Food Facts, une base de données
            libre et collaborative sous licence ODbL. Vivo n'est pas affiliée à
            Open Food Facts.
          </Text>
        </Section>

        <Section title="Éditeur">
          <Text className="text-sm leading-5 text-sage-700">
            LYXIRIA — Hector Volant{'\n'}
            Contact : contact@lyxiria.com
          </Text>
        </Section>

        <Pressable
          onPress={() =>
            Linking.openURL('https://lyxiria.com/privacy')
          }
          accessibilityRole="link"
          accessibilityLabel="Ouvrir la politique de confidentialité"
          className="flex-row items-center gap-2 rounded-vivo bg-white p-4"
        >
          <ExternalLink color={Colors.sage} size={18} />
          <Text className="flex-1 text-sage-800">Politique de confidentialité</Text>
        </Pressable>

        <Text className="text-center text-xs text-sage-500">
          Vivo v1.0.0 — LYXIRIA © 2026
        </Text>
      </View>
    </ScreenContainer>
  );
}
