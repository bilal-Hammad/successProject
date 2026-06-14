import dayjs from 'dayjs';
import type { Habit } from '../models/types';

export function habitsForDate(habits: Habit[], date: string): Habit[] {
  const dayOfWeek = dayjs(date).day(); // 0=Sun … 6=Sat
  return habits.filter(
    (h) => !h.archived && (h.weeklyTarget ? true : h.scheduleDays.includes(dayOfWeek))
  );
}

export function todayString(): string {
  return dayjs().format('YYYY-MM-DD');
}
