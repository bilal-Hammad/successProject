import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from '../models/types';
import { migrateStorageKey } from '../utils/migrateStorageKey';

// expo-calendar lazy-loaded to avoid crashing in Expo Go.
let Cal: typeof import('expo-calendar') | null = null;
try {
  Cal = require('expo-calendar');
} catch {
  // Expo Go — calendar unavailable
}

const CALENDAR_TITLE = 'Forge Habits';
const CALENDAR_KEY = '@forge/forgeCalendarId';
const CALENDAR_KEY_LEGACY = '@momentum/forgeCalendarId';
const REMINDER_LIST_KEY = '@forge/forgeReminderListId';
const REMINDER_LIST_KEY_LEGACY = '@momentum/forgeReminderListId';

let calendarKeysMigrated = false;
async function ensureCalendarKeysMigrated(): Promise<void> {
  if (calendarKeysMigrated) return;
  await Promise.all([
    migrateStorageKey(CALENDAR_KEY_LEGACY, CALENDAR_KEY),
    migrateStorageKey(REMINDER_LIST_KEY_LEGACY, REMINDER_LIST_KEY),
  ]);
  calendarKeysMigrated = true;
}

export async function requestCalendarPermission(): Promise<boolean> {
  if (!Cal) return false;
  try {
    const { status } = await Cal.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function requestRemindersPermission(): Promise<boolean> {
  if (!Cal) return false;
  try {
    const { status } = await Cal.requestRemindersPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

async function getOrCreateForgeCalendar(): Promise<string | null> {
  if (!Cal) return null;
  try {
    await ensureCalendarKeysMigrated();
    const cached = await AsyncStorage.getItem(CALENDAR_KEY).catch(() => null);
    if (cached) {
      const all = await Cal.getCalendarsAsync(Cal.EntityTypes.EVENT);
      if (all.find((c) => c.id === cached)) return cached;
      // Cached ID no longer exists — fall through to find/create.
    }

    const all = await Cal.getCalendarsAsync(Cal.EntityTypes.EVENT);
    const existing = all.find((c) => c.title === CALENDAR_TITLE && c.allowsModifications);
    if (existing) {
      await AsyncStorage.setItem(CALENDAR_KEY, existing.id);
      return existing.id;
    }

    // Find a writable source: prefer iCloud, fall back to LOCAL.
    const sources = await Cal.getSourcesAsync();
    const source =
      sources.find((s) => s.type === Cal!.SourceType.CALDAV && s.name === 'iCloud') ??
      sources.find((s) => s.type === Cal!.SourceType.LOCAL);
    if (!source) return null;

    const id = await Cal.createCalendarAsync({
      title: CALENDAR_TITLE,
      color: '#F05A7E',
      entityType: Cal.EntityTypes.EVENT,
      sourceId: source.id,
      // Use the actual source type — don't hardcode LOCAL.
      source: { isLocalAccount: source.type === Cal.SourceType.LOCAL, name: source.name, type: source.type },
      name: CALENDAR_TITLE,
      ownerAccount: 'local',
      accessLevel: Cal.CalendarAccessLevel.OWNER,
    });
    await AsyncStorage.setItem(CALENDAR_KEY, id);
    return id;
  } catch (e) {
    console.warn('[calendarService] getOrCreateForgeCalendar failed', e);
    return null;
  }
}

async function getOrCreateForgeReminderList(): Promise<string | null> {
  if (!Cal) return null;
  try {
    await ensureCalendarKeysMigrated();
    const cached = await AsyncStorage.getItem(REMINDER_LIST_KEY).catch(() => null);
    if (cached) {
      const all = await Cal.getCalendarsAsync(Cal.EntityTypes.REMINDER);
      if (all.find((c) => c.id === cached)) return cached;
    }

    const all = await Cal.getCalendarsAsync(Cal.EntityTypes.REMINDER);
    const existing = all.find((c) => c.title === CALENDAR_TITLE && c.allowsModifications);
    if (existing) {
      await AsyncStorage.setItem(REMINDER_LIST_KEY, existing.id);
      return existing.id;
    }

    const sources = await Cal.getSourcesAsync();
    const source =
      sources.find((s) => s.type === Cal!.SourceType.CALDAV && s.name === 'iCloud') ??
      sources.find((s) => s.type === Cal!.SourceType.LOCAL);
    if (!source) return null;

    const id = await Cal.createCalendarAsync({
      title: CALENDAR_TITLE,
      color: '#F05A7E',
      entityType: Cal.EntityTypes.REMINDER,
      sourceId: source.id,
      source: { isLocalAccount: source.type === Cal.SourceType.LOCAL, name: source.name, type: source.type },
      name: CALENDAR_TITLE,
      ownerAccount: 'local',
      accessLevel: Cal.CalendarAccessLevel.OWNER,
    });
    await AsyncStorage.setItem(REMINDER_LIST_KEY, id);
    return id;
  } catch (e) {
    console.warn('[calendarService] getOrCreateForgeReminderList failed', e);
    return null;
  }
}

function dueDatesForHabit(habit: Habit, fromDate: dayjs.Dayjs, windowDays: number): dayjs.Dayjs[] {
  const results: dayjs.Dayjs[] = [];
  const endDate = habit.endDate ? dayjs(habit.endDate) : fromDate.add(windowDays, 'day');

  if (habit.weeklyTarget) {
    // timesPerWeek: create one event per week for `weeklyTarget` occurrences per week.
    // We put them on the first N days of each week starting from today.
    const target = Math.min(habit.weeklyTarget, 7);
    let cur = fromDate.startOf('week');
    while (!cur.isAfter(endDate)) {
      let dayOfWeek = 0;
      let placed = 0;
      while (placed < target && dayOfWeek < 7) {
        const candidate = cur.add(dayOfWeek, 'day');
        if (!candidate.isBefore(fromDate) && !candidate.isAfter(endDate)) {
          results.push(candidate);
          placed++;
        }
        dayOfWeek++;
      }
      cur = cur.add(1, 'week');
    }
  } else if (habit.intervalDays) {
    const startStr = habit.startDate ?? dayjs(habit.createdAt).format('YYYY-MM-DD');
    const start = dayjs(startStr);
    // Jump to first occurrence >= fromDate
    let cur = start;
    if (cur.isBefore(fromDate)) {
      const daysAhead = fromDate.diff(cur, 'day');
      const steps = Math.ceil(daysAhead / habit.intervalDays);
      cur = cur.add(steps * habit.intervalDays, 'day');
    }
    while (!cur.isAfter(endDate)) {
      results.push(cur);
      cur = cur.add(habit.intervalDays, 'day');
    }
  } else {
    const daySet = new Set(
      habit.scheduleDays.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : habit.scheduleDays
    );
    let cur = fromDate;
    while (!cur.isAfter(endDate)) {
      if (daySet.has(cur.day())) results.push(cur);
      cur = cur.add(1, 'day');
    }
  }
  return results;
}

export type CalendarEventTypeOption = 'allDay' | 'automatic' | 'reminderTime';

/**
 * Create calendar events for a habit across the next `windowDays` days.
 * Returns an array of created event IDs (may be partial if some fail).
 */
export async function createHabitEvents(
  habit: Habit,
  eventType: CalendarEventTypeOption,
  windowDays = 60,
): Promise<string[]> {
  if (!Cal) return [];

  const calId = await getOrCreateForgeCalendar();
  if (!calId) return [];

  const today = dayjs().startOf('day');
  const dates = dueDatesForHabit(habit, today, windowDays);
  const ids: string[] = [];

  const reminderTime = habit.reminderTime
    ? (() => {
        const parts = habit.reminderTime!.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        return { hour: isNaN(h) ? 9 : h, minute: isNaN(m) ? 0 : m };
      })()
    : { hour: 9, minute: 0 };

  for (const date of dates) {
    let startDate: Date;
    let endDate: Date;
    let allDay: boolean;

    if (eventType === 'allDay') {
      allDay = true;
      startDate = date.startOf('day').toDate();
      endDate = date.endOf('day').toDate();
    } else {
      allDay = false;
      const startMoment = date.hour(reminderTime.hour).minute(reminderTime.minute).second(0);
      const endMoment = startMoment.add(30, 'minute');
      startDate = startMoment.toDate();
      endDate = endMoment.toDate();
    }

    try {
      const eventId = await Cal.createEventAsync(calId, {
        title: habit.title,
        startDate,
        endDate,
        allDay,
        notes: habit.description,
      });
      ids.push(eventId);
    } catch (e) {
      console.warn('[calendarService] createEventAsync failed for', date.format('YYYY-MM-DD'), e);
      // Continue — partial success is better than all-or-nothing.
    }
  }

  return ids;
}

/**
 * Delete previously created events for a habit.
 */
export async function deleteHabitEvents(eventIds: string[]): Promise<void> {
  if (!Cal || eventIds.length === 0) return;
  for (const id of eventIds) {
    await Cal.deleteEventAsync(id).catch((e) =>
      console.warn('[calendarService] deleteEventAsync failed', id, e)
    );
  }
}

/**
 * Sync calendar events for a habit: delete old ones and create new ones.
 * Returns the updated eventIds array.
 */
export async function syncHabitCalendarEvents(
  habit: Habit,
  eventType: CalendarEventTypeOption,
  enabled: boolean,
): Promise<string[]> {
  if (habit.calendarEventIds && habit.calendarEventIds.length > 0) {
    await deleteHabitEvents(habit.calendarEventIds);
  }
  if (!enabled) return [];
  return createHabitEvents(habit, eventType);
}
