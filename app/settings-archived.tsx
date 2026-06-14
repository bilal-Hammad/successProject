import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../src/i18n/LanguageContext';
import { resolveHabitTitle } from '../src/i18n/translations';
import { useHabitStore } from '../src/store/useHabitStore';
import { useTheme } from '../src/theme/ThemeContext';

export default function ArchivedHabitsScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const { habits, saveHabit } = useHabitStore();
  const archived = habits.filter((h) => h.archived);

  const confirmUnarchive = (id: string, title: string) => {
    Alert.alert(
      t('settings.unarchiveTitle'),
      t('settings.unarchiveMsg', { title }),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.unarchive'),
          onPress: () => {
            const habit = habits.find((h) => h.id === id);
            if (habit) saveHabit({ ...habit, archived: false });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {archived.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🗂</Text>
            <Text style={[s.emptyTitle, { color: theme.colors.textPrimary }]}>
              {t('settings.noArchived')}
            </Text>
            <Text style={[s.emptyBody, { color: theme.colors.textSecondary }]}>
              {t('settings.noArchivedBody')}
            </Text>
          </View>
        ) : (
          archived.map((habit, idx) => (
            <View
              key={habit.id}
              style={[
                s.row,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.lg,
                  borderLeftWidth: 4,
                  borderLeftColor: habit.color,
                },
              ]}
            >
              <View
                style={[s.iconWrap, { backgroundColor: habit.color + '22', borderRadius: theme.radius.md }]}
              >
                <Text style={s.icon}>{habit.icon}</Text>
              </View>
              <Text style={[s.title, { color: theme.colors.textPrimary, flex: 1 }]}>
                {resolveHabitTitle(habit, t)}
              </Text>
              <Pressable
                onPress={() => confirmUnarchive(habit.id, resolveHabitTitle(habit, t))}
                style={[s.unarchiveBtn, { borderColor: theme.colors.primary, borderRadius: theme.radius.md }]}
              >
                <Text style={[s.unarchiveTxt, { color: theme.colors.primary }]}>
                  {t('settings.unarchive')}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { fontSize: 14, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
  },
  iconWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  title: { fontSize: 15, fontWeight: '600' },
  unarchiveBtn: { borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 5 },
  unarchiveTxt: { fontSize: 12, fontWeight: '600' },
});
