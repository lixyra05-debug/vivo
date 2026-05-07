/**
 * HerbariumNoteModal — modal slide d'édition d'une note privée pour une
 * plante de l'herbier (max 200 caractères).
 *
 * Le parent gère le refresh de la liste après onSave (le modal n'écrit pas
 * directement dans le store, il appelle onSave avec le texte trimmé).
 */

import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '@/src/constants/colors';

interface HerbariumNoteModalProps {
  visible: boolean;
  plantId: string;
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

const MAX_NOTE_LEN = 200;

export function HerbariumNoteModal({
  visible,
  plantId,
  initialNote,
  onClose,
  onSave,
}: HerbariumNoteModalProps) {
  const [text, setText] = useState(initialNote);

  // Resync à chaque ouverture / changement de plante
  useEffect(() => {
    if (visible) setText(initialNote);
  }, [visible, plantId, initialNote]);

  function handleSave() {
    onSave(text);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Note pour cette plante</Text>
          <TextInput
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX_NOTE_LEN))}
            placeholder="Ajoute une note personnelle..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={MAX_NOTE_LEN}
            style={styles.input}
            accessibilityLabel="Note pour cette plante"
          />
          <Text style={styles.counter}>
            {text.length}/{MAX_NOTE_LEN}
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Annuler"
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                styles.cancel,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enregistrer la note"
              onPress={handleSave}
              style={({ pressed }) => [
                styles.button,
                styles.save,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.saveText}>Enregistrer</Text>
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(43, 62, 43, 0.55)',
  },
  card: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    gap: 12,
  },
  title: {
    fontFamily: 'BricolageGrotesque-SemiBold',
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  input: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.text,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2EBE2',
    minHeight: 100,
    padding: 14,
    textAlignVertical: 'top',
  },
  counter: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  cancel: {
    backgroundColor: 'transparent',
  },
  cancelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textMuted,
  },
  save: {
    backgroundColor: Colors.sage,
  },
  saveText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
