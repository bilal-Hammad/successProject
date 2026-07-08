import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHealthKitSync } from '../../src/hooks/useHealthKit';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CounterModal } from '../../src/components/CounterModal';
import { MoodSelector } from '../../src/components/MoodSelector';
import { EmptyState } from '../../src/components/EmptyState';
import { GoodHabitCard, isTimeUnit } from '../../src/components/GoodHabitCard';
import { TimerModal } from '../../src/components/TimerModal';
import { TodoHabitCard } from '../../src/components/TodoHabitCard';
import { TrackCounterModal } from '../../src/components/TrackCounterModal';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { resolveHabitTitle } from '../../src/i18n/translations';
import { getHabitCount, getWeeklyCount, isHabitDone } from '../../src/logic/completion';
import { habitsForDate, todayString } from '../../src/logic/scheduling';
import { currentStreak } from '../../src/logic/streaks';
import type { MoodValue } from '../../src/models/types';
import { useHabitStore } from '../../src/store/useHabitStore';
import { useMoodStore } from '../../src/store/useMoodStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { rescheduleAfterCompletion } from '../../src/notifications/reminders';

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_W = Dimensions.get('window').width;
const DAY_ITEM_W = Math.floor(SCREEN_W / 7);
const STRIP_DAYS = 90;
const TODAY_INDEX = 45;

const MOOD_CONFIG: Record<MoodValue, { label: string; color: string; face: string }> = {
  awful:     { label: 'Awful',     color: '#D96B6B', face: '' },
  bad:       { label: 'Bad',       color: '#9B6BB5', face: '' },
  poor:      { label: 'Poor',      color: '#6B7FD4', face: '' },
  neutral:   { label: 'Neutral',   color: '#7EC8E3', face: '' },
  good:      { label: 'Good',      color: '#5BBF7A', face: '' },
  great:     { label: 'Great',     color: '#F5D76E', face: '' },
  excellent: { label: 'Excellent', color: '#F5A623', face: '' },
};

// ─── Build day strip ──────────────────────────────────────────────────────────

