import dayjs from 'dayjs';
import type { Completion, Habit } from '../models/types';
import { getWeeklyCount, isHabitDone } from './completion';

function getMondayOfWeek(date: string): string {
  const d = dayjs(date);
  const daysFromMonday = (d.day() + 6) % 7;
  return d.subtract(daysFromMonday, 'day').format('YYYY-MM-DD');
}

export function currentStreak(habit: Habit, completions: Completion[]): number {
  if (habit.weeklyTarget) return currentWeeklyStreak(habit, completions);

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

function currentWeeklyStreak(habit: Habit, completions: Completion[]): number {
  const todayMonday = getMondayOfWeek(dayjs().format('YYYY-MM-DD'));
  let weekMonday = dayjs(todayMonday);
  let streak = 0;

  while (streak <= 52) {
    const weekDate = weekMonday.format('YYYY-MM-DD');
    const count = getWeeklyCount(habit.id, completions, weekDate);
    const isCurrent = weekDate === todayMonday;

    if (count >= habit.weeklyTarget!) {
      streak++;
      weekMonday = weekMonday.subtract(7, 'day');
    } else if (isCurrent) {
      weekMonday = weekMonday.subtract(7, 'day');
    } else {
      break;
    }
  }

  return streak;
}

export function longestStreak(habit: Habit, completions: Completion[]): number {
  if (habit.weeklyTarget) return longestWeeklyStreak(habit, completions);

  const doneDates = completions
    .filter((c) => c.habitId === habit.id && isHabitDone(habit, completions, c.date))
    .map((c) => c.date)
    .sort();

  if (doneDates.length === 0) return 0;

  // Deduplicate (counting habits may have multiple records per day theoretically)
  const unique = [...new Set(doneDates)];

  let best = 1;
  let current = 1;

  for (let i = 1; i < unique.length; i++) {
    const prev = dayjs(unique[i - 1]);
    const curr = dayjs(unique[i]);

    // Walk forward from prev+1 to find the next scheduled day
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

function longestWeeklyStreak(habit: Habit, completions: Completion[]): number {
  const habitCompletions = completions.filter((c) => c.habitId === habit.id);
  if (habitCompletions.length === 0) return 0;

  const earliestDate = habitCompletions.map((c) => c.date).sort()[0];
  const todayMonday = getMondayOfWeek(dayjs().format('YYYY-MM-DD'));

  let weekMonday = dayjs(getMondayOfWeek(earliestDate));
  const endMonday = dayjs(todayMonday);

  let best = 0;
  let current = 0;

  while (!weekMonday.isAfter(endMonday)) {
    const weekDate = weekMonday.format('YYYY-MM-DD');
    const count = getWeeklyCount(habit.id, completions, weekDate);

    if (count >= habit.weeklyTarget!) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }

    weekMonday = weekMonday.add(7, 'day');
  }

  return best;
}
