import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { Habit } from '../models/types';
import { isHealthKitAvailable, initForHabits, readTodayValue } from '../services/HealthKitService';

type LogCount = (habitId: string, date: string, count: number) => void;

export function useHealthKitSync(
  habits: Habit[],
  date: string,
  logCount: LogCount,
) {
  const lastSyncRef = useRef(0);

  const syncAll = async () => {
    if (!isHealthKitAvailable()) return;

    const now = Date.now();
    // Throttle: don't sync more than once per 60 seconds
    if (now - lastSyncRef.current < 60_000) return;
    lastSyncRef.current = now;

    const linked = habits.filter((h) => !!h.healthKitType && !h.archived);
    if (linked.length === 0) return;

    console.log('[FORGE] HealthKit: syncing', linked.length, 'linked habits for', date);

    // initHealthKit must be called before any reads. It shows the permission sheet
    // on first launch and is a no-op (fast) for subsequent calls.
    await initForHabits(linked.map((h) => h.healthKitType!));

    await Promise.all(
      linked.map(async (habit) => {
        try {
          const value = await readTodayValue(habit.healthKitType!);
          console.log(`[FORGE] HealthKit: ${habit.healthKitType} → value=${value} (habit "${habit.id}")`);
          if (value > 0) {
            logCount(habit.id, date, value);
          }
        } catch (e) {
          console.log(`[FORGE] HealthKit: readTodayValue threw for ${habit.healthKitType}:`, e);
        }
      }),
    );

    console.log('[FORGE] HealthKit: sync complete');
  };

  // Sync on mount
  useEffect(() => {
    syncAll();
  }, [date]);

  // Sync when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncAll();
    });
    return () => sub.remove();
  }, [habits, date]);
}
