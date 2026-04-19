import { act, fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { ToastProvider, useToast } from '../ToastProvider';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 0, left: 0, right: 0 }),
}));

function Harness({ variant, message }: { variant: 'info' | 'success' | 'error'; message: string }) {
  const toast = useToast();
  return (
    <Pressable
      accessibilityLabel="trigger"
      onPress={() => {
        if (variant === 'info') toast.show(message);
        else if (variant === 'success') toast.success(message);
        else toast.error(message);
      }}
    >
      <Text>trigger</Text>
    </Pressable>
  );
}

describe('ToastProvider', () => {
  it('affiche un toast info via show()', () => {
    const { getByLabelText, getByText } = render(
      <ToastProvider>
        <Harness variant="info" message="Analyse en cours" />
      </ToastProvider>,
    );
    fireEvent.press(getByLabelText('trigger'));
    expect(getByText('Analyse en cours')).toBeTruthy();
  });

  it('affiche un toast succès avec aria-live polite', () => {
    const { getByLabelText } = render(
      <ToastProvider>
        <Harness variant="success" message="Ajouté aux favoris" />
      </ToastProvider>,
    );
    fireEvent.press(getByLabelText('trigger'));
    const toast = getByLabelText('Ajouté aux favoris');
    expect(toast.props.accessibilityLiveRegion).toBe('polite');
  });

  it('affiche un toast erreur avec rôle alert', () => {
    const { getByLabelText } = render(
      <ToastProvider>
        <Harness variant="error" message="Erreur réseau" />
      </ToastProvider>,
    );
    fireEvent.press(getByLabelText('trigger'));
    const toast = getByLabelText('Erreur réseau');
    expect(toast.props.accessibilityRole).toBe('alert');
    expect(toast.props.accessibilityLiveRegion).toBe('assertive');
  });

  it('se ferme automatiquement après 2800ms', () => {
    jest.useFakeTimers();
    try {
      const { getByLabelText, queryByText } = render(
        <ToastProvider>
          <Harness variant="info" message="Bientôt parti" />
        </ToastProvider>,
      );
      fireEvent.press(getByLabelText('trigger'));
      expect(queryByText('Bientôt parti')).toBeTruthy();
      act(() => {
        jest.advanceTimersByTime(2800);
      });
      act(() => {
        jest.advanceTimersByTime(400);
      });
    } finally {
      jest.useRealTimers();
    }
  });
});
