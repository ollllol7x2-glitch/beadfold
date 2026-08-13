import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getSetting } from '@/database/repository';

export async function requestTasteReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const Notifications = await import('expo-notifications');
  const permission = await Notifications.requestPermissionsAsync();
  return permission.granted;
}

export async function scheduleTasteReminderIfAllowed(db: SQLiteDatabase, cupId: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const enabled = await getSetting(db, 'notification_reminders', 'false');
  if (enabled !== 'true') return false;
  const Notifications = await import('expo-notifications');
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return false;
  const sound = await getSetting(db, 'sound', 'false');
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '방금 내린 커피, 어떻게 느껴졌나요?',
        body: '방금 마신 커피는 어땠나요? 첫 느낌만 남겨보세요.',
        data: { route: `/record-cup/${cupId}`, cupId },
        sound: sound === 'true' ? 'default' : undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 15 * 60,
      },
    });
    return true;
  } catch {
    return false;
  }
}
