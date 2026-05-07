import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, ShieldAlert } from 'lucide-react-native';
import { Colors } from '@/src/constants/colors';

export interface HealthConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export function HealthConsentModal({
  visible,
  onAccept,
  onCancel,
}: HealthConsentModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <ShieldAlert color={Colors.sage} size={24} strokeWidth={2.2} />
            <Text style={styles.title}>Consentement données santé</Text>
          </View>

          <Text style={styles.body}>
            En activant ton profil santé, tu acceptes que Vivo traite tes
            données de santé (allergies, intolérances, conditions médicales,
            profil utilisateur) pour personnaliser ton score nutritionnel et
            tes recommandations.
          </Text>

          <Text style={styles.body}>
            Ces données sont stockées de façon sécurisée via Supabase (Union
            Européenne — Irlande) et ne sont jamais partagées avec des tiers à
            des fins commerciales. Tu peux les consulter, les modifier ou
            demander leur suppression à tout moment depuis ton profil.
          </Text>

          <Text style={styles.legal}>
            Base légale : RGPD art. 9 §2 a) — consentement explicite au
            traitement des données de santé.
          </Text>

          <Pressable
            onPress={() => setChecked((c) => !c)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel="J'accepte le traitement de mes données de santé"
            style={styles.checkRow}
            hitSlop={6}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked ? (
                <Check color="#FFFFFF" size={14} strokeWidth={3} />
              ) : null}
            </View>
            <Text style={styles.checkLabel}>
              J'accepte le traitement de mes données de santé pour la
              personnalisation de Vivo.
            </Text>
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Annuler"
              style={({ pressed }) => [
                styles.btnCancel,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.btnCancelLabel}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={onAccept}
              accessibilityRole="button"
              accessibilityLabel="Continuer après acceptation"
              disabled={!checked}
              style={({ pressed }) => [
                styles.btnAccept,
                !checked && styles.btnAcceptDisabled,
                pressed && checked && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.btnAcceptLabel}>Continuer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 28, 22, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.cream,
    borderRadius: 22,
    padding: 22,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 17,
    color: Colors.text,
    letterSpacing: -0.2,
    flex: 1,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 13.5,
    color: Colors.text,
    lineHeight: 20,
  },
  legal: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.sage,
  },
  checkLabel: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6DDD0',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  btnCancelLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  btnAccept: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.sage,
  },
  btnAcceptDisabled: {
    backgroundColor: '#B7C9B6',
  },
  btnAcceptLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
