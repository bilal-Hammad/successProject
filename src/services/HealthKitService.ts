import { Platform } from 'react-native';

// react-native-health exports via `export default AppleHealthKit` (ESM) which
// becomes `exports.default = ...` in CommonJS. We try .default first; if that
// is falsy (e.g. native module not registered) we fall back to the raw module.
// NOTE: even with the JS module loading, initHealthKit is a NATIVE bridge
// method — it is only present when the pod is linked AND the native module
// was registered at runtime. Constants is a static JS object and loads even
// without the native bridge, which is why it passes earlier checks but
// initHealthKit crashes.
let AppleHealthKit: any = null;
try {
  const mod = require('react-native-health');
  AppleHealthKit = mod.default ?? mod;
  // Log every key so we can confirm whether native methods like initHealthKit
  // are present. If you only see "Constants" here, the native bridge isn't linked.
  console.log('[HealthKit] module keys:', Object.keys(AppleHealthKit || {}));
  console.log('[HealthKit] initHealthKit type:', typeof AppleHealthKit?.initHealthKit);
} catch (e) {
  // Package not installed — run: npm install react-native-health && cd ios && pod install
  console.log('[HealthKit] require failed:', e);
}

// Use !! not !== null so both null and undefined are treated as "not available".
export const isHealthKitAvailable = (): boolean =>
  Platform.OS === 'ios' && !!AppleHealthKit;

// ─── healthKitType → library Permission constant name ─────────────────────────
//
// react-native-health uses its own string keys (not raw HK identifiers).
// Each entry maps the HK type string we store on a habit to the key that
// AppleHealthKit.Constants.Permissions exports. Wrong keys here cause
// initHealthKit to receive an unrecognised type and fail silently.

const QUANTITY_PERMS: Record<string, string> = {
  HKQuantityTypeIdentifierStepCount:          'Steps',
  HKQuantityTypeIdentifierActiveEnergyBurned: 'ActiveEnergyBurned',
  HKQuantityTypeIdentifierFlightsClimbed:     'FlightsClimbed',
  HKQuantityTypeIdentifierDietaryWater:       'Water',
  HKQuantityTypeIdentifierDietaryCaffeine:    'Caffeine',
  HKQuantityTypeIdentifierDietaryAlcohol:     'Alcohol',
  HKQuantityTypeIdentifierBodyMass:           'BodyMass',   // 'Weight' was wrong
  HKQuantityTypeIdentifierLeanBodyMass:       'LeanBodyMass',
  HKQuantityTypeIdentifierBodyFatPercentage:  'BodyFatPercentage',
  HKQuantityTypeIdentifierHeight:             'Height',
  HKQuantityTypeIdentifierBloodGlucose:       'BloodGlucose',
};

const CATEGORY_PERMS: Record<string, string> = {
  HKCategoryTypeIdentifierSleepAnalysis:       'SleepAnalysis',
  HKCategoryTypeIdentifierAppleStandHour:      'AppleStandHour',
  HKCategoryTypeIdentifierMindfulSession:      'MindfulSession',
  HKCategoryTypeIdentifierHandwashingEvent:    'HandwashingEvent',
};

const WORKOUT_TYPES = new Set([
  'HKWorkoutActivityTypeRunning',
  'HKWorkoutActivityTypeCycling',
  'HKWorkoutActivityTypeSwimming',
  'HKWorkoutActivityTypeDownhillSkiing',
  'HKWorkoutActivityTypeYoga',
  'HKWorkoutActivityTypeDance',
  'HKWorkoutActivityTypePilates',
  'HKWorkoutActivityTypeTennis',
  'HKWorkoutActivityTypeTraditionalStrengthTraining',
  'HKWorkoutActivityTypeBoxing',
]);

const CORRELATION_PERMS: Record<string, string> = {
  HKCorrelationTypeIdentifierBloodPressure: 'BloodPressure',
};

function permNameFor(hkType: string): string | null {
  if (QUANTITY_PERMS[hkType])  return QUANTITY_PERMS[hkType];
  if (CATEGORY_PERMS[hkType])  return CATEGORY_PERMS[hkType];
  if (CORRELATION_PERMS[hkType]) return CORRELATION_PERMS[hkType];
  if (WORKOUT_TYPES.has(hkType)) return 'Workout';
  return null;
}

// ─── Permission result type ───────────────────────────────────────────────────

export type HKPermResult = { ok: true } | { ok: false; reason: string };

// ─── Request permission for a single healthKitType ───────────────────────────
//
// Rules:
//   • Uses library Permission constants (AppleHealthKit.Constants.Permissions.*),
//     never raw HK identifier strings.
//   • Requests ONLY the permission needed for this specific habit.
//   • Logs the exact permissions object before calling initHealthKit.
//   • Returns { ok: false, reason } with the actual error on any failure so the
//     caller can show a meaningful alert instead of a generic message.
//   • A successful initHealthKit callback means the sheet was shown (or
//     previously granted/denied). HealthKit never reveals read-permission status
//     for privacy, so the caller should not block on a grant assumption.

