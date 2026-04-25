import { getTimeBasedTagline, getTimeSlot } from '../tagline';

function at(hour: number): Date {
  const d = new Date('2026-04-25T12:00:00Z');
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe('getTimeSlot', () => {
  it('renvoie morning entre 5h et 12h', () => {
    expect(getTimeSlot(at(5))).toBe('morning');
    expect(getTimeSlot(at(8))).toBe('morning');
    expect(getTimeSlot(at(11))).toBe('morning');
  });

  it('renvoie afternoon entre 12h et 18h', () => {
    expect(getTimeSlot(at(12))).toBe('afternoon');
    expect(getTimeSlot(at(15))).toBe('afternoon');
    expect(getTimeSlot(at(17))).toBe('afternoon');
  });

  it('renvoie evening entre 18h et 22h', () => {
    expect(getTimeSlot(at(18))).toBe('evening');
    expect(getTimeSlot(at(20))).toBe('evening');
    expect(getTimeSlot(at(21))).toBe('evening');
  });

  it('renvoie late entre 22h et 5h', () => {
    expect(getTimeSlot(at(22))).toBe('late');
    expect(getTimeSlot(at(23))).toBe('late');
    expect(getTimeSlot(at(0))).toBe('late');
    expect(getTimeSlot(at(4))).toBe('late');
  });
});

describe('getTimeBasedTagline', () => {
  it('renvoie un message matinal entre 5h et 12h', () => {
    expect(getTimeBasedTagline(at(8))).toBe('Bonne matinée ! Prêt à scanner ?');
  });

  it('renvoie le message principal en après-midi', () => {
    expect(getTimeBasedTagline(at(15))).toBe(
      'Scanne et découvre ce qui est vraiment compatible avec ta santé.',
    );
  });

  it('renvoie un message du soir entre 18h et 22h', () => {
    expect(getTimeBasedTagline(at(20))).toBe(
      'Bonne soirée ! Un dernier scan avant de se poser ?',
    );
  });

  it('renvoie un message tardif entre 22h et 5h', () => {
    expect(getTimeBasedTagline(at(23))).toContain('Encore debout');
    expect(getTimeBasedTagline(at(2))).toContain('Encore debout');
  });
});
