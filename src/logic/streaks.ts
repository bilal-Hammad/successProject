import dayjs from 'dayjs';
import type { Completion, Habit } from '../models/types';
import type { WeekStart } from '../store/useSettingsStore';
import { getWeekStart, getWeeklyCount, isHabitDone } from './completion';

export function currentStreak(
  habit: Habit,
  completions: Completion[],
  weekStartsOn: WeekStart = 1,
): number {
  if (habit.weeklyTarget) return currentWeeklyStreak(habit, completions, weekStartsOn);

  let streak = 0;
  let cursor = dayjs().startOf('day');

  while (true) {
    const dateStr = cursor.format('YYYY-MM-DD');
    const dayOfWeek = cursor.day();

    if (!habit.scheduleDays.includes(dayOfWeek)) {
      cursor = cursor.subtract(1, 'day');
      continue;
    }

    if (isHabitDone(habit, completions, dateStr)) {
      streak++;
      cursor = cursor.subtract(1, 'day');
    } else {
      if (dateStr === dayjs().format('YYYY-MM-DD')) {
        cursor = cursor.subtract(1, 'day');
        continue;
      }
      break;
    }

    if (streak > 365) break;
  }

  return streak;
}

function currentWeeklyStreak(
  habit: Habit,
  completions: Completion[],
  weekStartsOn: WeekStart,
): number {
  const todayStart = getWeekStart(weekStartsOn, dayjs().format('YYYY-MM-DD'));
  const todayStartStr = todayStart.format('YYYY-MM-DD');
  let weekStart = todayStart;
  let streak = 0;

  while (streak <= 52) {
    const weekDate = weekStart.format('YYYY-MM-DD');
    const count = getWeeklyCount(habit.id, completions, weekDate, weekStartsOn);
    const isCurrent = weekDate === todayStartStr;

    if (count >= habit.weeklyTarget!) {
      streak++;
      weekStart = weekStart.subtract(7, 'day');
    } else if (isCurrent) {
      weekStart = weekStart.subtract(7, 'day');
    } else {
      break;
    }
  }

  return streak;
}

export function longestStreak(
  habit: Habit,
  completions: Completion[],
  weekStartsOn: WeekStart = 1,
): number {
  if (habit.weeklyTarget) return longestWeeklyStreak(habit, completions, weekStartsOn);

  const doneDates = completions
    .filter((c) => c.habitId === habit.id && isHabitDone(habit, completions, c.date))
    .map((c) => c.date)
    .sort();

  if (doneDates.length === 0) return 0;

  const unique = [...new Set(doneDates)];

  let best = 1;
  let current = 1;

  for (let i = 1; i < unique.length; i++) {
    const prev = dayjs(unique[i - 1]);
    const curr = dayjs(unique[i]);

    let nextDay = prev.add(1, 'day');
    let steps = 0;
    while (!habit.scheduleDays.includes(nextDay.day()) && steps < 7) {
      nextDay = nextDay.add(1, 'day');
      steps++;
    }

    if (nextDay.format('YYYY-MM-DD') === curr.format('YYYY-MM-DD')) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

function longestWeeklyStreak(
  habit: Habit,
  completions: Completion[],
  weekStartsOn: WeekStart,
): number {
  const habitCompletions = completions.filter((c) => c.habitId === habit.id);
  if (habitCompletions.length === 0) return 0;

  const earliestDate = habitCompletions.map((c) => c.date).sort()[0];
  const todayStart = getWeekStart(weekStartsOn, dayjs().format('YYYY-MM-DD'));

  let weekStart = getWeekStart(weekStartsOn, earliestDate);

  let best = 0;
  let current = 0;

  while (!weekStart.isAfter(todayStart)) {
    const weekDate = weekStart.format('YYYY-MM-DD');
    const count = getWeeklyCount(habit.id, completions, weekDate, weekStartsOn);

    if (count >= habit.weeklyTarget!) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }

    weekStart = weekStart.add(7, 'day');
  }

  return best;
}
