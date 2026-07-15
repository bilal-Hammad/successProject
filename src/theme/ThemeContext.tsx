/**
 * Forge — Theme Context
 *
 * Single source of truth for the current theme. Components import
 * useTheme() from this file (in Stage 2); the old useTheme.ts stays
 * intact for now to avoid breaking anything during the transition.
 *
 * Supports three modes:
 *   'light'  — always light
 *   'dark'   — always dark
 *   'system' — follows OS (default)
 *
 * Preference is persisted to AsyncStorage so it survives restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { ACCENT_COLORS, useSettingsStore } from '../store/useSettingsStore';
import { darkTokens, lightTokens, type ColorTokens } from './tokens';
import { migrateStorageKey } from '../utils/migrateStorageKey';

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Non-color tokens (identical in both themes) ──────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 34,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export type Theme = {
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  customBg: { enabled: boolean; start: string; end: string };
};

// ─── Context ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@forge/theme_mode';
const STORAGE_KEY_LEGACY = '@momentum/theme_mode';

const ThemeContext = createContext<Theme>({
  colors: lightTokens,
  spacing,
  radius,
  fontSize,
  isDark: false,
  mode: 'system',
  setMode: async () => {},
  customBg: { enabled: false, start: '#6C63FF', end: '#FF6584' },
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Read accent + custom background from the settings store
  const accentColorIndex = useSettingsStore((s) => s.accentColorIndex);
  const customBgEnabled  = useSettingsStore((s) => s.customBgEnabled);
  const customBgStart    = useSettingsStore((s) => s.customBgStart);
  const customBgEnd      = useSettingsStore((s) => s.customBgEnd);

  // Hydrate persisted preference on mount
  useEffect(() => {
    migrateStorageKey(STORAGE_KEY_LEGACY, STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored as ThemeMode);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback(async (m: ThemeMode) => {
    await AsyncStorage.setItem(STORAGE_KEY, m);
    setModeState(m);
  }, []);

  const isDark =
    mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const accentColor = ACCENT_COLORS[accentColorIndex] ?? ACCENT_COLORS[0];

  const colors: ColorTokens = {
    ...(isDark ? darkTokens : lightTokens),
    primary: accentColor,
    primaryMuted: hexToRgba(accentColor, isDark ? 0.2 : 0.12),
    // Let the root gradient show through every screen when custom bg is on
    ...(customBgEnabled && { background: 'transparent' }),
  };

  const customBg = { enabled: customBgEnabled, start: customBgStart, end: customBgEnd };

  return (
    <ThemeContext.Provider
      value={{ colors, spacing, radius, fontSize, isDark, mode, setMode, customBg }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
