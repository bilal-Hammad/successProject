import { create } from 'zustand';
import dayjs from 'dayjs';
import { AsyncStorageRepository } from '../data/asyncStorageRepository';
import type { Completion, Habit } from '../models/types';
import { cancelTodaysFrequencyReminders } from '../notifications/reminders';

const repo = new AsyncStorageRepository();

function isToday(date: string): boolean {
  return date === dayjs().format('YYYY-MM-DD');
}

type HabitStore = {
  habits: Habit[];
  completions: Completion[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  saveHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  logCount: (habitId: string, date: string, count: number) => Promise<void>;
  skipHabit: (habitId: string, date: string) => Promise<void>;
};

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  completions: [],
  hydrated: false,

  hydrate: async () => {
    const [habits, completions] = await Promise.all([
      repo.getHabits(),
      repo.getCompletions(),
    ]);
    set({ habits, completions, hydrated: true });
  },

  saveHabit: async (habit) => {
    await repo.saveHabit(habit);
    const habits = await repo.getHabits();
    set({ habits });
  },

  deleteHabit: async (id) => {
    await repo.deleteHabit(id);
    const habits = await repo.getHabits();
    set({ habits });
    // A paused/running timer session for this habit would otherwise become
    // permanently orphaned — there's no UI path back to it once the habit
    // that owns it is gone.
    //
    // Deliberately a lazy require, not a static import: activeTimerSession.ts
    // itself imports useHabitStore (for the existence-check safety valve and
    // reconciliation), and a static import here created a real, reproducible
    // circular-require bug — expo-router's (tabs) layout failed on every
    // launch with "Cannot read property 'ErrorBoundary' of undefined" because
    // one side of the cycle was still mid-evaluation when the other read a
    // property off it. Deferring this to call time (long after both modules
    // have fully loaded) avoids that failure mode entirely.
    (require('../data/activeTimerSession') as typeof import('../data/activeTimerSession'))
      .clearActiveTimerSessionForHabit(id)
      .catch(() => {});
  },

  toggleCompletion: async (habitId, date) => {
    await repo.toggleCompletion(habitId, date);
    const completions = await repo.getCompletions();
    set({ completions });
  },

  logCount: async (habitId, date, count) => {
    await repo.logCount(habitId, date, count);
    const completions = await repo.getCompletions();
    set({ completions });

    // Frequency-mode reminders are one-off, per-slot notifications for today
    // only — once the goal is reached, stop nagging for the rest of the day.
    // Only meaningful for today's date (editing a past day's count shouldn't
    // touch today's still-pending reminders) and only for frequency-mode
    // habits — a habit still on the single fixed-time reminder has no
    // per-day-cancellable notification to cancel (see reminders.ts).
    const habit = get().habits.find((h) => h.id === habitId);
    if (habit?.reminderFrequencyMode && habit.dailyTarget && count >= habit.dailyTarget && isToday(date)) {
      cancelTodaysFrequencyReminders(habitId, date).catch(() => {});
    }
  },

  skipHabit: async (habitId, date) => {
    await repo.skipHabit(habitId, date);
    const completions = await repo.getCompletions();
    set({ completions });

    const habit = get().habits.find((h) => h.id === habitId);
    if (habit?.reminderFrequencyMode && isToday(date)) {
      cancelTodaysFrequencyReminders(habitId, date).catch(() => {});
    }
  },
}));
