import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Completion, Habit } from '../models/types';
import type { HabitRepository } from './repository';

const HABITS_KEY = '@momentum/habits';
const COMPLETIONS_KEY = '@momentum/completions';

export class AsyncStorageRepository implements HabitRepository {
  async getHabits(): Promise<Habit[]> {
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
      next = completions.map((c, i) =>
        i === idx ? { ...c, count, completedAt: Date.now() } : c
      );
    } else {
      next = [...completions, { habitId, date, completedAt: Date.now(), count }];
    }
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(next));
  }
}
