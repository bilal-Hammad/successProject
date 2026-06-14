import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  title: string;
  icon: string;
  color: string;
  points: number;
  streak: number;
  completed: boolean;
  dailyTarget?: number;
  unit?: string;
  count?: number;
  onPress: () => void;
  onDecrement?: () => void;
};

export function HabitCard({
  title, icon, color, points, streak, completed,
  dailyTarget, unit, count = 0, onPress, onDecrement,
}: Props) {
  const theme = useTheme();
  const { t } = useLanguage();

  const isCounting = !!dailyTarget;
  const progress = isCounting ? Math.min(count / dailyTarget, 1) : completed ? 1 : 0;
  const progressLabel = isCounting
    ? `${count}/${dailyTarget}${unit ? ' ' + unit : ''}`
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: completed ? color + '55' : theme.colors.border,
          borderRadius: theme.radius.lg,
          marginBottom: theme.spacing.sm,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {/* Left color accent stripe */}
      <View style={[styles.accent, { backgroundColor: color, borderTopLeftRadius: theme.radius.lg, borderBottomLeftRadius: theme.radius.lg }]} />

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.topRow}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: color + '22', borderRadius: theme.radius.md }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          {/* Title + meta */}
          <View style={styles.info}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.metaRow}>
              {progressLabel ? (
                <Text style={[styles.meta, { color: completed ? color : theme.colors.textSecondary }]}>
                  {progressLabel}
                </Text>
              ) : (
                <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                  +{points} {t('points.pts')}
                </Text>
              )}
            </View>
          </View>

          {/* Right side */}
          <View style={styles.right}>
            {streak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: theme.colors.warning + '22' }]}>
                <Text style={[styles.streakText, { color: theme.colors.warning }]}>
                  🔥 {streak}
                </Text>
              </View>
            )}

            <View style={styles.checkRow}>
              {/* Decrement button for counting habits */}
              {isCounting && count > 0 && onDecrement && (
                <Pressable
                  onPress={onDecrement}
                  hitSlop={10}
                  style={[styles.decrementBtn, { borderColor: theme.colors.border, borderRadius: theme.radius.full }]}
                >
                  <Text style={[styles.decrementText, { color: theme.colors.textSecondary }]}>−</Text>
                </Pressable>
              )}

              {/* Check circle — shows count number when incomplete, checkmark when done */}
              <View
                style={[
                  styles.check,
                  {
                    borderColor: completed ? color : theme.colors.border,
                    backgroundColor: completed ? color : 'transparent',
                    borderRadius: theme.radius.full,
                  },
                ]}
              >
                {completed ? (
                  <Text style={styles.checkMark}>✓</Text>
                ) : isCounting && count > 0 ? (
                  <Text style={[styles.countNum, { color: theme.colors.textPrimary }]}>{count}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Progress bar for counting habits */}
        {isCounting && (
          <View style={[styles.barTrack, { backgroundColor: theme.colors.border, borderRadius: theme.radius.full }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${progress * 100}%` as any,
                  backgroundColor: color,
                  borderRadius: theme.radius.full,
                },
              ]}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accent: {
    width: 5,
  },
  body: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 21,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  streakBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  decrementBtn: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decrementText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  check: {
    width: 26,
    height: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  countNum: {
    fontSize: 11,
    fontWeight: '800',
  },
  barTrack: {
    height: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
  },
});
