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
};

export type Completion = {
  habitId: string;
  date: string; // "YYYY-MM-DD"
  completedAt: number;
  count: number; // 1 for binary habits; 0–N for counting habits
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
  categories: string[]; // appears in every listed category tab
  pointsPerCompletion: number;
};
