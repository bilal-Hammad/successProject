import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Completion, Habit } from '../models/types';
import type { HabitRepository } from './repository';
import { migrateStorageKey } from '../utils/migrateStorageKey';

const HABITS_KEY = '@forge/habits';
const HABITS_KEY_LEGACY = '@momentum/habits';
const COMPLETIONS_KEY = '@forge/completions';
const COMPLETIONS_KEY_LEGACY = '@momentum/completions';

let migrated = false;
async function ensureMigrated(): Promise<void> {
  if (migrated) return;
  await Promise.all([
    migrateStorageKey(HABITS_KEY_LEGACY, HABITS_KEY),
    migrateStorageKey(COMPLETIONS_KEY_LEGACY, COMPLETIONS_KEY),
  ]);
  migrated = true;
}

export class AsyncStorageRepository implements HabitRepository {
  async getHabits(): Promise<Habit[]> {
    await ensureMigrated();
    const raw = await AsyncStorage.getItem(HABITS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async saveHabit(habit: Habit): Promise<void> {
    const habits = await this.getHabits();
    const index = habits.findIndex((h) => h.id === habit.id);
    if (index >= 0) {
      habits[index] = habit;
    } else {
      habits.push(habit);
    }
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }

  async deleteHabit(id: string): Promise<void> {
    const habits = await this.getHabits();
    await AsyncStorage.setItem(
      HABITS_KEY,
      JSON.stringify(habits.filter((h) => h.id !== id))
    );
  }

  async getCompletions(): Promise<Completion[]> {
    await ensureMigrated();
    const raw = await AsyncStorage.getItem(COMPLETIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async toggleCompletion(habitId: string, date: string): Promise<void> {
    const completions = await this.getCompletions();
    const idx = completions.findIndex((c) => c.habitId === habitId && c.date === date);
    let next: Completion[];
    if (idx >= 0) {
      next = completions.filter((_, i) => i !== idx);
    } else {
      next = [...completions, { habitId, date, completedAt: Date.now(), count: 1 }];
    }
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(next));
  }

  async logCount(habitId: string, date: string, count: number): Promise<void> {
    const completions = await this.getCompletions();
    const idx = completions.findIndex((c) => c.habitId === habitId && c.date === date);
    let next: Completion[];
    if (count <= 0) {
      next = completions.filter((_, i) => i !== idx);
    } else if (idx >= 0) {
      // Explicitly clears skipped rather than spreading it forward — logging
      // real progress after a skip means the day is no longer "skipped."
      next = completions.map((c, i) =>
        i === idx ? { ...c, count, completedAt: Date.now(), skipped: false } : c
      );
    } else {
      next = [...completions, { habitId, date, completedAt: Date.now(), count }];
    }
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(next));
  }

  async skipHabit(habitId: string, date: string): Promise<void> {
    const completions = await this.getCompletions();
    const idx = completions.findIndex((c) => c.habitId === habitId && c.date === date);
    const skippedEntry: Completion = { habitId, date, completedAt: Date.now(), count: 0, skipped: true };
    const next = idx >= 0
      ? completions.map((c, i) => (i === idx ? skippedEntry : c))
      : [...completions, skippedEntry];
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(next));
  }
}
