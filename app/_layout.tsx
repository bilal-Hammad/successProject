import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

// Keep the splash visible until the app is fully ready.
// Must be called before any component renders.
SplashScreen.preventAutoHideAsync();
import { LanguageProvider, useLanguage } from '../src/i18n/LanguageContext';
import { requestNotificationPermission } from '../src/notifications/reminders';
import { useHabitStore } from '../src/store/useHabitStore';
import { useMoodStore } from '../src/store/useMoodStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
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
    <ThemeProvider>
      <LanguageProvider>
        <RootLayoutInner />
      </LanguageProvider>
    </ThemeProvider>
  );
}

function RootLayoutInner() {
  const hydrate = useHabitStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateMoods = useMoodStore((s) => s.hydrate);
  const { t, isRTL } = useLanguage();
  const theme = useTheme();

  useEffect(() => {
    async function prepare() {
      await Promise.all([hydrate(), hydrateSettings(), hydrateMoods()]);
      requestNotificationPermission(); // fire-and-forget
      await SplashScreen.hideAsync();
    }
    prepare();
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
          name="settings-groups"
          options={{ title: t('settings.groups'), headerBackTitle: t('nav.back') }}
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
    </View>
  );
}
