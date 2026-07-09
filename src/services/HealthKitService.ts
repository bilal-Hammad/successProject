import {
  isHealthDataAvailable,
  requestAuthorization,
  queryStatisticsForQuantity,
  queryQuantitySamples,
  queryCategorySamples,
  queryWorkoutSamples,
  getMostRecentQuantitySample,
  WorkoutActivityType,
  CategoryValueSleepAnalysis,
  CategoryValueAppleStandHour,
} from '@kingstinct/react-native-healthkit';
import type { QuantityTypeIdentifier, CategoryTypeIdentifier } from '@kingstinct/react-native-healthkit';
import { isDevice } from 'expo-device';

console.log('[FORGE] HealthKit: isDevice =', isDevice, '| isHealthDataAvailable =', isHealthDataAvailable());

export const isHealthKitAvailable = (): boolean => isHealthDataAvailable();

// ─── Workout activity type mapping ────────────────────────────────────────────

const WORKOUT_ACTIVITY_MAP: Record<string, WorkoutActivityType> = {
  HKWorkoutActivityTypeRunning:                      WorkoutActivityType.running,
  HKWorkoutActivityTypeCycling:                      WorkoutActivityType.cycling,
  HKWorkoutActivityTypeSwimming:                     WorkoutActivityType.swimming,
  HKWorkoutActivityTypeDownhillSkiing:               WorkoutActivityType.downhillSkiing,
  HKWorkoutActivityTypeYoga:                         WorkoutActivityType.yoga,
  HKWorkoutActivityTypeDance:                        WorkoutActivityType.dance,
  HKWorkoutActivityTypePilates:                      WorkoutActivityType.pilates,
  HKWorkoutActivityTypeTennis:                       WorkoutActivityType.tennis,
  HKWorkoutActivityTypeTraditionalStrengthTraining:  WorkoutActivityType.traditionalStrengthTraining,
  HKWorkoutActivityTypeBoxing:                       WorkoutActivityType.boxing,
};

export const WORKOUT_TYPES = new Set(Object.keys(WORKOUT_ACTIVITY_MAP));

// ─── Permission helper ────────────────────────────────────────────────────────

function getReadPermissionsFor(hkType: string): string[] {
  if (WORKOUT_TYPES.has(hkType)) return ['HKWorkoutTypeIdentifier'];
  if (hkType === 'HKCorrelationTypeIdentifierBloodPressure') {
    return [
      'HKQuantityTypeIdentifierBloodPressureSystolic',
      'HKQuantityTypeIdentifierBloodPressureDiastolic',
    ];
  }
  if (hkType === 'HKQuantityTypeIdentifierDietaryAlcohol') return []; // not in library
  return [hkType];
}

// ─── Permission result type ───────────────────────────────────────────────────

export type HKPermResult = { ok: true } | { ok: false; reason: string };

// ─── Request permission for a single healthKitType ────────────────────────────

export async function requestHealthKitPermission(hkType: string): Promise<HKPermResult> {
  if (!isHealthKitAvailable()) {
    const reason = isDevice
      ? 'HealthKit is not available. Ensure this is a development build (npx expo run:ios).'
      : 'HealthKit is not available in the iOS Simulator. Run on a real iPhone.';
    return { ok: false, reason };
  }

  const perms = getReadPermissionsFor(hkType);
  if (perms.length === 0) {
    return { ok: false, reason: `HealthKit type "${hkType}" is not supported by this version of the library.` };
  }

  console.log('[FORGE] HealthKit: requestAuthorization for', hkType, '→ perms:', perms.join(', '));
  await requestAuthorization({ toRead: perms as any });
  console.log('[FORGE] HealthKit: authorization request complete');
  return { ok: true };
}

// ─── Init HealthKit permissions for all linked habits ─────────────────────────

export async function initForHabits(hkTypes: string[]): Promise<void> {
  if (!isHealthKitAvailable()) return;

  const readSet = new Set<string>();
  for (const hkType of hkTypes) {
    for (const perm of getReadPermissionsFor(hkType)) {
      readSet.add(perm);
    }
  }
  if (readSet.size === 0) return;

  console.log('[FORGE] HealthKit: initForHabits — requesting', readSet.size, 'permissions:', [...readSet].join(', '));
  await requestAuthorization({ toRead: [...readSet] as any });
  console.log('[FORGE] HealthKit: initForHabits complete');
}

// ─── Read today's value for a given HealthKit type ────────────────────────────

