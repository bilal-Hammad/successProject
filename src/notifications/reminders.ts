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

// ─── Interactive notification actions (counting/non-binary habits only) ──────
// Category must be registered before any notification using it is scheduled.
export const HABIT_NOTIFICATION_CATEGORY = 'forge-counting-habit';
export const ACTION_COMPLETE = 'complete';
export const ACTION_INCREMENT = 'increment';
export const ACTION_SKIP = 'skip';

N?.setNotificationCategoryAsync(HABIT_NOTIFICATION_CATEGORY, [
  // "Mark as Completed" matches Apple's own Reminders-app wording for this exact action.
  { identifier: ACTION_COMPLETE, buttonTitle: 'Mark as Completed', options: { opensAppToForeground: false } },
  { identifier: ACTION_INCREMENT, buttonTitle: '+1', options: { opensAppToForeground: false } },
  { identifier: ACTION_SKIP, buttonTitle: 'Skip', options: { opensAppToForeground: false, isDestructive: true } },
]).catch(() => {});

/**
 * Thin wrapper so callers (app/_layout.tsx) never need to import expo-notifications
 * directly or handle the Expo Go/no-native-module case themselves. Deliberately has
 * no dependency on useHabitStore — the actual action handling (logCount/skipHabit)
 * lives in the caller, to avoid a repeat of the circular-import crash documented in
 * useHabitStore.ts's deleteHabit (that one was reminders.ts-adjacent, not this exact
 * pair, but the same failure mode applies to any two-way store/service import here).
 */
export function addNotificationResponseListener(
  handler: (response: import('expo-notifications').NotificationResponse) => void,
): { remove: () => void } {
  if (!N) return { remove: () => {} };
  return N.addNotificationResponseReceivedListener(handler);
}

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
 * Cancel only today's still-pending frequency-mode reminder slots for a habit
 * (called when the goal is reached or the habit is skipped for today) — leaves
 * tomorrow's slots (not yet scheduled) and any other habit's reminders untouched.
 */
export async function cancelTodaysFrequencyReminders(habitId: string, date: string): Promise<void> {
  if (!N) return;
  const dateStr = date.replace(/-/g, ''); // "YYYY-MM-DD" -> "YYYYMMDD"
  const scheduled = await N.getAllScheduledNotificationsAsync().catch(() => []);
  const ids = scheduled
    .filter((n) => n.identifier.startsWith(`habit-${habitId}-freq-${dateStr}-`))
    .map((n) => n.identifier);
  for (const id of ids) {
    await N.cancelScheduledNotificationAsync(id).catch(() => {});
  }
}

// 9:00 PM — the end of the reminder window for frequency-mode habits. The
// window's start is the habit's own reminderTime (reused, not a separate field).
const FREQUENCY_WINDOW_END_HOUR = 21;

function computeFrequencySlotsForToday(habit: Habit): dayjs.Dayjs[] {
  const time = habit.reminderTime ? parseTime(habit.reminderTime) : { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  const today = dayjs().startOf('day');
  const windowStart = today.hour(time.hour).minute(time.minute).second(0);
  const windowEnd = today.hour(FREQUENCY_WINDOW_END_HOUR).minute(0).second(0);
  if (!windowEnd.isAfter(windowStart)) return [windowStart];

  const slots: dayjs.Dayjs[] = [];
  if (habit.reminderFrequencyMode === 'interval' && habit.reminderIntervalHours) {
    let cur = windowStart;
    while (!cur.isAfter(windowEnd)) {
      slots.push(cur);
      cur = cur.add(habit.reminderIntervalHours, 'hour');
    }
  } else if (habit.reminderFrequencyMode === 'timesPerDay' && habit.reminderTimesPerDay) {
    const n = habit.reminderTimesPerDay;
    const totalMinutes = windowEnd.diff(windowStart, 'minute');
    const stepMinutes = n > 1 ? totalMinutes / (n - 1) : 0;
    for (let i = 0; i < n; i++) {
      slots.push(windowStart.add(Math.round(stepMinutes * i), 'minute'));
    }
  }
  return slots;
}

/**
 * Schedules today's remaining frequency-mode reminder slots as one-off DATE
 * triggers (not a recurring DAILY trigger — a recurring trigger can't be
 * cancelled for just one day without also cancelling every future day, which
 * is exactly what "stop once the goal is reached today" needs to do). Must be
 * re-called daily (see app/_layout.tsx's reconciliation) to schedule the next
 * day's slots.
 */
export async function scheduleFrequencyRemindersForToday(habit: Habit): Promise<string[]> {
  if (!N || !Device.isDevice) return [];

  const dateStr = dayjs().format('YYYYMMDD');
  const now = new Date();
  const slots = computeFrequencySlotsForToday(habit);
  const { title, body } = await getNotifStrings(habit);
  const content = {
    title,
    body,
    data: { habitId: habit.id, date: dayjs().format('YYYY-MM-DD') },
    categoryIdentifier: HABIT_NOTIFICATION_CATEGORY,
  };

  const used = await countScheduled();
  const slotsAvailable = MAX_NOTIFICATIONS - used;
  if (slotsAvailable <= 0) {
    console.warn('[reminders] iOS notification limit reached — skipping frequency slots for', habit.id);
    return [];
  }

  const scheduledIds: string[] = [];
  for (let i = 0; i < slots.length; i++) {
    if (scheduledIds.length >= slotsAvailable) {
      console.warn('[reminders] slot limit reached mid-habit (frequency)', habit.id);
      break;
    }
    const slotDate = slots[i].toDate();
    if (slotDate <= now) continue; // don't schedule a slot whose time already passed today
    const id = `habit-${habit.id}-freq-${dateStr}-${i}`;
    await N.scheduleNotificationAsync({
      identifier: id,
      content,
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: slotDate },
    }).catch((e) => console.warn('[reminders] frequency schedule failed', id, e));
    scheduledIds.push(id);
  }
  return scheduledIds;
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

  // Frequency mode (counting habits only) replaces the single fixed-time
  // reminder below entirely — the two are mutually exclusive by construction,
  // since only one of these branches ever runs.
  if (habit.reminderFrequencyMode) {
    return scheduleFrequencyRemindersForToday(habit);
  }

  // Check how many slots remain before we start scheduling.
  const used = await countScheduled();
  const slotsAvailable = MAX_NOTIFICATIONS - used;
  if (slotsAvailable <= 0) {
    console.warn('[reminders] iOS notification limit reached — skipping', habit.id);
    return [];
  }

  const { title, body } = await getNotifStrings(habit);
  // Interactive actions (Mark as Completed / +1 / Skip) apply to counting
  // habits only, per the feature request — binary habits' notifications are
  // untouched (no categoryIdentifier, same as before this feature existed).
  //
  // data intentionally has no `date` field here: these triggers are DAILY/
  // WEEKLY/recurring, firing on many different future days, so any date
  // captured at scheduling time would go stale by the time it actually fires.
  // The response handler computes "today" itself instead of trusting this.
  const isCountingHabit = !!habit.dailyTarget;
  const content = {
    title,
    body,
    data: { habitId: habit.id },
    ...(isCountingHabit ? { categoryIdentifier: HABIT_NOTIFICATION_CATEGORY } : {}),
  };

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
