import dayjs from 'dayjs';
import type { Habit } from '../models/types';

export function habitsForDate(habits: Habit[], date: string): Habit[] {
  const dayOfWeek = dayjs(date).day(); // 0=Sun … 6=Sat
  return habits.filter((h) => {
    if (h.archived) return false;
    if (h.weeklyTarget) return true;
    if (h.intervalDays) {
      const startStr = h.startDate ?? dayjs(h.createdAt).format('YYYY-MM-DD');
      const diff = dayjs(date).diff(dayjs(startStr), 'day');
      return diff >= 0 && diff % h.intervalDays === 0;
    }
    return h.scheduleDays.includes(dayOfWeek);
  });
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
