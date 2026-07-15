import { create } from 'zustand';
import { AsyncStorageRepository } from '../data/asyncStorageRepository';
import type { Completion, Habit } from '../models/types';

const repo = new AsyncStorageRepository();

type HabitStore = {
  habits: Habit[];
  completions: Completion[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  saveHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  logCount: (habitId: string, date: string, count: number) => Promise<void>;
};

export const useHabitStore = create<HabitStore>((set) => ({
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
  },
}));
