import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { HabitType } from '../models/types';
import { isTimeUnit } from '../logic/units';

export { isTimeUnit };

type Props = {
  title: string;
  icon: string;
  color: string;
  count: number;
  dailyTarget?: number;
  unit?: string;
  step?: number;
  completed: boolean;
  streak: number;
  habitType?: HabitType;
  onBodyPress: () => void;
  onActionPress: () => void;
};

export function GoodHabitCard({
  title, icon, color, count, dailyTarget, unit, completed,
  streak, habitType, onBodyPress, onActionPress,
}: Props) {
  const isTimer = isTimeUnit(unit);

  const progress = dailyTarget
    ? Math.min(count / dailyTarget, 1)
    : completed ? 1 : 0;

  const progressAnim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const textColor = completed ? '#fff' : '#1C1C1E';
  const metaColor = completed ? 'rgba(255,255,255,0.75)' : '#8E8E93';

  let subtitle = 'Every day';
  if (dailyTarget && unit) {
    subtitle = `Every day, ${count}/${dailyTarget} ${unit}`;
  } else if (dailyTarget) {
    subtitle = `Every day, ${count}/${dailyTarget}`;
  }

  return (
    // Outer View (not Pressable) — avoids nested-Pressable event propagation issues
    <View style={gc.card}>
      {/* Pastel base layer */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: color, opacity: 0.22, borderRadius: 16 },
        ]}
      />

      {/* Animated progress fill */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: color, borderRadius: 16, width: progressWidth },
        ]}
      />

      {/* Streak badge */}
      {streak > 0 && (
        <View style={gc.streakBadge}>
          <Text style={gc.streakText}>🔥 {streak}</Text>
        </View>
      )}

      {/* Content row — body press area + independent action button */}
      <View style={gc.inner}>
        {/* Body: icon + text — independent Pressable, no nesting issues */}
        <Pressable
          onPress={onBodyPress}
          style={({ pressed }) => [gc.bodyArea, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={gc.iconWrap}>
            <Text style={gc.icon}>{icon}</Text>
          </View>
          <View style={gc.textCol}>
            <Text style={[gc.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[gc.meta, { color: metaColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </Pressable>

        {/* Action button — sibling Pressable, completely independent */}
        <Pressable
          onPress={onActionPress}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          style={gc.actionWrap}
        >
          {completed ? (
            <View style={[gc.actionCircle, { backgroundColor: '#fff', borderColor: 'transparent' }]}>
              <Text style={[gc.actionIcon, { color: color, fontSize: 22 }]}>✓</Text>
            </View>
          ) : (
            <View style={[gc.actionCircle, { backgroundColor: 'transparent', borderColor: color, borderWidth: 2 }]}>
              <Text style={[gc.actionIcon, { color }]}>
                {isTimer ? '▶' : '+'}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const CIRCLE = 46;

const gc = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 76,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
  },
  bodyArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 28 },
  textCol: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  streakBadge: {
    position: 'absolute',
    top: 8,
    right: 68,
    zIndex: 2,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  actionWrap: {
    marginLeft: 12,
  },
  actionCircle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
});
