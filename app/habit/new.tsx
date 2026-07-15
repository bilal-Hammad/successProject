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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { scheduleHabitReminder } from '../../src/notifications/reminders';
import { syncHabitCalendarEvents } from '../../src/services/calendarService';
import { useHabitStore } from '../../src/store/useHabitStore';
import { useTheme } from '../../src/theme/ThemeContext';
import type { HabitType, RepeatMode } from '../../src/models/types';
import { generateId } from '../../src/utils/id';
import { useSettingsStore } from '../../src/store/useSettingsStore';

let DateTimePicker: React.ComponentType<any> | null = null;
try { DateTimePicker = require('@react-native-community/datetimepicker').default; } catch {}

// ─── Unit categories ──────────────────────────────────────────────────────────

const UNIT_CATEGORIES: { nameKey: string; units: string[] }[] = [
  {
    nameKey: 'form.unitMostPopular',
    units: ['Minutes', 'Bottles', 'Cups', 'Litres', 'Pages', 'Chapters'],
  },
  {
    nameKey: 'form.unitCount',
    units: ['Count', 'Times', 'Reps', 'Sets', 'Laps', 'Rounds'],
  },
  {
    nameKey: 'form.unitDuration',
    units: ['Hours', 'Minutes', 'Seconds', 'Milliseconds'],
  },
  {
    nameKey: 'form.unitDistance',
    units: ['Kilometres', 'Miles', 'Meters', 'Steps', 'Feet'],
  },
  {
    nameKey: 'form.unitVolume',
    units: ['Litres', 'Millilitres', 'US Gallons', 'US Quarts', 'Metric Pints', 'Cups', 'US Fluid Ounces', 'Tablespoons', 'Teaspoons'],
  },
  {
    nameKey: 'form.unitWeight',
    units: ['Kilograms', 'Pounds', 'Grams', 'Ounces'],
  },
  {
    nameKey: 'form.unitHealth',
    units: ['Calories', 'Glasses', 'Milligrams', 'Micrograms', 'Percent', 'BPM'],
  },
  {
    nameKey: 'form.unitOther',
    units: ['Pages', 'Chapters', 'Words', 'Lines', 'Tasks', 'Items', 'Lessons', 'Sessions'],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const HABIT_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#795548', '#9C27B0',
  '#009688', '#00BCD4', '#F44336', '#03A9F4', '#E91E63',
  '#3F51B5', '#FF5722', '#8BC34A', '#FFC107', '#607D8B',
  '#F05A7E', '#6C63FF', '#00897B', '#F57F17', '#37474F',
];

const ALL_ICONS = [
  '🏃', '🚴', '🏊', '🧘', '💪', '🤸', '⚽', '🏀',
  '💊', '💧', '🍎', '🥗', '😴', '🦷', '❤️', '🫀',
  '📚', '📖', '✍️', '🎯', '🏆', '💡', '🧠', '🎓',
  '🌿', '⭐', '🙏', '🌟', '🎵', '🎨', '🔑', '☀️',
  '💰', '📊', '📈', '💼', '🪙', '🤝', '📋', '🏦',
  '🌙', '🌈', '🎬', '📱', '🛠', '✈️', '🏠', '🎉',
];

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtDateStr = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const addDays = (iso: string, n: number): string => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};



// ─── Floating calendar modal ──────────────────────────────────────────────────

const CAL_YEARS = Array.from({ length: 31 }, (_, i) => 2015 + i);

