import type { Completion, Habit } from '../models/types';

export interface HabitRepository {
  getHabits(): Promise<Habit[]>;
  saveHabit(habit: Habit): Promise<void>;
  deleteHabit(id: string): Promise<void>;
  getCompletions(): Promise<Completion[]>;
  toggleCompletion(habitId: string, date: string): Promise<void>;
  logCount(habitId: string, date: string, count: number): Promise<void>;
  skipHabit(habitId: string, date: string): Promise<void>;
}
