import { NativeModules, Platform } from 'react-native';

const { HabitLiveActivityModule } = NativeModules;

interface StartParams {
  habitName: string;
  habitIcon: string;
  goalMinutes: number;
  habitColor: string;
}

export async function startLiveActivity(params: StartParams): Promise<string | null> {
  if (Platform.OS !== 'ios' || !HabitLiveActivityModule) return null;
  try {
    return await HabitLiveActivityModule.startActivity(params);
  } catch {
    return null;
  }
}

export async function updateLiveActivity(activityId: string, elapsedSeconds: number, isRunning: boolean): Promise<void> {
  if (Platform.OS !== 'ios' || !HabitLiveActivityModule || !activityId) return;
  try {
    await HabitLiveActivityModule.updateActivity(activityId, elapsedSeconds, isRunning);
  } catch {}
}

export async function endLiveActivity(activityId: string): Promise<void> {
  if (Platform.OS !== 'ios' || !HabitLiveActivityModule || !activityId) return;
  try {
    await HabitLiveActivityModule.endActivity(activityId);
  } catch {}
}