function CalendarPickerModal({
  visible,
  onClose,
  selectedDate,
  onSelect,
  accentColor,
  minDate,
}: {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // "YYYY-MM-DD"
  onSelect: (iso: string) => void;
  accentColor: string;
  minDate?: string;
}) {
  const theme = useTheme();
  const { t } = useLanguage();
  const [viewYear, setViewYear] = useState(() => parseInt(selectedDate.slice(0, 4), 10));
  const [viewMonth, setViewMonth] = useState(() => parseInt(selectedDate.slice(5, 7), 10) - 1);
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setViewYear(parseInt(selectedDate.slice(0, 4), 10));
      setViewMonth(parseInt(selectedDate.slice(5, 7), 10) - 1);
      setShowYearPicker(false);
    }
  }, [visible]);

  const todaySafe = todayISO();

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  type Cell = { day: number; cur: boolean };
  const cells: Cell[] = [];
  for (let i = firstWeekDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrevMonth - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, cur: true });
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - daysInMonth - firstWeekDay + 1, cur: false });

  const isoForCell = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isSelected = (day: number, cur: boolean) => cur && isoForCell(day) === selectedDate;
  const isToday = (day: number, cur: boolean) => cur && isoForCell(day) === todaySafe;
  const isDisabled = (day: number, cur: boolean) => !cur || (!!minDate && isoForCell(day) <= minDate);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long' });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={calM.overlay} onPress={onClose}>
        <Pressable style={[calM.card, { backgroundColor: theme.colors.surface }]} onPress={() => {}}>
          {/* Header */}
          <View style={calM.header}>
            <Pressable onPress={() => setShowYearPicker(v => !v)} style={calM.monthBtn} hitSlop={8}>
              <Text style={[calM.monthLabel, { color: theme.colors.textPrimary }]}>
                {monthName} {viewYear}{' '}
                <Text style={{ color: accentColor }}>{showYearPicker ? '▲' : '›'}</Text>
              </Text>
            </Pressable>
            {!showYearPicker && (
              <View style={calM.navRow}>
                <Pressable onPress={prevMonth} hitSlop={10} style={calM.navBtn}>
                  <Text style={[calM.navText, { color: theme.colors.textPrimary }]}>‹</Text>
                </Pressable>
                <Pressable onPress={nextMonth} hitSlop={10} style={calM.navBtn}>
                  <Text style={[calM.navText, { color: theme.colors.textPrimary }]}>›</Text>
                </Pressable>
              </View>
            )}
          </View>

          {showYearPicker ? (
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              <View style={calM.yearGrid}>
                {CAL_YEARS.map(y => (
                  <Pressable
                    key={y}
                    onPress={() => { setViewYear(y); setShowYearPicker(false); }}
                    style={[calM.yearCell, y === viewYear && { backgroundColor: accentColor, borderRadius: 8 }]}
                  >
                    <Text style={[
                      calM.yearText,
                      { color: y === viewYear ? '#fff' : theme.colors.textPrimary },
                      y === parseInt(todaySafe.slice(0, 4), 10) && y !== viewYear && { color: accentColor, fontWeight: '700' },
                    ]}>
                      {y}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : (
            <>
              {/* Day headers */}
              <View style={calM.dayHeaders}>
                {[0, 1, 2, 3, 4, 5, 6].map(d => (
                  <Text key={d} style={[calM.dayHeaderText, { color: theme.colors.textSecondary }]}>{t(`day.${d}`).toUpperCase()}</Text>
                ))}
              </View>
              {/* Weeks */}
              {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
                <View key={row} style={calM.week}>
                  {cells.slice(row * 7, row * 7 + 7).map((cell, col) => {
                    const sel = isSelected(cell.day, cell.cur);
                    const tod = isToday(cell.day, cell.cur) && !sel;
                    const dis = isDisabled(cell.day, cell.cur);
                    return (
                      <Pressable
                        key={col}
                        disabled={dis}
                        onPress={() => onSelect(isoForCell(cell.day))}
                        style={[calM.dayCell, sel && { backgroundColor: accentColor, borderRadius: 20 }]}
                      >
                        <Text style={[
                          calM.dayNum,
                          { color: cell.cur ? theme.colors.textPrimary : theme.colors.textSecondary },
                          (dis) && { opacity: 0.2 },
                          sel && { color: '#fff', fontWeight: '700' },
                          tod && { color: accentColor, fontWeight: '700' },
                        ]}>
                          {cell.day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Reusable row ─────────────────────────────────────────────────────────────

function Row({
  icon,
  label,
  hint,
  value,
  onPress,
  rightNode,
  isLast = false,
}: {
  icon: string;
  label: string;
  hint?: string;
  value?: string;
  onPress?: () => void;
  rightNode?: React.ReactNode;
  isLast?: boolean;
}) {
  const theme = useTheme();
  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s.row, { opacity: pressed && onPress ? 0.65 : 1 }]}
      >
        <Text style={s.rowIcon}>{icon}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.rowLabel, { color: theme.colors.textPrimary, flex: 0 }]}>{label}</Text>
          {hint ? <Text style={[s.rowHint, { color: theme.colors.textSecondary }]}>{hint}</Text> : null}
        </View>
        {rightNode ?? (
          <View style={s.rowRight}>
            {value !== undefined && (
              <Text style={[s.rowValue, { color: theme.colors.textSecondary }]}>{value}</Text>
            )}
            {onPress && (
              <Text style={[s.chevron, { color: theme.colors.textSecondary }]}>›</Text>
            )}
          </View>
        )}
      </Pressable>
      {!isLast && <View style={[s.sep, { backgroundColor: theme.colors.border }]} />}
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NewHabitScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saveHabit = useHabitStore((s) => s.saveHabit);
  const { weekStartsOn, defaultReminderSchedule, notificationsEnabled, calendarIntegrationEnabled, calendarEventType } = useSettingsStore();
  const params = useLocalSearchParams<{
    templateId?: string;
    title?: string;
    icon?: string;
    color?: string;
    habitType?: string;
    unit?: string;
    goal?: string;
    healthKitType?: string;
    step?: string;
    repeatMode?: string;
    scheduleDays?: string;
    weeklyTarget?: string;
    intervalDays?: string;
  }>();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(params.title ?? '');
  const [icon, setIcon] = useState(params.icon ?? '⭐');
  const [color, setColor] = useState(params.color ?? '#F05A7E');
  const [description, setDescription] = useState('');
  const [habitType, setHabitType] = useState<HabitType>((params.habitType as HabitType) ?? 'good');
  const [goal, setGoal] = useState(params.goal ? parseInt(params.goal, 10) : 3);
  const [unit, setUnit] = useState(params.unit ? params.unit.charAt(0).toUpperCase() + params.unit.slice(1) : 'Count');
  const [step, setStep] = useState(params.step ? parseInt(params.step, 10) : 1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>((params.repeatMode as RepeatMode) ?? 'daily');
  const [repeatDays, setRepeatDays] = useState<number[]>(
    params.scheduleDays ? params.scheduleDays.split(',').map(Number) : ALL_DAYS
  );
  const [repeatTimesPerWeek, setRepeatTimesPerWeek] = useState(params.weeklyTarget ? parseInt(params.weeklyTarget, 10) : 3);
  const [repeatIntervalDays, setRepeatIntervalDays] = useState(params.intervalDays ? parseInt(params.intervalDays, 10) : 2);
  const [endsEnabled, setEndsEnabled] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => todayISO());
  const [endDate, setEndDate] = useState<string | null>(null);
  const [calendarFor, setCalendarFor] = useState<'start' | 'end' | null>(null);
  const [remindMe, setRemindMe] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempReminderDate, setTempReminderDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(9, 0, 0, 0); return d;
  });


  // ── Modal visibility ────────────────────────────────────────────────────────
  const [showColor, setShowColor] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
const [showGoal, setShowGoal] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);


  // ── Goal sub-state ──────────────────────────────────────────────────────────
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [tempGoalStr, setTempGoalStr] = useState(params.goal ?? '3');
  const [tempStepStr, setTempStepStr] = useState('1');
  const [unitSearch, setUnitSearch] = useState('');
  const [customUnit, setCustomUnit] = useState('');

  // ── Other temp state ────────────────────────────────────────────────────────
  const [tempDesc, setTempDesc] = useState('');


  // ── Derived ─────────────────────────────────────────────────────────────────
  const orderedDays = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);

  const repeatLabel =
    repeatMode === 'daily' ? t('form.everyDay') :
    repeatMode === 'specificDays' ? (repeatDays.length === 7 ? t('form.everyDay') : repeatDays.length === 0 ? t('form.never') : t('form.daysPerWeek', { count: repeatDays.length })) :
    repeatMode === 'timesPerWeek' ? t('repeat.timesPerWeekValue', { count: repeatTimesPerWeek }) :
    t('repeat.everyXDaysValue', { count: repeatIntervalDays });

  const repeatSummary =
    repeatMode === 'daily' ? t('repeat.summaryEveryDay') :
    repeatMode === 'specificDays' ? (repeatDays.length === 0 ? t('form.selectDaysMsg') : t('repeat.summaryOn', { days: orderedDays.filter(d => repeatDays.includes(d)).map(d => t(`day.${d}`)).join(', ') })) :
    repeatMode === 'timesPerWeek' ? t('repeat.summaryTimesPerWeek', { count: repeatTimesPerWeek }) :
    t('repeat.summaryEveryXDays', { count: repeatIntervalDays });

  const toggleDay = (d: number) =>
    setRepeatDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());

  const adjustGoal = (delta: number) =>
    setTempGoalStr(String(Math.max(1, (parseInt(tempGoalStr || '1', 10) || 1) + delta)));

  const adjustStep = (delta: number) =>
    setTempStepStr(String(Math.max(1, (parseInt(tempStepStr || '1', 10) || 1) + delta)));

  const openGoal = () => {
    setTempGoalStr(String(goal));
    setTempStepStr(String(step));
    setShowUnitPicker(false);
    setUnitSearch('');
    setShowGoal(true);
  };

  const saveGoal = () => {
    setGoal(Math.max(1, parseInt(tempGoalStr || '1', 10) || 1));
    setStep(Math.max(1, parseInt(tempStepStr || '1', 10) || 1));
    setShowGoal(false);
  };

  const selectUnit = (u: string) => {
    setUnit(u);
    setShowUnitPicker(false);
  };

  const filteredCategories = unitSearch.trim()
    ? UNIT_CATEGORIES.map((cat) => ({
        nameKey: cat.nameKey,
        units: cat.units.filter((u) => u.toLowerCase().includes(unitSearch.toLowerCase())),
      })).filter((cat) => cat.units.length > 0)
    : UNIT_CATEGORIES;

  // ── Date picker ─────────────────────────────────────────────────────────────
  const handleDateSelect = (iso: string) => {
    if (calendarFor === 'start') {
      setStartDate(iso);
      if (endDate && iso >= endDate) setEndDate(null);
      setCalendarFor(null);
    } else if (calendarFor === 'end') {
      if (iso <= startDate) {
        Alert.alert(t('form.invalidDate'), t('form.invalidDateMsg'));
        return;
      }
      setEndDate(iso);
      setCalendarFor(null);
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    const trimmed = title.trim();
    if (!trimmed) { Alert.alert(t('form.nameRequired'), t('form.nameRequiredMsg')); return; }
    setSaving(true);
    const isCountingHabit = habitType === 'track' || (habitType === 'todo' && goal > 1) || (habitType === 'good' && goal > 1);
    const habitId = generateId();
    const newHabit = {
      id: habitId,
      title: trimmed,
      icon,
      color,
      pointsPerCompletion: 10,
      scheduleDays: repeatMode === 'everyXDays' ? [] : repeatMode === 'timesPerWeek' ? ALL_DAYS : repeatDays.length > 0 ? repeatDays : ALL_DAYS,
      weeklyTarget: repeatMode === 'timesPerWeek' ? repeatTimesPerWeek : undefined,
      intervalDays: repeatMode === 'everyXDays' ? repeatIntervalDays : undefined,
      templateId: params.templateId,
      dailyTarget: isCountingHabit ? goal : undefined,
      unit: isCountingHabit ? unit : undefined,
      step: isCountingHabit ? step : undefined,
      createdAt: Date.now(),
      archived: false,
      description: description || undefined,
      habitType,
      startDate,
      endDate: endsEnabled && endDate ? endDate : undefined,
      healthKitType: params.healthKitType,
      remindMe: notificationsEnabled ? remindMe : false,
      reminderTime: notificationsEnabled && remindMe && defaultReminderSchedule === 'custom' ? reminderTime : undefined,
    };
    await saveHabit(newHabit);

    // Schedule notifications and calendar events, then save IDs back.
    const [notifIds, calIds] = await Promise.all([
      notificationsEnabled && remindMe ? scheduleHabitReminder(newHabit) : Promise.resolve([] as string[]),
      calendarIntegrationEnabled ? syncHabitCalendarEvents(newHabit, calendarEventType, true) : Promise.resolve([] as string[]),
    ]);
    if (notifIds.length > 0 || calIds.length > 0) {
      await saveHabit({
        ...newHabit,
        notificationIds: notifIds.length > 0 ? notifIds : undefined,
        calendarEventIds: calIds.length > 0 ? calIds : undefined,
      });
    }

    router.navigate('/');
  };

  const previewSubtitle = habitType === 'todo' ? t('form.previewTodo') : `${repeatLabel}, ${goal}`;

  return (
    <View style={[s.screen, { backgroundColor: theme.colors.background }]}>

      {/* ── Custom header ──────────────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.hdrBack}>
            <Text style={[s.hdrBackText, { color: theme.colors.textPrimary }]}>‹</Text>
          </Pressable>
          <Text style={[s.hdrTitle, { color: theme.colors.textPrimary }]}>{t('form.addHabit')}</Text>
          <Pressable onPress={handleSave} style={[s.hdrSave, { backgroundColor: color }]}>
            <Text style={s.hdrSaveText}>✓</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Preview card ──────────────────────────────────────────────── */}
        <View style={[s.previewCard, { backgroundColor: color }]}>
          <Text style={s.previewIcon}>{icon}</Text>
          <View style={s.previewMid}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('form.habitNameInput')}
              placeholderTextColor="rgba(255,255,255,0.55)"
              style={s.previewInput}
              maxLength={100}
            />
            <Text style={s.previewSub}>{previewSubtitle}</Text>
          </View>
          <Text style={s.previewPen}>✏️</Text>
        </View>
        <Text style={[s.charCount, { color: theme.colors.textSecondary }]}>{title.length}/100</Text>

        {/* ── Appearance ────────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: theme.colors.textSecondary }]}>{t('settings.appearance')}</Text>
        <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Row icon="🎨" label={t('form.color')} onPress={() => setShowColor(true)}
            rightNode={
              <View style={s.rowRight}>
                <View style={[s.colorDotSm, { backgroundColor: color }]} />
                <Text style={[s.chevronDown, { color: theme.colors.textSecondary }]}>⌄</Text>
              </View>
            }
          />
          <Row icon="🔣" label={t('form.icon')} onPress={() => setShowIcon(true)}
            rightNode={
              <View style={s.rowRight}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
                <Text style={[s.chevron, { color: theme.colors.textSecondary }]}>›</Text>
              </View>
            }
          />
          <Row icon="📄" label={t('form.description')} value={description || t('form.descriptionEmpty')}
            onPress={() => { setTempDesc(description); setShowDesc(true); }} isLast />
        </View>

        {/* ── General ───────────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: theme.colors.textSecondary }]}>{t('settings.general')}</Text>
        <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Row icon="🚩" label={t('form.goal')} value={`${goal}`} onPress={openGoal} />
          {habitType !== 'todo' && (
            <Row icon="🔁" label={t('form.repeat')} value={repeatLabel} onPress={() => setShowRepeat(true)} />
          )}
          {notificationsEnabled && (
            <>
              <Row
                icon="🔔"
                label={t('form.remindMe')}
                hint={t('form.remindMeHint')}
                rightNode={
                  <Switch
                    value={remindMe}
                    onValueChange={setRemindMe}
                    trackColor={{ false: theme.colors.border, true: color }}
                    thumbColor="#fff"
                  />
                }
              />
              {remindMe && defaultReminderSchedule === 'custom' && (
                <Row
                  icon="⏰"
                  label={t('form.reminderTimeLabel')}
                  onPress={() => {
                    const [h, m] = reminderTime.split(':');
                    const d = new Date(); d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                    setTempReminderDate(d);
                    setShowTimePicker(true);
                  }}
                  rightNode={
                    <View style={s.rowRight}>
                      <Text style={[s.rowValue, { color: theme.colors.textSecondary }]}>{reminderTime}</Text>
                      <Text style={[s.chevron, { color: theme.colors.textSecondary }]}>›</Text>
                    </View>
                  }
                />
              )}
            </>
          )}
          {/* Starts on */}
          <Row
            icon="📅"
            label={t('form.startsOn')}
            onPress={() => setCalendarFor('start')}
            rightNode={
              <View style={[s.datePill, { backgroundColor: color + '22' }]}>
                <Text style={[s.datePillText, { color }]}>{fmtDateStr(startDate)}</Text>
              </View>
            }
          />

          {/* Ends toggle */}
          <View style={s.row}>
            <Text style={s.rowIcon}>🗓</Text>
            <Text style={[s.rowLabel, { color: theme.colors.textPrimary }]}>{t('form.ends')}</Text>
            <Switch
              value={endsEnabled}
              onValueChange={(v) => {
                setEndsEnabled(v);
                if (v) {
                  if (!endDate) setEndDate(addDays(startDate, 30));
                  setCalendarFor('end');
                } else {
                  setEndDate(null);
                }
              }}
              trackColor={{ false: theme.colors.border, true: color }}
              thumbColor="#fff"
            />
          </View>

          {endsEnabled && endDate && (
            <Row
              icon="🏁"
              label={t('form.endsOn')}
              onPress={() => setCalendarFor('end')}
              rightNode={
                <View style={[s.datePill, { backgroundColor: color + '22' }]}>
                  <Text style={[s.datePillText, { color }]}>{fmtDateStr(endDate)}</Text>
                </View>
              }
              isLast
            />
          )}
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── Color Picker ────────────────────────────────────────────────── */}
      <Modal visible={showColor} transparent animationType="fade" onRequestClose={() => setShowColor(false)}>
        <Pressable style={s.overlay} onPress={() => setShowColor(false)}>
          <Pressable style={[s.colorCard, { backgroundColor: theme.colors.surface }]} onPress={() => {}}>
            <View style={s.colorGrid}>
              {HABIT_COLORS.map((c) => (
                <Pressable key={c} onPress={() => { setColor(c); setShowColor(false); }}
                  style={[s.colorDot, { backgroundColor: c }, color === c && { borderWidth: 3, borderColor: '#fff' }]}>
                  {color === c && <View style={s.colorCheck} />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Icon Picker ──────────────────────────────────────────────────── */}
      <Modal visible={showIcon} transparent animationType="slide" onRequestClose={() => setShowIcon(false)}>
        <View style={s.sheetWrap}>
          <Pressable style={s.overlay} onPress={() => setShowIcon(false)} />
          <View style={[s.sheet, { backgroundColor: theme.colors.surface }]}>
            <View style={s.handle} />
            <Text style={[s.sheetTitle, { color: theme.colors.textPrimary }]}>{t('form.icon')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.iconGrid}>
                {ALL_ICONS.map((ic) => (
                  <Pressable key={ic} onPress={() => { setIcon(ic); setShowIcon(false); }}
                    style={[s.iconCell, ic === icon && { backgroundColor: color + '30', borderRadius: 10 }]}>
                    <Text style={s.iconEmoji}>{ic}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Description ──────────────────────────────────────────────────── */}
      <Modal visible={showDesc} transparent animationType="slide" onRequestClose={() => setShowDesc(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetWrap}>
          <Pressable style={s.overlay} onPress={() => setShowDesc(false)} />
          <View style={[s.sheet, { backgroundColor: theme.colors.surface }]}>
            <View style={s.handle} />
            <Text style={[s.sheetTitle, { color: theme.colors.textPrimary }]}>{t('form.description')}</Text>
            <View style={[s.textBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <TextInput value={tempDesc} onChangeText={setTempDesc} multiline placeholder={t('form.description')}
                placeholderTextColor={theme.colors.textSecondary}
                style={[s.textBoxInput, { color: theme.colors.textPrimary }]}
                maxLength={4000} autoFocus />
            </View>
            <Text style={[s.hint, { color: theme.colors.textSecondary }]}>
              {t('form.descriptionHint')}{'   '}{tempDesc.length}/4,000
            </Text>
            <Pressable onPress={() => { setDescription(tempDesc); setShowDesc(false); }}
              style={[s.doneBtn, { backgroundColor: color }]}>
              <Text style={s.doneBtnText}>{t('form.done')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Goal (full-screen) ───────────────────────────────────────────── */}
      <Modal visible={showGoal} animationType="slide" onRequestClose={() => { if (showUnitPicker) setShowUnitPicker(false); else setShowGoal(false); }}>
        <View style={[s.fullScreen, { backgroundColor: theme.colors.background }]}>
          <View style={[s.goalHeader, { paddingTop: insets.top + 10, borderBottomColor: theme.colors.border }]}>
            <Pressable
              onPress={() => { if (showUnitPicker) setShowUnitPicker(false); else setShowGoal(false); }}
              hitSlop={12}
              style={s.goalHdrSide}
            >
              <Text style={[s.goalHdrCancel, { color: theme.colors.textSecondary }]}>
                {showUnitPicker ? `‹  ${t('form.goal')}` : t('form.cancel')}
              </Text>
            </Pressable>
            <Text style={[s.hdrTitle, { color: theme.colors.textPrimary }]}>
              {showUnitPicker ? t('form.unit') : t('form.goal')}
            </Text>
            <View style={[s.goalHdrSide, { alignItems: 'flex-end' }]}>
              {!showUnitPicker && (
                <Pressable onPress={saveGoal} hitSlop={12}>
                  <Text style={[s.goalHdrDone, { color: color }]}>{t('form.done')}</Text>
                </Pressable>
              )}
            </View>
          </View>

          {!showUnitPicker ? (
            /* ── Goal form ────────────────────────────────────────────── */
            <ScrollView contentContainerStyle={s.goalScroll}>

              {/* Goal / Unit / Step */}
              <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginHorizontal: 16 }]}>

                {/* Goal row */}
                <View style={[s.row, { paddingRight: 8 }]}>
                  <Text style={s.rowIcon}>🚩</Text>
                  <Text style={[s.rowLabel, { color: theme.colors.textPrimary }]}>{t('form.goal')}</Text>
                  <View style={s.stepperWrap}>
                    <View style={[s.stepperBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                      <TextInput
                        value={tempGoalStr}
                        onChangeText={setTempGoalStr}
                        keyboardType="number-pad"
                        style={[s.stepperInput, { color: theme.colors.textPrimary }]}
                        textAlign="center"
                      />
                    </View>
                    <View style={s.stepperBtns}>
                      <Pressable onPress={() => adjustGoal(1)} style={[s.stepDot, { backgroundColor: color }]}>
                        <Text style={s.stepDotText}>▲</Text>
                      </Pressable>
                      <Pressable onPress={() => adjustGoal(-1)} style={[s.stepDot, { backgroundColor: color }]}>
                        <Text style={s.stepDotText}>▼</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={[s.sep, { backgroundColor: theme.colors.border }]} />

                {/* Unit row */}
                <Pressable style={s.row} onPress={() => setShowUnitPicker(true)}>
                  <Text style={s.rowIcon}>📏</Text>
                  <Text style={[s.rowLabel, { color: theme.colors.textPrimary }]}>{t('form.unit')}</Text>
                  <View style={s.rowRight}>
                    <Text style={[s.rowValue, { color: theme.colors.textSecondary }]}>{unit}</Text>
                    <Text style={[s.chevron, { color: theme.colors.textSecondary }]}>›</Text>
                  </View>
                </Pressable>

                <View style={[s.sep, { backgroundColor: theme.colors.border }]} />

                {/* Step row */}
                <View style={[s.row, { paddingRight: 8 }]}>
                  <Text style={s.rowIcon}>➕</Text>
                  <Text style={[s.rowLabel, { color: theme.colors.textPrimary }]}>{t('form.step')}</Text>
                  <View style={[s.stepperBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                    <TextInput
                      value={tempStepStr}
                      onChangeText={setTempStepStr}
                      keyboardType="number-pad"
                      style={[s.stepperInput, { color: theme.colors.textPrimary }]}
                      textAlign="center"
                    />
                  </View>
                </View>
              </View>

              <Text style={[s.hint, { color: theme.colors.textSecondary, marginHorizontal: 20, marginTop: 8 }]}>
                {t('form.stepHint')}
              </Text>

              <View style={{ height: 40 }} />
            </ScrollView>
          ) : (
            /* ── Unit picker ──────────────────────────────────────────── */
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={s.goalScroll} keyboardShouldPersistTaps="handled">

                {/* Custom unit */}
                <Text style={[s.sectionLabel, { color: theme.colors.textSecondary }]}>{t('form.customUnitLabel')}</Text>
                <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginHorizontal: 16 }]}>
                  <View style={s.row}>
                    <View style={[s.customUnitIcon, { backgroundColor: '#2196F3' }]}>
                      <Text style={{ color: '#fff', fontSize: 14 }}>✏️</Text>
                    </View>
                    <TextInput
                      value={customUnit}
                      onChangeText={(v) => { setCustomUnit(v); }}
                      onSubmitEditing={() => { if (customUnit.trim()) selectUnit(customUnit.trim()); }}
                      placeholder={t('form.customUnitPlaceholder')}
                      placeholderTextColor={theme.colors.textSecondary}
                      style={[s.customUnitInput, { color: theme.colors.textPrimary }]}
                      returnKeyType="done"
                    />
                  </View>
                </View>

                {/* Category lists */}
                {filteredCategories.map((cat) => (
                  <View key={cat.nameKey}>
                    <Text style={[s.sectionLabel, { color: theme.colors.textSecondary }]}>{t(cat.nameKey)}</Text>
                    <View style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginHorizontal: 16 }]}>
                      {cat.units.map((u, idx) => (
                        <View key={u}>
                          <Pressable
                            onPress={() => selectUnit(u)}
                            style={({ pressed }: any) => [s.unitRow, { opacity: pressed ? 0.65 : 1 }]}
                          >
                            <Text style={[s.unitLabel, { color: theme.colors.textPrimary }]}>{u}</Text>
                            {unit === u && <Text style={[s.unitCheck, { color: color }]}>✓</Text>}
                          </Pressable>
                          {idx < cat.units.length - 1 && (
                            <View style={[s.sep, { backgroundColor: theme.colors.border }]} />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}

                <View style={{ height: 40 }} />
              </ScrollView>

              {/* Search bar */}
              <View style={[s.unitSearchBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
                <Text style={{ fontSize: 16, color: theme.colors.textSecondary, marginRight: 8 }}>🔍</Text>
                <TextInput
                  value={unitSearch}
                  onChangeText={setUnitSearch}
                  placeholder={t('form.searchUnit')}
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[s.unitSearchInput, { color: theme.colors.textPrimary }]}
                />
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>

      {/* ── Repeat ───────────────────────────────────────────────────────── */}
      <Modal visible={showRepeat} transparent animationType="slide" onRequestClose={() => setShowRepeat(false)}>
        <View style={s.sheetWrap}>
          <Pressable style={s.overlay} onPress={() => setShowRepeat(false)} />
          <View style={[s.sheet, { backgroundColor: theme.colors.surface }]}>
            <View style={s.handle} />
            <Text style={[s.sheetTitle, { color: theme.colors.textPrimary }]}>{t('form.repeat')}</Text>

            {/* 4 mode options */}
            {(['daily', 'specificDays', 'timesPerWeek', 'everyXDays'] as const).map((mode) => {
              const labels: Record<RepeatMode, string> = {
                daily: t('form.everyDay'),
                specificDays: t('form.specificDays'),
                timesPerWeek: t('form.timesPerWeek'),
                everyXDays: t('repeat.everyXDays'),
              };
              const active = repeatMode === mode;
              return (
                <Pressable key={mode} onPress={() => setRepeatMode(mode)} style={s.modeRow}>
                  <View style={[s.radioOuter, { borderColor: active ? color : theme.colors.border }]}>
                    {active && <View style={[s.radioInner, { backgroundColor: color }]} />}
                  </View>
                  <Text style={[s.modeLabel, { color: active ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                    {labels[mode]}
                  </Text>
                </Pressable>
              );
            })}

            {/* Sub-control for selected mode */}
            {repeatMode === 'specificDays' && (
              <View style={[s.daysRow, { marginTop: 16 }]}>
                {orderedDays.map((d) => (
                  <Pressable key={d} onPress={() => toggleDay(d)}
                    style={[s.dayCircle, repeatDays.includes(d) ? { backgroundColor: color } : { backgroundColor: theme.colors.surfaceRaised }]}>
                    <Text style={[s.dayLabel, { color: repeatDays.includes(d) ? '#fff' : theme.colors.textSecondary }]}>
                      {t(`day.${d}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {repeatMode === 'timesPerWeek' && (
              <View style={[s.repeatStepperRow, { marginTop: 16 }]}>
                <Pressable onPress={() => setRepeatTimesPerWeek((v) => Math.max(1, v - 1))}
                  style={[s.repeatStepBtn, { backgroundColor: color }]}>
                  <Text style={s.repeatStepBtnText}>−</Text>
                </Pressable>
                <Text style={[s.repeatStepValue, { color: theme.colors.textPrimary }]}>{repeatTimesPerWeek}</Text>
                <Pressable onPress={() => setRepeatTimesPerWeek((v) => Math.min(7, v + 1))}
                  style={[s.repeatStepBtn, { backgroundColor: color }]}>
                  <Text style={s.repeatStepBtnText}>+</Text>
                </Pressable>
              </View>
            )}
            {repeatMode === 'everyXDays' && (
              <View style={[s.repeatStepperRow, { marginTop: 16 }]}>
                <Pressable onPress={() => setRepeatIntervalDays((v) => Math.max(2, v - 1))}
                  style={[s.repeatStepBtn, { backgroundColor: color }]}>
                  <Text style={s.repeatStepBtnText}>−</Text>
                </Pressable>
                <Text style={[s.repeatStepValue, { color: theme.colors.textPrimary }]}>{repeatIntervalDays}</Text>
                <Pressable onPress={() => setRepeatIntervalDays((v) => Math.min(30, v + 1))}
                  style={[s.repeatStepBtn, { backgroundColor: color }]}>
                  <Text style={s.repeatStepBtnText}>+</Text>
                </Pressable>
              </View>
            )}

            {/* Live summary */}
            <Text style={[s.repeatSummary, { color: theme.colors.textSecondary }]}>{repeatSummary}</Text>

            <Pressable onPress={() => setShowRepeat(false)} style={[s.doneBtn, { backgroundColor: color, marginTop: 16 }]}>
              <Text style={s.doneBtnText}>{t('form.done')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Reminder Time picker ──────────────────────────────────────────── */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={[s.sheetWrap, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
          <Pressable style={s.overlay} onPress={() => setShowTimePicker(false)} />
          <View style={[s.sheet, { backgroundColor: theme.colors.surface }]}>
            <View style={s.handle} />
            <Text style={[s.sheetTitle, { color: theme.colors.textPrimary }]}>{t('form.reminderTimeLabel')}</Text>
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
              <Text style={[s.hint, { color: theme.colors.textSecondary, textAlign: 'center', marginVertical: 20 }]}>
                Time picker requires a dev build.
              </Text>
            )}
            <Pressable
              onPress={() => {
                const h = String(tempReminderDate.getHours()).padStart(2, '0');
                const m = String(tempReminderDate.getMinutes()).padStart(2, '0');
                setReminderTime(`${h}:${m}`);
                setShowTimePicker(false);
              }}
              style={[s.doneBtn, { backgroundColor: color, marginTop: 8 }]}
            >
              <Text style={s.doneBtnText}>{t('form.done')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Date picker modal (shared for start + end) ────────────────────── */}
      <CalendarPickerModal
        visible={calendarFor !== null}
        onClose={() => setCalendarFor(null)}
        selectedDate={calendarFor === 'start' ? startDate : (endDate ?? addDays(startDate, 30))}
        onSelect={handleDateSelect}
        accentColor={color}
        minDate={calendarFor === 'end' ? startDate : undefined}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1 },
  fullScreen: { flex: 1 },

  // Shared header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  goalHdrSide: { width: 80 },
  goalHdrCancel: { fontSize: 16 },
  goalHdrDone: { fontSize: 16, fontWeight: '700' },
  hdrBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(120,120,128,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  hdrBackText: { fontSize: 24, lineHeight: 30, marginTop: -2 },
  hdrTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  hdrSave: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hdrSaveText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Preview card
  previewCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 8,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  previewIcon: { fontSize: 28 },
  previewMid: { flex: 1 },
  previewInput: { color: '#fff', fontSize: 17, fontWeight: '700', padding: 0 },
  previewSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 2 },
  previewPen: { fontSize: 16 },
  charCount: { textAlign: 'right', fontSize: 12, marginTop: 4, marginRight: 20, marginBottom: 4 },

  // Scroll
  scroll: { paddingBottom: 60 },
  goalScroll: { paddingTop: 12, paddingBottom: 60 },

  // Section label
  sectionLabel: { fontSize: 13, fontWeight: '600', marginLeft: 20, marginBottom: 8, marginTop: 20 },

  // Card
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
  },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15 },
  rowHint: { fontSize: 12, lineHeight: 16 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 15 },
  chevron: { fontSize: 20 },
  chevronDown: { fontSize: 16, fontWeight: '600' },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 54 },

  // Color row
  colorDotSm: { width: 22, height: 22, borderRadius: 11 },

  // Date pill
  datePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  datePillText: { fontSize: 14, fontWeight: '500' },

  // Overlay
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },

  // Color picker popup
  colorCard: {
    position: 'absolute', top: '30%', left: 40, right: 40,
    borderRadius: 18, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  colorDot: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  colorCheck: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff' },

  // Bottom sheet
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 20, paddingBottom: 44, maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(120,120,128,0.35)',
    alignSelf: 'center', marginTop: 10, marginBottom: 18,
  },
  sheetTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  doneBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Icon picker
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 4, paddingBottom: 20 },
  iconCell: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 28 },

  // Text box
  textBox: { borderWidth: 1.5, borderRadius: 12, padding: 12, minHeight: 80 },
  textBoxInput: { fontSize: 15, lineHeight: 22, padding: 0 },
  hint: { fontSize: 12, lineHeight: 17 },


  // Goal screen — stepper
  stepperWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperBox: {
    width: 80, height: 40,
    borderWidth: 1.5, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperInput: { fontSize: 18, fontWeight: '600', width: '100%', textAlign: 'center', padding: 0 },
  stepperBtns: { flexDirection: 'column', gap: 4 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // Unit picker
  unitRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  unitLabel: { flex: 1, fontSize: 16 },
  unitCheck: { fontSize: 18, fontWeight: '700' },
  customUnitIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  customUnitInput: { flex: 1, fontSize: 15, padding: 0 },
  unitSearchBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  unitSearchInput: { flex: 1, fontSize: 15, padding: 0 },

  // Repeat
  modeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  modeLabel: { fontSize: 15, fontWeight: '500' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontSize: 12, fontWeight: '700' },
  repeatStepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  repeatStepBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  repeatStepBtnText: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '600' },
  repeatStepValue: { fontSize: 28, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  repeatSummary: { fontSize: 13, textAlign: 'center', marginTop: 14, marginBottom: 4, fontStyle: 'italic' },
});

// ─── Floating calendar modal styles ──────────────────────────────────────────
const calM = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  monthBtn: { paddingVertical: 4 },
  monthLabel: { fontSize: 17, fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: { padding: 4 },
  navText: { fontSize: 24, fontWeight: '300' },
  dayHeaders: { flexDirection: 'row', marginBottom: 4 },
  dayHeaderText: {
    flex: 1, textAlign: 'center',
    fontSize: 10, fontWeight: '600', letterSpacing: 0.3,
  },
  week: { flexDirection: 'row', marginBottom: 2 },
  dayCell: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 14 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  yearCell: { width: '25%', paddingVertical: 10, alignItems: 'center' },
  yearText: { fontSize: 15, fontWeight: '500' },
});
