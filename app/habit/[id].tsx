import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { resolveHabitTitle } from '../../src/i18n/translations';
import { cancelHabitReminders, scheduleHabitReminder } from '../../src/notifications/reminders';
import {
  syncHabitCalendarEvent,
  syncHabitReminder,
  deleteHabitCalendarEvent,
  deleteHabitReminder,
  requestCalendarPermission,
  requestRemindersPermission,
} from '../../src/services/calendarService';
import { computeSmartReminderTime } from '../../src/data/smartReminderTime';
import { useHabitStore } from '../../src/store/useHabitStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useTheme } from '../../src/theme/ThemeContext';
import type { Habit, RepeatMode } from '../../src/models/types';

let DateTimePicker: React.ComponentType<any> | null = null;
try { DateTimePicker = require('@react-native-community/datetimepicker').default; } catch {}

const ICONS = ['⭐', '🎯', '💡', '🏆', '❤️', '🌿', '🎨', '🎵', '📌', '🔑', '🛠', '🌟'];
const COLORS = ['#6C63FF', '#FF5722', '#A2FA4E', '#2196F3', '#9C27B0', '#FF9800', '#E91E63', '#00BCD4'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function initRepeatMode(habit: Habit): RepeatMode {
  if (habit.intervalDays) return 'everyXDays';
  if (habit.weeklyTarget) return 'timesPerWeek';
  if (!habit.scheduleDays || habit.scheduleDays.length === 7) return 'daily';
  return 'specificDays';
}

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { habits, completions, saveHabit, deleteHabit } = useHabitStore();
  const { weekStartsOn, notificationsEnabled } = useSettingsStore();
  const habit = habits.find((h) => h.id === id);

  const [title, setTitle] = useState(habit ? resolveHabitTitle(habit, t) : '');
  const [icon, setIcon] = useState(habit?.icon ?? '⭐');
  const [color, setColor] = useState(habit?.color ?? '#6C63FF');
  const [points, setPoints] = useState(String(habit?.pointsPerCompletion ?? 10));
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(habit ? initRepeatMode(habit) : 'daily');
  const [days, setDays] = useState<number[]>(
    habit?.intervalDays || habit?.weeklyTarget ? ALL_DAYS : (habit?.scheduleDays ?? ALL_DAYS)
  );
  const [weeklyTarget, setWeeklyTarget] = useState(String(habit?.weeklyTarget ?? 3));
  const [intervalDays, setIntervalDays] = useState(String(habit?.intervalDays ?? 2));
  const [reminder, setReminder] = useState(habit?.reminderTime ?? '');
  const [remindMe, setRemindMe] = useState(habit?.remindMe ?? false);
  const [reminderMode, setReminderMode] = useState<'custom' | 'smart'>(habit?.reminderMode ?? 'custom');
  const [remindersAppEnabled, setRemindersAppEnabled] = useState(habit?.remindersAppEnabled ?? false);
  const [calendarEnabled, setCalendarEnabled] = useState(habit?.calendarEnabled ?? false);
  const [reminderFrequencyMode, setReminderFrequencyMode] = useState<'interval' | 'timesPerDay' | null>(habit?.reminderFrequencyMode ?? null);
  const [reminderIntervalHours, setReminderIntervalHours] = useState(habit?.reminderIntervalHours ?? 2);
  const [reminderTimesPerDay, setReminderTimesPerDay] = useState(habit?.reminderTimesPerDay ?? 2);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempReminderDate, setTempReminderDate] = useState<Date>(() => {
    if (habit?.reminderTime) {
      const [h, m] = habit.reminderTime.split(':');
      const d = new Date(); d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0); return d;
    }
    const d = new Date(); d.setHours(9, 0, 0, 0); return d;
  });
  const [isCounting, setIsCounting] = useState(!!habit?.dailyTarget);
  const [dailyTarget, setDailyTarget] = useState(String(habit?.dailyTarget ?? ''));
  const [unit, setUnit] = useState(habit?.unit ?? '');

  if (!habit) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>{t('form.habitNotFound')}</Text>
      </SafeAreaView>
    );
  }

  const orderedDays = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);

  // Uses live form state (isCounting), not the stored habit's dailyTarget, since
  // the user may be toggling counting on/off right now in this edit form.
  const isBinaryEligible = (habit.habitType === 'good' || habit.habitType === 'bad') && !isCounting;
  const smartPreview = isBinaryEligible ? computeSmartReminderTime(habit, completions) : null;
  // Matches the same isCountingNow formula used in handleSave — timesPerWeek
  // habits can't be counting-type regardless of the isCounting toggle.
  const isCountingHabitNow = repeatMode !== 'timesPerWeek' && isCounting;
  const dailyTargetGoal = Math.max(1, parseInt(dailyTarget, 10) || 1);

  const handleRemindersAppToggle = async (value: boolean) => {
    console.log('[FORGE] (edit) handleRemindersAppToggle: called with value =', value);
    if (value) {
      const granted = await requestRemindersPermission();
      console.log('[FORGE] (edit) handleRemindersAppToggle: requestRemindersPermission() =', granted);
      if (!granted) {
        Alert.alert(
          t('settings.calendarIntegration'),
          'Reminders access was denied. Please enable it in Settings → Privacy → Reminders.',
        );
        console.log('[FORGE] (edit) handleRemindersAppToggle: permission denied — leaving toggle off');
        return;
      }
    }
    console.log('[FORGE] (edit) handleRemindersAppToggle: calling setRemindersAppEnabled(', value, ')');
    setRemindersAppEnabled(value);
  };

  useEffect(() => {
    console.log('[FORGE] (edit) remindersAppEnabled state is now =', remindersAppEnabled);
  }, [remindersAppEnabled]);

  const handleCalendarToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestCalendarPermission();
      if (!granted) {
        Alert.alert(
          t('settings.calendarIntegration'),
          'Calendar access was denied. Please enable it in Settings → Privacy → Calendars.',
        );
        return;
      }
    }
    setCalendarEnabled(value);
  };

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const repeatSummary =
    repeatMode === 'daily' ? t('repeat.summaryEveryDay') :
    repeatMode === 'specificDays' ? (days.length === 0 ? t('form.selectDaysMsg') : t('repeat.summaryOn', { days: orderedDays.filter(d => days.includes(d)).map(d => t(`day.${d}`)).join(', ') })) :
    repeatMode === 'timesPerWeek' ? t('repeat.summaryTimesPerWeek', { count: Math.max(1, parseInt(weeklyTarget, 10) || 3) }) :
    t('repeat.summaryEveryXDays', { count: Math.max(2, parseInt(intervalDays, 10) || 2) });

  const handleSave = async () => {
    console.log('[FORGE] (edit) ===== handleSave ENTRY ===== remindersAppEnabled =', remindersAppEnabled, '| calendarEnabled =', calendarEnabled, '| remindMe =', remindMe);
    const trimmed = title.trim();
    if (!trimmed) {
      console.log('[FORGE] (edit) handleSave: empty title — bailing with alert');
      Alert.alert(t('form.nameRequired'));
      return;
    }
    if (repeatMode === 'specificDays' && days.length === 0) {
      console.log('[FORGE] (edit) handleSave: no days selected — bailing with alert');
      Alert.alert(t('form.selectDayMsg'));
      return;
    }

    try {
    const isCountingNow = repeatMode !== 'timesPerWeek' && isCounting;
    const effectiveReminderTime = notificationsEnabled && remindMe
      ? (reminderMode === 'smart' && isBinaryEligible && smartPreview
          ? smartPreview.time
          : (reminder || undefined))
      : undefined;

    const updated: Habit = {
      ...habit,
      title: trimmed,
      translationKey: undefined,
      icon,
      color,
      pointsPerCompletion: Math.max(1, parseInt(points, 10) || 10),
      scheduleDays: repeatMode === 'everyXDays' ? [] : repeatMode === 'timesPerWeek' ? ALL_DAYS : days.length > 0 ? days : ALL_DAYS,
      weeklyTarget: repeatMode === 'timesPerWeek' ? Math.max(1, parseInt(weeklyTarget, 10) || 3) : undefined,
      intervalDays: repeatMode === 'everyXDays' ? Math.max(2, parseInt(intervalDays, 10) || 2) : undefined,
      reminderTime: effectiveReminderTime,
      remindMe: notificationsEnabled ? remindMe : false,
      reminderMode: notificationsEnabled && remindMe ? reminderMode : undefined,
      remindersAppEnabled: notificationsEnabled && remindMe ? remindersAppEnabled : false,
      calendarEnabled: notificationsEnabled && remindMe ? calendarEnabled : false,
      reminderFrequencyMode: notificationsEnabled && remindMe && isCountingNow ? reminderFrequencyMode ?? undefined : undefined,
      reminderIntervalHours: notificationsEnabled && remindMe && isCountingNow && reminderFrequencyMode === 'interval'
        ? Math.min(reminderIntervalHours, dailyTargetGoal) : undefined,
      reminderTimesPerDay: notificationsEnabled && remindMe && isCountingNow && reminderFrequencyMode === 'timesPerDay'
        ? Math.min(reminderTimesPerDay, dailyTargetGoal) : undefined,
      dailyTarget: isCountingNow ? Math.max(1, parseInt(dailyTarget, 10) || 1) : undefined,
      unit: isCountingNow && unit.trim() ? unit.trim() : undefined,
    };

    await saveHabit(updated);

    console.log(
      '[FORGE] handleSave (edit): sync gates —',
      'notificationsEnabled =', notificationsEnabled,
      '| remindMe =', remindMe,
      '| remindersAppEnabled =', remindersAppEnabled,
      '| calendarEnabled =', calendarEnabled,
      '| effectiveReminderTime =', effectiveReminderTime,
    );

    // scheduleHabitReminder internally cancels old ones first — no need to call cancel separately.
    const [notifIds, reminderId, calId] = await Promise.all([
      notificationsEnabled && remindMe ? scheduleHabitReminder(updated) : cancelHabitReminders(habit.id).then(() => [] as string[]),
      notificationsEnabled && remindMe && remindersAppEnabled
        ? syncHabitReminder(updated, effectiveReminderTime!, true)
        : syncHabitReminder(updated, effectiveReminderTime ?? '09:00', false),
      notificationsEnabled && remindMe && calendarEnabled
        ? syncHabitCalendarEvent(updated, effectiveReminderTime!, true)
        : syncHabitCalendarEvent(updated, effectiveReminderTime ?? '09:00', false),
    ]);
    // Persist IDs so future edits/deletes can target them directly.
    await saveHabit({
      ...updated,
      notificationIds: notifIds.length > 0 ? notifIds : undefined,
      reminderId,
      calendarEventIds: calId ? [calId] : undefined,
    });

    router.back();
    } catch (e) {
      console.warn('[FORGE] (edit) handleSave: THREW —', e instanceof Error ? e.message : e, e);
    }
  };

  const handleDelete = () => {
    Alert.alert(t('habits.deleteTitle'), t('form.deleteMsg', { title: resolveHabitTitle(habit, t) }), [
      { text: t('habits.cancel'), style: 'cancel' },
      {
        text: t('habits.delete'),
        style: 'destructive',
        onPress: async () => {
          await Promise.all([
            cancelHabitReminders(habit.id),
            habit.calendarEventIds?.[0] ? deleteHabitCalendarEvent(habit.calendarEventIds[0]) : Promise.resolve(),
            habit.reminderId ? deleteHabitReminder(habit.reminderId) : Promise.resolve(),
          ]);
          await deleteHabit(habit.id);
          router.back();
        },
      },
    ]);
  };

  const inputStyle = [styles.input, {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    borderRadius: theme.radius.md,
  }];

  const modeLabels: Record<RepeatMode, string> = {
    daily: t('form.everyDay'),
    specificDays: t('form.specificDays'),
    timesPerWeek: t('form.timesPerWeek'),
    everyXDays: t('repeat.everyXDays'),
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scroll, { padding: theme.spacing.md }]}>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('form.habitName')}</Text>
          <TextInput value={title} onChangeText={setTitle} placeholderTextColor={theme.colors.textSecondary} style={inputStyle} />

          <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>{t('form.icon')}</Text>
          <View style={styles.grid}>
            {ICONS.map((ic) => (
              <Pressable key={ic} onPress={() => setIcon(ic)} style={[styles.iconBtn, { backgroundColor: icon === ic ? theme.colors.primaryMuted : theme.colors.surface, borderColor: icon === ic ? theme.colors.primary : theme.colors.border, borderRadius: theme.radius.md }]}>
                <Text style={{ fontSize: 22 }}>{ic}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>{t('form.color')}</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff' }]} />
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>{t('form.points')}</Text>
          <TextInput value={points} onChangeText={setPoints} keyboardType="number-pad" style={inputStyle} />

          {/* ── Repeat / Frequency (hidden for todo habits) ──────────────── */}
          {habit.habitType !== 'todo' && (
            <>
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>{t('form.repeat')}</Text>

              {/* 4 mode radio rows */}
              <View style={[styles.modeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
                {((['daily', 'specificDays', 'timesPerWeek', 'everyXDays'] as const)).map((mode, idx, arr) => (
                  <View key={mode}>
                    <Pressable onPress={() => setRepeatMode(mode)} style={styles.modeRow}>
                      <View style={[styles.radioOuter, { borderColor: repeatMode === mode ? theme.colors.primary : theme.colors.border }]}>
                        {repeatMode === mode && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />}
                      </View>
                      <Text style={[styles.modeLabel, { color: repeatMode === mode ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                        {modeLabels[mode]}
                      </Text>
                    </Pressable>
                    {idx < arr.length - 1 && <View style={[styles.modeSep, { backgroundColor: theme.colors.border }]} />}
                  </View>
                ))}
              </View>

              {/* Sub-control */}
              {repeatMode === 'specificDays' && (
                <View style={styles.daysRow}>
                  {orderedDays.map((d) => (
                    <Pressable key={d} onPress={() => toggleDay(d)} style={[styles.dayBtn, { backgroundColor: days.includes(d) ? theme.colors.primary : theme.colors.surface, borderColor: days.includes(d) ? theme.colors.primary : theme.colors.border, borderRadius: theme.radius.full }]}>
                      <Text style={[styles.dayText, { color: days.includes(d) ? '#fff' : theme.colors.textSecondary }]}>{t(`day.${d}`)}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {repeatMode === 'timesPerWeek' && (
                <View style={styles.stepperRow}>
                  <Pressable onPress={() => setWeeklyTarget((v) => String(Math.max(1, (parseInt(v, 10) || 1) - 1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </Pressable>
                  <Text style={[styles.stepValue, { color: theme.colors.textPrimary }]}>{weeklyTarget}</Text>
                  <Pressable onPress={() => setWeeklyTarget((v) => String(Math.min(7, (parseInt(v, 10) || 1) + 1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </Pressable>
                </View>
              )}
              {repeatMode === 'everyXDays' && (
                <View style={styles.stepperRow}>
                  <Pressable onPress={() => setIntervalDays((v) => String(Math.max(2, (parseInt(v, 10) || 2) - 1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </Pressable>
                  <Text style={[styles.stepValue, { color: theme.colors.textPrimary }]}>{intervalDays}</Text>
                  <Pressable onPress={() => setIntervalDays((v) => String(Math.min(30, (parseInt(v, 10) || 2) + 1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </Pressable>
                </View>
              )}

              {/* Live summary */}
              <Text style={[styles.repeatSummary, { color: theme.colors.textSecondary }]}>{repeatSummary}</Text>

              {/* Counting toggle — not available for timesPerWeek */}
              {repeatMode !== 'timesPerWeek' && (
                <>
                  <View style={[styles.toggleRow, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>{t('form.trackCount')}</Text>
                      <Text style={[styles.toggleHint, { color: theme.colors.textSecondary }]}>{t('form.trackCountHint')}</Text>
                    </View>
                    <Switch
                      value={isCounting}
                      onValueChange={setIsCounting}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>

                  {isCounting && (
                    <View style={styles.countingFields}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('form.dailyTarget')}</Text>
                        <TextInput value={dailyTarget} onChangeText={setDailyTarget} keyboardType="number-pad" placeholder="8" placeholderTextColor={theme.colors.textSecondary} style={inputStyle} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('form.unit')}</Text>
                        <TextInput value={unit} onChangeText={setUnit} placeholder={t('form.unitPlaceholder')} placeholderTextColor={theme.colors.textSecondary} style={inputStyle} />
                      </View>
                    </View>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Remind Me ──────────────────────────────────────────────────── */}
          {notificationsEnabled && (
            <>
              <View style={[styles.toggleRow, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>{t('form.remindMe')}</Text>
                  <Text style={[styles.toggleHint, { color: theme.colors.textSecondary }]}>{t('form.remindMeHint')}</Text>
                </View>
                <Switch
                  value={remindMe}
                  onValueChange={setRemindMe}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              {remindMe && isBinaryEligible && (
                <View style={[styles.toggleRow, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, marginTop: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>{t('form.reminderSmartToggle')}</Text>
                    {smartPreview && (
                      <Text style={[styles.toggleHint, { color: theme.colors.textSecondary }]}>
                        {smartPreview.isFallback
                          ? t('form.reminderSmartFallback', { time: smartPreview.time })
                          : t('form.reminderSmartPreview', { time: smartPreview.time, count: smartPreview.sampleSize })}
                      </Text>
                    )}
                  </View>
                  <Switch
                    value={reminderMode === 'smart'}
                    onValueChange={(v) => setReminderMode(v ? 'smart' : 'custom')}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              )}
              {remindMe && reminderMode === 'custom' && (
                <Pressable
                  onPress={() => setShowTimePicker(true)}
                  style={[styles.toggleRow, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, marginTop: 8 }]}
                >
                  <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary, flex: 1 }]}>{t('form.reminderTimeLabel')}</Text>
                  <Text style={[styles.toggleHint, { color: theme.colors.textSecondary }]}>{reminder || '09:00'}</Text>
                  <Text style={{ color: theme.colors.textSecondary, marginLeft: 6, fontSize: 18 }}>›</Text>
                </Pressable>
              )}
              {remindMe && isCountingHabitNow && (
                <>
                  <View style={[styles.toggleRow, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, marginTop: 8 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>{t('form.reminderFrequencyToggle')}</Text>
                      <Text style={[styles.toggleHint, { color: theme.colors.textSecondary }]}>
                        {t('form.reminderFrequencyHint', { goal: dailyTargetGoal })}
                      </Text>
                    </View>
                    <Switch
                      value={reminderFrequencyMode !== null}
                      onValueChange={(v) => setReminderFrequencyMode(v ? 'interval' : null)}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                  {reminderFrequencyMode !== null && (
                    <>
                      <Pressable
                        onPress={() => setReminderFrequencyMode('interval')}
                        style={[styles.toggleRow, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, marginTop: 8 }]}
                      >
                        <Text style={[styles.toggleLabel, { color: reminderFrequencyMode === 'interval' ? theme.colors.primary : theme.colors.textPrimary, flex: 1 }]}>
                          {t('form.reminderFrequencyInterval', { hours: reminderIntervalHours })}
                        </Text>
                        {reminderFrequencyMode === 'interval' && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Pressable onPress={() => setReminderIntervalHours((v) => Math.max(1, v - 1))} hitSlop={8}>
                              <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>−</Text>
                            </Pressable>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, minWidth: 20, textAlign: 'center' }}>
                              {reminderIntervalHours}
                            </Text>
                            <Pressable onPress={() => setReminderIntervalHours((v) => Math.min(dailyTargetGoal, v + 1))} hitSlop={8}>
                              <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>+</Text>
                            </Pressable>
                          </View>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => setReminderFrequencyMode('timesPerDay')}
                        style={[styles.toggleRow, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, marginTop: 8 }]}
                      >
                        <Text style={[styles.toggleLabel, { color: reminderFrequencyMode === 'timesPerDay' ? theme.colors.primary : theme.colors.textPrimary, flex: 1 }]}>
                          {t('form.reminderFrequencyTimesPerDay', { count: reminderTimesPerDay })}
                        </Text>
                        {reminderFrequencyMode === 'timesPerDay' && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Pressable onPress={() => setReminderTimesPerDay((v) => Math.max(1, v - 1))} hitSlop={8}>
                              <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>−</Text>
                            </Pressable>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, minWidth: 20, textAlign: 'center' }}>
                              {reminderTimesPerDay}
                            </Text>
                            <Pressable onPress={() => setReminderTimesPerDay((v) => Math.min(dailyTargetGoal, v + 1))} hitSlop={8}>
                              <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>+</Text>
                            </Pressable>
                          </View>
                        )}
                      </Pressable>
                    </>
                  )}
                </>
              )}
              {remindMe && (
                <>
                  <View style={[styles.toggleRow, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, marginTop: 8 }]}>
                    <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary, flex: 1 }]}>{t('form.remindersAppToggle')}</Text>
                    <Switch
                      value={remindersAppEnabled}
                      onValueChange={handleRemindersAppToggle}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                  <View style={[styles.toggleRow, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, marginTop: 8 }]}>
                    <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary, flex: 1 }]}>{t('form.calendarToggle')}</Text>
                    <Switch
                      value={calendarEnabled}
                      onValueChange={handleCalendarToggle}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                </>
              )}
            </>
          )}

          {/* ── Reminder Time picker sheet ──────────────────────────────────── */}
          <Modal
            visible={showTimePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTimePicker(false)} />
              <View style={[styles.timeSheet, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 12 }]}>
                  {t('form.reminderTimeLabel')}
                </Text>
                {DateTimePicker ? (
                  <DateTimePicker
                    value={tempReminderDate}
                    mode="time"
                    display="spinner"
                    is24Hour={false}
                    onChange={(_: any, date?: Date) => { if (date) setTempReminderDate(date); }}
                    style={{ backgroundColor: theme.colors.surface, height: 180 }}
                    textColor={theme.mode === 'dark' ? '#fff' : '#000'}
                  />
                ) : (
                  <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginVertical: 20 }}>
                    Time picker requires a dev build.
                  </Text>
                )}
                <Pressable
                  onPress={() => {
                    const h = String(tempReminderDate.getHours()).padStart(2, '0');
                    const m = String(tempReminderDate.getMinutes()).padStart(2, '0');
                    setReminder(`${h}:${m}`);
                    setShowTimePicker(false);
                  }}
                  style={[styles.saveBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, marginTop: 8 }]}
                >
                  <Text style={styles.saveBtnText}>{t('form.done')}</Text>
                </Pressable>
                <View style={{ height: 20 }} />
              </View>
            </View>
          </Modal>

          <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md }]}>
            <Text style={styles.saveBtnText}>{t('form.saveChanges')}</Text>
          </Pressable>

          <Pressable onPress={handleDelete} style={[styles.deleteBtn, { borderColor: theme.colors.error, borderRadius: theme.radius.md }]}>
            <Text style={[styles.deleteBtnText, { color: theme.colors.error }]}>{t('form.deleteHabit')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBtn: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  // Repeat
  modeCard: { borderWidth: 1.5, overflow: 'hidden' },
  modeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  modeSep: { height: StyleSheet.hairlineWidth, marginLeft: 46 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  modeLabel: { fontSize: 15, fontWeight: '500' },
  daysRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  dayBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  dayText: { fontSize: 11, fontWeight: '700' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 12 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '600' },
  stepValue: { fontSize: 28, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  repeatSummary: { fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 4, fontStyle: 'italic' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 14, borderWidth: 1.5, gap: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleHint: { fontSize: 12, marginTop: 2 },
  countingFields: { flexDirection: 'row', gap: 12, marginTop: 12 },
  timeSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  saveBtn: { marginTop: 28, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});
