import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

const mockSignUp = jest.fn();
const mockSignInGoogle = jest.fn();

jest.mock('@/src/lib/api/auth', () => ({
  CGU_VERSION: '1.0',
  signUpWithEmail: (...args: unknown[]) => mockSignUp(...args),
  signInWithGoogle: (...args: unknown[]) => mockSignInGoogle(...args),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
  };
});

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const RegisterScreen = require('../auth/register').default;

describe('RegisterScreen — checkbox CGU/Privacy (C-004)', () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockSignInGoogle.mockReset();
    mockSignUp.mockResolvedValue({ needsConfirmation: true });
  });

  it('le bouton "S\'inscrire" est désactivé sans cocher la checkbox', () => {
    const { getByLabelText, getByPlaceholderText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('vous@exemple.fr'), 'test@vivo.fr');
    fireEvent.changeText(getByPlaceholderText('6 caractères minimum'), 'azerty12');

    const submit = getByLabelText("S'inscrire");
    fireEvent.press(submit);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('passe consent_at et cgu_version=1.0 au submit après cochage', async () => {
    const { getByLabelText, getByPlaceholderText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('vous@exemple.fr'), 'test@vivo.fr');
    fireEvent.changeText(getByPlaceholderText('6 caractères minimum'), 'azerty12');

    const checkbox = getByLabelText(
      "J'accepte les CGU et la Politique de confidentialité",
    );
    fireEvent.press(checkbox);

    fireEvent.press(getByLabelText("S'inscrire"));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1));
    const args = mockSignUp.mock.calls[0];
    expect(args[0]).toBe('test@vivo.fr');
    expect(args[1]).toBe('azerty12');
    const opts = args[2] as { consentAt: string; cguVersion: string };
    expect(opts.cguVersion).toBe('1.0');
    expect(typeof opts.consentAt).toBe('string');
    // Format ISO 8601 (Z final)
    expect(opts.consentAt).toMatch(/T.*Z$/);
  });
});
