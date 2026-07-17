import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from '../models/types';
import { isTimeUnit } from '../logic/units';
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
    const { status } = await Cal.requestCalendarPermissions();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function requestRemindersPermission(): Promise<boolean> {
  if (!Cal) return false;
  try {
    const { status } = await Cal.requestRemindersPermissions();
    return status === 'granted';
  } catch {
    return false;
  }
}

// Finds a writable source for a newly-created calendar/reminder list: prefer
// iCloud, fall back to LOCAL. getSourcesSync is synchronous in the modern API.
function findWritableSource(): import('expo-calendar').Source | null {
  if (!Cal) return null;
  const sources = Cal.getSourcesSync();
  return (
    sources.find((s) => s.type === Cal!.SourceType.CALDAV && s.name === 'iCloud') ??
    sources.find((s) => s.type === Cal!.SourceType.LOCAL) ??
    null
  );
}

export async function getOrCreateForgeCalendar(): Promise<string | null> {
  if (!Cal) return null;
  try {
    await ensureCalendarKeysMigrated();
    const cached = await AsyncStorage.getItem(CALENDAR_KEY).catch(() => null);
    if (cached) {
      const all = await Cal.getCalendars(Cal.EntityTypes.EVENT);
      if (all.find((c) => c.id === cached)) return cached;
      // Cached ID no longer exists — fall through to find/create.
    }

    const all = await Cal.getCalendars(Cal.EntityTypes.EVENT);
    const existing = all.find((c) => c.title === CALENDAR_TITLE && c.allowsModifications);
    if (existing) {
      await AsyncStorage.setItem(CALENDAR_KEY, existing.id);
      return existing.id;
    }

    const source = findWritableSource();
    if (!source) return null;

    const calendar = await Cal.createCalendar({
      title: CALENDAR_TITLE,
      color: '#F05A7E',
      entityType: Cal.EntityTypes.EVENT,
      sourceId: source.id,
      source: { isLocalAccount: source.type === Cal.SourceType.LOCAL, name: source.name, type: source.type },
      name: CALENDAR_TITLE,
      ownerAccount: 'local',
      accessLevel: Cal.CalendarAccessLevel.OWNER,
    });
    await AsyncStorage.setItem(CALENDAR_KEY, calendar.id);
    return calendar.id;
  } catch (e) {
    console.warn('[calendarService] getOrCreateForgeCalendar failed', e);
    return null;
  }
}

export async function getOrCreateForgeReminderList(): Promise<string | null> {
  if (!Cal) {
    console.log('[FORGE] Reminders: getOrCreateForgeReminderList — Cal module not loaded (Expo Go?)');
    return null;
  }
  try {
    await ensureCalendarKeysMigrated();
    const cached = await AsyncStorage.getItem(REMINDER_LIST_KEY).catch(() => null);
    console.log('[FORGE] Reminders: cached list ID =', cached);
    if (cached) {
      const all = await Cal.getCalendars(Cal.EntityTypes.REMINDER);
      if (all.find((c) => c.id === cached)) {
        console.log('[FORGE] Reminders: cached list still exists — reusing', cached);
        return cached;
      }
      console.log('[FORGE] Reminders: cached list ID no longer exists — will find/create');
    }

    const all = await Cal.getCalendars(Cal.EntityTypes.REMINDER);
    console.log('[FORGE] Reminders: existing REMINDER-type calendars =', all.map((c) => `${c.title} (${c.id}, writable=${c.allowsModifications}, source=${c.source?.name}/${c.source?.type})`));
    const existing = all.find((c) => c.title === CALENDAR_TITLE && c.allowsModifications);
    if (existing) {
      console.log('[FORGE] Reminders: found existing Forge Habits list —', existing.id);
      await AsyncStorage.setItem(REMINDER_LIST_KEY, existing.id);
      return existing.id;
    }

    // Derive the source from a real, already-existing REMINDER-type calendar
    // rather than guessing by source title/type. Root-caused via a real
    // device log: EventKit can expose two distinct sources both named
    // "iCloud" (type caldav) — one backs Events, a separate one backs
    // Reminders — and title-based matching (findWritableSource, used for
    // the Calendar side) has no way to tell them apart. It picked the wrong
    // one here, and createCalendar failed with "That account does not
    // support reminders." A calendar returned by
    // getCalendars(EntityTypes.REMINDER) is proof its source supports
    // reminders, so deriving from one sidesteps the ambiguity entirely.
    const writableReminderCalendars = all.filter((c) => c.allowsModifications && c.source);
    const iCloudReminderCalendar = writableReminderCalendars.find(
      (c) => c.source!.type === Cal!.SourceType.CALDAV && c.source!.name === 'iCloud',
    );
    const derivedSource = (iCloudReminderCalendar ?? writableReminderCalendars[0])?.source ?? null;

    const sourcesDebug = Cal.getSourcesSync();
    console.log('[FORGE] Reminders: available sources =', sourcesDebug.map((s) => `${s.name} (${s.type})`));
    const source = derivedSource ?? findWritableSource();
    console.log(
      '[FORGE] Reminders: chosen source =', source ? `${source.name} (${source.type})` : 'NONE FOUND',
      derivedSource ? '(derived from existing reminder calendar)' : '(fallback title-based guess — no existing reminder calendars found)',
    );
    if (!source) return null;

    console.log('[FORGE] Reminders: creating new Forge Habits list on source', source.name);
    const list = await Cal.createCalendar({
      title: CALENDAR_TITLE,
      color: '#F05A7E',
      entityType: Cal.EntityTypes.REMINDER,
      sourceId: source.id,
      source: { isLocalAccount: source.type === Cal.SourceType.LOCAL, name: source.name, type: source.type },
      name: CALENDAR_TITLE,
      ownerAccount: 'local',
      accessLevel: Cal.CalendarAccessLevel.OWNER,
    });
    console.log('[FORGE] Reminders: createCalendar succeeded — new list ID =', list.id);
    await AsyncStorage.setItem(REMINDER_LIST_KEY, list.id);
    return list.id;
  } catch (e) {
    console.warn('[calendarService] getOrCreateForgeReminderList failed —', e instanceof Error ? e.message : e, e);
    return null;
  }
}

