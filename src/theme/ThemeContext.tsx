/**
 * Momentum — Theme Context
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
import { darkTokens, lightTokens, type ColorTokens } from './tokens';

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
};

// ─── Context ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@momentum/theme_mode';

const ThemeContext = createContext<Theme>({
  colors: lightTokens,
  spacing,
  radius,
  fontSize,
  isDark: false,
  mode: 'system',
  setMode: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Hydrate persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
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

  const colors = isDark ? darkTokens : lightTokens;

  return (
    <ThemeContext.Provider
      value={{ colors, spacing, radius, fontSize, isDark, mode, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
