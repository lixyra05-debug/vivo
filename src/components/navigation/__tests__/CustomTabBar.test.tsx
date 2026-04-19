import { fireEvent, render } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from '../CustomTabBar';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

function makeProps(activeIndex = 0, overrides?: { navigate?: jest.Mock; emit?: jest.Mock }) {
  const navigate = overrides?.navigate ?? jest.fn();
  const emit =
    overrides?.emit ?? jest.fn(() => ({ defaultPrevented: false }));
  const routes = [
    { key: 'index-1', name: 'index' },
    { key: 'scan-1', name: 'scan' },
    { key: 'history-1', name: 'history' },
    { key: 'favorites-1', name: 'favorites' },
    { key: 'profile-1', name: 'profile' },
  ];
  const descriptors = routes.reduce<Record<string, unknown>>((acc, r) => {
    acc[r.key] = { options: { title: r.name } };
    return acc;
  }, {});
  return {
    props: {
      state: {
        index: activeIndex,
        routes,
        key: 'tab',
        routeNames: routes.map((r) => r.name),
        history: [],
        type: 'tab',
        stale: false,
      },
      descriptors,
      navigation: { navigate, emit },
      insets: { top: 0, bottom: 34, left: 0, right: 0 },
    } as unknown as BottomTabBarProps,
    navigate,
    emit,
  };
}

describe('CustomTabBar', () => {
  it('rend les 5 labels en français', () => {
    const { props } = makeProps();
    const { getByText } = render(<CustomTabBar {...props} />);
    expect(getByText('Accueil')).toBeTruthy();
    expect(getByText('Scanner')).toBeTruthy();
    expect(getByText('Historique')).toBeTruthy();
    expect(getByText('Favoris')).toBeTruthy();
    expect(getByText('Profil')).toBeTruthy();
  });

  it('appelle navigation.navigate lors du tap sur un tab inactif', () => {
    const { props, navigate } = makeProps(0);
    const { getByLabelText } = render(<CustomTabBar {...props} />);
    fireEvent.press(getByLabelText('Scanner'));
    expect(navigate).toHaveBeenCalledWith('scan');
  });

  it('ne navigue pas lors du tap sur le tab actif', () => {
    const { props, navigate } = makeProps(0);
    const { getByLabelText } = render(<CustomTabBar {...props} />);
    fireEvent.press(getByLabelText('Accueil'));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('expose accessibilityState.selected pour le tab actif', () => {
    const { props } = makeProps(2);
    const { getByLabelText } = render(<CustomTabBar {...props} />);
    expect(getByLabelText('Historique').props.accessibilityState).toEqual({ selected: true });
    expect(getByLabelText('Accueil').props.accessibilityState).toEqual({ selected: false });
  });

  it("respecte defaultPrevented en ne naviguant pas quand l'event est annulé", () => {
    const emit = jest.fn(() => ({ defaultPrevented: true }));
    const { props, navigate } = makeProps(0, { emit });
    const { getByLabelText } = render(<CustomTabBar {...props} />);
    fireEvent.press(getByLabelText('Favoris'));
    expect(emit).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
