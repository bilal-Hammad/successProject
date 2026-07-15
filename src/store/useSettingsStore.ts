import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { migrateStorageKey } from '../utils/migrateStorageKey';

const KEY = '@forge/settings';
const KEY_LEGACY = '@momentum/settings';

export const ACCENT_COLORS = [
  '#F05A7E', // coral pink (brand default)
  '#6C63FF', // purple
  '#2196F3', // blue
  '#00BCD4', // cyan
  '#4CAF50', // green
  '#FF9800', // amber
  '#E91E63', // deep pink
  '#9C27B0', // violet
  '#FF5722', // deep orange
  '#009688', // teal
];

export const GRADIENT_PRESETS: { start: string; end: string }[] = [
  { start: '#6C63FF', end: '#FF6584' },
  { start: '#FF6B35', end: '#F7C59F' },
  { start: '#667eea', end: '#764ba2' },
  { start: '#0072ff', end: '#00c6ff' },
  { start: '#f093fb', end: '#f5576c' },
  { start: '#4facfe', end: '#00f2fe' },
  { start: '#43e97b', end: '#38f9d7' },
  { start: '#fa709a', end: '#fee140' },
  { start: '#a18cd1', end: '#fbc2eb' },
  { start: '#ffecd2', end: '#fcb69f' },
  { start: '#96fbc4', end: '#f9f586' },
  { start: '#d4fc79', end: '#96e6a1' },
];

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun 1=Mon … 6=Sat

export type ReminderSchedule = 'automatic' | 'custom';
export type CalendarEventType = 'allDay' | 'automatic' | 'reminderTime';

type Settings = {
  accentColorIndex: number;
  customBgEnabled: boolean;
  customBgStart: string;
  customBgEnd: string;
  customBgPresetIndex: number;
  weekStartsOn: WeekStart;
  dayStartsAt: number; // minutes from midnight; 240 = 4:00 AM
  enableFutureDates: boolean;
  badgesEnabled: boolean;
  soundsEnabled: boolean;
  completionSound: string;
  notificationsSound: string;
  // Notifications
  notificationsEnabled: boolean;
  defaultReminderSchedule: ReminderSchedule;
  // Calendar integration
  calendarIntegrationEnabled: boolean;
  calendarEventType: CalendarEventType;
};

const DEFAULTS: Settings = {
  accentColorIndex: 0,
  customBgEnabled: false,
  customBgStart: '#6C63FF',
  customBgEnd: '#FF6584',
  customBgPresetIndex: 0,
  weekStartsOn: 1,
  dayStartsAt: 240,
  enableFutureDates: false,
  badgesEnabled: true,
  soundsEnabled: true,
  completionSound: 'Default',
  notificationsSound: 'Default',
  notificationsEnabled: false,
  defaultReminderSchedule: 'automatic',
  calendarIntegrationEnabled: false,
  calendarEventType: 'allDay',
};

type SettingsStore = Settings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await migrateStorageKey(KEY_LEGACY, KEY);
      if (raw) {
        set({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>), hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  update: async (patch) => {
    set(patch);
    try {
      const s = get();
      const toSave: Settings = {
        accentColorIndex: s.accentColorIndex,
        customBgEnabled: s.customBgEnabled,
        customBgStart: s.customBgStart,
        customBgEnd: s.customBgEnd,
        customBgPresetIndex: s.customBgPresetIndex,
        weekStartsOn: s.weekStartsOn,
        dayStartsAt: s.dayStartsAt,
        enableFutureDates: s.enableFutureDates,
        badgesEnabled: s.badgesEnabled,
        soundsEnabled: s.soundsEnabled,
        completionSound: s.completionSound,
        notificationsSound: s.notificationsSound,
        notificationsEnabled: s.notificationsEnabled,
        defaultReminderSchedule: s.defaultReminderSchedule,
        calendarIntegrationEnabled: s.calendarIntegrationEnabled,
        calendarEventType: s.calendarEventType,
      };
      await AsyncStorage.setItem(KEY, JSON.stringify(toSave));
    } catch {}
  },
}));
