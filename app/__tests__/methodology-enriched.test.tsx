import { render } from '@testing-library/react-native';
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

describe('MethodologyScreen — bloc Nutri-Score enrichi', () => {
  it('affiche le titre du bloc et les 3 axes (Nutrition, Transformation, Additifs)', () => {
    const { getByText } = render(<MethodologyScreen />);
    expect(getByText(/Pourquoi Vivo ne se contente pas du Nutri-Score/)).toBeTruthy();
    expect(getByText('Nutrition')).toBeTruthy();
    expect(getByText('Transformation')).toBeTruthy();
    expect(getByText('Additifs')).toBeTruthy();
  });

  it("affiche l'exemple concret de la pizza végétarienne surgelée", () => {
    const { getByText } = render(<MethodologyScreen />);
    expect(getByText(/pizza végétarienne surgelée/i)).toBeTruthy();
    expect(getByText(/Nutri-Score A/)).toBeTruthy();
    expect(getByText(/42\/100/)).toBeTruthy();
  });
});
