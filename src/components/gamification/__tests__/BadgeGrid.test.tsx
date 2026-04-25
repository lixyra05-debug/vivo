import { fireEvent, render } from '@testing-library/react-native';
import { BadgeGrid } from '../BadgeGrid';
import { BADGES } from '@/src/lib/gamification/badge-engine';

describe('BadgeGrid', () => {
  it('rend les 12 badges quand earnedIds=[]', () => {
    const { getAllByText } = render(<BadgeGrid earnedIds={[]} />);
    BADGES.forEach((badge) => {
      // Chaque nom apparaît au moins une fois (dans la version verrouillée)
      expect(getAllByText(badge.nameFr).length).toBeGreaterThan(0);
    });
  });

  it('rend "first_scan" en pleine couleur (gagné) quand earnedIds=["first_scan"]', () => {
    const { getByLabelText } = render(<BadgeGrid earnedIds={['first_scan']} />);
    expect(getByLabelText(/Premier scan.*gagné/)).toBeTruthy();
  });

  it('appelle onBadgePress avec le bon BadgeDef au tap', () => {
    const onBadgePress = jest.fn();
    const { getByLabelText } = render(
      <BadgeGrid earnedIds={['first_scan']} onBadgePress={onBadgePress} />,
    );
    fireEvent.press(getByLabelText(/Premier scan.*gagné/));
    expect(onBadgePress).toHaveBeenCalledTimes(1);
    expect(onBadgePress).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'first_scan' }),
    );
  });
});
