/**
 * Planification des notifications locales (résumé hebdomadaire Vivo).
 *
 * Le module est conçu en graceful degradation : si `expo-notifications`
 * n'est pas dispo (cas tests sans mock, environnement web, ...), les
 * fonctions retournent gentiment `{ success: false, reason: 'unavailable' }`
 * sans jamais throw.
 */

import type { WeeklySummary } from '@/src/lib/gamification/types';

export const WEEKLY_SUMMARY_NOTIFICATION_ID = 'vivo_weekly_summary';

export interface ScheduleResult {
  success: boolean;
  reason?: 'unavailable' | 'permission_denied' | 'error';
  identifier?: string;
}

interface ScheduleOptions {
  weekday?: number; // 1=dimanche selon Expo, 2=lundi... (cf. trigger weekly)
  hour?: number;
  minute?: number;
}

/**
 * Type minimal sur le sous-ensemble d'API expo-notifications utilisé ici.
 * On évite de dépendre des types complets pour rester compatible avec un
 * import dynamique qui peut échouer.
 */
interface NotificationsModule {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: (options?: unknown) => Promise<{ status: string }>;
  scheduleNotificationAsync: (config: unknown) => Promise<string>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
}

async function getNotifications(): Promise<NotificationsModule | null> {
  try {
    // On utilise `require` plutôt qu'un `import()` dynamique pour rester
    // compatible avec l'environnement jest (qui ne supporte pas les modules
    // ES par défaut) tout en restant fonctionnel en runtime React Native.
    // Si le module est absent (ex: web sans expo-notifications), require throw
    // et on retombe gentiment sur null.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-notifications') as
      | NotificationsModule
      | { default?: NotificationsModule };
    // Compat ESM/CJS : si le module expose ses fonctions sur `default`, on
    // privilégie cette voie.
    const candidate =
      mod &&
      'default' in mod &&
      mod.default &&
      typeof mod.default.getPermissionsAsync === 'function'
        ? mod.default
        : (mod as NotificationsModule);
    if (!candidate || typeof candidate.getPermissionsAsync !== 'function') {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

/**
 * Indique si l'utilisateur a déjà accordé la permission de recevoir
 * des notifications locales.
 */
export async function isNotificationPermissionGranted(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return false;
  }
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Formatte le corps de la notification de résumé hebdomadaire.
 */
function formatBody(summary: WeeklySummary): string {
  if (summary.totalScans === 0) {
    return 'Cette semaine est calme. Reprends quand tu veux !';
  }
  const plural = summary.totalScans > 1 ? 's' : '';
  return `Cette semaine : ${summary.totalScans} scan${plural}, score moyen ${summary.averageScore}/100.`;
}

/**
 * Planifie la notification hebdomadaire (par défaut : tous les dimanches à 19h00).
 *
 * Note : Expo `weekday` dans un trigger weekly est 1=dimanche selon les conventions
 * iOS, mais ce module reçoit un weekday brut côté caller. Default 1 = dimanche.
 */
export async function scheduleWeeklySummaryNotification(
  summary: WeeklySummary,
  options: ScheduleOptions = {}
): Promise<ScheduleResult> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return { success: false, reason: 'unavailable' };
  }

  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      });
      status = requested.status;
    }

    if (status !== 'granted') {
      return { success: false, reason: 'permission_denied' };
    }

    // On annule la notif précédente avec le même identifier pour éviter les doublons
    try {
      await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_NOTIFICATION_ID);
    } catch {
      // ignore — une absence préalable ne doit pas bloquer le scheduling
    }

    await Notifications.scheduleNotificationAsync({
      identifier: WEEKLY_SUMMARY_NOTIFICATION_ID,
      content: {
        title: 'Ta semaine Vivo 📊',
        body: formatBody(summary),
      },
      trigger: {
        type: 'weekly',
        weekday: options.weekday ?? 1,
        hour: options.hour ?? 19,
        minute: options.minute ?? 0,
      },
    });

    return { success: true, identifier: WEEKLY_SUMMARY_NOTIFICATION_ID };
  } catch {
    return { success: false, reason: 'error' };
  }
}

/**
 * Annule la notification hebdomadaire programmée.
 */
export async function cancelWeeklySummaryNotification(): Promise<{ success: boolean }> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return { success: false };
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_NOTIFICATION_ID);
    return { success: true };
  } catch {
    return { success: false };
  }
}
