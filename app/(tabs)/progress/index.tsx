import dayjs from 'dayjs';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../../src/components/EmptyState';
import { StreakChip } from '../../../src/components/StreakChip';
import { useLanguage } from '../../../src/i18n/LanguageContext';
import { resolveHabitTitle } from '../../../src/i18n/translations';
import { getHabitCount, isHabitDone } from '../../../src/logic/completion';
import { pointsForDate, totalPoints } from '../../../src/logic/points';
import { habitsForDate, todayString } from '../../../src/logic/scheduling';
import { currentStreak, longestStreak } from '../../../src/logic/streaks';
import { useHabitStore } from '../../../src/store/useHabitStore';
import { useSettingsStore } from '../../../src/store/useSettingsStore';
import { useTheme } from '../../../src/theme/ThemeContext';

function getWeekDays(weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
  const today = dayjs();
  const dow = today.day();
  const daysFromStart = (dow - weekStartsOn + 7) % 7;
  const startDay = today.subtract(daysFromStart, 'day');
  return Array.from({ length: 7 }, (_, i) => startDay.add(i, 'day'));
}

export default function ProgressScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const { habits, completions } = useHabitStore();
  const { weekStartsOn, dayStartsAt } = useSettingsStore();
  const today = todayString(dayStartsAt);
  const activeHabits = habits.filter((h) => !h.archived);

  const allPts = totalPoints(habits, completions);
  const bestStreak = Math.max(0, ...habits.map((h) => currentStreak(h, completions, weekStartsOn)));

  const last7 = Array.from({ length: 7 }, (_, i) =>
    dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD')
  );

  const weekDays = getWeekDays(weekStartsOn);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        {activeHabits.length === 0 ? (
          <EmptyState
            icon="📈"
            title={t('progress.emptyTitle')}
            body={t('progress.emptyBody')}
            actionLabel={t('today.browseTemplates')}
            actionHref="/templates"
          />
        ) : (
          <>
            {/* Summary cards */}
            <View style={[styles.statsRow, { paddingHorizontal: theme.spacing.md }]}>
              <StatCard label={t('progress.totalPoints')} value={String(allPts)} icon="⭐" theme={theme} />
              <StatCard label={t('progress.bestStreak')} value={`${bestStreak}${t('progress.dayUnit')}`} icon="🔥" theme={theme} />
              <StatCard label={t('progress.habits')} value={String(activeHabits.length)} icon="📋" theme={theme} />
            </View>

            {/* Weekly grid */}
            <View style={[styles.section, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
              marginHorizontal: theme.spacing.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                {t('progress.weeklyGrid')}
              </Text>

              {/* Day headers */}
              <View style={styles.gridRow}>
                <View style={styles.habitLabelCell} />
                {weekDays.map((day) => (
                  <View key={day.format('D')} style={styles.gridCell}>
                    <Text style={[styles.gridDayName, { color: theme.colors.textSecondary }]}>
                      {day.format('dd')[0]}
                    </Text>
                    <Text style={[
                      styles.gridDayNum,
                      {
                        color: day.format('YYYY-MM-DD') === today
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                        fontWeight: day.format('YYYY-MM-DD') === today ? '800' : '400',
                      },
                    ]}>
                      {day.format('D')}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Habit rows */}
              {activeHabits.map((habit) => (
                <View key={habit.id} style={[styles.gridRow, { marginTop: 8 }]}>
                  <View style={styles.habitLabelCell}>
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                    <Text style={[styles.habitLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {resolveHabitTitle(habit, t)}
                    </Text>
                  </View>
                  {weekDays.map((day) => {
                    const dateStr = day.format('YYYY-MM-DD');
                    const scheduled = habitsForDate([habit], dateStr).length > 0;
                    // Weekly habits: show dot on days with any completion logged (not "whole week done")
                    const done = scheduled && (
                      habit.weeklyTarget
                        ? getHabitCount(habit.id, completions, dateStr) > 0
                        : isHabitDone(habit, completions, dateStr)
                    );
                    const isFuture = day.isAfter(dayjs(), 'day');
                    return (
                      <View key={dateStr} style={styles.gridCell}>
                        <View style={[
                          styles.dot,
                          {
                            backgroundColor: done
                              ? habit.color
                              : scheduled && !isFuture
                              ? theme.colors.border
                              : 'transparent',
                            borderRadius: theme.radius.sm,
                          },
                        ]} />
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Last 7 days bar chart */}
            <View style={[styles.section, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
              marginHorizontal: theme.spacing.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                {t('progress.last7')}
              </Text>
              <View style={styles.weekRow}>
                {last7.map((date) => {
                  const dayHabits = habitsForDate(habits, date);
                  const done = dayHabits.filter((h) => isHabitDone(h, completions, date)).length;
                  const pct = dayHabits.length === 0 ? 0 : done / dayHabits.length;
                  const isToday = date === today;
                  return (
                    <View key={date} style={styles.dayCol}>
                      <View style={[styles.dayBar, {
                        height: Math.max(4, pct * 56),
                        backgroundColor: pct === 0 ? theme.colors.border : pct === 1 ? theme.colors.success : theme.colors.primary,
                        borderRadius: theme.radius.sm,
                      }]} />
                      <Text style={[styles.dayLabel, { color: isToday ? theme.colors.primary : theme.colors.textSecondary }]}>
                        {dayjs(date).format('dd')[0]}
                      </Text>
                      <Text style={[styles.dayPts, { color: theme.colors.textSecondary }]}>
                        {pointsForDate(habits, completions, date)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Per-habit streaks */}
            <View style={[styles.section, { paddingHorizontal: theme.spacing.md }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 10 }]}>
                {t('progress.habitStreaks')}
              </Text>
              {activeHabits.map((habit) => {
                const streak = currentStreak(habit, completions, weekStartsOn);
                const longest = longestStreak(habit, completions, weekStartsOn);
                return (
                  <View key={habit.id} style={[styles.habitRow, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.sm,
                    borderLeftWidth: 4,
                    borderLeftColor: habit.color,
                  }]}>
                    <Text style={styles.habitIconLg}>{habit.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.habitTitle, { color: theme.colors.textPrimary }]}>
                        {resolveHabitTitle(habit, t)}
                      </Text>
                      <Text style={[styles.habitMeta, { color: theme.colors.textSecondary }]}>
                        {t(longest === 1 ? 'progress.best' : 'progress.bestPlural', { days: longest })}
                      </Text>
                    </View>
                    {streak > 0 && <StreakChip streak={streak} />}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, theme }: {
  label: string; value: string; icon: string;
  theme: ReturnType<typeof import('../../../src/theme/ThemeContext').useTheme>;
}) {
  return (
    <View style={[statStyles.card, {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      flex: 1,
    }]}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={[statStyles.value, { color: theme.colors.textPrimary }]}>{value}</Text>
      <Text style={[statStyles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { padding: 14, alignItems: 'center', borderWidth: 1.5 },
  icon: { fontSize: 22, marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '500', marginTop: 2, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {},
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  section: { borderWidth: 1.5 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  // Weekly grid
  gridRow: { flexDirection: 'row', alignItems: 'center' },
  habitLabelCell: { width: 80, flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 6 },
  habitIcon: { fontSize: 13 },
  habitLabel: { fontSize: 10, fontWeight: '500', flex: 1 },
  gridCell: { flex: 1, alignItems: 'center', gap: 2 },
  gridDayName: { fontSize: 9, fontWeight: '500' },
  gridDayNum: { fontSize: 11 },
  dot: { width: 18, height: 18 },
  // Bar chart
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 },
  dayCol: { alignItems: 'center', gap: 4, flex: 1 },
  dayBar: { width: 20 },
  dayLabel: { fontSize: 11, fontWeight: '600' },
  dayPts: { fontSize: 9, fontWeight: '500' },
  // Habit streak rows
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5 },
  habitIconLg: { fontSize: 22 },
  habitTitle: { fontSize: 14, fontWeight: '600' },
  habitMeta: { fontSize: 12, marginTop: 1 },
});
