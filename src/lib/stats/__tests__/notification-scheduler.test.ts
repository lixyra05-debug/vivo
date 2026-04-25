import type { WeeklySummary } from '@/src/lib/gamification/types';

const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockSchedule = jest.fn();
const mockCancel = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissions(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissions(...args),
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancel(...args),
}));

import {
  isNotificationPermissionGranted,
  scheduleWeeklySummaryNotification,
  cancelWeeklySummaryNotification,
  WEEKLY_SUMMARY_NOTIFICATION_ID,
} from '@/src/lib/stats/notification-scheduler';

beforeEach(() => {
  mockGetPermissions.mockReset();
  mockRequestPermissions.mockReset();
  mockSchedule.mockReset();
  mockCancel.mockReset();
});

const baseSummary: WeeklySummary = {
  totalScans: 12,
  averageScore: 64,
  productsAvoided: 2,
  excellentProducts: 4,
  topCategory: 'biscuits',
  streakDays: 5,
  comparisonVsLastWeek: { scans: 3, avgScore: 5 },
};

describe('isNotificationPermissionGranted', () => {
  it('retourne true si status === "granted", false sinon', async () => {
    mockGetPermissions.mockResolvedValueOnce({ status: 'granted' });
    expect(await isNotificationPermissionGranted()).toBe(true);

    mockGetPermissions.mockResolvedValueOnce({ status: 'denied' });
    expect(await isNotificationPermissionGranted()).toBe(false);

    mockGetPermissions.mockResolvedValueOnce({ status: 'undetermined' });
    expect(await isNotificationPermissionGranted()).toBe(false);
  });
});

describe('scheduleWeeklySummaryNotification', () => {
  it('schedule la notif avec trigger weekly correct, content formatté, retourne success+identifier', async () => {
    mockGetPermissions.mockResolvedValueOnce({ status: 'granted' });
    mockCancel.mockResolvedValueOnce(undefined);
    mockSchedule.mockResolvedValueOnce(WEEKLY_SUMMARY_NOTIFICATION_ID);

    const result = await scheduleWeeklySummaryNotification(baseSummary);

    expect(result).toEqual({
      success: true,
      identifier: WEEKLY_SUMMARY_NOTIFICATION_ID,
    });

    expect(mockCancel).toHaveBeenCalledWith(WEEKLY_SUMMARY_NOTIFICATION_ID);
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    const scheduleArg = mockSchedule.mock.calls[0][0];
    expect(scheduleArg.identifier).toBe(WEEKLY_SUMMARY_NOTIFICATION_ID);
    expect(scheduleArg.content.title).toBe('Ta semaine Vivo 📊');
    expect(scheduleArg.content.body).toBe(
      'Cette semaine : 12 scans, score moyen 64/100.'
    );
    expect(scheduleArg.trigger).toEqual({
      type: 'weekly',
      weekday: 1,
      hour: 19,
      minute: 0,
    });
  });
});

describe('cancelWeeklySummaryNotification', () => {
  it('appelle cancelScheduledNotificationAsync avec le bon identifier et retourne success', async () => {
    mockCancel.mockResolvedValueOnce(undefined);

    const result = await cancelWeeklySummaryNotification();

    expect(mockCancel).toHaveBeenCalledWith(WEEKLY_SUMMARY_NOTIFICATION_ID);
    expect(result).toEqual({ success: true });
  });
});
