import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { MoodEntry, MoodValue } from '../models/types';

const MOODS_KEY = '@momentum/moods';

// Maps 0–100 continuous value to the legacy 7-bucket MoodValue.
// The 7 zones are equal-width (100/7 ≈ 14.286 each).
function numericToMoodValue(v: number): MoodValue {
  const clamped = Math.max(0, Math.min(100, v));
  if (clamped < 14.286) return 'awful';
  if (clamped < 28.571) return 'bad';
  if (clamped < 42.857) return 'poor';
  if (clamped < 57.143) return 'neutral';
  if (clamped < 71.429) return 'good';
  if (clamped < 85.714) return 'great';
  return 'excellent';
}

type MoodStore = {
  moods: MoodEntry[];
  hydrate: () => Promise<void>;
  logMood: (date: string, mood: MoodValue) => Promise<void>;
  logMoodValue: (date: string, value: number) => Promise<void>;
  getMood: (date: string) => MoodValue | undefined;
  getMoodValue: (date: string) => number | undefined;
};

export const useMoodStore = create<MoodStore>((set, get) => ({
  moods: [],

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(MOODS_KEY);
    set({ moods: raw ? JSON.parse(raw) : [] });
  },

  logMood: async (date, mood) => {
    const current = get().moods.filter((m) => m.date !== date);
    const next = [...current, { date, mood }];
    await AsyncStorage.setItem(MOODS_KEY, JSON.stringify(next));
    set({ moods: next });
  },

  logMoodValue: async (date, value) => {
    const mood = numericToMoodValue(value);
    const current = get().moods.filter((m) => m.date !== date);
    const next = [...current, { date, mood, moodValue: value }];
    await AsyncStorage.setItem(MOODS_KEY, JSON.stringify(next));
    set({ moods: next });
  },

  getMood: (date) => get().moods.find((m) => m.date === date)?.mood,

  getMoodValue: (date) => get().moods.find((m) => m.date === date)?.moodValue,
}));
