import dayjs from 'dayjs';
import type { Habit } from '../models/types';

export function habitsForDate(habits: Habit[], date: string): Habit[] {
  const dayOfWeek = dayjs(date).day(); // 0=Sun … 6=Sat
  return habits.filter(
    (h) => !h.archived && (h.weeklyTarget ? true : h.scheduleDays.includes(dayOfWeek))
  );
}

// Returns 'YYYY-MM-DD' for the current effective day.
// If the current clock time is before dayStartsAt (minutes from midnight),
// the "day" is still yesterday — e.g. 3:50 AM with dayStartsAt=240 returns yesterday.
export function todayString(dayStartsAt = 0): string {
  if (dayStartsAt > 0) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (currentMinutes < dayStartsAt) {
      return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    }
  }
  return dayjs().format('YYYY-MM-DD');
}
