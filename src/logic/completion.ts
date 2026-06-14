import dayjs from 'dayjs';
import type { Completion, Habit } from '../models/types';

function getMondayOfWeek(date: string): dayjs.Dayjs {
  const d = dayjs(date);
  const daysFromMonday = (d.day() + 6) % 7;
  return d.subtract(daysFromMonday, 'day');
}

export function getWeeklyCount(
  habitId: string,
  completions: Completion[],
  date: string
): number {
  const monday = getMondayOfWeek(date);
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    monday.add(i, 'day').format('YYYY-MM-DD')
  );
  return completions
    .filter((c) => c.habitId === habitId && weekDates.includes(c.date))
    .reduce((sum, c) => sum + (c.count ?? 1), 0);
}

export function getHabitCount(
  habitId: string,
  completions: Completion[],
  date: string
): number {
  const c = completions.find((c) => c.habitId === habitId && c.date === date);
  return c?.count ?? 0;
}

export function isHabitDone(
  habit: Habit,
  completions: Completion[],
  date: string
): boolean {
  if (habit.weeklyTarget) {
    return getWeeklyCount(habit.id, completions, date) >= habit.weeklyTarget;
  }
  const c = completions.find((c) => c.habitId === habit.id && c.date === date);
  if (!c) return false;
  if (habit.dailyTarget) return (c.count ?? 1) >= habit.dailyTarget;
  return true;
}
