import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnimatedSplash } from '../src/components/AnimatedSplash';

class SplashErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() {
    SplashScreen.hideAsync().catch(() => {});
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: '' };
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, message: e?.message ?? String(e) };
  }
  componentDidCatch(e: Error) {
    SplashScreen.hideAsync().catch(() => {});
    console.error('[FORGE] App render error:', e?.message, e?.stack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#131825', padding: 32 }}>
          <Text style={{ color: '#FF3B30', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ color: '#8E8E93', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            {__DEV__ ? this.state.message : 'Please force-quit and reopen Forge.'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Keep the splash visible until the app is fully ready.
// Must be called before any component renders.
SplashScreen.preventAutoHideAsync();
import { AppState } from 'react-native';
import { LanguageProvider, useLanguage } from '../src/i18n/LanguageContext';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  scheduleAllReminders,
} from '../src/notifications/reminders';
import { reconcileActiveTimerSession } from '../src/data/activeTimerSession';
import { useHabitStore } from '../src/store/useHabitStore';
import { useMoodStore } from '../src/store/useMoodStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTemplateSectionStore } from '../src/store/useTemplateSectionStore';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';

const STRIPS = 20;

function lerpColor(a: string, b: string, t: number) {
  const parse = (h: string) => {
    const hex = h.replace('#', '');
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
  };
  const ca = parse(a), cb = parse(b);
  return `rgb(${Math.round(ca.r + (cb.r - ca.r) * t)},${Math.round(ca.g + (cb.g - ca.g) * t)},${Math.round(ca.b + (cb.b - ca.b) * t)})`;
}

function GradientBackground({ start, end }: { start: string; end: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: STRIPS }, (_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: lerpColor(start, end, i / (STRIPS - 1)) }} />
      ))}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <RootLayoutInner />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutInner() {
  const hydrate = useHabitStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateMoods = useMoodStore((s) => s.hydrate);
  const hydrateSections = useTemplateSectionStore((s) => s.hydrate);
  const initAuthListener = useAuthStore((s) => s._initListener);
  const { t, isRTL } = useLanguage();
  const theme = useTheme();

  const [hydrated, setHydrated] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = initAuthListener();
    return unsubscribeAuth;
  }, []);

  // Re-check on every foreground transition too, not just cold launch — a
  // habit timer can finish while the app is merely backgrounded as well.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        reconcileActiveTimerSession().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // 1.5-second safety: splash always clears even if hydration hangs.
    // AnimatedSplash also has its own SAFE_EXIT_MS guard.
    const safety = setTimeout(() => {
      setHydrated(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 1500);

    Promise.all([hydrate(), hydrateSettings(), hydrateMoods(), hydrateSections()])
      .then(async () => {
        clearTimeout(safety);
        setHydrated(true);

        // If a habit timer's Live Activity finished while the app wasn't open
        // to see it, finalize that completion now that habits/completions are
        // loaded. Safe to run on every launch — a no-op if there's no session
        // or it isn't due yet.
        reconcileActiveTimerSession().catch(() => {});

        const { notificationsEnabled } = useSettingsStore.getState();
        if (!notificationsEnabled) return;

        // Request permission (no-op if already granted; shows dialog only on first launch).
        const granted = await requestNotificationPermission().catch(() => false);
        if (!granted) return;

        // Verify OS still has permission (could be revoked externally or cleared on reboot).
        const status = await getNotificationPermissionStatus();
        if (status !== 'granted') return;

        // Reschedule all habits. This is safe to call on every launch:
        // - Cancels all existing triggers first, then re-creates them.
        // - Recovers from device reboots (iOS clears all local notifications on reboot).
        // - Extends the 60-day window for everyXDays habits.
        // Runs in the background — doesn't block splash or first render.
        scheduleAllReminders(useHabitStore.getState().habits);
      })
      .catch(() => {
        clearTimeout(safety);
        setHydrated(true);
        SplashScreen.hideAsync().catch(() => {});
      });

    return () => clearTimeout(safety);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        direction: isRTL ? 'rtl' : 'ltr',
        backgroundColor: theme.customBg.enabled ? undefined : theme.colors.background,
      }}
    >
      {theme.customBg.enabled && (
        <GradientBackground start={theme.customBg.start} end={theme.customBg.end} />
      )}
      <AppErrorBoundary>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.customBg.enabled ? 'transparent' : theme.colors.background },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.customBg.enabled ? 'transparent' : theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="templates"
          options={{ headerShown: false, gestureEnabled: true }}
        />
        <Stack.Screen
          name="habit/new"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="habits"
          options={{ title: t('nav.manageHabits'), headerBackTitle: t('nav.back') }}
        />
        <Stack.Screen
          name="habit/[id]"
          options={{ title: t('nav.editHabit'), presentation: 'modal' }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: t('nav.settings'), headerBackTitle: t('nav.back') }}
        />
        <Stack.Screen
          name="settings-theme"
          options={{ title: t('nav.settingsTheme'), headerBackTitle: t('nav.back') }}
        />
        <Stack.Screen
          name="settings-archived"
          options={{ title: t('settings.archivedHabits'), headerBackTitle: t('nav.back') }}
        />
<Stack.Screen
          name="settings-vacations"
          options={{ title: t('settings.vacations'), headerBackTitle: t('nav.back') }}
        />
        <Stack.Screen
          name="settings-achievements"
          options={{ title: t('settings.achievements'), headerBackTitle: t('nav.back') }}
        />
        <Stack.Screen
          name="settings-stub"
          options={{ title: t('settings.comingSoon'), headerBackTitle: t('nav.back') }}
        />
      </Stack>
      </AppErrorBoundary>

      {/* Animated splash overlay — sits above the Stack, removed from tree when done */}
      {splashVisible && (
        <SplashErrorBoundary onError={() => setSplashVisible(false)}>
          <AnimatedSplash
            ready={hydrated}
            onHidden={() => setSplashVisible(false)}
          />
        </SplashErrorBoundary>
      )}
    </View>
  );
}
