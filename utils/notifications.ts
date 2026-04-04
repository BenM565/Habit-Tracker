import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const NOTIFICATION_TIMES = [
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '9:00 AM', hour: 9, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '6:00 PM', hour: 18, minute: 0 },
  { label: '9:00 PM', hour: 21, minute: 0 },
];

async function getNotifications() {
  return import('expo-notifications');
}

export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;
  try {
    const Notifications = await getNotifications();
    await Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  } catch (_) {}
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const Notifications = await getNotifications();
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (_) {
    return false;
  }
}

export async function scheduleReminder(hour: number, minute: number): Promise<boolean> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return false;

    const Notifications = await getNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit Tracker Reminder',
        body: "Don't forget to log your habits today! Keep the streak going!",
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'habit-reminders' } : {}),
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      } as any,
    });

    await AsyncStorage.setItem('notificationsEnabled', 'true');
    await AsyncStorage.setItem('notificationTime', JSON.stringify({ hour, minute }));
    return true;
  } catch (_) {
    return false;
  }
}

export async function cancelReminder(): Promise<void> {
  try {
    const Notifications = await getNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (_) {}
  await AsyncStorage.setItem('notificationsEnabled', 'false');
}

export async function loadNotificationSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  const [enabledRaw, timeRaw] = await Promise.all([
    AsyncStorage.getItem('notificationsEnabled'),
    AsyncStorage.getItem('notificationTime'),
  ]);
  const enabled = enabledRaw === 'true';
  const time = timeRaw ? JSON.parse(timeRaw) : { hour: 9, minute: 0 };
  return { enabled, hour: time.hour, minute: time.minute };
}
