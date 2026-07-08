import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import dayjs from 'dayjs';
import type { Habit } from '../models/types';
import { translate, type Language } from '../i18n/translations';

// expo-notifications lazy-loaded so Expo Go doesn't crash on missing native module.
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

// iOS hard limit is 64; leave headroom for other app notifications.
const MAX_NOTIFICATIONS = 60;

async function getLang(): Promise<Language> {
  const stored = await AsyncStorage.getItem('@app_language').catch(() => null);
  return (stored as Language) || 'en';
}

async function getNotifStrings(habit: Habit): Promise<{ title: string; body: string }> {
  const lang = await getLang();
  const habitTitle = habit.translationKey
    ? translate(lang, habit.translationKey)
    : habit.title;
  return {
    title: translate(lang, 'notif.title'),
    body: translate(lang, 'notif.body', { title: habitTitle }),
  };
}

function parseTime(hhmm: string): { hour: number; minute: number } {
  const parts = (hhmm ?? '').split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  return {
    hour: isNaN(hour) ? 9 : Math.max(0, Math.min(23, hour)),
    minute: isNaN(minute) ? 0 : Math.max(0, Math.min(59, minute)),
  };
}

// Default reminder time when none set: 9:00 AM
const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!N || !Device.isDevice) return false;
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (!N || !Device.isDevice) return 'undetermined';
  const { status } = await N.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

/** How many scheduled notifications are currently in use by this app. */
async function countScheduled(): Promise<number> {
  if (!N) return 0;
  const all = await N.getAllScheduledNotificationsAsync().catch(() => []);
  return all.length;
}

/**
 * Cancel all scheduled notifications for a habit.
 */
export async function cancelHabitReminders(habitId: string): Promise<void> {
  if (!N) return;
  const scheduled = await N.getAllScheduledNotificationsAsync().catch(() => []);
  const ids = scheduled
    .filter((n) => n.identifier.startsWith(`habit-${habitId}-`))
    .map((n) => n.identifier);
  // Also cancel legacy single-id format
  ids.push(`habit-${habitId}`);
  for (const id of ids) {
    await N.cancelScheduledNotificationAsync(id).catch(() => {});
  }
}

// Keep backward compat
export async function cancelHabitReminder(habitId: string): Promise<void> {
  return cancelHabitReminders(habitId);
}

/**
 * Schedule reminders for a single habit based on its repeat mode.
 * Cancels any previously scheduled reminders for this habit first.
 * Returns the new notification identifiers so the caller can save them to the habit.
 */
export async function scheduleHabitReminder(habit: Habit): Promise<string[]> {
  if (!N || !Device.isDevice) return [];
  if (!habit.remindMe) {
    await cancelHabitReminders(habit.id);
    return [];
  }

  // Cancel first so we don't accumulate stale triggers.
  await cancelHabitReminders(habit.id);

  // Check how many slots remain before we start scheduling.
  const used = await countScheduled();
  const slotsAvailable = MAX_NOTIFICATIONS - used;
  if (slotsAvailable <= 0) {
    console.warn('[reminders] iOS notification limit reached — skipping', habit.id);
    return [];
  }

  const { title, body } = await getNotifStrings(habit);
  const content = { title, body, data: { habitId: habit.id } };

  const time = habit.reminderTime ? parseTime(habit.reminderTime) : { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };

  const scheduledIds: string[] = [];

  if (habit.weeklyTarget) {
    // timesPerWeek: fire daily and let the user decide when to act.
    const id = `habit-${habit.id}-daily`;
    await N.scheduleNotificationAsync({
      identifier: id,
      content,
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      },
    });
    scheduledIds.push(id);
  } else if (habit.intervalDays) {
    // everyXDays: start from today (not startDate) to avoid iterating over past dates.
    const startStr = habit.startDate ?? dayjs(habit.createdAt).format('YYYY-MM-DD');
    const start = dayjs(startStr);
    const today = dayjs().startOf('day');
    const endDate = habit.endDate ? dayjs(habit.endDate) : today.add(60, 'day');

    // Jump forward to the first due date that is >= today.
    let current = start;
    if (current.isBefore(today)) {
      const daysAhead = today.diff(current, 'day');
      const stepsAhead = Math.ceil(daysAhead / habit.intervalDays);
      current = current.add(stepsAhead * habit.intervalDays, 'day');
    }

    const now = new Date();
    while (!current.isAfter(endDate) && scheduledIds.length < slotsAvailable) {
      const id = `habit-${habit.id}-${current.format('YYYYMMDD')}`;
      const triggerDate = current.hour(time.hour).minute(time.minute).second(0).toDate();
      if (triggerDate > now) {
        await N.scheduleNotificationAsync({
          identifier: id,
          content,
          trigger: {
            type: N.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        }).catch((e) => console.warn('[reminders] schedule failed', id, e));
        scheduledIds.push(id);
      }
      current = current.add(habit.intervalDays, 'day');
    }
  } else if (habit.scheduleDays.length === 7 || habit.scheduleDays.length === 0) {
    // Every day
    const id = `habit-${habit.id}-daily`;
    await N.scheduleNotificationAsync({
      identifier: id,
      content,
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      },
    });
    scheduledIds.push(id);
  } else {
    // Specific days of week — one WEEKLY trigger per selected day.
    // expo-notifications weekday: 1=Sun, 2=Mon ... 7=Sat
    for (const day of habit.scheduleDays) {
      if (scheduledIds.length >= slotsAvailable) {
        console.warn('[reminders] slot limit reached mid-habit', habit.id);
        break;
      }
      const weekday = (day + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      const id = `habit-${habit.id}-dow${day}`;
      await N.scheduleNotificationAsync({
        identifier: id,
        content,
        trigger: {
          type: N.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: time.hour,
          minute: time.minute,
        },
      }).catch((e) => console.warn('[reminders] schedule failed', id, e));
      scheduledIds.push(id);
    }
  }

  return scheduledIds;
}

/**
 * Cancel all app notifications and reschedule for every habit that has remindMe enabled.
 * Called when the user enables global notifications in Settings.
 */
export async function scheduleAllReminders(habits: Habit[]): Promise<void> {
  if (!N) return;
  // Full cancel first so the slot count is accurate when we re-schedule.
  await N.cancelAllScheduledNotificationsAsync().catch(() => {});
  for (const habit of habits) {
    if (!habit.archived && habit.remindMe) {
      await scheduleHabitReminder(habit);
    }
  }
}

/**
 * Cancel all app-scheduled notifications.
 */
export async function cancelAllReminders(): Promise<void> {
  await N?.cancelAllScheduledNotificationsAsync().catch(() => {});
}

/**
 * Update the stored reminderTime to now (HH:mm) and reschedule.
 * Used after a habit is completed in "automatic" reminder mode.
 * The caller must persist the returned reminderTime to the habit store.
 */
export async function rescheduleAfterCompletion(
  habit: Habit,
  defaultSchedule: 'automatic' | 'custom',
): Promise<{ reminderTime: string; notificationIds: string[] }> {
  const now = new Date();
  const reminderTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (!habit.remindMe) return { reminderTime: habit.reminderTime ?? reminderTime, notificationIds: habit.notificationIds ?? [] };

  // In automatic mode, update the reminder time to match the user's current completion time.
  const updatedHabit: Habit = defaultSchedule === 'automatic'
    ? { ...habit, reminderTime }
    : habit;

  const notificationIds = await scheduleHabitReminder(updatedHabit);
  return { reminderTime: updatedHabit.reminderTime ?? reminderTime, notificationIds };
}
