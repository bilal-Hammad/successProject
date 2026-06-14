import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { cancelHabitReminder, scheduleHabitReminder } from '../../src/notifications/reminders';
import { useHabitStore } from '../../src/store/useHabitStore';
import { useTheme } from '../../src/theme/ThemeContext';

const ICONS = ['⭐', '🎯', '💡', '🏆', '❤️', '🌿', '🎨', '🎵', '📌', '🔑', '🛠', '🌟'];
const COLORS = ['#6C63FF', '#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63', '#00BCD4'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { habits, saveHabit, deleteHabit } = useHabitStore();
  const habit = habits.find((h) => h.id === id);

  const [title, setTitle] = useState(habit ? resolveHabitTitle(habit, t) : '');
  const [icon, setIcon] = useState(habit?.icon ?? '⭐');
  const [color, setColor] = useState(habit?.color ?? '#6C63FF');
  const [points, setPoints] = useState(String(habit?.pointsPerCompletion ?? 10));
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>(habit?.weeklyTarget ? 'weekly' : 'daily');
  const [days, setDays] = useState<number[]>(habit?.weeklyTarget ? ALL_DAYS : (habit?.scheduleDays ?? ALL_DAYS));
  const [weeklyTarget, setWeeklyTarget] = useState(String(habit?.weeklyTarget ?? 3));
  const [reminder, setReminder] = useState(habit?.reminderTime ?? '');
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

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) { Alert.alert(t('form.nameRequired')); return; }
    if (days.length === 0) { Alert.alert(t('form.selectDayMsg')); return; }

    const isWeekly = frequencyType === 'weekly';
    const updated = {
      ...habit,
      title: trimmed,
      translationKey: undefined,
      icon,
      color,
      pointsPerCompletion: Math.max(1, parseInt(points, 10) || 10),
      scheduleDays: isWeekly ? ALL_DAYS : days,
      weeklyTarget: isWeekly ? Math.max(1, parseInt(weeklyTarget, 10) || 3) : undefined,
      reminderTime: reminder || undefined,
      dailyTarget: !isWeekly && isCounting ? Math.max(1, parseInt(dailyTarget, 10) || 1) : undefined,
      unit: !isWeekly && isCounting && unit.trim() ? unit.trim() : undefined,
    };

    await saveHabit(updated);
    await cancelHabitReminder(habit.id);
    if (updated.reminderTime) await scheduleHabitReminder(updated);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(t('habits.deleteTitle'), t('form.deleteMsg', { title: resolveHabitTitle(habit, t) }), [
      { text: t('habits.cancel'), style: 'cancel' },
      {
        text: t('habits.delete'),
        style: 'destructive',
        onPress: async () => {
          await cancelHabitReminder(habit.id);
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

          <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>{t('form.frequency')}</Text>
          <View style={styles.freqRow}>
            {(['daily', 'weekly'] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setFrequencyType(type)}
                style={[
                  styles.freqBtn,
                  {
                    backgroundColor: frequencyType === type ? theme.colors.primary : theme.colors.surface,
                    borderColor: frequencyType === type ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Text style={[styles.freqBtnText, { color: frequencyType === type ? '#fff' : theme.colors.textSecondary }]}>
                  {type === 'daily' ? t('form.specificDays') : t('form.timesPerWeek')}
                </Text>
              </Pressable>
            ))}
          </View>

          {frequencyType === 'daily' ? (
            <View style={styles.daysRow}>
              {ALL_DAYS.map((d) => (
                <Pressable key={d} onPress={() => toggleDay(d)} style={[styles.dayBtn, { backgroundColor: days.includes(d) ? theme.colors.primary : theme.colors.surface, borderColor: days.includes(d) ? theme.colors.primary : theme.colors.border, borderRadius: theme.radius.full }]}>
                  <Text style={[styles.dayText, { color: days.includes(d) ? '#fff' : theme.colors.textSecondary }]}>{t(`day.${d}`)}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View>
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 8 }]}>{t('form.weeklyTargetLabel')}</Text>
              <TextInput
                value={weeklyTarget}
                onChangeText={setWeeklyTarget}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor={theme.colors.textSecondary}
                style={inputStyle}
              />
            </View>
          )}

          {/* Counting toggle — only for specific-days habits */}
          {frequencyType === 'daily' && (
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

          <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>{t('form.reminderRequired')}</Text>
          <TextInput value={reminder} onChangeText={setReminder} placeholder={t('form.reminderPlaceholder')} placeholderTextColor={theme.colors.textSecondary} style={inputStyle} />

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
  daysRow: { flexDirection: 'row', gap: 8 },
  dayBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  dayText: { fontSize: 11, fontWeight: '700' },
  freqRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  freqBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5 },
  freqBtnText: { fontSize: 13, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 14, borderWidth: 1.5, gap: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleHint: { fontSize: 12, marginTop: 2 },
  countingFields: { flexDirection: 'row', gap: 12, marginTop: 12 },
  saveBtn: { marginTop: 28, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});
