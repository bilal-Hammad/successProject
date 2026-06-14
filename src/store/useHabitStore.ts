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
