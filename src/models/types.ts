export type HabitType = 'good' | 'bad' | 'track' | 'todo';

export type MoodValue = 'awful' | 'bad' | 'poor' | 'neutral' | 'good' | 'great' | 'excellent';

export interface MoodEntry {
  date: string;       // "YYYY-MM-DD"
  mood: MoodValue;    // legacy zone label — always set for backward compat
  moodValue?: number; // 0–100 continuous value from new selector
}

export type Habit = {
  id: string;
  title: string;
  icon: string;
  color: string;
  pointsPerCompletion: number;
  scheduleDays: number[]; // 0=Sun … 6=Sat, default all
  reminderTime?: string;  // "HH:mm" local time
  templateId?: string;
  translationKey?: string; // set for template habits; display via t(translationKey) instead of title
  dailyTarget?: number;   // if set, habit is counting type (e.g. 8 glasses). undefined = binary done/not-done
  weeklyTarget?: number;  // if set, habit recurs any day; done when total completions this week >= weeklyTarget
  unit?: string;          // display unit for counting habits (e.g. "glasses", "min", "km")
  createdAt: number;
  archived: boolean;
  description?: string;
  habitType?: HabitType;
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string;   // "YYYY-MM-DD"
  step?: number;      // increment step for counting/todo habits (default 1)
  healthKitType?: string;  // HealthKit identifier for auto-sync
  intervalDays?: number;   // "every N days" mode: due when (date - startDate) % intervalDays === 0
  remindMe?: boolean;      // per-habit reminder toggle
  reminderMode?: 'custom' | 'smart'; // custom time vs. computed from completion history (binary habits only)
  notificationIds?: string[];   // identifiers of scheduled expo-notifications
  calendarEnabled?: boolean;    // per-habit "also add to Calendar" toggle
  calendarEventIds?: string[];  // single recurring Calendar event ID (kept as array for back-compat)
  remindersAppEnabled?: boolean; // per-habit "also add to Reminders app" toggle
  reminderId?: string;           // single recurring Apple Reminders entry ID
  reminderFrequencyMode?: 'interval' | 'timesPerDay'; // counting habits only; unset = single fixed-time reminder (default, unchanged behavior)
  reminderIntervalHours?: number;  // reminderFrequencyMode === 'interval'
  reminderTimesPerDay?: number;    // reminderFrequencyMode === 'timesPerDay'; must be <= dailyTarget
};

export type RepeatMode = 'daily' | 'specificDays' | 'timesPerWeek' | 'everyXDays';

export type Completion = {
  habitId: string;
  date: string; // "YYYY-MM-DD"
  completedAt: number;
  count: number; // 1 for binary habits; 0–N for counting habits
  skipped?: boolean; // actively skipped today, distinct from "just not done yet" (count 0)
};

export type TemplatePack = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  habits: TemplateHabit[];
};

export type TemplateHabit = {
  title: string;
  icon: string;
  color: string;
  pointsPerCompletion: number;
};

export type TemplateCategory = {
  id: string;
  labelKey: string; // i18n key
  icon: string;
};

export type HabitTemplate = {
  id: string;
  title: string;
  icon: string;
  color: string;
  categories: string[];
  pointsPerCompletion: number;
  habitType?: HabitType;
  unit?: string;
  defaultGoal?: number;
  healthKitType?: string;
  step?: number;             // increment step for counting/todo habits (default 1)
  repeatMode?: RepeatMode;
  scheduleDays?: number[];   // 0=Sun … 6=Sat, default all
  weeklyTarget?: number;     // if set, habit recurs any day; done when total completions this week >= weeklyTarget
  intervalDays?: number;     // "every N days" mode: due when (date - startDate) % intervalDays === 0
};
