import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { useHabitStore } from '../store/useHabitStore';
import { scheduleHabitReminder, scheduleFrequencyRemindersForToday } from '../notifications/reminders';
import { syncHabitCalendarEvent, syncHabitReminder } from '../services/calendarService';
import {
  computeSmartReminderTime,
  isSmartReminderEligible,
  timeDiffMinutes,
  SMART_TIME_DRIFT_THRESHOLD_MINUTES,
} from './smartReminderTime';

const LAST_RUN_KEY = '@forge/smartReminderLastRun';
const FREQUENCY_LAST_RUN_KEY = '@forge/frequencyReminderLastRun';

/**
 * Frequency-mode reminders are scheduled as one-off, today-only notifications
 * (see reminders.ts for why — a recurring trigger can't be selectively
 * cancelled for one day). So each new day's slots need to be (re)scheduled
 * once daily, same launch/foreground trigger pattern as reconcileSmartReminders.
 */
export async function reconcileFrequencyReminders(): Promise<void> {
  const today = dayjs().format('YYYY-MM-DD');
  const lastRun = await AsyncStorage.getItem(FREQUENCY_LAST_RUN_KEY).catch(() => null);
  if (lastRun === today) return;

  const { habits } = useHabitStore.getState();
  for (const habit of habits) {
    if (habit.archived || !habit.remindMe || !habit.reminderFrequencyMode) continue;
    await scheduleFrequencyRemindersForToday(habit).catch((e) =>
      console.warn('[reminderReconciliation] failed to schedule frequency reminders for', habit.id, e),
    );
  }

  await AsyncStorage.setItem(FREQUENCY_LAST_RUN_KEY, today);
}

/**
 * Recomputes smart-mode reminder times from completion history, once per calendar
 * day (guarded below), for every eligible habit. Only pushes the new time to the
 * notification/Reminders/Calendar integrations if it moved by more than
 * SMART_TIME_DRIFT_THRESHOLD_MINUTES — avoids churning the Calendar/Reminders API
 * over trivial day-to-day noise. Call on launch and on every foreground transition
 * (the guard below makes repeated calls within the same day cheap no-ops), mirroring
 * reconcileActiveTimerSession's pattern.
 */
export async function reconcileSmartReminders(): Promise<void> {
  const today = dayjs().format('YYYY-MM-DD');
  const lastRun = await AsyncStorage.getItem(LAST_RUN_KEY).catch(() => null);
  if (lastRun === today) return;

  const { habits, completions, saveHabit } = useHabitStore.getState();

  for (const habit of habits) {
    if (habit.archived || !habit.remindMe || habit.reminderMode !== 'smart') continue;
    if (!isSmartReminderEligible(habit)) continue;

    const { time: newTime } = computeSmartReminderTime(habit, completions);
    const currentTime = habit.reminderTime ?? newTime;
    if (timeDiffMinutes(newTime, currentTime) <= SMART_TIME_DRIFT_THRESHOLD_MINUTES) continue;

    const updated = { ...habit, reminderTime: newTime };

    try {
      const [notificationIds, calendarEventId, reminderId] = await Promise.all([
        scheduleHabitReminder(updated),
        habit.calendarEnabled ? syncHabitCalendarEvent(updated, newTime, true) : Promise.resolve(undefined),
        habit.remindersAppEnabled ? syncHabitReminder(updated, newTime, true) : Promise.resolve(undefined),
      ]);

      await saveHabit({
        ...updated,
        notificationIds,
        calendarEventIds: calendarEventId ? [calendarEventId] : undefined,
        reminderId,
      });
    } catch (e) {
      console.warn('[reminderReconciliation] failed to update smart reminder for', habit.id, e);
    }
  }

  await AsyncStorage.setItem(LAST_RUN_KEY, today);
}