// ─── Recurrence ────────────────────────────────────────────────────────────────

// EventKit's DayOfTheWeek enum is 1=Sunday…7=Saturday; this app's scheduleDays
// is 0=Sunday…6=Saturday (dayjs convention), hence the +1 below.
function toDayOfTheWeek(day: number): number {
  return day + 1;
}

function firstNWeekdays(n: number): number[] {
  return Array.from({ length: Math.min(n, 7) }, (_, i) => i);
}

/**
 * Builds a native RecurrenceRule matching the habit's own due-date pattern, so a
 * single reminder/event can recur correctly without pre-generating discrete
 * occurrences. `weeklyTarget` (any N days per week) has no exact EventKit
 * equivalent, so it's approximated the same way the old date-window logic did:
 * placed on the first N weekdays.
 */
function recurrenceRuleForHabit(habit: Habit): import('expo-calendar').RecurrenceRule | null {
  if (!Cal) return null;
  const endDate = habit.endDate ? dayjs(habit.endDate).toDate() : undefined;

  if (habit.weeklyTarget) {
    return {
      frequency: Cal.Frequency.WEEKLY,
      daysOfTheWeek: firstNWeekdays(habit.weeklyTarget).map((d) => ({ dayOfTheWeek: toDayOfTheWeek(d) })),
      ...(endDate ? { endDate } : {}),
    };
  }

  if (habit.intervalDays) {
    return {
      frequency: Cal.Frequency.DAILY,
      interval: habit.intervalDays,
      ...(endDate ? { endDate } : {}),
    };
  }

  const daySet = habit.scheduleDays ?? [];
  if (daySet.length === 0 || daySet.length === 7) {
    return { frequency: Cal.Frequency.DAILY, ...(endDate ? { endDate } : {}) };
  }

  return {
    frequency: Cal.Frequency.WEEKLY,
    daysOfTheWeek: daySet.map((d) => ({ dayOfTheWeek: toDayOfTheWeek(d) })),
    ...(endDate ? { endDate } : {}),
  };
}

function anchorDateForTime(reminderTime: string): Date {
  const parts = reminderTime.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return dayjs()
    .hour(isNaN(h) ? 9 : h)
    .minute(isNaN(m) ? 0 : m)
    .second(0)
    .millisecond(0)
    .toDate();
}

// ─── Calendar event sync (single recurring event per habit) ──────────────────

/**
 * Creates or updates the single recurring Calendar event for a habit, or
 * deletes it if `enabled` is false. Returns the event ID (or undefined).
 *
 * Duration rule: time-based units (minutes/hours) get a timed block from
 * `reminderTime` to `reminderTime + goal duration`; everything else gets an
 * all-day event.
 */
