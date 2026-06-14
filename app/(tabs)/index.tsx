import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { HabitCard } from '../../src/components/HabitCard';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { resolveHabitTitle } from '../../src/i18n/translations';
import { getHabitCount, getWeeklyCount, isHabitDone } from '../../src/logic/completion';
import { pointsForDate, totalPoints } from '../../src/logic/points';
import { habitsForDate, todayString } from '../../src/logic/scheduling';
import { currentStreak } from '../../src/logic/streaks';
import { useHabitStore } from '../../src/store/useHabitStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useTheme } from '../../src/theme/ThemeContext';

function getWeekDays(weekStartsOn: 0 | 1) {
  const today = dayjs();
  const dow = today.day(); // 0=Sun … 6=Sat
  const daysFromStart = weekStartsOn === 1
    ? (dow + 6) % 7   // Monday-based
    : dow;             // Sunday-based
  const startDay = today.subtract(daysFromStart, 'day');
  return Array.from({ length: 7 }, (_, i) => startDay.add(i, 'day'));
}

type StatCardProps = { label: string; value: string; accent: string };
function StatCard({ label, value, accent }: StatCardProps) {
  const theme = useTheme();
  return (
    <View style={[statStyles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.lg }]}>
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
      <Text style={[statStyles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export default function TodayScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { habits, completions, toggleCompletion, logCount } = useHabitStore();
  const { weekStartsOn, enableFutureDates } = useSettingsStore();

  const todayStr = todayString();
  const weekDays = getWeekDays(weekStartsOn);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const selectedHabits = habitsForDate(habits, selectedDate);
  const completedCount = selectedHabits.filter((h) => isHabitDone(h, completions, selectedDate)).length;
  const allPoints = totalPoints(habits, completions);
  const todayPoints = pointsForDate(habits, completions, todayStr);
  const bestStreak = Math.max(0, ...habits.map((h) => currentStreak(h, completions)));
  const activeCount = habits.filter((h) => !h.archived).length;
  const rateStr = selectedHabits.length > 0
    ? `${Math.round((completedCount / selectedHabits.length) * 100)}%`
    : '—';

  const greeting = () => {
    const h = dayjs().hour();
    if (h < 12) return t('today.greetingMorning');
    if (h < 17) return t('today.greetingAfternoon');
    return t('today.greetingEvening');
  };

  const handlePress = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    if (habit.weeklyTarget) {
      const weekCount = getWeeklyCount(habitId, completions, selectedDate);
      if (weekCount < habit.weeklyTarget) {
        const todayCount = getHabitCount(habitId, completions, selectedDate);
        logCount(habitId, selectedDate, todayCount + 1);
        if (weekCount + 1 >= habit.weeklyTarget) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } else if (habit.dailyTarget) {
      const current = getHabitCount(habitId, completions, selectedDate);
      if (current < habit.dailyTarget) {
        logCount(habitId, selectedDate, current + 1);
        if (current + 1 >= habit.dailyTarget) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } else {
      const wasDone = isHabitDone(habit, completions, selectedDate);
      toggleCompletion(habitId, selectedDate);
      if (!wasDone) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleDecrement = (habitId: string) => {
    const current = getHabitCount(habitId, completions, selectedDate);
    if (current > 0) {
      logCount(habitId, selectedDate, current - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: theme.spacing.md }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
            {greeting()}
          </Text>
          <Text style={[styles.heading, { color: theme.colors.textPrimary, fontSize: theme.fontSize.xxl }]}>
            {t('today.heading')}
          </Text>
        </View>
      </View>

      {/* Week strip */}
      <View style={[styles.weekStrip, { paddingHorizontal: theme.spacing.md }]}>
        {weekDays.map((day) => {
          const dateStr = day.format('YYYY-MM-DD');
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const dayHabits = habitsForDate(habits, dateStr);
          const allDone = dayHabits.length > 0 &&
            dayHabits.every((h) => isHabitDone(h, completions, dateStr));

          return (
            <Pressable
              key={dateStr}
              onPress={() => {
                if (!enableFutureDates && day.isAfter(dayjs(), 'day')) return;
                setSelectedDate(dateStr);
              }}
              style={[
                styles.dayCell,
                {
                  backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                  borderRadius: theme.radius.lg,
                },
              ]}
            >
              <Text style={[styles.dayName, {
                color: isSelected ? '#fff' : isToday ? theme.colors.primary : theme.colors.textSecondary,
                fontWeight: isToday ? '800' : '500',
              }]}>
                {day.format('dd')[0]}
              </Text>
              <Text style={[styles.dayNum, {
                color: isSelected ? '#fff' : isToday ? theme.colors.primary : theme.colors.textPrimary,
                fontWeight: isSelected || isToday ? '700' : '400',
              }]}>
                {day.format('D')}
              </Text>
              {allDone && !isSelected && (
                <View style={[styles.doneDot, { backgroundColor: theme.colors.success }]} />
              )}
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        {/* 4 Stat cards */}
        <View style={[styles.statsRow, { paddingHorizontal: theme.spacing.md }]}>
          <StatCard label={t('stat.rate')} value={rateStr} accent={theme.colors.primary} />
          <StatCard label={t('stat.points')} value={String(todayPoints)} accent={theme.colors.success} />
          <StatCard label={t('stat.streak')} value={`${bestStreak}${t('progress.dayUnit')}`} accent={theme.colors.warning} />
          <StatCard label={t('stat.habits')} value={String(activeCount)} accent={theme.colors.textSecondary} />
        </View>

        {/* Habit list */}
        <View style={[styles.listSection, { paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.sm }]}>
          {selectedHabits.length === 0 ? (
            <EmptyState
              icon="🌱"
              title={t('today.emptyTitle')}
              body={t('today.emptyBody')}
              actionLabel={t('today.browseTemplates')}
              actionHref="/templates"
            />
          ) : (
            <>
              {selectedHabits.map((habit) => {
                const done = isHabitDone(habit, completions, selectedDate);
                const streak = currentStreak(habit, completions);
                const isWeekly = !!habit.weeklyTarget;
                const target = isWeekly ? habit.weeklyTarget : habit.dailyTarget;
                const count = isWeekly
                  ? getWeeklyCount(habit.id, completions, selectedDate)
                  : getHabitCount(habit.id, completions, selectedDate);
                const unit = isWeekly ? t('habit.timesThisWeek') : habit.unit;
                return (
                  <HabitCard
                    key={habit.id}
                    title={resolveHabitTitle(habit, t)}
                    icon={habit.icon}
                    color={habit.color}
                    points={habit.pointsPerCompletion}
                    streak={streak}
                    completed={done}
                    dailyTarget={target}
                    unit={unit}
                    count={count}
                    onPress={() => handlePress(habit.id)}
                    onDecrement={target ? () => handleDecrement(habit.id) : undefined}
                  />
                );
              })}
              {completedCount === selectedHabits.length && selectedHabits.length > 0 && (
                <Text style={[styles.allDone, { color: theme.colors.success }]}>
                  {t('today.allDone')}
                </Text>
              )}
            </>
          )}
        </View>

        {selectedHabits.length > 0 && (
          <Text
            onPress={() => router.push('/templates')}
            style={[styles.addMore, { color: theme.colors.primary, marginHorizontal: theme.spacing.md }]}
          >
            {t('today.browseMore')}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 1.5 },
  value: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '500', marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20,
    paddingBottom: 12,
  },
  greeting: { fontWeight: '500' },
  heading: { fontWeight: '800', marginTop: 2 },
  weekStrip: {
    flexDirection: 'row',
    gap: 4,
    paddingBottom: 12,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  dayName: { fontSize: 11 },
  dayNum: { fontSize: 15 },
  doneDot: { width: 5, height: 5, borderRadius: 3 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  scroll: {},
  listSection: {},
  allDone: { textAlign: 'center', marginTop: 16, fontWeight: '700', fontSize: 14 },
  addMore: { fontSize: 13, fontWeight: '600', marginTop: 10 },
});
