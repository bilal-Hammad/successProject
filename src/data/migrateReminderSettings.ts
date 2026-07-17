import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from '../models/types';
import { useHabitStore } from '../store/useHabitStore';

const SETTINGS_KEY = '@forge/settings';
const HABITS_KEY = '@forge/habits';
const MIGRATION_DONE_KEY = '@forge/calendarMigrationDone';

/**
 * One-time migration from the retired global calendarIntegrationEnabled setting
 * to a per-habit calendarEnabled toggle. Preserves existing behavior for anyone
 * who had the global setting on — every existing habit keeps getting calendar
 * events. Guarded by MIGRATION_DONE_KEY so it only ever runs once; without that
 * guard, a user later turning a habit's per-habit toggle off would get it forced
 * back on on the next launch. Must run after both the habit and settings stores
 * have hydrated.
 *
 * Reads the persisted settings JSON directly (not useSettingsStore's typed
 * state) since calendarIntegrationEnabled no longer exists on that type — it
 * may still be present in an old user's already-persisted JSON blob, though.
 */
export async function migrateGlobalCalendarToggle(): Promise<void> {
  const done = await AsyncStorage.getItem(MIGRATION_DONE_KEY).catch(() => null);
  if (done) return;

  const rawSettings = await AsyncStorage.getItem(SETTINGS_KEY).catch(() => null);
  const calendarIntegrationEnabled = rawSettings ? !!JSON.parse(rawSettings).calendarIntegrationEnabled : false;
  if (calendarIntegrationEnabled) {
    const raw = await AsyncStorage.getItem(HABITS_KEY);
    const habits: Habit[] = raw ? JSON.parse(raw) : [];
    const migrated = habits.map((h) => ({ ...h, calendarEnabled: true }));
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(migrated));
    await useHabitStore.getState().hydrate();
  }

  await AsyncStorage.setItem(MIGRATION_DONE_KEY, '1');
}