function buildDayStrip(): dayjs.Dayjs[] {
  const today = dayjs();
  return Array.from({ length: STRIP_DAYS }, (_, i) => today.subtract(TODAY_INDEX - i, 'day'));
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const { habits, completions, toggleCompletion, logCount, saveHabit } = useHabitStore();
  const { enableFutureDates, weekStartsOn, dayStartsAt, notificationsEnabled, defaultReminderSchedule } = useSettingsStore();
  const { moods, logMoodValue, getMood, getMoodValue } = useMoodStore();

  const todayStr = todayString(dayStartsAt);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [moodDate, setMoodDate] = useState<string | null>(null);

  useHealthKitSync(habits, selectedDate, logCount);

  // Todo counter
  const [counterHabitId, setCounterHabitId] = useState<string | null>(null);
  // Track counter (count/volume habits)
  const [trackCounterHabitId, setTrackCounterHabitId] = useState<string | null>(null);
  // Timer (duration habits)
  const [timerHabitId, setTimerHabitId] = useState<string | null>(null);

  const stripDays = useRef(buildDayStrip()).current;
  const flatRef = useRef<FlatList>(null);

  // Ref so the focus callback always sees the latest selectedDate without being a dep
  const selectedDateRef = useRef(selectedDate);
  useEffect(() => { selectedDateRef.current = selectedDate; });

  // Reset to today whenever this screen gains focus (tab switch, back navigation, app resume)
  useFocusEffect(
    useCallback(() => {
      const currentToday = todayString(dayStartsAt);
      if (selectedDateRef.current !== currentToday) {
        setSelectedDate(currentToday);
      }
      const timer = setTimeout(() => {
        flatRef.current?.scrollToIndex({ index: TODAY_INDEX, animated: false, viewPosition: 0.5 });
      }, 80);
      return () => clearTimeout(timer);
    }, [dayStartsAt])
  );

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedHabits = habitsForDate(habits, selectedDate);

  // Sort: incomplete first, completed last
  const sortedHabits = useMemo(() => {
    const incomplete = selectedHabits.filter((h) => !isHabitDone(h, completions, selectedDate, weekStartsOn));
    const complete = selectedHabits.filter((h) => isHabitDone(h, completions, selectedDate, weekStartsOn));
    return [...incomplete, ...complete];
  }, [selectedHabits, completions, selectedDate, weekStartsOn]);

  const completedCount = selectedHabits.filter((h) => isHabitDone(h, completions, selectedDate, weekStartsOn)).length;

  // Modal derived state
  const counterHabit = counterHabitId ? habits.find((h) => h.id === counterHabitId) ?? null : null;
  const counterCount = counterHabitId ? getHabitCount(counterHabitId, completions, selectedDate) : 0;

  const trackCounterHabit = trackCounterHabitId ? habits.find((h) => h.id === trackCounterHabitId) ?? null : null;
  const trackCounterCount = trackCounterHabitId ? getHabitCount(trackCounterHabitId, completions, selectedDate) : 0;

  const timerHabit = timerHabitId ? habits.find((h) => h.id === timerHabitId) ?? null : null;
  // Timer elapsed in seconds (count stored in minutes)
  const timerInitialSeconds = timerHabitId
    ? getHabitCount(timerHabitId, completions, selectedDate) * 60
    : 0;

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Non-blocking reschedule after a habit reaches completion.
  // Only fires for today (completing a past date shouldn't shift future reminders),
  // only when notifications are enabled, and only when the habit has remindMe set.
  const fireReschedule = (habit: typeof habits[0], date: string) => {
    if (!notificationsEnabled || !habit.remindMe || date !== todayStr) return;
    rescheduleAfterCompletion(habit, defaultReminderSchedule)
      .then(({ reminderTime, notificationIds }) => {
        saveHabit({ ...habit, reminderTime, notificationIds: notificationIds.length > 0 ? notificationIds : undefined });
      })
      .catch(() => {});
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDayPress = (dateStr: string, day: dayjs.Dayjs) => {
    if (!enableFutureDates && day.isAfter(dayjs(), 'day')) return;
    setSelectedDate(dateStr);
    setMoodDate(dateStr);
  };

  // Good/Track habit — body tap
  const handleGoodBodyPress = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    if (isTimeUnit(habit.unit)) {
      setTimerHabitId(habitId);
    } else {
      setTrackCounterHabitId(habitId);
    }
  };

  // Good/Track habit — action button (▶ for time units, + for everything else)
  const handleGoodActionPress = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    if (isTimeUnit(habit.unit)) {
      setTimerHabitId(habitId);
      return;
    }

    const current = getHabitCount(habitId, completions, selectedDate);
    const goal = habit.dailyTarget ?? 1;
    if (current >= goal) return;
    const step = habit.step ?? 1;
    const next = Math.min(current + step, goal);
    logCount(habitId, selectedDate, next);
    if (next >= goal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fireReschedule(habit, selectedDate);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Legacy HabitCard handler (bad habits, etc.)
  const handlePress = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    if (habit.weeklyTarget) {
      const weekCount = getWeeklyCount(habitId, completions, selectedDate, weekStartsOn);
      if (weekCount < habit.weeklyTarget) {
        const todayCount = getHabitCount(habitId, completions, selectedDate);
        logCount(habitId, selectedDate, todayCount + 1);
        if (weekCount + 1 >= habit.weeklyTarget) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          fireReschedule(habit, selectedDate);
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
          fireReschedule(habit, selectedDate);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } else {
      const wasDone = isHabitDone(habit, completions, selectedDate);
      toggleCompletion(habitId, selectedDate);
      if (!wasDone) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fireReschedule(habit, selectedDate);
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

  // Todo handlers
  const handleTodoBodyPress = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    if (habit.dailyTarget && habit.dailyTarget > 1) {
      setCounterHabitId(habitId);
    } else {
      const wasDone = isHabitDone(habit, completions, selectedDate);
      toggleCompletion(habitId, selectedDate);
      if (wasDone) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fireReschedule(habit, selectedDate);
      }
    }
  };

  const handleTodoPlusPress = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const step = habit.step ?? 1;
    if (!habit.dailyTarget || habit.dailyTarget <= 1) {
      const wasDone = isHabitDone(habit, completions, selectedDate);
      toggleCompletion(habitId, selectedDate);
      if (wasDone) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fireReschedule(habit, selectedDate);
      }
    } else {
      const current = getHabitCount(habitId, completions, selectedDate);
      if (current >= habit.dailyTarget) return;
      const next = Math.min(current + step, habit.dailyTarget);
      logCount(habitId, selectedDate, next);
      if (next >= habit.dailyTarget) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fireReschedule(habit, selectedDate);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  // ── Day strip item ────────────────────────────────────────────────────────

  const renderDayItem = useCallback(({ item: day }: { item: dayjs.Dayjs }) => {
    const dateStr = day.format('YYYY-MM-DD');
    const isSelected = dateStr === selectedDate;
    const isToday = dateStr === todayStr;
    const dayHabits = habitsForDate(habits, dateStr);
    const allDone = dayHabits.length > 0 && dayHabits.every((h) => isHabitDone(h, completions, dateStr, weekStartsOn));
    const mood = getMood(dateStr);
    const moodColor = mood ? MOOD_CONFIG[mood].color : undefined;

    return (
      <Pressable
        onPress={() => handleDayPress(dateStr, day)}
        style={[
          ds.dayCell,
          {
            width: DAY_ITEM_W,
            backgroundColor: isSelected ? theme.colors.primary : 'transparent',
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Text style={[ds.dayName, {
          color: isSelected ? '#fff' : isToday ? theme.colors.primary : theme.colors.textSecondary,
          fontWeight: isToday ? '800' : '500',
        }]}>
          {day.format('ddd').slice(0, 3)}
        </Text>
        <Text style={[ds.dayNum, {
          color: isSelected ? '#fff' : isToday ? theme.colors.primary : theme.colors.textPrimary,
          fontWeight: isSelected || isToday ? '700' : '400',
        }]}>
          {day.format('D')}
        </Text>
        {!isSelected && (moodColor || allDone) && (
          <View style={[ds.dot, { backgroundColor: moodColor ?? theme.colors.success }]} />
        )}
      </Pressable>
    );
  }, [selectedDate, habits, completions, moods, theme]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* Day strip */}
      <FlatList
        ref={flatRef}
        data={stripDays}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderDayItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: DAY_ITEM_W, offset: DAY_ITEM_W * index, index })}
        onScrollToIndexFailed={(info) => {
          flatRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
        }}
        style={ds.strip}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      />

      {/* Habit list */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120, paddingHorizontal: theme.spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {sortedHabits.length === 0 ? (
          <EmptyState
            icon="🌱"
            title={t('today.emptyTitle')}
            body={t('today.emptyBody')}
            actionLabel={t('today.browseTemplates')}
            actionHref="/templates"
          />
        ) : (
          <>
            {sortedHabits.map((habit) => {
              const done = isHabitDone(habit, completions, selectedDate, weekStartsOn);
              const count = habit.weeklyTarget
                ? getWeeklyCount(habit.id, completions, selectedDate, weekStartsOn)
                : getHabitCount(habit.id, completions, selectedDate);
              const streak = currentStreak(habit, completions, weekStartsOn);

              if (habit.habitType === 'todo') {
                return (
                  <TodoHabitCard
                    key={habit.id}
                    title={resolveHabitTitle(habit, t)}
                    icon={habit.icon}
                    color={habit.color}
                    count={count}
                    dailyTarget={habit.dailyTarget}
                    step={habit.step}
                    completed={done}
                    onBodyPress={() => handleTodoBodyPress(habit.id)}
                    onPlusPress={() => handleTodoPlusPress(habit.id)}
                  />
                );
              }

              if (habit.habitType === 'bad') {
                // Bad habits use the legacy card for now
                const isWeekly = !!habit.weeklyTarget;
                const target = isWeekly ? habit.weeklyTarget : habit.dailyTarget;
                const unit = isWeekly ? t('habit.timesThisWeek') : habit.unit;
                return (
                  <GoodHabitCard
                    key={habit.id}
                    title={resolveHabitTitle(habit, t)}
                    icon={habit.icon}
                    color={habit.color}
                    count={count}
                    dailyTarget={target}
                    unit={unit}
                    step={habit.step}
                    completed={done}
                    streak={streak}
                    habitType={habit.habitType}
                    onBodyPress={() => handlePress(habit.id)}
                    onActionPress={() => handlePress(habit.id)}
                  />
                );
              }

              // Good / Track habits
              return (
                <GoodHabitCard
                  key={habit.id}
                  title={resolveHabitTitle(habit, t)}
                  icon={habit.icon}
                  color={habit.color}
                  count={count}
                  dailyTarget={habit.dailyTarget}
                  unit={habit.unit}
                  step={habit.step}
                  completed={done}
                  streak={streak}
                  habitType={habit.habitType}
                  onBodyPress={() => handleGoodBodyPress(habit.id)}
                  onActionPress={() => handleGoodActionPress(habit.id)}
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
      </ScrollView>

      {/* Mood Selector */}
      <MoodSelector
        visible={moodDate !== null}
        initialValue={moodDate ? (getMoodValue(moodDate) ?? 50) : 50}
        onSave={(value) => {
          if (moodDate) {
            logMoodValue(moodDate, value);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          setMoodDate(null);
        }}
        onClose={() => setMoodDate(null)}
      />

      {/* Todo Counter Modal */}
      <CounterModal
        visible={counterHabitId !== null}
        habit={counterHabit}
        count={counterCount}
        onClose={() => setCounterHabitId(null)}
        onCountChange={(newCount) => {
          if (counterHabitId) logCount(counterHabitId, selectedDate, newCount);
        }}
      />

      {/* Track Counter Modal (count/volume habits) */}
      <TrackCounterModal
        visible={trackCounterHabitId !== null}
        habit={trackCounterHabit}
        count={trackCounterCount}
        date={selectedDate}
        onClose={() => setTrackCounterHabitId(null)}
        onCountChange={(newCount) => {
          if (trackCounterHabitId) logCount(trackCounterHabitId, selectedDate, newCount);
        }}
      />

      {/* Timer Modal (duration habits) */}
      <TimerModal
        visible={timerHabitId !== null}
        habit={timerHabit}
        elapsed={timerInitialSeconds}
        date={selectedDate}
        onClose={() => setTimerHabitId(null)}
        onElapsedChange={(seconds) => {
          if (timerHabitId) {
            logCount(timerHabitId, selectedDate, Math.floor(seconds / 60));
          }
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ds = StyleSheet.create({
  strip: { flexGrow: 0, paddingBottom: 8 },
  dayCell: { alignItems: 'center', paddingVertical: 8, gap: 2 },
  dayName: { fontSize: 11 },
  dayNum: { fontSize: 15 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: { fontSize: 20 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  headerAdd: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 30 },

  scroll: { paddingTop: 8 },
  allDone: { textAlign: 'center', marginTop: 16, fontWeight: '700', fontSize: 14 },
});
