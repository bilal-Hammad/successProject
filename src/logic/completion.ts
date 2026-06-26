import dayjs from 'dayjs';
import type { Completion, Habit } from '../models/types';
import type { WeekStart } from '../store/useSettingsStore';

// Returns the dayjs for the first day of the week containing `date`,
// given that weeks start on `weekStartsOn` (0=Sun … 6=Sat).
export function getWeekStart(weekStartsOn: WeekStart, date: string): dayjs.Dayjs {
  const d = dayjs(date);
  const daysFromStart = (d.day() - weekStartsOn + 7) % 7;
  return d.subtract(daysFromStart, 'day');
}

export function getWeeklyCount(
  habitId: string,
  completions: Completion[],
  date: string,
  weekStartsOn: WeekStart = 1,
): number {
  const start = getWeekStart(weekStartsOn, date);
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    start.add(i, 'day').format('YYYY-MM-DD')
  );
  return completions
    .filter((c) => c.habitId === habitId && weekDates.includes(c.date))
    .reduce((sum, c) => sum + (c.count ?? 1), 0);
}

export function getHabitCount(
  habitId: string,
  completions: Completion[],
  date: string,
): number {
  const c = completions.find((c) => c.habitId === habitId && c.date === date);
  return c?.count ?? 0;
}

export function isHabitDone(
  habit: Habit,
  completions: Completion[],
  date: string,
  weekStartsOn: WeekStart = 1,
): boolean {
  if (habit.weeklyTarget) {
    return getWeeklyCount(habit.id, completions, date, weekStartsOn) >= habit.weeklyTarget;
  }
  const c = completions.find((c) => c.habitId === habit.id && c.date === date);
  if (!c) return false;
  if (habit.dailyTarget) return (c.count ?? 1) >= habit.dailyTarget;
  return true;
}