export async function syncHabitCalendarEvent(
  habit: Habit,
  reminderTime: string,
  enabled: boolean,
): Promise<string | undefined> {
  if (!Cal) return undefined;

  if (!enabled) {
    if (habit.calendarEventIds?.[0]) {
      await deleteHabitCalendarEvent(habit.calendarEventIds[0]);
    }
    return undefined;
  }

  const calId = await getOrCreateForgeCalendar();
  if (!calId) return undefined;

  const timeBased = isTimeUnit(habit.unit);
  const anchor = dayjs(anchorDateForTime(reminderTime));
  const goalMinutes = habit.dailyTarget ?? 30;

  const allDay = !timeBased;
  const startDate = allDay ? anchor.startOf('day').toDate() : anchor.toDate();
  const endDate = allDay ? anchor.endOf('day').toDate() : anchor.add(goalMinutes, 'minute').toDate();
  const recurrenceRule = recurrenceRuleForHabit(habit);

  const details = {
    title: habit.title,
    startDate,
    endDate,
    allDay,
    notes: habit.description,
    recurrenceRule,
  };

  const existingId = habit.calendarEventIds?.[0];
  if (existingId) {
    try {
      const event = await Cal.ExpoCalendarEvent.get(existingId);
      await event.update(details);
      return existingId;
    } catch (e) {
      console.warn('[calendarService] update failed, recreating event', e);
      // Fall through to create — the existing event was likely deleted externally.
    }
  }

  try {
    const calendar = await Cal.ExpoCalendar.get(calId);
    const event = await calendar.createEvent(details);
    return event.id;
  } catch (e) {
    console.warn('[calendarService] createEvent failed', e);
    return undefined;
  }
}

export async function deleteHabitCalendarEvent(eventId: string): Promise<void> {
  if (!Cal) return;
  try {
    const event = await Cal.ExpoCalendarEvent.get(eventId);
    await event.delete();
  } catch (e) {
    console.warn('[calendarService] deleteHabitCalendarEvent failed', eventId, e);
  }
}

// ─── Reminders sync (single recurring reminder per habit) ─────────────────────

/**
 * Creates or updates the single recurring Apple Reminders entry for a habit,
 * or deletes it if `enabled` is false. Returns the reminder ID (or undefined).
 */
export async function syncHabitReminder(
  habit: Habit,
  reminderTime: string,
  enabled: boolean,
): Promise<string | undefined> {
  console.log('[FORGE] Reminders: syncHabitReminder called for', habit.title, '| enabled =', enabled, '| Cal loaded =', !!Cal);
  if (!Cal) return undefined;

  if (!enabled) {
    if (habit.reminderId) {
      await deleteHabitReminder(habit.reminderId);
    }
    return undefined;
  }

  const listId = await getOrCreateForgeReminderList();
  console.log('[FORGE] Reminders: listId =', listId);
  if (!listId) {
    console.log('[FORGE] Reminders: no list ID — bailing without creating a reminder');
    return undefined;
  }

  const anchor = anchorDateForTime(reminderTime);
  const recurrenceRule = recurrenceRuleForHabit(habit);
  console.log('[FORGE] Reminders: anchor =', anchor.toISOString(), '| recurrenceRule =', JSON.stringify(recurrenceRule));

  const details = {
    title: habit.title,
    startDate: anchor,
    dueDate: anchor,
    notes: habit.description,
    recurrenceRule,
  };

  if (habit.reminderId) {
    try {
      console.log('[FORGE] Reminders: existing reminderId found — attempting update', habit.reminderId);
      const reminder = await Cal.ExpoCalendarReminder.get(habit.reminderId);
      await reminder.update(details);
      console.log('[FORGE] Reminders: update succeeded');
      return habit.reminderId;
    } catch (e) {
      console.warn('[calendarService] reminder update failed, recreating —', e instanceof Error ? e.message : e, e);
      // Fall through to create — likely deleted externally.
    }
  }

  try {
    console.log('[FORGE] Reminders: creating new reminder in list', listId, 'with details', JSON.stringify({ ...details, startDate: anchor.toISOString(), dueDate: anchor.toISOString() }));
    const list = await Cal.ExpoCalendar.get(listId);
    console.log('[FORGE] Reminders: fetched list object —', list.title, '| entityType =', list.entityType);
    const reminder = await list.createReminder(details);
    console.log('[FORGE] Reminders: createReminder succeeded — new reminder ID =', reminder.id);
    return reminder.id;
  } catch (e) {
    console.warn('[calendarService] createReminder failed —', e instanceof Error ? e.message : e, e);
    return undefined;
  }
}

export async function deleteHabitReminder(reminderId: string): Promise<void> {
  if (!Cal) return;
  try {
    const reminder = await Cal.ExpoCalendarReminder.get(reminderId);
    await reminder.delete();
  } catch (e) {
    console.warn('[calendarService] deleteHabitReminder failed', reminderId, e);
  }
}
