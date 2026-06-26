import React, { useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Habit } from '../models/types';

const SCREEN_W = Dimensions.get('window').width;
const RING_SIZE = Math.min(SCREEN_W * 0.55, 220);
const STROKE = 18;

// ─── SVG progress ring ────────────────────────────────────────────────────────

function CounterRing({
  progress,
  color,
  count,
}: {
  progress: number;
  color: string;
  count: number;
}) {
  const r = (RING_SIZE - STROKE) / 2;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Ring */}
      <View style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          {/* Track */}
          <Circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color + '30'}
            strokeWidth={STROKE}
          />
          {/* Fill */}
          <Circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      {/* Center number */}
      <Text style={cm.bigNumber}>{count}</Text>
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  habit: Habit | null;
  count: number;
  onClose: () => void;
  onCountChange: (newCount: number) => void;
};

export function CounterModal({ visible, habit, count, onClose, onCountChange }: Props) {
  if (!habit) return null;

  const step = habit.step ?? 1;
  const goal = habit.dailyTarget ?? 1;
  const progress = goal > 0 ? count / goal : 0;
  const remaining = Math.max(goal - count, 0);
  const isComplete = count >= goal;

  // Auto-close after completing
  useEffect(() => {
    if (isComplete && visible) {
      const t = setTimeout(onClose, 650);
      return () => clearTimeout(t);
    }
  }, [isComplete, visible]);

  const increment = () => {
    if (!isComplete) onCountChange(Math.min(count + step, goal));
  };
  const decrement = () => {
    if (count > 0) onCountChange(Math.max(count - step, 0));
  };
  const completeAll = () => onCountChange(goal);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Dim overlay — tap to close */}
      <Pressable style={cm.overlay} onPress={onClose} />

      {/* Sheet */}
      <View style={cm.sheet}>
        {/* Handle */}
        <View style={cm.handle} />

        {/* Top bar */}
        <View style={cm.topBar}>
          <Pressable onPress={onClose} style={cm.closeBtn} hitSlop={10}>
            <Text style={cm.closeX}>✕</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Text style={cm.menuIcon}>📋</Text>
          <Text style={cm.menuDots}>···</Text>
        </View>

        {/* Habit header */}
        <View style={cm.habitHeader}>
          <Text style={cm.habitEmoji}>{habit.icon}</Text>
          <Text style={cm.habitTitle}>{habit.title}</Text>
          <Text style={cm.habitMeta}>To-do, {count}/{goal}</Text>
        </View>

        {/* Ring + side buttons */}
        <View style={cm.ringRow}>
          <Pressable
            onPress={decrement}
            disabled={count <= 0}
            style={[cm.sideBtn, cm.sideBtnOutline, { opacity: count <= 0 ? 0.25 : 1 }]}
          >
            <Text style={cm.sideBtnTextGray}>−</Text>
          </Pressable>

          <CounterRing progress={progress} color={habit.color} count={count} />

          <Pressable
            onPress={increment}
            disabled={isComplete}
            style={[cm.sideBtn, { backgroundColor: habit.color, opacity: isComplete ? 0.4 : 1 }]}
          >
            <Text style={cm.sideBtnTextWhite}>+</Text>
          </Pressable>
        </View>

        {/* Bottom button */}
        <Pressable
          onPress={isComplete ? onClose : completeAll}
          style={[cm.bottomBtn, { backgroundColor: habit.color }]}
        >
          <Text style={cm.bottomBtnText}>
            {isComplete ? '✓  Done!' : `+${remaining}`}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#F9F9FB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(60,60,67,0.3)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(60,60,67,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: { fontSize: 14, color: '#3C3C43', fontWeight: '600' },
  menuIcon: { fontSize: 18 },
  menuDots: { fontSize: 18, fontWeight: '700', color: '#3C3C43', letterSpacing: 1 },

  habitHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  habitEmoji: { fontSize: 36, marginBottom: 6 },
  habitTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', textAlign: 'center' },
  habitMeta: { fontSize: 15, color: '#8E8E93', marginTop: 4 },

  bigNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: '#1C1C1E',
    lineHeight: 80,
  },

  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },

  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(60,60,67,0.3)',
  },
  sideBtnTextGray: { fontSize: 28, fontWeight: '300', color: '#3C3C43', lineHeight: 32 },
  sideBtnTextWhite: { fontSize: 28, fontWeight: '300', color: '#fff', lineHeight: 32 },

  bottomBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
  },
  bottomBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
