import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/constants/colors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Boundary global pour capturer les erreurs JS non gérées dans l'arbre React.
 * Affiche un fallback en français et permet à l'utilisateur de réessayer
 * (réinitialise l'état et re-rend les enfants).
 *
 * Note : les error boundaries doivent être des class components — pas
 * d'équivalent en hooks pour `componentDidCatch` / `getDerivedStateFromError`.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Sentry à brancher dans une PR ultérieure (R5 : pas de console.log,
    // mais console.error reste autorisé pour les erreurs réelles).
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.root} accessibilityRole="alert">
          <Text style={styles.title}>Oups, une erreur s'est produite</Text>
          <Text style={styles.body}>
            Vivo a rencontré un problème inattendu. Tu peux réessayer dans un instant.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Réessayer"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonLabel}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontFamily: 'BricolageGrotesque-Bold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  button: {
    backgroundColor: Colors.sage,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
