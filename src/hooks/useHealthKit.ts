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
  // HealthKit types we've already requested authorization for this session.
  // requestAuthorization must only be called once per type — calling it again
  // on every sync (even for already-granted types) was the actual bug: it isn't
  // wrapped in try/catch, and a rejected repeat call would throw synchronously
  // here, aborting syncAll() before it ever reached the reads below. Since every
  // subsequent sync hit this same line, that's why syncing only ever worked once,
  // at add-time — never again afterward. Tracking already-initialized types here
  // means only genuinely new health-linked habits trigger a fresh request.
  const initializedTypesRef = useRef<Set<string>>(new Set());

  const syncAll = async () => {
    if (!isHealthKitAvailable()) return;

    const now = Date.now();
    // Throttle: don't sync more than once per 60 seconds
    if (now - lastSyncRef.current < 60_000) return;
    lastSyncRef.current = now;

    const linked = habits.filter((h) => !!h.healthKitType && !h.archived);
    if (linked.length === 0) return;

    console.log('[FORGE] HealthKit: syncing', linked.length, 'linked habits for', date);

    const newTypes = linked
      .map((h) => h.healthKitType!)
      .filter((hkType) => !initializedTypesRef.current.has(hkType));
    if (newTypes.length > 0) {
      try {
        await initForHabits(newTypes);
        newTypes.forEach((hkType) => initializedTypesRef.current.add(hkType));
      } catch (e) {
        console.log('[FORGE] HealthKit: initForHabits threw —', e);
      }
    }

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

  // Always-fresh reference to the latest syncAll closure (current habits/date/
  // logCount), so the foreground listener and the backstop interval below never
  // need to be torn down and recreated just to avoid a stale closure.
  const syncAllRef = useRef(syncAll);
  syncAllRef.current = syncAll;

  // Sync on mount / date change
  useEffect(() => {
    syncAllRef.current();
  }, [date]);

  // Sync when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncAllRef.current();
    });
    return () => sub.remove();
  }, []);

  // Continuous backstop: HealthKit data can change while this screen just sits
  // open in the foreground the whole time (e.g. a workout finishes via Apple
  // Watch without you ever backgrounding Forge) — no AppState transition fires
  // in that case, so without this, updates would only ever appear after your
  // next background/foreground cycle. Matches the internal 60s throttle, so
  // ticks that land before that window are cheap no-ops.
  useEffect(() => {
    const id = setInterval(() => syncAllRef.current(), 60_000);
    return () => clearInterval(id);
  }, []);
}