export function requestHealthKitPermission(hkType: string): Promise<HKPermResult> {
  return new Promise((resolve) => {
    if (!isHealthKitAvailable()) {
      resolve({ ok: false, reason: 'HealthKit is not available on this device.' });
      return;
    }

    const permName = permNameFor(hkType);
    if (!permName) {
      resolve({
        ok: false,
        reason: `No permission mapping for healthKitType "${hkType}". This type is not yet supported.`,
      });
      return;
    }

    const perms = AppleHealthKit?.Constants?.Permissions;
    if (!perms) {
      resolve({
        ok: false,
        reason:
          'AppleHealthKit.Constants.Permissions is undefined. ' +
          'The native HealthKit module is not linked — rebuild after pod install.',
      });
      return;
    }

    const perm = perms[permName];
    if (!perm) {
      resolve({
        ok: false,
        reason: `"${permName}" not found in AppleHealthKit.Constants.Permissions. ` +
                `Available keys: ${Object.keys(perms).slice(0, 8).join(', ')} …`,
      });
      return;
    }

    // Guard: initHealthKit is a native bridge method. It is undefined when the
    // native module isn't linked or wasn't registered at runtime (common on
    // simulator builds where HealthKit entitlements aren't wired up).
    if (typeof AppleHealthKit?.initHealthKit !== 'function') {
      const msg =
        '[HealthKit] Native module unavailable — initHealthKit is not a function. ' +
        'This usually means the app is running on a simulator without HealthKit ' +
        'support, or the native module needs a rebuild after pod install.';
      console.log(msg);
      console.log('[HealthKit] AppleHealthKit keys:', Object.keys(AppleHealthKit || {}));
      resolve({
        ok: false,
        reason:
          'HealthKit is not available on this simulator. ' +
          'Run on a real iPhone to use Apple Health habits, or create the habit ' +
          'now and log values manually.',
      });
      return;
    }

    const options = { permissions: { read: [perm], write: [] } };

    console.log('[HealthKit] Requesting permission');
    console.log(`[HealthKit]   hkType   : ${hkType}`);
    console.log(`[HealthKit]   permName : ${permName}`);
    console.log(`[HealthKit]   permValue: ${perm}`);
    console.log('[HealthKit]   options  :', JSON.stringify(options));

    AppleHealthKit.initHealthKit(options, (err: any) => {
      if (err) {
        const msg = typeof err === 'string' ? err : JSON.stringify(err);
        console.log('[HealthKit] initHealthKit error:', msg);
        resolve({ ok: false, reason: `HealthKit init failed: ${msg}` });
      } else {
        console.log(`[HealthKit] initHealthKit succeeded — permission sheet shown for "${permName}"`);
        resolve({ ok: true });
      }
    });
  });
}

// ─── Read today's value for a given HealthKit type ────────────────────────────

