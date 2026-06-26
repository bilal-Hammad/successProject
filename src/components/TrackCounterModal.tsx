import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Habit } from '../models/types';
import { AddNoteModal } from './AddNoteModal';

const SCREEN_W = Dimensions.get('window').width;
const RING_SIZE = Math.min(SCREEN_W * 0.58, 230);
const STROKE = 20;

// ─── Ring ────────────────────────────────────────────────────────────────────

function CountRing({ progress, color, count }: { progress: number; color: string; count: number }) {
  const r = (RING_SIZE - STROKE) / 2;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke={color + '28'} strokeWidth={STROKE} />
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
      <Text style={tc.bigNumber}>{count}</Text>
    </View>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  habit: Habit | null;
  count: number;
  date: string;
  onClose: () => void;
  onCountChange: (newCount: number) => void;
};

export function TrackCounterModal({ visible, habit, count, date, onClose, onCountChange }: Props) {
  const [noteVisible, setNoteVisible] = useState(false);
  // Track previous count for undo
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (visible) prevCountRef.current = count;
  }, [visible]);

  if (!habit) return null;

  const step = habit.step ?? 1;
  const goal = habit.dailyTarget ?? 1;
  const progress = goal > 0 ? count / goal : 0;
  const isComplete = count >= goal;
  const remaining = Math.max(goal - count, 0);

  const increment = () => {
    if (!isComplete) {
      prevCountRef.current = count;
      onCountChange(Math.min(count + step, goal));
    }
  };
  const decrement = () => {
    if (count > 0) {
      prevCountRef.current = count;
      onCountChange(Math.max(count - step, 0));
    }
  };
  const undo = () => onCountChange(prevCountRef.current);
  const reset = () => { prevCountRef.current = 0; onCountChange(0); };

  const bottomLabel = isComplete
    ? `✓  Done!`
    : `+${remaining} ${habit.unit ?? ''}`.trim();

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable style={tc.overlay} onPress={onClose} />

        <View style={tc.sheet}>
          {/* Handle */}
          <View style={tc.handle} />

          {/* Top bar */}
          <View style={tc.topBar}>
            <Pressable onPress={onClose} style={tc.closeBtn} hitSlop={10}>
              <Text style={tc.closeX}>✕</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => setNoteVisible(true)} hitSlop={10}>
              <Text style={tc.topIcon}>📋</Text>
            </Pressable>
            <Text style={tc.topIcon}>📈</Text>
            <Text style={[tc.topIcon, { fontWeight: '700', letterSpacing: 1 }]}>···</Text>
          </View>

          {/* Habit header */}
          <View style={tc.habitHeader}>
            {/* Blurred emoji glow */}
            <View style={[tc.emojiGlow, { backgroundColor: habit.color + '30' }]}>
              <Text style={tc.emojiGlowText}>{habit.icon}</Text>
            </View>
            <Text style={tc.habitTitle}>{habit.title}</Text>
            <Text style={tc.habitMeta}>
              Every day, {count}/{goal} {habit.unit ?? ''}
            </Text>
          </View>

          {/* Ring + side buttons */}
          <View style={tc.ringRow}>
            <Pressable
              onPress={decrement}
              disabled={count <= 0}
              style={[tc.sideBtn, tc.sideBtnOutline, { opacity: count <= 0 ? 0.25 : 1 }]}
            >
              <Text style={tc.sideBtnGray}>−</Text>
            </Pressable>

            <View style={tc.ringWrap}>
              <CountRing progress={progress} color={habit.color} count={count} />
              {/* Unit below number */}
              {habit.unit && (
                <Text style={tc.unitLabel}>{habit.unit}</Text>
              )}
            </View>

            <Pressable
              onPress={increment}
              disabled={isComplete}
              style={[tc.sideBtn, { backgroundColor: isComplete ? habit.color + '60' : habit.color }]}
            >
              <Text style={tc.sideBtnWhite}>+</Text>
            </Pressable>
          </View>

          {/* Bottom action bar */}
          <View style={tc.bottomBar}>
            {/* Skip */}
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={tc.bottomIcon}>⏩</Text>
            </Pressable>
            {/* Reset */}
            <Pressable onPress={reset} hitSlop={10}>
              <Text style={tc.bottomIcon}>✕</Text>
            </Pressable>
            {/* Undo */}
            <Pressable onPress={undo} hitSlop={10}>
              <Text style={tc.bottomIcon}>↩</Text>
            </Pressable>

            {/* Main action */}
            <Pressable
              onPress={isComplete ? onClose : increment}
              style={[tc.mainBtn, { backgroundColor: habit.color }]}
            >
              <Text style={tc.mainBtnText}>{bottomLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AddNoteModal
        visible={noteVisible}
        date={date}
        habitColor={habit.color}
        onClose={() => setNoteVisible(false)}
        onSave={() => {}}
      />
    </>
  );
}

const tc = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#F9F9FB',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
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
    gap: 12,
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
  topIcon: { fontSize: 20, color: '#3C3C43' },

  habitHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  emojiGlow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emojiGlowText: { fontSize: 32 },
  habitTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  habitMeta: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },

  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  ringWrap: {
    alignItems: 'center',
  },
  unitLabel: {
    marginTop: -8,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },

  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtnOutline: {
    borderWidth: 1.5,
    borderColor: 'rgba(60,60,67,0.3)',
    backgroundColor: 'transparent',
  },
  sideBtnGray: { fontSize: 28, fontWeight: '300', color: '#3C3C43', lineHeight: 32 },
  sideBtnWhite: { fontSize: 28, fontWeight: '300', color: '#fff', lineHeight: 32 },

  bigNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: '#1C1C1E',
    lineHeight: 80,
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  bottomIcon: {
    fontSize: 22,
    color: '#8E8E93',
  },
  mainBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
