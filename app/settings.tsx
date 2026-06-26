import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../src/i18n/LanguageContext';
import { useHabitStore } from '../src/store/useHabitStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useTheme } from '../src/theme/ThemeContext';

// Lazy-load DateTimePicker so the app doesn't crash if the pod isn't installed yet.
// After `npm install @react-native-community/datetimepicker && cd ios && pod install`,
// the native spinner will be available.
let DateTimePicker: React.ComponentType<any> | null = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch {}

// ─── Constants ────────────────────────────────────────────────────────────────

const LANG_OPTIONS = [
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
  { code: 'ar' as const, label: 'العربية', flag: '🇸🇦' },
  { code: 'tr' as const, label: 'Türkçe', flag: '🇹🇷' },
];

const WEEK_DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

// Common day-start times shown when native DateTimePicker is unavailable
const FALLBACK_TIMES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480];

function minutesToDate(mins: number): Date {
  const d = new Date();
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d;
}

function dateToMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function formatDayStart(mins: number): string {
  return dayjs().hour(Math.floor(mins / 60) % 24).minute(mins % 60).format('h:mm A');
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Text style={[s.sectionHeader, { color: theme.colors.textSecondary }]}>
      {label}
    </Text>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
        },
      ]}
    >
      {children}
    </View>
  );
}

type RowProps = {
  icon: string;
  iconBg: string;
  label: string;
  hint?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
};

function SettingRow({ icon, iconBg, label, hint, right, onPress, destructive, isLast }: RowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !right}
      style={({ pressed }) => [
        s.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
        { opacity: pressed && !!onPress ? 0.7 : 1 },
      ]}
    >
      <View style={[s.iconBox, { backgroundColor: iconBg }]}>
        <Text style={s.iconText}>{icon}</Text>
      </View>
      <View style={s.rowContent}>
        <Text style={[s.rowLabel, { color: destructive ? theme.colors.error : theme.colors.textPrimary }]}>
          {label}
        </Text>
        {hint ? (
          <Text style={[s.rowHint, { color: theme.colors.textSecondary }]}>{hint}</Text>
        ) : null}
      </View>
      {right ?? (onPress ? (
        <Text style={[s.chevron, { color: theme.colors.textDisabled }]}>›</Text>
      ) : null)}
    </Pressable>
  );
}

