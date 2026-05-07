import AsyncStorage from '@react-native-async-storage/async-storage';
import { createReminder, markTodayDone } from '../reminder-store';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-mock-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('reminder-store — gestion des rappels de cures', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("createReminder('thyme', 14) renvoie une cure active de 14 jours avec notif programmée", async () => {
    const reminder = await createReminder('thyme', 14);

    expect(reminder.plantId).toBe('thyme');
    expect(reminder.durationDays).toBe(14);
    expect(reminder.status).toBe('active');
    expect(reminder.markedDays).toEqual([]);
    expect(reminder.notificationId).not.toBeNull();
    expect(typeof reminder.startDate).toBe('string');
  });

  it('markTodayDone ajoute une date YYYY-MM-DD à markedDays', async () => {
    const reminder = await createReminder('thyme', 14);
    const updated = await markTodayDone(reminder.id);

    expect(updated).not.toBeNull();
    expect(updated?.markedDays.length).toBe(1);
    expect(updated?.markedDays[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(updated?.markedDays[0].length).toBe(10);
  });
});
