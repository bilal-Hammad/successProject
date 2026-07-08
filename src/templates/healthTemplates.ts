export type HealthTemplate = {
  id: string;
  title: string;
  emoji: string;
  healthKitType: string;
  unit?: string;
  defaultGoal?: number;
  icon: string;  // emoji
  color: string;
};

export type HealthTemplateSection = {
  id: string;
  labelKey: string;
  templates: HealthTemplate[];
};

export const APPLE_HEALTH_SECTIONS: HealthTemplateSection[] = [
  {
    id: 'activity',
    labelKey: 'section.activity',
    templates: [
      { id: 'hk-steps',    title: 'Steps',                       emoji: '👟', icon: '👟', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierStepCount',                      unit: 'steps',    defaultGoal: 10000 },
      { id: 'hk-run',      title: 'Run',                         emoji: '🏃', icon: '🏃', color: '#34C759', healthKitType: 'HKWorkoutActivityTypeRunning',                           unit: 'minutes',  defaultGoal: 30    },
      { id: 'hk-cycle',    title: 'Cycle',                       emoji: '🚴', icon: '🚴', color: '#34C759', healthKitType: 'HKWorkoutActivityTypeCycling',                           unit: 'minutes',  defaultGoal: 30    },
      { id: 'hk-swim',     title: 'Swim',                        emoji: '🏊', icon: '🏊', color: '#34C759', healthKitType: 'HKWorkoutActivityTypeSwimming',                          unit: 'minutes',  defaultGoal: 30    },
      { id: 'hk-ski',      title: 'Ski',                         emoji: '⛷️', icon: '⛷️', color: '#34C759', healthKitType: 'HKWorkoutActivityTypeDownhillSkiing',                    unit: 'minutes',  defaultGoal: 60    },
      { id: 'hk-yoga',     title: 'Yoga',                        emoji: '🧘', icon: '🧘', color: '#34C759', healthKitType: 'HKWorkoutActivityTypeYoga',                              unit: 'minutes',  defaultGoal: 30    },
      { id: 'hk-dance',    title: 'Dance',                       emoji: '💃', icon: '💃', color: '#34C759', healthKitType: 'HKWorkoutActivityTypeDance',                             unit: 'minutes',  defaultGoal: 30    },
      { id: 'hk-pilates',  title: 'Pilates',                     emoji: '🤸', icon: '🤸', color: '#34C759', healthKitType: 'HKWorkoutActivityTypePilates',                           unit: 'minutes',  defaultGoal: 30    },
      { id: 'hk-tennis',   title: 'Tennis',                      emoji: '🎾', icon: '🎾', color: '#34C759', healthKitType: 'HKWorkoutActivityTypeTennis',                            unit: 'minutes',  defaultGoal: 60    },
      { id: 'hk-strength', title: 'Traditional Strength Training',emoji: '🏋️',icon: '🏋️',color: '#34C759', healthKitType: 'HKWorkoutActivityTypeTraditionalStrengthTraining',       unit: 'minutes',  defaultGoal: 45    },
      { id: 'hk-boxing',   title: 'Boxing',                      emoji: '🥊', icon: '🥊', color: '#34C759', healthKitType: 'HKWorkoutActivityTypeBoxing',                            unit: 'minutes',  defaultGoal: 45    },
      { id: 'hk-flights',  title: 'Climb Flights',               emoji: '🪜', icon: '🪜', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierFlightsClimbed',                 unit: 'flights',  defaultGoal: 10    },
      { id: 'hk-calories', title: 'Burn Calories',               emoji: '🔥', icon: '🔥', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierActiveEnergyBurned',             unit: 'cal',      defaultGoal: 500   },
      { id: 'hk-stand',    title: 'Stand',                       emoji: '🧍', icon: '🧍', color: '#34C759', healthKitType: 'HKCategoryTypeIdentifierAppleStandHour',                 unit: 'hours',    defaultGoal: 12    },
      { id: 'hk-deficit',  title: 'Calorie Deficit',             emoji: '🔥', icon: '🔥', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierActiveEnergyBurned',             unit: 'cal',      defaultGoal: 300   },
      { id: 'hk-workout',  title: 'Work Out',                    emoji: '🏋️',icon: '🏋️',color: '#34C759', healthKitType: 'HKWorkoutActivityTypeTraditionalStrengthTraining',       unit: 'minutes',  defaultGoal: 30    },
    ],
  },
  {
    id: 'sleep',
    labelKey: 'section.sleep',
    templates: [
      { id: 'hk-sleep',   title: 'Sleep', emoji: '😴', icon: '😴', color: '#34C759', healthKitType: 'HKCategoryTypeIdentifierSleepAnalysis', unit: 'hours', defaultGoal: 8 },
    ],
  },
  {
    id: 'heart',
    labelKey: 'section.heart',
    templates: [
      { id: 'hk-bp',      title: 'Record Blood Pressure', emoji: '💚', icon: '💚', color: '#34C759', healthKitType: 'HKCorrelationTypeIdentifierBloodPressure', unit: 'mmHg', defaultGoal: 1 },
    ],
  },
  {
    id: 'mental',
    labelKey: 'section.mentalWellbeing',
    templates: [
      { id: 'hk-mindful', title: 'Mindful Session', emoji: '🧘', icon: '🧘', color: '#34C759', healthKitType: 'HKCategoryTypeIdentifierMindfulSession', unit: 'minutes', defaultGoal: 10 },
    ],
  },
  {
    id: 'nutrition',
    labelKey: 'section.nutrition',
    templates: [
      { id: 'hk-water',   title: 'Drink Water',          emoji: '💧', icon: '💧', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierDietaryWater',    unit: 'ml',    defaultGoal: 2000 },
      { id: 'hk-coffee',  title: 'Limit Coffee',         emoji: '☕', icon: '☕', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierDietaryCaffeine',  unit: 'mg',    defaultGoal: 400  },
      { id: 'hk-alcohol', title: 'Limit Alcoholic Drinks',emoji: '🍷',icon: '🍷', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierDietaryAlcohol',   unit: 'g',     defaultGoal: 14   },
    ],
  },
  {
    id: 'body',
    labelKey: 'section.bodyMeasurements',
    templates: [
      { id: 'hk-weight',  title: 'Record Weight',        emoji: '⚖️', icon: '⚖️', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierBodyMass',              unit: 'kg',  defaultGoal: 1 },
      { id: 'hk-lean',    title: 'Record Lean Body Mass',emoji: '⚖️', icon: '⚖️', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierLeanBodyMass',          unit: 'kg',  defaultGoal: 1 },
      { id: 'hk-fat',     title: 'Record Fat Percentage',emoji: '⚖️', icon: '⚖️', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierBodyFatPercentage',     unit: '%',   defaultGoal: 1 },
      { id: 'hk-height',  title: 'Record Height',        emoji: '📏', icon: '📏', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierHeight',                unit: 'cm',  defaultGoal: 1 },
      { id: 'hk-glucose', title: 'Record Blood Glucose', emoji: '💉', icon: '💉', color: '#34C759', healthKitType: 'HKQuantityTypeIdentifierBloodGlucose',          unit: 'mg/dL',defaultGoal: 1},
    ],
  },
  {
    id: 'other',
    labelKey: 'section.other',
    templates: [
      { id: 'hk-handwash', title: 'Wash Your Hands', emoji: '🙌', icon: '🙌', color: '#34C759', healthKitType: 'HKCategoryTypeIdentifierHandwashingEvent', unit: 'times', defaultGoal: 8 },
    ],
  },
];
