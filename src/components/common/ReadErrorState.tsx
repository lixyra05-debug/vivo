/**
 * État « lecture en erreur » des écrans qui lisent l'historique (lot H).
 *
 * Une requête en échec ne s'affiche jamais comme une liste vide : « Aucun scan
 * pour le moment » disait le contraire de ce qui se passait — la lecture avait
 * échoué, les scans existaient. Le message ne promet rien sur les données
 * (seule la lecture est en cause) et propose un nouvel essai.
 */
import { Text, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { PrimaryCTA } from '@/src/components/home/PrimaryCTA';
import { Colors } from '@/src/constants/colors';
import { Palette } from '@/src/constants/theme';

export const READ_ERROR_TITLE = 'Impossible de charger tes scans';
export const READ_ERROR_BODY = 'Le chargement a échoué. Réessaie dans un instant.';
export const READ_ERROR_RETRY = 'Réessayer';

interface ReadErrorStateProps {
  onRetry: () => void;
}

export function ReadErrorState({ onRetry }: ReadErrorStateProps) {
  return (
    <View
      accessibilityRole="alert"
      style={{ alignItems: 'center', alignSelf: 'stretch', gap: 10, paddingVertical: 16 }}
    >
      <Text
        style={{
          fontFamily: 'BricolageGrotesque-Bold',
          fontSize: 20,
          color: Colors.text,
          textAlign: 'center',
          letterSpacing: -0.3,
        }}
      >
        {READ_ERROR_TITLE}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 14,
          color: Colors.textMuted,
          textAlign: 'center',
          lineHeight: 21,
          maxWidth: 300,
        }}
      >
        {READ_ERROR_BODY}
      </Text>
      <View style={{ alignSelf: 'stretch', paddingHorizontal: 16, marginTop: 6 }}>
        <PrimaryCTA
          label={READ_ERROR_RETRY}
          onPress={onRetry}
          icon={<RefreshCw color={Palette.surfaceRaised} size={18} strokeWidth={2.2} />}
        />
      </View>
    </View>
  );
}
