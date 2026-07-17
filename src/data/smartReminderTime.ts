import dayjs from 'dayjs';
import type { Completion, Habit } from '../models/types';

const MIN_SAMPLES = 5;
const HISTORY_WINDOW_DAYS = 30;
export const SMART_TIME_DRIFT_THRESHOLD_MINUTES = 15;

// Smart mode needs a single clean completion timestamp per day to mean anything.
// Counting/track habits overwrite completedAt on every increment (last-edit time,
// not first-completion time), which isn't a meaningful signal — restricted to
// binary good/bad habits only.
export function isSmartReminderEligible(habit: Habit): boolean {
  return (habit.habitType === 'good' || habit.habitType === 'bad') && !habit.dailyTarget;
}

function minutesSinceMidnight(timestamp: number): number {
  const d = new Date(timestamp);
  return d.getHours() * 60 + d.getMinutes();
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export type SmartTimeResult = {
  time: string;       // "HH:mm"
  sampleSize: number;
  isFallback: boolean; // true if there wasn't enough history and a default was used
};

/**
 * Median completion time-of-day over the trailing HISTORY_WINDOW_DAYS days. Median
 * (not mean) so one very early/late outlier completion doesn't skew the result.
 * Sliding window (not all-time) so the result naturally drifts as behavior shifts,
 * rather than being anchored to old habits from months ago.
 */
export function computeSmartReminderTime(habit: Habit, completions: Completion[]): SmartTimeResult {
  const cutoff = dayjs().subtract(HISTORY_WINDOW_DAYS, 'day').valueOf();
  const samples = completions
    .filter((c) => c.habitId === habit.id && c.completedAt >= cutoff)
    .map((c) => minutesSinceMidnight(c.completedAt));

  if (samples.length < MIN_SAMPLES) {
    return {
      time: minutesToHHMM(minutesSinceMidnight(habit.createdAt)),
      sampleSize: samples.length,
      isFallback: true,
    };
  }

  return { time: minutesToHHMM(median(samples)), sampleSize: samples.length, isFallback: false };
}

export function timeDiffMinutes(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return Math.abs((ah * 60 + am) - (bh * 60 + bm));
}
