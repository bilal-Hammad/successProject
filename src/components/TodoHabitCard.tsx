import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  icon: string;
  color: string;
  count: number;
  dailyTarget?: number;
  step?: number;
  completed: boolean;
  onBodyPress: () => void;
  onPlusPress: () => void;
};

export function TodoHabitCard({
  title, icon, color, count, dailyTarget, completed, onBodyPress, onPlusPress,
}: Props) {
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

  const metaText = dailyTarget ? `To-do, ${count}/${dailyTarget}` : 'To-do';
  const textColor = completed ? '#fff' : '#1C1C1E';
  const metaColor = completed ? 'rgba(255,255,255,0.8)' : '#8E8E93';

  return (
    // Outer View (not Pressable) — avoids nested-Pressable event propagation issues
    <View style={td.card}>
      {/* Pastel base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: 0.28, borderRadius: 14 }]} />
      {/* Progress fill */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: color, borderRadius: 14, width: progressWidth },
        ]}
      />

      {/* Content row — body press area + independent action button */}
      <View style={td.inner}>
        {/* Body: badge + icon + text — independent Pressable */}
        <Pressable
          onPress={onBodyPress}
          style={({ pressed }) => [td.bodyArea, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[td.badge, { color: completed ? 'rgba(255,255,255,0.7)' : '#8E8E93' }]}>📋</Text>
          <View style={td.titleRow}>
            <Text style={td.habitEmoji}>{icon}</Text>
            <View style={td.textCol}>
              <Text style={[td.title, { color: textColor }]} numberOfLines={1}>{title}</Text>
              <Text style={[td.meta, { color: metaColor }]}>{metaText}</Text>
            </View>
          </View>
        </Pressable>

        {/* Action button — sibling Pressable, completely independent */}
        <Pressable
          onPress={onPlusPress}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          style={td.actionWrap}
        >
          {completed ? (
            <View style={td.circleCompleted}>
              <Text style={td.checkmark}>✓</Text>
            </View>
          ) : (
            <View style={[td.circlePlus, { borderColor: color }]}>
              <Text style={[td.plus, { color }]}>+</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const CIRCLE = 46;

const td = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 80,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
  },
  bodyArea: {
    flex: 1,
    paddingLeft: 14,
    paddingTop: 8,
    paddingBottom: 12,
  },
  badge: {
    fontSize: 11,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  habitEmoji: {
    fontSize: 28,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  actionWrap: {
    marginLeft: 12,
  },
  circlePlus: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#1C1C1E',
    fontSize: 22,
    fontWeight: '700',
  },
  plus: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -2,
  },
});
