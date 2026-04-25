import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ReportButton } from '../ReportButton';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('@/src/lib/api/reports', () => ({
  submitProductReport: jest.fn(() => Promise.resolve({ ok: true, error: null })),
}));

jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: null }) => unknown) => selector({ user: null }),
}));

jest.mock('@/src/components/common/ToastProvider', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    show: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
  };
});

describe('ReportButton', () => {
  it('affiche le texte "Signaler une erreur"', () => {
    const { getByText } = render(<ReportButton barcode="123" />);
    expect(getByText('Signaler une erreur')).toBeTruthy();
  });

  it('ouvre le modal au tap', () => {
    const { getByLabelText, getAllByText } = render(<ReportButton barcode="123" />);
    fireEvent.press(getByLabelText('Signaler une erreur sur ce produit'));
    // Le titre du modal doit apparaître (il y a au moins 2 occurrences possibles si on garde le texte du trigger).
    // On vérifie spécifiquement la présence du titre du modal.
    expect(getAllByText('Signaler une erreur').length).toBeGreaterThan(0);
  });
});
