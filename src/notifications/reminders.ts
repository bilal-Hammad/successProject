import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import type { Habit } from '../models/types';
import { translate, type Language } from '../i18n/translations';

// expo-notifications was removed from Expo Go on Android in SDK 53.
// We lazy-load it via require() so the app doesn't crash in Expo Go;
// all functions become no-ops when the module isn't available.
let N: typeof import('expo-notifications') | null = null;
try {
  N = require('expo-notifications');
  N!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Running in Expo Go — notifications unavailable
}

async function getNotifStrings(habit: Habit): Promise<{ title: string; body: string }> {
  const stored = await AsyncStorage.getItem('@app_language').catch(() => null);
  const lang: Language = (stored as Language) || 'en';
  const habitTitle = habit.translationKey
    ? translate(lang, habit.translationKey)
    : habit.title;
  return {
    title: translate(lang, 'notif.title'),
    body: translate(lang, 'notif.body', { title: habitTitle }),
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!N || !Device.isDevice) return false;
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleHabitReminder(habit: Habit): Promise<void> {
  if (!N || !habit.reminderTime) return;
  const [hourStr, minuteStr] = habit.reminderTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  await N.cancelScheduledNotificationAsync(`habit-${habit.id}`).catch(() => {});

  const { title, body } = await getNotifStrings(habit);

  await N.scheduleNotificationAsync({
    identifier: `habit-${habit.id}`,
    content: {
      title,
      body,
      data: { habitId: habit.id },
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  await N?.cancelScheduledNotificationAsync(`habit-${habitId}`).catch(() => {});
}

export async function scheduleAllReminders(habits: Habit[]): Promise<void> {
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
  for (const habit of habits) {
    if (!habit.archived && habit.reminderTime) {
      await scheduleHabitReminder(habit);
    }
  }
}