export function readTodayValue(hkType: string): Promise<number> {
  return new Promise((resolve) => {
    if (!isHealthKitAvailable()) { resolve(0); return; }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const options = {
      startDate: startOfDay.toISOString(),
      endDate: now.toISOString(),
    };

    try {
      if (hkType === 'HKQuantityTypeIdentifierStepCount') {
        AppleHealthKit.getStepCount(options, (err: any, result: any) => {
          resolve(err ? 0 : Math.round(result?.value ?? 0));
        });

      } else if (hkType === 'HKQuantityTypeIdentifierActiveEnergyBurned') {
        AppleHealthKit.getActiveEnergyBurned(options, (err: any, results: any[]) => {
          if (err || !Array.isArray(results)) { resolve(0); return; }
          const total = results.reduce((sum, r) => sum + (r.value ?? 0), 0);
          resolve(Math.round(total));
        });

      } else if (hkType === 'HKQuantityTypeIdentifierFlightsClimbed') {
        AppleHealthKit.getFlightsClimbed(options, (err: any, result: any) => {
          resolve(err ? 0 : Math.round(result?.value ?? 0));
        });

      } else if (hkType === 'HKQuantityTypeIdentifierDietaryWater') {
        AppleHealthKit.getWaterSamples(options, (err: any, results: any[]) => {
          if (err || !Array.isArray(results)) { resolve(0); return; }
          const total = results.reduce((sum, r) => sum + (r.value ?? 0), 0);
          resolve(Math.round(total * 1000));
        });

      } else if (hkType === 'HKQuantityTypeIdentifierDietaryCaffeine') {
        AppleHealthKit.getDietaryCaffeineSamples(
          { ...options, unit: 'mg' },
          (err: any, results: any[]) => {
            if (err || !Array.isArray(results)) { resolve(0); return; }
            const total = results.reduce((sum, r) => sum + (r.value ?? 0), 0);
            resolve(Math.round(total));
          },
        );

      } else if (hkType === 'HKQuantityTypeIdentifierBodyMass') {
        AppleHealthKit.getLatestWeight({ unit: 'gram' }, (err: any, result: any) => {
          resolve(err ? 0 : Math.round((result?.value ?? 0) / 1000));
        });

      } else if (hkType === 'HKCategoryTypeIdentifierSleepAnalysis') {
        AppleHealthKit.getSleepSamples(options, (err: any, results: any[]) => {
          if (err || !Array.isArray(results)) { resolve(0); return; }
          const asleepMinutes = results
            .filter((r) => r.value === 'ASLEEP' || r.value === 'ASLEEP_CORE' || r.value === 'ASLEEP_DEEP')
            .reduce((sum, r) => {
              const ms = new Date(r.endDate).getTime() - new Date(r.startDate).getTime();
              return sum + ms / 60000;
            }, 0);
          resolve(Math.round(asleepMinutes / 60));
        });

      } else if (hkType === 'HKCategoryTypeIdentifierMindfulSession') {
        AppleHealthKit.getMindfulSession(options, (err: any, results: any[]) => {
          if (err || !Array.isArray(results)) { resolve(0); return; }
          const totalMinutes = results.reduce((sum, r) => {
            const ms = new Date(r.endDate).getTime() - new Date(r.startDate).getTime();
            return sum + ms / 60000;
          }, 0);
          resolve(Math.round(totalMinutes));
        });

      } else if (WORKOUT_TYPES.has(hkType)) {
        const workoutTypeMap: Record<string, number> = {
          HKWorkoutActivityTypeRunning:                      37,
          HKWorkoutActivityTypeCycling:                      13,
          HKWorkoutActivityTypeSwimming:                     46,
          HKWorkoutActivityTypeDownhillSkiing:               35,
          HKWorkoutActivityTypeYoga:                         20,
          HKWorkoutActivityTypeDance:                        76,
          HKWorkoutActivityTypePilates:                      79,
          HKWorkoutActivityTypeTennis:                       50,
          HKWorkoutActivityTypeTraditionalStrengthTraining:  50,
          HKWorkoutActivityTypeBoxing:                       10,
        };
        const typeId = workoutTypeMap[hkType] ?? 1;
        AppleHealthKit.getSamples(
          { ...options, type: 'Workout', limit: 50 },
          (err: any, results: any[]) => {
            if (err || !Array.isArray(results)) { resolve(0); return; }
            const filtered = results.filter((r) => r.activityId === typeId);
            const totalMinutes = filtered.reduce((sum, r) => {
              const ms = new Date(r.end).getTime() - new Date(r.start).getTime();
              return sum + ms / 60000;
            }, 0);
            resolve(Math.round(totalMinutes));
          },
        );

      } else if (hkType === 'HKCategoryTypeIdentifierAppleStandHour') {
        AppleHealthKit.getAppleStandTime(options, (err: any, result: any) => {
          resolve(err ? 0 : Math.round((result?.value ?? 0) / 60));
        });

      } else if (hkType === 'HKCorrelationTypeIdentifierBloodPressure') {
        resolve(1);

      } else if (hkType === 'HKQuantityTypeIdentifierBodyFatPercentage') {
        AppleHealthKit.getLatestBodyFatPercentage({}, (err: any, result: any) => {
          resolve(err ? 0 : Math.round((result?.value ?? 0) * 100));
        });

      } else if (hkType === 'HKQuantityTypeIdentifierLeanBodyMass') {
        AppleHealthKit.getLatestLeanBodyMass({ unit: 'gram' }, (err: any, result: any) => {
          resolve(err ? 0 : Math.round((result?.value ?? 0) / 1000));
        });

      } else if (hkType === 'HKQuantityTypeIdentifierHeight') {
        AppleHealthKit.getLatestHeight({ unit: 'centimeter' }, (err: any, result: any) => {
          resolve(err ? 0 : Math.round(result?.value ?? 0));
        });

      } else if (hkType === 'HKQuantityTypeIdentifierBloodGlucose') {
        AppleHealthKit.getBloodGlucoseSamples(
          { ...options, unit: 'mmolPerL', limit: 1 },
          (err: any, results: any[]) => {
            resolve(err || !results?.length ? 0 : 1);
          },
        );

      } else if (hkType === 'HKCategoryTypeIdentifierHandwashingEvent') {
        AppleHealthKit.getHandwashingEvent?.(options, (err: any, results: any[]) => {
          resolve(err || !Array.isArray(results) ? 0 : results.length);
        }) ?? resolve(0);

      } else {
        resolve(0);
      }
    } catch {
      resolve(0);
    }
  });
}
