/**
 * Lot H — le profil ne présente pas une lecture en erreur comme un compte sans
 * scan : la section de statistiques montre l'erreur (pas des zéros), et
 * l'export PDF refuse de produire un rapport vide (« Aucune activité
 * enregistrée ») sur un historique qui n'a pas pu être lu.
 */
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import ProfileScreen from '../(tabs)/profile';
import { exportHealthReportPdf } from '@/src/lib/export/generate-pdf';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
  };
});
jest.mock('@/src/components/ui/FadeIn', () => ({
  FadeIn: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/src/lib/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string; email: string }; session: null }) => unknown) =>
    selector({ user: { id: 'user-1', email: 'hector@example.fr' }, session: null }),
}));
jest.mock('@/src/lib/stores/useProfileStore', () => ({
  useProfileStore: (selector: (s: { profile: null }) => unknown) => selector({ profile: null }),
}));
jest.mock('@/src/lib/premium/premium-gate', () => ({
  ...jest.requireActual('@/src/lib/premium/premium-gate'),
  usePremium: () => ({ tier: 'premium', isPremium: true, isExpert: false, isLoading: false, canAccess: () => true }),
}));
jest.mock('@/src/lib/stores/useBadges', () => ({
  useUserBadges: () => ({ data: [] }),
  useUserReportCount: () => ({ data: 0 }),
}));
jest.mock('@/src/lib/export/generate-pdf', () => ({ exportHealthReportPdf: jest.fn() }));
jest.mock('@/src/lib/api/auth', () => ({ signOut: jest.fn() }));
jest.mock('@/src/lib/api/account-deletion', () => ({ requestAccountDeletion: jest.fn() }));

const mockRefetch = jest.fn();
jest.mock('@/src/lib/stores/useProductStore', () => ({
  ...jest.requireActual('@/src/lib/stores/useProductStore'),
  useScanHistory: () => ({ data: undefined, isLoading: false, isError: true, refetch: mockRefetch }),
}));

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Lot H — profil : lecture en erreur ≠ compte sans scan', () => {
  afterEach(() => jest.clearAllMocks());

  it('la section de statistiques montre l’erreur et « Réessayer », pas « Total scans 0 »', () => {
    const { getByText, queryByText, getByLabelText } = renderWithClient(<ProfileScreen />);
    expect(getByText('Impossible de charger tes scans')).toBeTruthy();
    expect(queryByText('Total scans')).toBeNull();
    fireEvent.press(getByLabelText('Réessayer'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('l’export PDF est refusé : jamais un rapport vide sur un historique illisible', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByText } = renderWithClient(<ProfileScreen />);
    fireEvent.press(getByText('Exporter mon rapport PDF'));
    await Promise.resolve();
    expect(exportHealthReportPdf).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      'Export impossible',
      'Tes scans ne sont pas disponibles pour le moment. Réessaie dans un instant.',
    );
  });
});
