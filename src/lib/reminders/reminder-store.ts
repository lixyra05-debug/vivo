/**
 * reminder-store — Rappels de cures persistés en AsyncStorage (R10).
 *
 * Chaque rappel programme une notification quotidienne via `expo-notifications`
 * (graceful degradation : si le module est absent, `notificationId` reste null
 * et la cure reste utilisable manuellement).
 *
 * Le marquage "Pris aujourd'hui" est déduplé par date YYYY-MM-DD : tu peux
 * appeler `markTodayDone` plusieurs fois dans la même journée sans incrémenter.
 * Quand `markedDays.length === durationDays`, le rappel passe en `'completed'`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type CureDuration = 7 | 14 | 21 | 30;

export interface CureReminder {
  id: string;
  plantId: string;
  durationDays: CureDuration;
  /** ISO timestamp de création */
  startDate: string;
  /** Dates ISO YYYY-MM-DD du marquage "Pris aujourd'hui" (sans doublon) */
  markedDays: string[];
  /** ID retourné par expo-notifications, null si module absent ou refus */
  notificationId: string | null;
  status: 'active' | 'completed' | 'abandoned';
}

const REMINDERS_KEY = '@vivo_reminders';

// ─── Helpers ────────────────────────────────────────────────────────────

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(
    36,
  )}`;
}

async function readAll(): Promise<CureReminder[]> {
  const raw = await AsyncStorage.getItem(REMINDERS_KEY);
  return safeParse<CureReminder[]>(raw, []);
}

async function writeAll(reminders: CureReminder[]): Promise<void> {
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// ─── Lazy require expo-notifications ───────────────────────────────────

interface NotificationsModule {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: (options?: unknown) => Promise<{ status: string }>;
  scheduleNotificationAsync: (config: unknown) => Promise<string>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
}

async function getNotifications(): Promise<NotificationsModule | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-notifications') as
      | NotificationsModule
      | { default?: NotificationsModule };
    const candidate =
      mod &&
      'default' in mod &&
      mod.default &&
      typeof mod.default.scheduleNotificationAsync === 'function'
        ? mod.default
        : (mod as NotificationsModule);
    if (
      !candidate ||
      typeof candidate.scheduleNotificationAsync !== 'function'
    ) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

async function scheduleDaily(): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
      status = requested.status;
    }
    if (status !== 'granted') return null;
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ta cure du jour 🌿',
        body: "C'est l'heure de ta cure",
      },
      trigger: {
        type: 'daily',
        hour: 9,
        minute: 0,
      },
    });
    return identifier;
  } catch {
    return null;
  }
}

async function cancelNotification(identifier: string | null): Promise<void> {
  if (!identifier) return;
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // ignore — best effort
  }
}

// ─── API publique ──────────────────────────────────────────────────────

/**
 * Retourne tous les rappels persistés (actifs, complétés, abandonnés).
 */
export async function getReminders(): Promise<CureReminder[]> {
  return readAll();
}

/**
 * Crée un nouveau rappel pour une cure de `durationDays` jours.
 * Programme une notification quotidienne à 9h00 (best effort).
 */
export async function createReminder(
  plantId: string,
  durationDays: CureDuration,
): Promise<CureReminder> {
  const notificationId = await scheduleDaily();
  const reminder: CureReminder = {
    id: genId(),
    plantId,
    durationDays,
    startDate: new Date().toISOString(),
    markedDays: [],
    notificationId,
    status: 'active',
  };

  const all = await readAll();
  all.push(reminder);
  await writeAll(all);
  return reminder;
}

/**
 * Marque la journée courante comme prise pour le rappel `reminderId`.
 * - Pas de duplicate dans la même journée (clé YYYY-MM-DD)
 * - Auto-complete (status='completed') si `markedDays.length >= durationDays`
 *
 * Renvoie le rappel à jour, ou null si introuvable.
 */
export async function markTodayDone(
  reminderId: string,
): Promise<CureReminder | null> {
  const all = await readAll();
  const idx = all.findIndex((r) => r.id === reminderId);
  if (idx < 0) return null;

  const reminder = all[idx];
  const today = todayIso();
  const markedDays = reminder.markedDays.includes(today)
    ? reminder.markedDays
    : [...reminder.markedDays, today];

  const updated: CureReminder = {
    ...reminder,
    markedDays,
    status:
      markedDays.length >= reminder.durationDays ? 'completed' : reminder.status,
  };

  // Si la cure se termine, on annule la notification programmée
  if (updated.status === 'completed' && reminder.status !== 'completed') {
    await cancelNotification(reminder.notificationId);
  }

  all[idx] = updated;
  await writeAll(all);
  return updated;
}

/**
 * Supprime un rappel et annule sa notification (si présente).
 */
export async function deleteReminder(
  reminderId: string,
): Promise<CureReminder[]> {
  const all = await readAll();
  const target = all.find((r) => r.id === reminderId);
  if (target) {
    await cancelNotification(target.notificationId);
  }
  const filtered = all.filter((r) => r.id !== reminderId);
  await writeAll(filtered);
  return filtered;
}
