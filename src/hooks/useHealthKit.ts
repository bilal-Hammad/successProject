import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { Habit } from '../models/types';
import { isHealthKitAvailable, readTodayValue } from '../services/HealthKitService';

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
    await Promise.all(
      linked.map(async (habit) => {
        try {
          const value = await readTodayValue(habit.healthKitType!);
          if (value > 0) {
            logCount(habit.id, date, value);
          }
        } catch {
          // ignore individual errors
        }
      }),
    );
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
