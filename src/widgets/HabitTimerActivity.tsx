// Live Activities are iOS-only. Same exported shape as the .ios implementation
// so callers can import unconditionally without per-call-site platform checks.
//
// Must be .tsx, not .ts, even though this file has no JSX: Metro's platform
// resolution (metro-resolver's resolveSourceFile) iterates sourceExts as the
// OUTER loop and checks platform-specific-then-generic WITHIN each extension
// before moving to the next extension. This project's sourceExts order is
// ["ts","tsx",...] — .ts before .tsx — so when this file was named
// HabitTimerActivity.ts, Metro found this generic .ts file during the .ts
// pass and returned it immediately, never reaching the .tsx pass where
// HabitTimerActivity.ios.tsx actually lives. Confirmed by directly fetching
// and inspecting the real Metro bundle for platform=ios: it contained this
// stub's empty function bodies, not the real implementation, on every build
// throughout this entire feature's testing. Keeping both files on the same
// extension is what makes Metro's per-extension platform check work.
import type { HabitTimerSessionInput } from './HabitTimerActivity.types';

export function startHabitTimerActivity(_session: HabitTimerSessionInput): void {}

export function pauseHabitTimerActivity(_session: HabitTimerSessionInput, _pausedAt: Date): void {}

export function resumeHabitTimerActivity(_session: HabitTimerSessionInput): void {}

export function endHabitTimerActivity(): void {}