function ValueRow({ icon, iconBg, label, value, onPress, isLast }: {
  icon: string; iconBg: string; label: string; value: string;
  onPress?: () => void; isLast?: boolean;
}) {
  const theme = useTheme();
  return (
    <SettingRow
      icon={icon}
      iconBg={iconBg}
      label={label}
      isLast={isLast}
      onPress={onPress}
      right={
        <View style={s.valueRight}>
          <Text style={[s.valueText, { color: theme.colors.textSecondary }]}>{value}</Text>
          <Text style={[s.chevron, { color: theme.colors.textDisabled }]}>›</Text>
        </View>
      }
    />
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const theme = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const { habits, completions } = useHabitStore();
  const settings = useSettingsStore();
  const insets = useSafeAreaInsets();

  const [langSheetVisible, setLangSheetVisible] = useState(false);
  const [weekSheetVisible, setWeekSheetVisible] = useState(false);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(() => minutesToDate(settings.dayStartsAt));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openDayPicker = () => {
    setTempTime(minutesToDate(settings.dayStartsAt));
    setDayPickerVisible(true);
  };

  const handleDayStartDone = () => {
    settings.update({ dayStartsAt: dateToMinutes(tempTime) });
    setDayPickerVisible(false);
  };

  const handleExport = async () => {
    try {
      const payload = JSON.stringify({ habits, completions }, null, 2);
      await Share.share({
        message: payload,
        title: 'Momentum Export',
      });
    } catch {}
  };

  const handleFreshStart = () => {
    Alert.alert(
      t('settings.freshStartTitle'),
      t('settings.freshStartMsg'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.confirm'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@momentum/completions');
            await useHabitStore.getState().hydrate();
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      t('settings.deleteAllTitle'),
      t('settings.deleteAllMsg'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.confirm'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['@momentum/habits', '@momentum/completions']);
            await useHabitStore.getState().hydrate();
          },
        },
      ]
    );
  };

  const handleGetSupport = () => {
    Linking.openURL('mailto:support@momentum-app.com?subject=Momentum Support');
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: t('settings.shareMessage'),
        title: 'Momentum',
      });
    } catch {}
  };

  const langLabel = language === 'en' ? 'English' : language === 'ar' ? 'العربية' : 'Türkçe';
  const weekLabel = WEEK_DAY_NAMES[settings.weekStartsOn] ?? 'Monday';
  const dayStartLabel = formatDayStart(settings.dayStartsAt);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Appearance ──────────────────────────────────────────────────── */}
        <SectionHeader label={t('settings.appearance')} />
        <SectionCard>
          <SettingRow
            icon="◑"
            iconBg="#555"
            label={t('settings.appearanceMode')}
            isLast
            onPress={() => router.push('/settings-theme')}
            right={
              <View style={s.valueRight}>
                <Text style={[s.valueText, { color: theme.colors.textSecondary }]}>
                  {t(`theme.${theme.mode}`)}
                </Text>
                <Text style={[s.chevron, { color: theme.colors.textDisabled }]}>›</Text>
              </View>
            }
          />
        </SectionCard>

        {/* ── General ─────────────────────────────────────────────────────── */}
        <SectionHeader label={t('settings.general')} />
        <SectionCard>
          <SettingRow
            icon="🏅"
            iconBg="#FF9800"
            label={t('settings.badges')}
            isLast={false}
            right={
              <Switch
                value={settings.badgesEnabled}
                onValueChange={(v) => settings.update({ badgesEnabled: v })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <ValueRow
            icon="🕓"
            iconBg="#2196F3"
            label={t('settings.dayStartsAt')}
            value={dayStartLabel}
            isLast={false}
            onPress={openDayPicker}
          />
          <ValueRow
            icon="🌐"
            iconBg="#4CAF50"
            label={t('settings.language')}
            value={langLabel}
            isLast={false}
            onPress={() => setLangSheetVisible(true)}
          />
          <ValueRow
            icon="📅"
            iconBg="#3F51B5"
            label={t('settings.weekStartsOn')}
            value={weekLabel}
            isLast={false}
            onPress={() => setWeekSheetVisible(true)}
          />
          <SettingRow
            icon="📆"
            iconBg="#E53935"
            label={t('settings.enableFutureDates')}
            hint={t('settings.enableFutureDatesHint')}
            isLast
            right={
              <Switch
                value={settings.enableFutureDates}
                onValueChange={(v) => settings.update({ enableFutureDates: v })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </SectionCard>

        {/* ── Sounds ──────────────────────────────────────────────────────── */}
        <SectionHeader label={t('settings.sounds')} />
        <SectionCard>
          <SettingRow
            icon="🔊"
            iconBg="#00BCD4"
            label={t('settings.soundsEnabled')}
            isLast={false}
            right={
              <Switch
                value={settings.soundsEnabled}
                onValueChange={(v) => settings.update({ soundsEnabled: v })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <ValueRow
            icon="✅"
            iconBg="#4CAF50"
            label={t('settings.completionSound')}
            value={settings.completionSound}
            isLast={false}
            onPress={() =>
              Alert.alert(t('settings.completionSound'), t('settings.comingSoonBody'))
            }
          />
          <ValueRow
            icon="🔔"
            iconBg="#FF9800"
            label={t('settings.notificationsSound')}
            value={settings.notificationsSound}
            isLast
            onPress={() =>
              Alert.alert(t('settings.notificationsSound'), t('settings.comingSoonBody'))
            }
          />
        </SectionCard>

        {/* ── Data ────────────────────────────────────────────────────────── */}
        <SectionHeader label={t('settings.data')} />
        <SectionCard>
          <SettingRow
            icon="📦"
            iconBg="#6C63FF"
            label={t('settings.groups')}
            isLast={false}
            onPress={() => router.push('/settings-groups')}
          />
          <SettingRow
            icon="🌴"
            iconBg="#26A69A"
            label={t('settings.vacations')}
            isLast={false}
            onPress={() => router.push('/settings-vacations')}
          />
          <SettingRow
            icon="🏆"
            iconBg="#FFC107"
            label={t('settings.achievements')}
            isLast={false}
            onPress={() => router.push('/settings-achievements')}
          />
          <SettingRow
            icon="🗂"
            iconBg="#9C27B0"
            label={t('settings.archivedHabits')}
            isLast
            onPress={() => router.push('/settings-archived')}
          />
        </SectionCard>

        {/* ── Sync & Export ───────────────────────────────────────────────── */}
        <SectionHeader label={t('settings.syncExport')} />
        <SectionCard>
          <SettingRow
            icon="📋"
            iconBg="#00ACC1"
            label={t('settings.exportData')}
            isLast={false}
            onPress={handleExport}
          />
          <SettingRow
            icon="🔄"
            iconBg="#FF7043"
            label={t('settings.freshStart')}
            isLast={false}
            onPress={handleFreshStart}
          />
          <SettingRow
            icon="🗑"
            iconBg="#E53935"
            label={t('settings.deleteAllData')}
            destructive
            isLast
            onPress={handleDeleteAll}
          />
        </SectionCard>

        {/* ── Help & Support ──────────────────────────────────────────────── */}
        <SectionHeader label={t('settings.helpSupport')} />
        <SectionCard>
          <SettingRow
            icon="💬"
            iconBg="#2196F3"
            label={t('settings.getSupport')}
            isLast={false}
            onPress={handleGetSupport}
          />
          <SettingRow
            icon="🔗"
            iconBg="#4CAF50"
            label={t('settings.shareApp')}
            isLast
            onPress={handleShareApp}
          />
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Day Starts At picker sheet ───────────────────────────────────── */}
      <Modal
        visible={dayPickerVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setDayPickerVisible(false)}
      >
        <View style={s.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDayPickerVisible(false)} />
          <View style={[s.sheet, { backgroundColor: theme.colors.surface }]}>
            {/* header row */}
            <View style={[s.sheetHeader, { borderBottomColor: theme.colors.border }]}>
              <Pressable onPress={() => setDayPickerVisible(false)} hitSlop={12} style={s.sheetActionBtn}>
                <Text style={[s.sheetActionText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Text style={[s.sheetTitle, { color: theme.colors.textPrimary }]}>
                {t('settings.dayStartsAt')}
              </Text>
              <Pressable onPress={handleDayStartDone} hitSlop={12} style={s.sheetActionBtn}>
                <Text style={[s.sheetActionText, { color: theme.colors.primary, fontWeight: '700' }]}>Done</Text>
              </Pressable>
            </View>

            {/* Native spinner — available after npm install + pod install + rebuild */}
            {DateTimePicker ? (
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                is24Hour={false}
                locale="en_US"
                onChange={(_: any, date?: Date) => { if (date) setTempTime(date); }}
                style={{ backgroundColor: theme.colors.surface, height: 216 }}
                textColor={theme.mode === 'dark' ? '#fff' : '#000'}
              />
            ) : (
              // Fallback list when native picker not installed
              <ScrollView style={{ maxHeight: 216 }} showsVerticalScrollIndicator={false}>
                {FALLBACK_TIMES.map((mins) => {
                  const active = settings.dayStartsAt === mins;
                  const isLast = mins === FALLBACK_TIMES[FALLBACK_TIMES.length - 1];
                  return (
                    <Pressable
                      key={mins}
                      onPress={() => {
                        settings.update({ dayStartsAt: mins });
                        setDayPickerVisible(false);
                      }}
                      style={({ pressed }) => [
                        s.langRow,
                        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Text style={[s.langLabel, { color: theme.colors.textPrimary }]}>
                        {formatDayStart(mins)}
                      </Text>
                      {active && (
                        <View style={[s.radio, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
                          <Text style={s.radioCheck}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={{ height: Math.max(insets.bottom, 20) }} />
          </View>
        </View>
      </Modal>

      {/* ── Week Starts On picker sheet ──────────────────────────────────── */}
      <Modal
        visible={weekSheetVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setWeekSheetVisible(false)}
      >
        <View style={s.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setWeekSheetVisible(false)} />
          <View style={[s.sheet, { backgroundColor: theme.colors.surface }]}>
            <View style={[s.sheetHeader, { borderBottomColor: theme.colors.border }]}>
              <View style={{ width: 64 }} />
              <Text style={[s.sheetTitle, { color: theme.colors.textPrimary }]}>
                {t('settings.weekStartsOn')}
              </Text>
              <Pressable onPress={() => setWeekSheetVisible(false)} hitSlop={10} style={{ width: 64, alignItems: 'flex-end' }}>
                <Text style={[s.sheetClose, { color: theme.colors.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            {WEEK_DAY_NAMES.map((name, idx) => {
              const active = settings.weekStartsOn === idx;
              const isLast = idx === WEEK_DAY_NAMES.length - 1;
              return (
                <Pressable
                  key={name}
                  onPress={() => {
                    settings.update({ weekStartsOn: idx as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
                    setWeekSheetVisible(false);
                  }}
                  style={({ pressed }) => [
                    s.langRow,
                    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[s.langLabel, { color: theme.colors.textPrimary }]}>{name}</Text>
                  <View style={[
                    s.radio,
                    {
                      backgroundColor: active ? theme.colors.primary : 'transparent',
                      borderColor: active ? theme.colors.primary : theme.colors.textDisabled,
                    },
                  ]}>
                    {active && <Text style={s.radioCheck}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}

            <View style={{ height: Math.max(insets.bottom, 20) }} />
          </View>
        </View>
      </Modal>

      {/* ── Language picker bottom sheet ─────────────────────────────────── */}
      <Modal
        visible={langSheetVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setLangSheetVisible(false)}
      >
        <View style={s.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLangSheetVisible(false)} />
          <View style={[s.sheet, { backgroundColor: theme.colors.surface }]}>
            {/* header */}
            <View style={[s.sheetHeader, { borderBottomColor: theme.colors.border }]}>
              <View style={{ width: 32 }} />
              <Text style={[s.sheetTitle, { color: theme.colors.textPrimary }]}>
                {t('settings.selectLanguage')}
              </Text>
              <Pressable onPress={() => setLangSheetVisible(false)} hitSlop={10}>
                <Text style={[s.sheetClose, { color: theme.colors.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            {/* language options */}
            {LANG_OPTIONS.map(({ code, label, flag }, idx) => {
              const active = language === code;
              const isLast = idx === LANG_OPTIONS.length - 1;
              return (
                <Pressable
                  key={code}
                  onPress={() => { setLanguage(code); setLangSheetVisible(false); }}
                  style={({ pressed }) => [
                    s.langRow,
                    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={s.langFlag}>{flag}</Text>
                  <Text style={[s.langLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
                  <View style={[
                    s.radio,
                    {
                      backgroundColor: active ? theme.colors.primary : 'transparent',
                      borderColor: active ? theme.colors.primary : theme.colors.textDisabled,
                    },
                  ]}>
                    {active && <Text style={s.radioCheck}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}

            <View style={{ height: Math.max(insets.bottom, 20) }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.3,
  },

  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    minHeight: 54,
  },

  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 16 },

  rowContent: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowHint: { fontSize: 12, lineHeight: 16 },

  valueRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueText: { fontSize: 14 },
  chevron: { fontSize: 20, fontWeight: '300', marginRight: -4 },

  // ── Bottom sheets
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 4,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sheetClose: { fontSize: 17, fontWeight: '400', width: 32, textAlign: 'center' },
  sheetActionBtn: { width: 64 },
  sheetActionText: { fontSize: 15 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  langFlag: { fontSize: 22 },
  langLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCheck: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
