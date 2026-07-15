import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { Habit } from '../models/types';
import { AddNoteModal } from './AddNoteModal';
import { useLanguage } from '../i18n/LanguageContext';
import {
  startHabitTimerActivity,
  pauseHabitTimerActivity,
  resumeHabitTimerActivity,
  endHabitTimerActivity,
} from '../modules/HabitLiveActivity';
import {
  saveActiveTimerSession,
  clearActiveTimerSession,
  getActiveTimerSession,
  getValidActiveTimerSession,
} from '../data/activeTimerSession';

const SCREEN_W = Dimensions.get('window').width;
const RING_SIZE = Math.min(SCREEN_W * 0.62, 248);
const STROKE = 16;
const TICK_COUNT = 60;

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Clock ring ───────────────────────────────────────────────────────────────

function ClockRing({
  progress,
  color,
  elapsed,
}: {
  progress: number;
  color: string;
  elapsed: number;
}) {
  const r = (RING_SIZE - STROKE) / 2;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  const outerR = r + STROKE / 2 + 2;
  const innerMajorR = outerR - 10;
  const innerMinorR = outerR - 5;

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
    const major = i % 5 === 0;
    const x1 = cx + outerR * Math.cos(angle);
    const y1 = cy + outerR * Math.sin(angle);
    const innerR = major ? innerMajorR : innerMinorR;
    const x2 = cx + innerR * Math.cos(angle);
    const y2 = cy + innerR * Math.sin(angle);
    return { x1, y1, x2, y2, major };
  });

  const dotAngle = progress * 2 * Math.PI - Math.PI / 2;
  const dotX = cx + r * Math.cos(dotAngle);
  const dotY = cy + r * Math.sin(dotAngle);
  const DOT_R = STROKE / 2 + 1;

  return (
    <View
      style={{
        width: RING_SIZE + 28,
        height: RING_SIZE + 28,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg
        width={RING_SIZE + 28}
        height={RING_SIZE + 28}
        style={{ position: 'absolute' }}
      >
        {/* Track */}
        <Circle
          cx={(RING_SIZE + 28) / 2}
          cy={(RING_SIZE + 28) / 2}
          r={r}
          fill="none"
          stroke={color + '28'}
          strokeWidth={STROKE}
        />
        {/* Fill arc */}
        <Circle
          cx={(RING_SIZE + 28) / 2}
          cy={(RING_SIZE + 28) / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${(RING_SIZE + 28) / 2}, ${(RING_SIZE + 28) / 2})`}
        />
        {/* Tick marks */}
        {ticks.map((t, i) => {
          const offset = (RING_SIZE + 28 - RING_SIZE) / 2;
          return (
            <Line
              key={i}
              x1={t.x1 + offset}
              y1={t.y1 + offset}
              x2={t.x2 + offset}
              y2={t.y2 + offset}
              stroke={t.major ? 'rgba(60,60,67,0.35)' : 'rgba(60,60,67,0.18)'}
              strokeWidth={t.major ? 1.5 : 1}
              strokeLinecap="round"
            />
          );
        })}
        {/* Progress dot */}
        {progress > 0 && (
          <Circle
            cx={dotX + (RING_SIZE + 28 - RING_SIZE) / 2}
            cy={dotY + (RING_SIZE + 28 - RING_SIZE) / 2}
            r={DOT_R}
            fill={color}
          />
        )}
        {/* Start dot at 12 o'clock */}
        {progress === 0 && (
          <Circle
            cx={(RING_SIZE + 28) / 2}
            cy={(RING_SIZE + 28) / 2 - r}
            r={DOT_R}
            fill={color}
          />
        )}
      </Svg>

      {/* Live elapsed time */}
      <Text style={tm.bigTime}>{formatTime(elapsed)}</Text>
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  habit: Habit | null;
  elapsed: number; // seconds already logged
  date: string;
  onClose: () => void;
  onElapsedChange: (seconds: number) => void;
};

export function TimerModal({ visible, habit, elapsed, date, onClose, onElapsedChange }: Props) {
  const { t } = useLanguage();
  const [localElapsed, setLocalElapsed] = useState(elapsed);
  const [isRunning, setIsRunning] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startAtRef = useRef(0);
  const bgTimeRef = useRef(0);
  // Current end-of-timer date shown on the Live Activity — shifts forward on
  // each resume by the paused duration (see resumeHabitTimerActivity).
  const endDateRef = useRef<Date | null>(null);
  // Set while paused; used on resume to compute how long the pause lasted.
  const pausedAtRef = useRef<Date | null>(null);
  // Which habit's session endDateRef/pausedAtRef/intervalRef currently
  // describe. This component instance is reused across different habits
  // (the modal is always mounted, just toggled via `visible`), so this is
  // what lets us tell "these refs are stale, they're from a different habit"
  // apart from "these refs are this habit's still-active session."
  const activeHabitIdRef = useRef<string | null>(null);
  // Guards against a second concurrent reconciliation read if the modal's
  // visible prop were to toggle again before the first read resolves.
  const reconcilingRef = useRef(false);

  // On open: if this component instance is already tracking an active session
  // for this exact habit (activeHabitIdRef matches — e.g. the modal was simply
  // closed and reopened without the app ever backgrounding, so the interval
  // never stopped), there's nothing to reconstruct; existing state already
  // reflects reality.
  //
  // If the refs instead describe a *different* habit (its timer is still
  // running in the background — this modal instance is shared across habits),
  // detach from it locally without touching its actual session or Live
  // Activity, which keeps going untouched.
  //
  // Then check the persisted session (Step 5) for one belonging to *this*
  // habit and rebuild UI state from it — this is the case where the app was
  // backgrounded/killed and relaunched while this habit's timer kept running
  // via its Live Activity. If no matching session exists, fall back to the
  // original behavior of just syncing from the elapsed prop.
  useEffect(() => {
    if (!visible || !habit) return;
    if (activeHabitIdRef.current === habit.id) return;

    if (activeHabitIdRef.current !== null) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      endDateRef.current = null;
      pausedAtRef.current = null;
      activeHabitIdRef.current = null;
      setIsRunning(false);
    }

    if (reconcilingRef.current) return;
    reconcilingRef.current = true;
    setLocalElapsed(elapsed); // synchronous default while the async check below runs

    let cancelled = false;
    getActiveTimerSession()
      .then((session) => {
        if (cancelled) return;
        if (!session || session.habitId !== habit.id) return; // already defaulted above

        activeHabitIdRef.current = habit.id;
        endDateRef.current = new Date(session.endDate);

        if (session.isPaused && session.pausedAt != null) {
          pausedAtRef.current = new Date(session.pausedAt);
          const elapsedAtPause = Math.floor((session.pausedAt - session.startedAt) / 1000);
          setLocalElapsed(Math.min(Math.max(elapsedAtPause, 0), session.goalSeconds));
          setIsRunning(false);
        } else {
          pausedAtRef.current = null;
          startAtRef.current = session.startedAt;
          const currentElapsed = Math.floor((Date.now() - session.startedAt) / 1000);
          setLocalElapsed(Math.min(Math.max(currentElapsed, 0), session.goalSeconds));
          setIsRunning(true);
          intervalRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startAtRef.current) / 1000);
            setLocalElapsed(elapsed);
          }, 1000);
        }
      })
      .finally(() => {
        reconcilingRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [visible, habit?.id]); // intentionally omit elapsed — only sync on open

  // AppState: keep timer running in background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && isRunning) {
        bgTimeRef.current = Date.now();
      } else if (state === 'active' && isRunning && bgTimeRef.current) {
        const bgElapsed = Math.floor((Date.now() - bgTimeRef.current) / 1000);
        bgTimeRef.current = 0;
        setLocalElapsed((prev) => prev + bgElapsed);
      }
    });
    return () => sub.remove();
  }, [isRunning]);

  const startTimer = async () => {
    console.log('[FORGE] TIMER BUTTON TAPPED');
    try {
      if (!habit) {
        console.log('[FORGE] startTimer: habit is null/undefined — bailing before any Live Activity logic');
        return;
      }

      const isResumingOwnSession =
        activeHabitIdRef.current === habit.id && pausedAtRef.current && endDateRef.current;
      console.log(
        '[FORGE] startTimer: habit =', habit.id, habit.title,
        '| isResumingOwnSession =', !!isResumingOwnSession,
        '| activeHabitIdRef =', activeHabitIdRef.current
      );

      if (!isResumingOwnSession) {
        // Fresh start (not resuming our own paused session) — make sure we're
        // not about to silently kill and overwrite a different habit's timer
        // that's still active in the background. getValidActiveTimerSession
        // auto-clears (and returns null for) a session whose habit no longer
        // exists, so an orphaned record can never block a new start.
        const existingSession = await getValidActiveTimerSession();
        console.log(
          '[FORGE] startTimer: existingSession =',
          existingSession ? existingSession.habitId : null
        );
        if (existingSession && existingSession.habitId !== habit.id) {
          console.log(
            '[FORGE] startTimer: BLOCKED — another habit\'s session is active:',
            existingSession.habitId
          );
          Alert.alert(t('timer.anotherActiveTitle'), t('timer.anotherActiveMsg'));
          return;
        }
      }

      setIsRunning(true);
      const now = Date.now();
      startAtRef.current = now - localElapsed * 1000;
      activeHabitIdRef.current = habit.id;

      if (isResumingOwnSession && pausedAtRef.current && endDateRef.current) {
        // Resuming from a genuine pause — shift endDate forward by the paused
        // duration so the displayed remaining time doesn't jump (see Step 3 report).
        const pausedDurationMs = now - pausedAtRef.current.getTime();
        const newEndDate = new Date(endDateRef.current.getTime() + pausedDurationMs);
        endDateRef.current = newEndDate;
        pausedAtRef.current = null;
        console.log('[FORGE] startTimer: RESUME branch — calling resumeHabitTimerActivity, newEndDate =', newEndDate.toISOString());
        resumeHabitTimerActivity({
          habitName: habit.title,
          habitIcon: habit.icon ?? '⏱',
          habitColor: habit.color,
          startDate: new Date(startAtRef.current),
          endDate: newEndDate,
        });
        console.log('[FORGE] startTimer: resumeHabitTimerActivity call returned (back in TimerModal)');
        saveActiveTimerSession({
          habitId: habit.id,
          date,
          startedAt: startAtRef.current,
          endDate: newEndDate.getTime(),
          goalSeconds,
          isPaused: false,
          pausedAt: null,
        }).catch((e) => console.warn('[FORGE] startTimer: saveActiveTimerSession threw —', e));
      } else {
        // Fresh start (first start, or restarting after a full cancel/reset).
        const startDate = new Date(startAtRef.current);
        const endDate = new Date(startAtRef.current + goalSeconds * 1000);
        endDateRef.current = endDate;
        console.log(
          '[FORGE] startTimer: FRESH START branch — about to call startHabitTimerActivity',
          'typeof startHabitTimerActivity =', typeof startHabitTimerActivity,
          'startDate =', startDate.toISOString(),
          'endDate =', endDate.toISOString()
        );
        startHabitTimerActivity({
          habitName: habit.title,
          habitIcon: habit.icon ?? '⏱',
          habitColor: habit.color,
          startDate,
          endDate,
        });
        console.log('[FORGE] startTimer: startHabitTimerActivity call returned (back in TimerModal)');
        saveActiveTimerSession({
          habitId: habit.id,
          date,
          startedAt: startAtRef.current,
          endDate: endDate.getTime(),
          goalSeconds,
          isPaused: false,
          pausedAt: null,
        }).catch((e) => console.warn('[FORGE] startTimer: saveActiveTimerSession threw —', e));
      }
    } catch (e) {
      console.warn('[FORGE] startTimer: UNCAUGHT ERROR in handler —', e);
      throw e;
    }

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startAtRef.current) / 1000);
      setLocalElapsed(elapsed);
    }, 1000);
  };

  // The actual "Stop timer" button — pause with intent to resume later.
  const pauseTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    const now = new Date();
    pausedAtRef.current = now;
    if (habit && endDateRef.current) {
      pauseHabitTimerActivity(
        {
          habitName: habit.title,
          habitIcon: habit.icon ?? '⏱',
          habitColor: habit.color,
          startDate: new Date(startAtRef.current),
          endDate: endDateRef.current,
        },
        now
      );
      saveActiveTimerSession({
        habitId: habit.id,
        date,
        startedAt: startAtRef.current,
        endDate: endDateRef.current.getTime(),
        goalSeconds,
        isPaused: true,
        pausedAt: now.getTime(),
      }).catch(() => {});
    }
  };

  // Used by completion, reset, and manual decrement — this timer session is
  // over (as opposed to pauseTimer, which expects a later resume).
  const cancelTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    endHabitTimerActivity();
    endDateRef.current = null;
    pausedAtRef.current = null;
    activeHabitIdRef.current = null;
    clearActiveTimerSession().catch(() => {});
  };

  // Closing the modal only hides the UI — it does not cancel the timer. A
  // running/paused session (and its Live Activity) keeps going in the
  // background; reopening the modal for this habit reconstructs state from
  // it (see the reconciliation effect above).
  const handleClose = () => {
    onElapsedChange(localElapsed);
    onClose();
  };

  // Derived values — computed before early return so the useEffect below is always called
  const goalSeconds = habit ? (habit.dailyTarget ?? 0) * 60 : 0;
  const stepSeconds = habit ? (habit.step ?? 1) * 60 : 60;
  const progress = goalSeconds > 0 ? Math.min(localElapsed / goalSeconds, 1) : 0;
  const remainingMinutes = Math.max(Math.ceil((goalSeconds - localElapsed) / 60), 0);
  const isComplete = goalSeconds > 0 && localElapsed >= goalSeconds;

  // Auto-stop when goal reached — must stay before the early return (Rules of Hooks)
  useEffect(() => {
    if (isComplete && isRunning) {
      cancelTimer();
      onElapsedChange(goalSeconds);
    }
  }, [isComplete, isRunning]);

  if (!habit) return null;

  const handleAddStep = () => {
    const next = Math.min(localElapsed + stepSeconds, goalSeconds);
    setLocalElapsed(next);
    onElapsedChange(next);
  };

  const handleCompleteAll = () => {
    cancelTimer();
    setLocalElapsed(goalSeconds);
    onElapsedChange(goalSeconds);
  };

  const handleReset = () => {
    cancelTimer();
    setLocalElapsed(0);
    onElapsedChange(0);
  };

  const handleDecrement = () => {
    const next = Math.max(localElapsed - stepSeconds, 0);
    cancelTimer();
    setLocalElapsed(next);
    onElapsedChange(next);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <Pressable style={tm.overlay} onPress={handleClose} />

        <View style={tm.sheet}>
          {/* Handle */}
          <View style={tm.handle} />

          {/* Top bar */}
          <View style={tm.topBar}>
            <Pressable onPress={handleClose} style={tm.closeBtn} hitSlop={10}>
              <Text style={tm.closeX}>✕</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Text style={tm.topIcon}>☀️</Text>
            <Pressable onPress={() => setNoteVisible(true)} hitSlop={10}>
              <Text style={tm.topIcon}>📋</Text>
            </Pressable>
            <Text style={tm.topIcon}>📈</Text>
            <Text style={[tm.topIcon, { fontWeight: '700', letterSpacing: 1 }]}>···</Text>
          </View>

          {/* Habit header */}
          <View style={tm.habitHeader}>
            <Text style={tm.habitTitle}>{habit.title}</Text>
            <Text style={tm.habitMeta}>
              Every day, {formatTime(localElapsed)}/{habit.dailyTarget ?? 0} {habit.unit ?? 'minutes'}
            </Text>
          </View>

          {/* Clock ring + side buttons */}
          <View style={tm.ringRow}>
            <Pressable
              onPress={handleDecrement}
              disabled={localElapsed <= 0}
              style={[tm.sideBtn, tm.sideBtnOutline, { opacity: localElapsed <= 0 ? 0.25 : 1 }]}
            >
              <Text style={tm.sideBtnGray}>−</Text>
            </Pressable>

            <ClockRing progress={progress} color={habit.color} elapsed={localElapsed} />

            <Pressable
              onPress={handleAddStep}
              disabled={isComplete}
              style={[tm.sideBtn, { backgroundColor: isComplete ? habit.color + '60' : habit.color }]}
            >
              <Text style={tm.sideBtnWhite}>+</Text>
            </Pressable>
          </View>

          {/* Bottom action bar */}
          <View style={tm.bottomBar}>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Text style={tm.bottomIcon}>⏩</Text>
            </Pressable>
            <Pressable onPress={handleReset} hitSlop={10}>
              <Text style={tm.bottomIcon}>✕</Text>
            </Pressable>
            <Pressable onPress={handleDecrement} hitSlop={10}>
              <Text style={tm.bottomIcon}>↩</Text>
            </Pressable>

            <Pressable
              onPress={isComplete ? handleClose : handleCompleteAll}
              style={[tm.mainBtn, { backgroundColor: habit.color }]}
            >
              <Text style={tm.mainBtnText}>
                {isComplete ? '✓  Done!' : `+${remainingMinutes} ${habit.unit ?? 'minutes'}`}
              </Text>
            </Pressable>
          </View>

          {/* Start / Stop timer */}
          <Pressable
            onPress={isRunning ? pauseTimer : startTimer}
            style={[
              tm.startBtn,
              { backgroundColor: isRunning ? '#FF3B30' : habit.color },
            ]}
          >
            <Text style={tm.startBtnText}>
              {isRunning ? '⏹  Stop timer' : '▶  Start timer'}
            </Text>
          </Pressable>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const tm = StyleSheet.create({
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
  habitTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  habitMeta: { fontSize: 15, color: '#8E8E93', marginTop: 4 },

  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 10,
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

  bigTime: {
    fontSize: 60,
    fontWeight: '800',
    color: '#1C1C1E',
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 14,
  },
  bottomIcon: { fontSize: 22, color: '#8E8E93' },
  mainBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  startBtn: {
    marginHorizontal: 20,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
