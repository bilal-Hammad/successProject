import { Text, HStack, VStack } from '@expo/ui/swift-ui';
import { createLiveActivity, type LiveActivityLayout, type LiveActivityEnvironment, type LiveActivity } from 'expo-widgets';
import type { HabitTimerActivityProps, HabitTimerSessionInput } from './HabitTimerActivity.types';

function habitTimerActivityLayout(
  props: HabitTimerActivityProps,
  environment: LiveActivityEnvironment
): LiveActivityLayout {
  'widget';

  // Native, OS-ticking countdown — Text(timerInterval:pauseTime:countsDown:) under the
  // hood. Once started, this ticks with zero JS involvement, including if the app is
  // backgrounded or killed. `pauseTime` only freezes the *display* — it does not stop
  // the underlying interval's clock, so resuming must shift `endDate` forward by the
  // paused duration (done by the caller via resumeHabitTimerActivity, not here).
  const countdown = (
    <Text
      timerInterval={{ lower: new Date(props.startDate), upper: new Date(props.endDate) }}
      pauseTime={props.pausedAt ? new Date(props.pausedAt) : undefined}
      countsDown
    />
  );

  return {
    banner: (
      <HStack spacing={12}>
        <Text>{props.habitIcon}</Text>
        <VStack alignment="leading">
          <Text>{props.habitName}</Text>
          {countdown}
        </VStack>
      </HStack>
    ),
    compactLeading: <Text>{props.habitIcon}</Text>,
    compactTrailing: countdown,
    minimal: <Text>{props.habitIcon}</Text>,
    expandedLeading: <Text>{props.habitIcon}</Text>,
    expandedTrailing: <Text>{props.habitName}</Text>,
    expandedBottom: countdown,
  };
}

const habitTimerActivityFactory = createLiveActivity<HabitTimerActivityProps>(
  'HabitTimerActivity',
  habitTimerActivityLayout
);

// At most one habit timer runs at a time in this app's UI (single TimerModal),
// so a module-level singleton mirrors that constraint rather than modeling a
// map of concurrent activities that can never actually occur. This singleton
// only holds for the lifetime of the current JS process, though — it's `null`
// again after a force-quit + relaunch even though the native Live Activity
// itself is still showing (ActivityKit state lives at the OS level, independent
// of our app's process). endHabitTimerActivity() below accounts for this.
let activeActivity: LiveActivity<HabitTimerActivityProps> | null = null;
let activeProps: HabitTimerActivityProps | null = null;

function endAllNativeInstances(): void {
  for (const instance of habitTimerActivityFactory.getInstances()) {
    instance.end('immediate');
  }
}

// Shared by pause/resume. Prefers the cached activeActivity reference, but
// that reference is only ever set by a .start() call within *this* JS
// process's lifetime — it does NOT survive a reload/relaunch, even though a
// paused/running session reconstructed from the persisted AsyncStorage
// record (see TimerModal's reopen-reconciliation effect) can be perfectly
// real and current. Without this fallback, pauseHabitTimerActivity/
// resumeHabitTimerActivity would silently no-op after any reload since the
// last real start() — exactly the bug found on 2026-07-16 (a "RESUME branch"
// log fired in TimerModal, then nothing, because activeActivity/activeProps
// were null here despite a real, correctly-reconstructed persisted session).
// getInstances() queries actual OS-level ActivityKit state instead of our
// in-memory bookkeeping, so it recovers correctly regardless of reloads.
function updateOrRecoverActivity(props: HabitTimerActivityProps): void {
  if (activeActivity) {
    activeActivity.update(props);
    activeProps = props;
    return;
  }

  const instances = habitTimerActivityFactory.getInstances();
  if (instances.length > 0) {
    console.log('[FORGE] LiveActivity: no cached reference — recovered', instances.length, 'instance(s) via getInstances()');
    for (const instance of instances) instance.update(props);
    activeActivity = instances[0];
    activeProps = props;
    return;
  }

  // Nothing exists at the OS level either — the native activity is truly
  // gone (dismissed, ended, or this session never actually started one).
  // Start fresh rather than silently doing nothing.
  console.log('[FORGE] LiveActivity: no existing instance found at all — starting fresh instead of updating');
  activeProps = props;
  activeActivity = habitTimerActivityFactory.start(props);
}

export function startHabitTimerActivity(session: HabitTimerSessionInput): void {
  console.log('[FORGE] LiveActivity: startHabitTimerActivity called for', session.habitName);
  try {
    // Defensively end any instance still alive at the OS level (e.g. left over
    // from a prior session the app never got to reconcile) so we never end up
    // with two simultaneous Live Activities of this type.
    endAllNativeInstances();
    activeProps = {
      habitName: session.habitName,
      habitIcon: session.habitIcon,
      habitColor: session.habitColor,
      startDate: session.startDate.toISOString(),
      endDate: session.endDate.toISOString(),
    };
    activeActivity = habitTimerActivityFactory.start(activeProps);
    console.log('[FORGE] LiveActivity: start() returned successfully');
  } catch (e) {
    console.warn('[FORGE] LiveActivity: start() threw —', e);
  }
}

// Freezes the displayed countdown at `pausedAt`. Does not change endDate —
// call resumeHabitTimerActivity to account for the paused duration.
export function pauseHabitTimerActivity(session: HabitTimerSessionInput, pausedAt: Date): void {
  console.log('[FORGE] LiveActivity: pauseHabitTimerActivity called for', session.habitName);
  try {
    updateOrRecoverActivity({
      habitName: session.habitName,
      habitIcon: session.habitIcon,
      habitColor: session.habitColor,
      startDate: session.startDate.toISOString(),
      endDate: session.endDate.toISOString(),
      pausedAt: pausedAt.toISOString(),
    });
    console.log('[FORGE] LiveActivity: pause update completed');
  } catch (e) {
    console.warn('[FORGE] LiveActivity: pause update() threw —', e);
  }
}

// session.endDate here is the already-shifted new end date (the caller is
// responsible for computing oldEndDate + pausedDurationMs) — pausedAt is
// omitted so the countdown resumes ticking.
export function resumeHabitTimerActivity(session: HabitTimerSessionInput): void {
  console.log('[FORGE] LiveActivity: resumeHabitTimerActivity called for', session.habitName);
  try {
    updateOrRecoverActivity({
      habitName: session.habitName,
      habitIcon: session.habitIcon,
      habitColor: session.habitColor,
      startDate: session.startDate.toISOString(),
      endDate: session.endDate.toISOString(),
    });
    console.log('[FORGE] LiveActivity: resume update completed');
  } catch (e) {
    console.warn('[FORGE] LiveActivity: resume update() threw —', e);
  }
}

// Uses getInstances() rather than the in-memory singleton alone, since this
// must also work when called from app-launch reconciliation after a
// force-quit — at which point activeActivity is null but the real native
// Live Activity may still be on the Lock Screen.
export function endHabitTimerActivity(): void {
  try {
    endAllNativeInstances();
  } catch (e) {
    console.warn('[FORGE] LiveActivity: end() threw —', e);
  }
  activeActivity = null;
  activeProps = null;
}
