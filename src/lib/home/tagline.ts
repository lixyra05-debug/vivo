/**
 * Tagline dynamique affichée sur la home, varie selon l'heure locale.
 * Exporte une fonction pure pour faciliter le test.
 */

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'late';

export function getTimeSlot(now: Date = new Date()): TimeSlot {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'late';
}

const MESSAGES: Record<TimeSlot, string> = {
  morning: 'Bonne matinée ! Prêt à scanner ?',
  afternoon: 'Scanne et découvre ce qui est vraiment compatible avec ta santé.',
  evening: 'Bonne soirée ! Un dernier scan avant de se poser ?',
  late: 'Encore debout ? Scanne si tu veux 😉',
};

export function getTimeBasedTagline(now: Date = new Date()): string {
  return MESSAGES[getTimeSlot(now)];
}
