import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../src/components/EmptyState';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { useLanguage } from '../src/i18n/LanguageContext';
import { resolveHabitTitle } from '../src/i18n/translations';
import { currentStreak } from '../src/logic/streaks';
import { useHabitStore } from '../src/store/useHabitStore';
import { useTheme } from '../src/theme/ThemeContext';

export default function HabitsScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { habits, completions, deleteHabit } = useHabitStore();
  const active = habits.filter((h) => !h.archived);

  const confirmDelete = (id: string, title: string, translationKey?: string) => {
    const displayTitle = translationKey ? t(translationKey) : title;
    Alert.alert(
      t('habits.deleteTitle'),
      t('habits.deleteMsg', { title: displayTitle }),
      [
        { text: t('habits.cancel'), style: 'cancel' },
        { text: t('habits.delete'), style: 'destructive', onPress: () => deleteHabit(id) },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title={t('habits.title')}
        subtitle={
          active.length === 1
            ? t('habits.activeCount', { count: active.length })
            : t('habits.activeCountPlural', { count: active.length })
        }
        right={
          <Pressable
            onPress={() => router.push('/habit/new')}
            style={[styles.newBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md }]}
          >
            <Text style={styles.newBtnText}>{t('habits.new')}</Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {active.length === 0 ? (
          <EmptyState
            icon="📋"
            title={t('habits.emptyTitle')}
            body={t('habits.emptyBody')}
            actionLabel={t('today.browseTemplates')}
            actionHref="/templates"
          />
        ) : (
          active.map((habit) => {
            const streak = currentStreak(habit, completions);
            return (
              <Pressable
                key={habit.id}
                onPress={() => router.push(`/habit/${habit.id}`)}
                style={[
                  styles.row,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.lg,
                    marginHorizontal: theme.spacing.md,
                    marginBottom: theme.spacing.sm,
                    padding: theme.spacing.md,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: habit.color + '22', borderRadius: theme.radius.md },
                  ]}
                >
                  <Text style={styles.icon}>{habit.icon}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                    {resolveHabitTitle(habit, t)}
                  </Text>
                  <View style={styles.meta}>
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                      +{habit.pointsPerCompletion} {t('points.pts')}
                    </Text>
                    {streak > 0 && (
                      <Text style={[styles.metaText, { color: theme.colors.warning }]}>
                        🔥 {streak} {t(streak === 1 ? 'streak.day' : 'streak.days')}
                      </Text>
                    )}
                    {habit.reminderTime && (
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                        ⏰ {habit.reminderTime}
                      </Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => confirmDelete(habit.id, habit.title, habit.translationKey)}
                  hitSlop={8}
                  style={styles.deleteBtn}
                >
                  <Text style={{ color: theme.colors.error, fontSize: 18 }}>×</Text>
                </Pressable>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 32, paddingTop: 8 },
  newBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5 },
  iconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  meta: { flexDirection: 'row', gap: 10, marginTop: 3 },
  metaText: { fontSize: 12, fontWeight: '500' },
  deleteBtn: { padding: 4 },
});
