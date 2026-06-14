import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { LanguageProvider, useLanguage } from '../src/i18n/LanguageContext';
import { requestNotificationPermission } from '../src/notifications/reminders';
import { useHabitStore } from '../src/store/useHabitStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';

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
  const { t, isRTL } = useLanguage();
  const theme = useTheme();

  useEffect(() => {
    hydrate();
    hydrateSettings();
    requestNotificationPermission();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        direction: isRTL ? 'rtl' : 'ltr',
        backgroundColor: theme.colors.background,
      }}
    >
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="templates"
          options={{ title: t('nav.templates'), headerBackTitle: t('nav.back') }}
        />
        <Stack.Screen
          name="habit/new"
          options={{ title: t('nav.newHabit'), presentation: 'modal' }}
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
