import type { Completion, Habit } from '../models/types';

export function totalPoints(habits: Habit[], completions: Completion[]): number {
  return completions.reduce((sum, c) => {
    const habit = habits.find((h) => h.id === c.habitId);
    return sum + (habit?.pointsPerCompletion ?? 0);
  }, 0);
}

export function pointsForDate(
  habits: Habit[],
  completions: Completion[],
  date: string
): number {
  return completions
    .filter((c) => c.date === date)
    .reduce((sum, c) => {
      const habit = habits.find((h) => h.id === c.habitId);
      return sum + (habit?.pointsPerCompletion ?? 0);
    }, 0);
}
