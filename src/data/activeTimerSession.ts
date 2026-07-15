import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHabitStore } from '../store/useHabitStore';
import { endHabitTimerActivity } from '../modules/HabitLiveActivity';

const KEY = '@forge/activeTimerSession';

export type ActiveTimerSession = {
  habitId: string;
  date: string;         // "YYYY-MM-DD" — the day this completion applies to
  startedAt: number;     // epoch ms
  endDate: number;       // epoch ms — current end date; shifts forward on each resume
  goalSeconds: number;
  isPaused: boolean;
  pausedAt: number | null; // epoch ms
};

export async function saveActiveTimerSession(session: ActiveTimerSession): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}

export async function getActiveTimerSession(): Promise<ActiveTimerSession | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearActiveTimerSession(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

// Called when a single habit is deleted. If the persisted session belongs to
// that habit, end its Live Activity and clear the record — otherwise it's
// orphaned forever, since the only way to reach a habit's timer UI is through
// that habit, and it no longer exists. (This is exactly how an orphaned
// session was found on 2026-07-15: a paused session survived its habit being
// deleted, with no code path left to ever clear it again.)
export async function clearActiveTimerSessionForHabit(habitId: string): Promise<void> {
  const session = await getActiveTimerSession();
  if (session && session.habitId === habitId) {
    endHabitTimerActivity();
    await clearActiveTimerSession();
  }
}

// Called when all habits are wiped (Settings > Delete All Data). Any existing
// session is guaranteed orphaned at that point, regardless of which habit it
// belonged to.
export async function clearAnyActiveTimerSession(): Promise<void> {
  const session = await getActiveTimerSession();
  if (session) {
    endHabitTimerActivity();
    await clearActiveTimerSession();
  }
}

// Returns the persisted session only if the habit it belongs to still exists;
// otherwise it's orphaned (e.g. deleted through some path older than the
// delete-time clearing added alongside this function — belt and suspenders),
// so this clears it and returns null instead. Existence, not elapsed time, is
// the safety valve: a habit that's still there is never touched regardless of
// how long its session has been paused, so a legitimately long-paused timer
// can never be misclassified as stale the way a time-based cutoff could.
export async function getValidActiveTimerSession(): Promise<ActiveTimerSession | null> {
  const session = await getActiveTimerSession();
  if (!session) return null;

  const habitStillExists = useHabitStore.getState().habits.some((h) => h.id === session.habitId);
  if (!habitStillExists) {
    endHabitTimerActivity();
    await clearActiveTimerSession();
    return null;
  }

  return session;
}

// Called on app launch and on every foreground transition. If a persisted timer
// session's endDate has already passed and it isn't paused, the habit finished
// while the app wasn't open to see it — finalize the completion via the same
// logCount path the in-app timer already uses, then end the Live Activity (if
// any) and clear the record.
//
// A paused session is left untouched: real time passing while paused must not
// auto-complete the habit. A still-running, not-yet-due session is also left
// untouched — the in-app timer's own AppState handling covers that case while
// the modal is open, and there's nothing to reconcile here until it's actually due.
export async function reconcileActiveTimerSession(): Promise<void> {
  const session = await getValidActiveTimerSession();
  if (!session) return;
  if (session.isPaused) return;
  if (Date.now() < session.endDate) return;

  const goalMinutes = Math.floor(session.goalSeconds / 60);
  await useHabitStore.getState().logCount(session.habitId, session.date, goalMinutes);
  endHabitTimerActivity();
  await clearActiveTimerSession();
}