export async function readTodayValue(hkType: string): Promise<number> {
  if (!isHealthKitAvailable()) return 0;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = now;
  const dateFilter = { date: { startDate, endDate } };

  try {
    // ── Cumulative quantities ──────────────────────────────────────────────────

    if (hkType === 'HKQuantityTypeIdentifierStepCount') {
      const r = await queryStatisticsForQuantity(
        hkType as QuantityTypeIdentifier,
        ['cumulativeSum'],
        { filter: dateFilter },
      );
      const val = Math.round(r.sumQuantity?.quantity ?? 0);
      console.log('[FORGE] HealthKit: steps =', val);
      return val;
    }

    if (hkType === 'HKQuantityTypeIdentifierActiveEnergyBurned') {
      const r = await queryStatisticsForQuantity(
        hkType as QuantityTypeIdentifier,
        ['cumulativeSum'],
        { filter: dateFilter },
      );
      const val = Math.round(r.sumQuantity?.quantity ?? 0);
      console.log('[FORGE] HealthKit: active energy =', val, 'kcal');
      return val;
    }

    if (hkType === 'HKQuantityTypeIdentifierFlightsClimbed') {
      const r = await queryStatisticsForQuantity(
        hkType as QuantityTypeIdentifier,
        ['cumulativeSum'],
        { filter: dateFilter },
      );
      const val = Math.round(r.sumQuantity?.quantity ?? 0);
      console.log('[FORGE] HealthKit: flights climbed =', val);
      return val;
    }

    if (hkType === 'HKQuantityTypeIdentifierDietaryWater') {
      // canonical unit: mL — habit goal is in mL, no conversion needed
      const r = await queryStatisticsForQuantity(
        hkType as QuantityTypeIdentifier,
        ['cumulativeSum'],
        { filter: dateFilter },
      );
      const val = Math.round(r.sumQuantity?.quantity ?? 0);
      console.log('[FORGE] HealthKit: water =', val, 'mL');
      return val;
    }

    if (hkType === 'HKQuantityTypeIdentifierDietaryCaffeine') {
      // canonical unit: g — habit unit is mg, multiply by 1000
      const r = await queryStatisticsForQuantity(
        hkType as QuantityTypeIdentifier,
        ['cumulativeSum'],
        { filter: dateFilter },
      );
      const grams = r.sumQuantity?.quantity ?? 0;
      const mg = Math.round(grams * 1000);
      console.log('[FORGE] HealthKit: caffeine =', mg, 'mg (', grams.toFixed(3), 'g)');
      return mg;
    }

    if (hkType === 'HKQuantityTypeIdentifierDietaryAlcohol') {
      // DietaryAlcohol is not in @kingstinct/react-native-healthkit — return 0
      console.log('[FORGE] HealthKit: DietaryAlcohol not supported by library — returning 0');
      return 0;
    }

    // ── Point-in-time measurements ─────────────────────────────────────────────

    if (hkType === 'HKQuantityTypeIdentifierBodyMass') {
      // canonical unit: kg
      const s = await getMostRecentQuantitySample(hkType as QuantityTypeIdentifier);
      const val = s ? Math.round(s.quantity) : 0;
      console.log('[FORGE] HealthKit: body mass =', val, 'kg');
      return val;
    }

    if (hkType === 'HKQuantityTypeIdentifierLeanBodyMass') {
      // canonical unit: kg
      const s = await getMostRecentQuantitySample(hkType as QuantityTypeIdentifier);
      const val = s ? Math.round(s.quantity) : 0;
      console.log('[FORGE] HealthKit: lean body mass =', val, 'kg');
      return val;
    }

    if (hkType === 'HKQuantityTypeIdentifierBodyFatPercentage') {
      // canonical unit: % (0–100)
      const s = await getMostRecentQuantitySample(hkType as QuantityTypeIdentifier);
      const val = s ? Math.round(s.quantity) : 0;
      console.log('[FORGE] HealthKit: body fat =', val, '%');
      return val;
    }

    if (hkType === 'HKQuantityTypeIdentifierHeight') {
      // canonical unit: m — habit unit is cm, multiply by 100
      const s = await getMostRecentQuantitySample(hkType as QuantityTypeIdentifier);
      const val = s ? Math.round(s.quantity * 100) : 0;
      console.log('[FORGE] HealthKit: height =', val, 'cm (raw:', s?.quantity, 'm)');
      return val;
    }

    if (hkType === 'HKQuantityTypeIdentifierBloodGlucose') {
      // canonical unit: mg/dL — return 1 if any sample exists today (habit goal = 1)
      const samples = await queryQuantitySamples(
        hkType as QuantityTypeIdentifier,
        { filter: dateFilter, limit: 1 } as any,
      );
      const val = samples.length > 0 ? 1 : 0;
      console.log('[FORGE] HealthKit: blood glucose samples today =', samples.length, '→', val);
      return val;
    }

    // ── Category types ─────────────────────────────────────────────────────────

    if (hkType === 'HKCategoryTypeIdentifierSleepAnalysis') {
      const samples = await queryCategorySamples(
        hkType as CategoryTypeIdentifier,
        { filter: dateFilter, limit: -1 },
      );
      // Filter for true sleep (asleep, core, deep, REM) — exclude inBed (0) and awake (2)
      const sleepSamples = samples.filter(
        (s) => s.value !== CategoryValueSleepAnalysis.inBed &&
               s.value !== CategoryValueSleepAnalysis.awake,
      );
      const totalMs = sleepSamples.reduce((sum, s) => {
        const start = s.startDate instanceof Date ? s.startDate : new Date(s.startDate);
        const end = s.endDate instanceof Date ? s.endDate : new Date(s.endDate);
        return sum + (end.getTime() - start.getTime());
      }, 0);
      const hours = Math.round(totalMs / 3_600_000);
      console.log('[FORGE] HealthKit: sleep =', hours, 'h (', sleepSamples.length, '/', samples.length, 'sleep samples)');
      return hours;
    }

    if (hkType === 'HKCategoryTypeIdentifierMindfulSession') {
      const samples = await queryCategorySamples(
        hkType as CategoryTypeIdentifier,
        { filter: dateFilter, limit: -1 },
      );
      const totalMs = samples.reduce((sum, s) => {
        const start = s.startDate instanceof Date ? s.startDate : new Date(s.startDate);
        const end = s.endDate instanceof Date ? s.endDate : new Date(s.endDate);
        return sum + (end.getTime() - start.getTime());
      }, 0);
      const minutes = Math.round(totalMs / 60_000);
      console.log('[FORGE] HealthKit: mindful session =', minutes, 'min');
      return minutes;
    }

    if (hkType === 'HKCategoryTypeIdentifierAppleStandHour') {
      const samples = await queryCategorySamples(
        hkType as CategoryTypeIdentifier,
        { filter: dateFilter, limit: -1 },
      );
      const stoodCount = samples.filter((s) => s.value === CategoryValueAppleStandHour.stood).length;
      console.log('[FORGE] HealthKit: stand hours =', stoodCount, '(', samples.length, 'total samples)');
      return stoodCount;
    }

    if (hkType === 'HKCategoryTypeIdentifierHandwashingEvent') {
      const samples = await queryCategorySamples(
        hkType as CategoryTypeIdentifier,
        { filter: dateFilter, limit: -1 },
      );
      console.log('[FORGE] HealthKit: handwashing events =', samples.length);
      return samples.length;
    }

    // ── Blood pressure ─────────────────────────────────────────────────────────

    if (hkType === 'HKCorrelationTypeIdentifierBloodPressure') {
      // No correlation query needed — just check if any systolic sample exists today
      const samples = await queryQuantitySamples(
        'HKQuantityTypeIdentifierBloodPressureSystolic' as QuantityTypeIdentifier,
        { filter: dateFilter, limit: 1 } as any,
      );
      const val = samples.length > 0 ? 1 : 0;
      console.log('[FORGE] HealthKit: blood pressure readings today =', samples.length, '→', val);
      return val;
    }

    // ── Workouts ───────────────────────────────────────────────────────────────

    if (WORKOUT_TYPES.has(hkType)) {
      const activityType = WORKOUT_ACTIVITY_MAP[hkType];
      const workouts = await queryWorkoutSamples({
        filter: {
          workoutActivityType: activityType,
          date: { startDate, endDate },
        },
        limit: -1,
      });
      const totalMinutes = workouts.reduce((sum, w) => {
        // duration.quantity is in seconds (serialized from HKWorkout.duration)
        return sum + (w.duration.quantity / 60);
      }, 0);
      const minutes = Math.round(totalMinutes);
      console.log(`[FORGE] HealthKit: ${hkType} — ${workouts.length} workouts → ${minutes} min`);
      return minutes;
    }

    console.log('[FORGE] HealthKit: unhandled hkType:', hkType);
    return 0;
  } catch (e) {
    console.log('[FORGE] HealthKit: readTodayValue error for', hkType, ':', e);
    return 0;
  }
}
