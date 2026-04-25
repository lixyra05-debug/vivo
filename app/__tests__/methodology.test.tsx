import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import MethodologyScreen from '../methodology';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve()),
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
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

describe('MethodologyScreen', () => {
  it('affiche le titre principal et au moins une question FAQ', () => {
    const { getByText } = render(<MethodologyScreen />);
    expect(getByText('Comment Vivo note les produits')).toBeTruthy();
    expect(getByText('Comment le score est-il calculé ?')).toBeTruthy();
  });

  it('tap sur une question FAQ révèle la réponse', () => {
    const { getByText, queryByText } = render(<MethodologyScreen />);
    const question = 'Comment le score est-il calculé ?';
    expect(getByText(question)).toBeTruthy();
    // La réponse doit être absente avant le tap
    expect(queryByText(/système de pénalités à partir d'une base 100/)).toBeNull();
    fireEvent.press(getByText(question));
    expect(queryByText(/système de pénalités à partir d'une base 100/)).toBeTruthy();
  });
});
