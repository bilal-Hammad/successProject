import type { HabitTemplate, TemplateCategory } from '../models/types';

// ─── Category tabs ────────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'good',   labelKey: 'category.good',   icon: '✅' },
  { id: 'health', labelKey: 'category.health', icon: '❤️' },
  { id: 'bad',    labelKey: 'category.bad',    icon: '🚫' },
  { id: 'todo',   labelKey: 'category.todo',   icon: '📋' },
];

// ─── Good tab section definitions ────────────────────────────────────────────

export const GOOD_TAB_SECTIONS: { id: string; labelKey: string; templateIds: string[] }[] = [
  {
    id: 'most-popular',
    labelKey: 'section.mostPopular',
    templateIds: [
      'make-your-bed', 'drink-water', 'cold-shower', 'vitamins',
      'wake-up-time', 'eat-healthy', 'brush-teeth', 'read-book',
      'take-shower', 'walk',
    ],
  },
  {
    id: 'body',
    labelKey: 'section.body',
    templateIds: [
      'eat-healthy', 'cold-shower', 'walk', 'brush-teeth', 'take-shower',
      'drink-tea', 'cook-home', 'vitamins', 'eat-breakfast', 'take-selfie',
      'wash-face', 'take-stairs', 'health-checkup', 'skin-care',
      'dental-checkup', 'face-mask', 'walk-dog',
      'eat-fruits-veg', 'snack-fruits-veg', 'meal-prep', 'eat-low-fat',
      'steam-boil', 'healthy-oils', 'low-fat-dairy', 'lean-meats',
      'nutrition-labels', 'iodized-salt', 'food-log', 'no-salt-table',
      'smaller-plates', 'dress-well',
    ],
  },
  {
    id: 'mind',
    labelKey: 'section.mind',
    templateIds: [
      'learn', 'read-book', 'play-instrument', 'learn-language',
      'homework-good', 'podcast', 'audiobook',
    ],
  },
  {
    id: 'mental-wellbeing',
    labelKey: 'section.mentalWellbeing',
    templateIds: [
      'meditation', 'smile', 'wake-up-time', 'go-sleep-time',
      'gratitude', 'meet-friend', 'reflect-day', 'pray',
      'listen-music', 'journal-thoughts',
      'breathe', 'laugh', 'mind-clearing', 'power-down-screens',
    ],
  },
  {
    id: 'productivity',
    labelKey: 'section.productivity',
    templateIds: [
      'clean-email', 'plan-tomorrow', 'set-daily-goals', 'deep-work',
      'make-your-bed', 'take-breaks', 'no-phone', 'review-today', 'post-it-task',
    ],
  },
  {
    id: 'social',
    labelKey: 'section.social',
    templateIds: [
      'smile-stranger', 'give-compliment', 'leave-house', 'start-conversation',
      'give-hug', 'help-someone', 'call-parents',
    ],
  },
  {
    id: 'other',
    labelKey: 'section.other',
    templateIds: [
      'take-trash', 'laundry', 'track-expenses', 'water-plant',
      'clear-fridge', 'wash-dishes', 'vacuum', 'dust', 'mop-floor', 'cleaning',
      'grocery-shopping', 'save-money', 'pay-bills', 'spend-less',
    ],
  },
  {
    id: 'islamic',
    labelKey: 'section.islamic',
    templateIds: [
      'five-prayers', 'read-quran', 'morning-adhkar', 'evening-adhkar',
      'istighfar', 'night-prayer', 'mon-thu-fast', 'daily-sadaqah', 'tasbih',
    ],
  },
];

// ─── Bad tab section definitions ─────────────────────────────────────────────

export const BAD_TAB_SECTIONS: { id: string; labelKey: string; templateIds: string[] }[] = [
  {
    id: 'body',
    labelKey: 'section.body',
    templateIds: [
      'dont-snack', 'no-sugar', 'no-alcohol', 'dont-bite-nails', 'dont-pick-nose', 'sit-less',
      'no-smoking', 'no-trans-fats', 'no-sugary-drinks', 'less-carbs',
      'limit-salt', 'no-salty-snacks', 'no-late-meals',
    ],
  },
  {
    id: 'mental-wellbeing',
    labelKey: 'section.mentalWellbeing',
    templateIds: ['dont-swear', 'dont-get-angry', 'dont-complain'],
  },
  {
    id: 'productivity',
    labelKey: 'section.productivity',
    templateIds: ['dont-procrastinate', 'dont-play-games', 'less-social-media', 'less-tv'],
  },
];

// ─── Templates ────────────────────────────────────────────────────────────────

export const HABIT_TEMPLATES: HabitTemplate[] = [

  // ── Good — Most Popular / cross-section ──────────────────────────────────
  { id: 'make-your-bed',    title: 'Make your Bed',         icon: '🛏️', color: '#9C27B0', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'wake-up-time',     title: 'Wake Up on Time',       icon: '☀️',  color: '#FF9800', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'eat-healthy',      title: 'Eat a Healthy Meal',    icon: '🥕',  color: '#4CAF50', categories: ['good'], pointsPerCompletion: 15, unit: 'times', defaultGoal: 3 },
  { id: 'brush-teeth',      title: 'Brush Your Teeth',      icon: '🪥',  color: '#00BCD4', categories: ['good'], pointsPerCompletion: 5, unit: 'times', defaultGoal: 2 },
  { id: 'read-book',        title: 'Read a Book',           icon: '📖',  color: '#795548', categories: ['good'], pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 20, step: 5 },
  { id: 'take-shower',      title: 'Take a Shower',         icon: '🚿',  color: '#2196F3', categories: ['good'], pointsPerCompletion: 5  },

  // ── Good — Body ───────────────────────────────────────────────────────────
  { id: 'drink-tea',        title: 'Drink Tea',             icon: '☕',  color: '#8D6E63', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'cook-home',        title: 'Cook at Home',          icon: '🥘',  color: '#FF7043', categories: ['good'], pointsPerCompletion: 15, unit: 'times', defaultGoal: 1 },
  { id: 'eat-breakfast',    title: 'Eat Breakfast',         icon: '🍳',  color: '#FFA726', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'take-selfie',      title: 'Take a Selfie',         icon: '📷',  color: '#E91E63', categories: ['good'], pointsPerCompletion: 5  },
  { id: 'wash-face',        title: 'Wash Face',             icon: '🧖',  color: '#26C6DA', categories: ['good'], pointsPerCompletion: 5, unit: 'times', defaultGoal: 2 },
  { id: 'take-stairs',      title: 'Take the Stairs',       icon: '🏃',  color: '#66BB6A', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'health-checkup',   title: 'Health Checkup',        icon: '💗',  color: '#EF5350', categories: ['good'], pointsPerCompletion: 20, unit: 'times', defaultGoal: 1, repeatMode: 'everyXDays', intervalDays: 365 },
  { id: 'skin-care',        title: 'Skin Care',             icon: '🧖',  color: '#F48FB1', categories: ['good'], pointsPerCompletion: 10, unit: 'times', defaultGoal: 2 },
  { id: 'dental-checkup',   title: 'Dental Check-Up',       icon: '🦷',  color: '#29B6F6', categories: ['good'], pointsPerCompletion: 20, unit: 'times', defaultGoal: 1, repeatMode: 'everyXDays', intervalDays: 182 },
  { id: 'face-mask',        title: 'Face Mask',             icon: '🧖',  color: '#AB47BC', categories: ['good'], pointsPerCompletion: 10, unit: 'times', defaultGoal: 1, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'walk-dog',         title: 'Walk Your Dog',         icon: '🐕',  color: '#A1887F', categories: ['good'], pointsPerCompletion: 15, unit: 'times', defaultGoal: 2 },

  // ── Good — Mind ───────────────────────────────────────────────────────────
  { id: 'learn',            title: 'Learn',                 icon: '📚',  color: '#5C6BC0', categories: ['good'], pointsPerCompletion: 20 },
  { id: 'play-instrument',  title: 'Play Instrument',       icon: '🎸',  color: '#EF5350', categories: ['good'], pointsPerCompletion: 20, unit: 'minutes', defaultGoal: 30, step: 5 },
  { id: 'learn-language',   title: 'Learn a Language',      icon: '🅰️', color: '#FF7043', categories: ['good'], pointsPerCompletion: 20, unit: 'minutes', defaultGoal: 20, step: 5 },
  { id: 'homework-good',    title: 'Homework',              icon: '📚',  color: '#42A5F5', categories: ['good'], pointsPerCompletion: 20 },
  { id: 'podcast',          title: 'Listen to a Podcast',   icon: '🎙️', color: '#7E57C2', categories: ['good'], pointsPerCompletion: 10, unit: 'minutes', defaultGoal: 30, step: 10 },
  { id: 'audiobook',        title: 'Listen to an Audiobook',icon: '🎙️', color: '#26A69A', categories: ['good'], pointsPerCompletion: 10, unit: 'minutes', defaultGoal: 30, step: 10 },

  // ── Good — Mental Wellbeing ───────────────────────────────────────────────
  { id: 'smile',            title: 'Smile',                 icon: '😊',  color: '#FFCA28', categories: ['good'], pointsPerCompletion: 5  },
  { id: 'go-sleep-time',    title: 'Go to Sleep on Time',   icon: '😴',  color: '#3F51B5', categories: ['good'], pointsPerCompletion: 15, unit: 'hours', defaultGoal: 8 },
  { id: 'meet-friend',      title: 'Meet a Friend',         icon: '👥',  color: '#26A69A', categories: ['good'], pointsPerCompletion: 15, unit: 'times', defaultGoal: 1, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'reflect-day',      title: 'Reflect on My Day',     icon: '🤔',  color: '#8D6E63', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'pray',             title: 'Pray',                  icon: '🙏',  color: '#7E57C2', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'listen-music',     title: 'Listen to Music',       icon: '🎵',  color: '#FF7043', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'journal-thoughts', title: 'Journal Your Thoughts', icon: '📝',  color: '#5C6BC0', categories: ['good'], pointsPerCompletion: 10 },

  // ── Good — Productivity ───────────────────────────────────────────────────
  { id: 'clean-email',      title: 'Clean up Email',        icon: '✉️',  color: '#607D8B', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'plan-tomorrow',    title: 'Plan Tomorrow',         icon: '📋',  color: '#FF7043', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'set-daily-goals',  title: 'Set Daily Goals',       icon: '📅',  color: '#EF5350', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'deep-work',        title: 'Deep Work',             icon: '👨‍💻', color: '#5C6BC0', categories: ['good'], pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 90, step: 30 },
  { id: 'take-breaks',      title: 'Take Breaks',           icon: '⏳',  color: '#78909C', categories: ['good'], pointsPerCompletion: 5  },

  // ── Good — Social ─────────────────────────────────────────────────────────
  { id: 'smile-stranger',   title: 'Smile at a Stranger',   icon: '😊',  color: '#FFCA28', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'give-compliment',  title: 'Give a Compliment',     icon: '🤗',  color: '#FF7043', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'leave-house',      title: 'Leave the House',       icon: '🏡',  color: '#4CAF50', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'start-conversation',title: 'Start a Conversation', icon: '🗣️', color: '#42A5F5', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'give-hug',         title: 'Give Someone a Hug',    icon: '🤗',  color: '#FF8A65', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'help-someone',     title: 'Help Someone',          icon: '👥',  color: '#26C6DA', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'call-parents',     title: 'Call Parents',          icon: '👨‍👩‍👧', color: '#66BB6A', categories: ['good'], pointsPerCompletion: 15, unit: 'times', defaultGoal: 1, repeatMode: 'timesPerWeek', weeklyTarget: 1 },

  // ── Good — Other ──────────────────────────────────────────────────────────
  { id: 'take-trash',       title: 'Take the Trash Out',    icon: '🗑️', color: '#EF5350', categories: ['good'], pointsPerCompletion: 5, unit: 'times', defaultGoal: 1, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'laundry',          title: 'Laundry',               icon: '👕',  color: '#66BB6A', categories: ['good'], pointsPerCompletion: 10, unit: 'times', defaultGoal: 1, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'track-expenses',   title: 'Track Expenses',        icon: '💲',  color: '#4CAF50', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'water-plant',      title: 'Water Plant',           icon: '🪴',  color: '#4CAF50', categories: ['good'], pointsPerCompletion: 5, unit: 'times', defaultGoal: 1, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'clear-fridge',     title: 'Clear the Fridge',      icon: '🧊',  color: '#29B6F6', categories: ['good'], pointsPerCompletion: 10, unit: 'times', defaultGoal: 1, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'wash-dishes',      title: 'Wash the Dishes',       icon: '🍽️', color: '#26A69A', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'vacuum',           title: 'Vacuum',                icon: '🧹',  color: '#78909C', categories: ['good'], pointsPerCompletion: 10, unit: 'times', defaultGoal: 1, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'dust',             title: 'Dust',                  icon: '🧹',  color: '#A1887F', categories: ['good'], pointsPerCompletion: 5, unit: 'times', defaultGoal: 1, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'mop-floor',        title: 'Mop the Floor',         icon: '🧹',  color: '#607D8B', categories: ['good'], pointsPerCompletion: 10, unit: 'times', defaultGoal: 1, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'cleaning',         title: 'Cleaning',              icon: '🧹',  color: '#26A69A', categories: ['good'], pointsPerCompletion: 15 },

  // ── Good — Islamic ────────────────────────────────────────────────────────
  { id: 'five-prayers',     title: 'الصلوات الخمس',         icon: '🕌',  color: '#2E7D32', categories: ['good'], pointsPerCompletion: 30, unit: 'times', defaultGoal: 5 },
  { id: 'read-quran',       title: 'قراءة القرآن',           icon: '📖',  color: '#1B5E20', categories: ['good'], pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 20, step: 5 },
  { id: 'morning-adhkar',   title: 'الأذكار الصباحية',       icon: '🌅',  color: '#F9A825', categories: ['good'], pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 10 },
  { id: 'evening-adhkar',   title: 'الأذكار المسائية',       icon: '🌙',  color: '#283593', categories: ['good'], pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 10 },
  { id: 'istighfar',        title: 'الاستغفار',              icon: '📿',  color: '#00695C', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'night-prayer',     title: 'قيام الليل',             icon: '🌙',  color: '#4527A0', categories: ['good'], pointsPerCompletion: 25 },
  { id: 'mon-thu-fast',     title: 'صيام الإثنين والخميس',   icon: '🌙',  color: '#2E7D32', categories: ['good'], pointsPerCompletion: 30, repeatMode: 'specificDays', scheduleDays: [1, 4] },
  { id: 'daily-sadaqah',    title: 'الصدقة اليومية',         icon: '💝',  color: '#F9A825', categories: ['good'], pointsPerCompletion: 20 },
  { id: 'tasbih',           title: 'تلاوة الأذكار',          icon: '📿',  color: '#00695C', categories: ['good'], pointsPerCompletion: 15 },

  // ── Good — Legacy (kept for backward compatibility) ───────────────────────
  { id: 'walk',          title: 'Go for a Walk',           icon: '🚶',  color: '#FF7043', categories: ['good'],   pointsPerCompletion: 20, unit: 'minutes', defaultGoal: 30, step: 5 },
  { id: 'run',           title: 'Run',                     icon: '🏃',  color: '#FF5722', categories: ['good'],   pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 20, step: 5 },
  { id: 'cycling',       title: 'Cycling',                 icon: '🚴',  color: '#FF9800', categories: ['good'],   pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 30, step: 10 },
  { id: 'workout',       title: 'Workout',                 icon: '💪',  color: '#F44336', categories: ['good'],   pointsPerCompletion: 30, unit: 'minutes', defaultGoal: 30, step: 5 },
  { id: 'exercise',      title: 'Exercise',                icon: '🏋️', color: '#E91E63', categories: ['good'],   pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 30, step: 5 },
  { id: 'yoga',          title: 'Yoga',                    icon: '🤸',  color: '#E91E63', categories: ['good'],   pointsPerCompletion: 20, unit: 'minutes', defaultGoal: 20, step: 5 },
  { id: 'stretch',       title: 'Stretch 10 min',          icon: '🧘',  color: '#FF9800', categories: ['good', 'health'], pointsPerCompletion: 10, unit: 'minutes', defaultGoal: 10 },
  { id: 'meditation',    title: 'Meditate',                icon: '🧘',  color: '#9C27B0', categories: ['good'],   pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 10 },
  { id: 'read-20',       title: 'Read 20 minutes',         icon: '📖',  color: '#4CAF50', categories: ['good'],   pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 20 },
  { id: 'study-session', title: 'Study session',           icon: '📚',  color: '#2196F3', categories: ['good'],   pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 45, step: 5 },
  { id: 'coding',        title: 'Coding practice',         icon: '💻',  color: '#607D8B', categories: ['good'],   pointsPerCompletion: 20, unit: 'minutes', defaultGoal: 30, step: 5 },
  { id: 'journal',       title: 'Journal entry',           icon: '✍️',  color: '#673AB7', categories: ['good'],   pointsPerCompletion: 10 },
  { id: 'gratitude',     title: 'Gratitude',               icon: '🙏',  color: '#E91E63', categories: ['good'],   pointsPerCompletion: 10, unit: 'things', defaultGoal: 3 },
  { id: 'breathe',       title: 'Breathing exercise',      icon: '💨',  color: '#00BCD4', categories: ['good'],   pointsPerCompletion: 10, unit: 'minutes', defaultGoal: 5 },
  { id: 'affirmations',  title: 'Positive affirmations',   icon: '💬',  color: '#FF9800', categories: ['good'],   pointsPerCompletion: 10 },
  { id: 'digital-detox', title: 'Digital detox hour',      icon: '🌿',  color: '#4CAF50', categories: ['good'],   pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 60, step: 15 },
  { id: 'vocabulary',    title: 'Learn 5 new words',       icon: '🔤',  color: '#9C27B0', categories: ['good'],   pointsPerCompletion: 10, unit: 'words', defaultGoal: 5 },
  { id: 'review-notes',  title: 'Review notes',            icon: '📝',  color: '#8BC34A', categories: ['good'],   pointsPerCompletion: 10 },
  { id: 'no-phone',      title: 'No-phone Hour',           icon: '📵',  color: '#546E7A', categories: ['good'],   pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 60, step: 15 },

  // ── Good — Body (new) ────────────────────────────────────────────────────
  { id: 'eat-fruits-veg',   title: 'Eat Fruits & Vegetables',          icon: '🍎', color: '#4CAF50', categories: ['good'], pointsPerCompletion: 15, unit: 'servings', defaultGoal: 5 },
  { id: 'snack-fruits-veg', title: 'Snack on Raw Fruits & Vegetables', icon: '🍊', color: '#FF9800', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'meal-prep',        title: 'Meal-Prep Fruits & Vegetables',    icon: '🥗', color: '#43A047', categories: ['good'], pointsPerCompletion: 15, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'eat-low-fat',      title: 'Eat Low-Fat / Reduce Saturated Fat', icon: '🥩', color: '#FF7043', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'steam-boil',       title: 'Steam or Boil Instead of Frying', icon: '🫕', color: '#26A69A', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'healthy-oils',     title: 'Replace Butter with Healthy Oils', icon: '🫒', color: '#FFA726', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'low-fat-dairy',    title: 'Choose Low-Fat Dairy',             icon: '🥛', color: '#29B6F6', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'lean-meats',       title: 'Choose Lean Meats / Trim Fat',     icon: '🍗', color: '#FF8A65', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'nutrition-labels', title: 'Check Nutrition Labels',           icon: '🏷️', color: '#607D8B', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'iodized-salt',     title: 'Use Iodized Salt',                 icon: '🧂', color: '#90A4AE', categories: ['good'], pointsPerCompletion: 5  },
  { id: 'food-log',         title: 'Keep a Food Log',                  icon: '📓', color: '#5C6BC0', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'no-salt-table',    title: 'Keep Salt Off the Table',          icon: '🧂', color: '#78909C', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'smaller-plates',   title: 'Use Smaller Plates',               icon: '🍽️', color: '#AB47BC', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'dress-well',       title: 'Dress Well',                       icon: '👔', color: '#7E57C2', categories: ['good'], pointsPerCompletion: 10 },

  // ── Good — Mental Wellbeing (new) ────────────────────────────────────────
  { id: 'laugh',              title: 'Laugh Out Loud',                 icon: '😂', color: '#FFCA28', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'mind-clearing',      title: 'Mind Clearing',                  icon: '🌬️', color: '#26C6DA', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'power-down-screens', title: 'Power Down Screens Before Bed',  icon: '🌙', color: '#3F51B5', categories: ['good'], pointsPerCompletion: 10, unit: 'minutes', defaultGoal: 30, step: 10 },

  // ── Good — Productivity (new) ────────────────────────────────────────────
  { id: 'review-today',  title: 'Review Today',                        icon: '📋', color: '#FF7043', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'post-it-task',  title: 'Write Top Task on a Post-it',         icon: '📝', color: '#FFCA28', categories: ['good'], pointsPerCompletion: 5  },

  // ── Good — Other (new) ───────────────────────────────────────────────────
  { id: 'grocery-shopping', title: 'Grocery Shopping',                 icon: '🛒', color: '#4CAF50', categories: ['good'], pointsPerCompletion: 10, repeatMode: 'timesPerWeek', weeklyTarget: 1 },
  { id: 'save-money',       title: 'Save Money',                       icon: '💰', color: '#43A047', categories: ['good'], pointsPerCompletion: 15, repeatMode: 'everyXDays', intervalDays: 30 },
  { id: 'pay-bills',        title: 'Pay Bills',                        icon: '💳', color: '#FF7043', categories: ['good'], pointsPerCompletion: 10, unit: 'times', defaultGoal: 1, repeatMode: 'everyXDays', intervalDays: 30 },
  { id: 'spend-less',       title: 'Spend Less Than You Earn',         icon: '💵', color: '#26A69A', categories: ['good'], pointsPerCompletion: 15, repeatMode: 'everyXDays', intervalDays: 30 },

  // ── Health ────────────────────────────────────────────────────────────────
  { id: 'drink-water',   title: 'Drink Water',             icon: '💧',  color: '#2196F3', categories: ['health', 'good'], pointsPerCompletion: 10, unit: 'glasses', defaultGoal: 8 },
  { id: 'sleep',         title: 'Sleep 8 hours',           icon: '🛏️', color: '#3F51B5', categories: ['health'], pointsPerCompletion: 15, unit: 'hours', defaultGoal: 8 },
  { id: 'vitamins',      title: 'Take Vitamins',           icon: '💊',  color: '#9C27B0', categories: ['health', 'good'], pointsPerCompletion: 10 },
  { id: 'stand',         title: 'Stand',                   icon: '🧍',  color: '#607D8B', categories: ['health'], pointsPerCompletion: 5  },
  { id: 'steps-10k',     title: '10,000 steps',            icon: '👟',  color: '#FF5722', categories: ['health'], pointsPerCompletion: 20, unit: 'steps', defaultGoal: 10000, step: 1000 },
  { id: 'swim',          title: 'Swimming',                icon: '🏊',  color: '#2196F3', categories: ['health'], pointsPerCompletion: 30, unit: 'minutes', defaultGoal: 30, step: 15 },
  { id: 'cold-shower',   title: 'Take a Cold Shower',      icon: '❄️',  color: '#00BCD4', categories: ['health', 'good'], pointsPerCompletion: 15 },
  { id: 'floss',         title: 'Floss teeth',             icon: '🦷',  color: '#00BCD4', categories: ['health'], pointsPerCompletion: 5, unit: 'times', defaultGoal: 1 },
  { id: 'sleep-early',   title: 'Sleep before midnight',   icon: '🌙',  color: '#3F51B5', categories: ['health'], pointsPerCompletion: 10 },
  { id: 'basketball',    title: 'Basketball',              icon: '🏀',  color: '#FF9800', categories: ['health'], pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 30, step: 15 },
  { id: 'football',      title: 'Football',                icon: '⚽',  color: '#4CAF50', categories: ['health'], pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 30, step: 15 },
  { id: 'active-cal',    title: 'Active Calorie',          icon: '🔥',  color: '#FF5722', categories: ['health'], pointsPerCompletion: 20, unit: 'calories', defaultGoal: 500, step: 50 },
  { id: 'burn-cal',      title: 'Burn Calorie',            icon: '🔥',  color: '#FF7043', categories: ['health'], pointsPerCompletion: 20, unit: 'calories', defaultGoal: 500, step: 50 },

  // ── Health — Manual (new) ────────────────────────────────────────────────
  { id: 'aerobic-moderate',  title: 'Moderate-Intensity Aerobic Activity', icon: '🚶', color: '#FF5722', categories: ['health'], pointsPerCompletion: 20, unit: 'minutes', defaultGoal: 30, step: 15, repeatMode: 'timesPerWeek', weeklyTarget: 5 },
  { id: 'aerobic-vigorous',  title: 'Vigorous-Intensity Aerobic Activity', icon: '🏃', color: '#F44336', categories: ['health'], pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 25, step: 5, repeatMode: 'timesPerWeek', weeklyTarget: 3 },
  { id: 'balance-training',  title: 'Balance & Functional Training',       icon: '⚖️', color: '#FF9800', categories: ['health'], pointsPerCompletion: 15, repeatMode: 'timesPerWeek', weeklyTarget: 3 },
  { id: 'menstrual-log',     title: 'Log Menstrual Cycle',                 icon: '🌸', color: '#E91E63', categories: ['health'], pointsPerCompletion: 10, repeatMode: 'everyXDays', intervalDays: 30 },
  { id: 'contraceptive-pill',title: 'Take Contraceptive Pill',             icon: '💊', color: '#F48FB1', categories: ['health'], pointsPerCompletion: 10 },
  { id: 'time-daylight',     title: 'Time in Daylight',                    icon: '☀️', color: '#FFA726', categories: ['health'], pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 30, step: 10 },
  { id: 'pelvic-floor',      title: 'Pelvic Floor Training',               icon: '💪', color: '#EC407A', categories: ['health'], pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 10 },
  { id: 'sleep-diary',       title: 'Keep a Sleep Diary',                  icon: '📓', color: '#3F51B5', categories: ['health'], pointsPerCompletion: 10 },

  // ── Bad — Body ───────────────────────────────────────────────────────────
  { id: 'dont-snack',        title: "Don't Snack",              icon: '🍿', color: '#26A69A', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },
  { id: 'no-sugar',          title: 'No Sugar',                 icon: '🍬', color: '#EC407A', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },
  { id: 'no-alcohol',        title: 'No Alcohol',               icon: '🍷', color: '#8D6E63', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 20 },
  { id: 'no-smoking',        title: 'Quit Smoking / Vaping',    icon: '🚬', color: '#546E7A', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 25 },
  { id: 'no-trans-fats',     title: 'Avoid Trans Fats',         icon: '🧈', color: '#FF8A65', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },
  { id: 'no-sugary-drinks',  title: 'Cut Sugary Drinks',        icon: '🥤', color: '#FF7043', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 20 },
  { id: 'less-carbs',        title: 'Less Carbohydrate',        icon: '🍞', color: '#FFA726', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },
  { id: 'limit-salt',        title: 'Limit Salt (Under 5 g/day)', icon: '🧂', color: '#78909C', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15, unit: 'grams', defaultGoal: 5 },
  { id: 'no-salty-snacks',   title: 'Restrict Salty Snacks',    icon: '🍟', color: '#FF9800', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },
  { id: 'no-late-meals',     title: 'Avoid Large Meals Before Bed', icon: '🌙', color: '#3F51B5', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },
  { id: 'dont-bite-nails',   title: "Don't Bite Nails",    icon: '🤚',  color: '#00ACC1', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 10 },
  { id: 'dont-pick-nose',    title: "Don't Pick Nose",     icon: '👆',  color: '#1E88E5', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 10 },
  { id: 'sit-less',          title: 'Sit Less',            icon: '🪑',  color: '#8D6E63', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },

  // ── Bad — Mental Wellbeing ────────────────────────────────────────────────
  { id: 'dont-swear',        title: "Don't Swear",         icon: '🤬',  color: '#EF5350', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },
  { id: 'dont-get-angry',    title: "Don't Get Angry",     icon: '😠',  color: '#FF7043', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 20 },
  { id: 'dont-complain',     title: "Don't Complain",      icon: '🤨',  color: '#FFA726', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },

  // ── Bad — Productivity ────────────────────────────────────────────────────
  { id: 'dont-procrastinate',title: "Don't Procrastinate", icon: '📺',  color: '#607D8B', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 20 },
  { id: 'dont-play-games',   title: "Don't Play Games",    icon: '🎮',  color: '#7B1FA2', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },
  { id: 'less-social-media', title: 'Less Social Media',   icon: '📱',  color: '#455A64', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 20, unit: 'minutes', defaultGoal: 30, step: 10 },
  { id: 'less-tv',           title: 'Less TV',             icon: '📺',  color: '#607D8B', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 60, step: 30 },

  // ── To-Do ─────────────────────────────────────────────────────────────────
  { id: 'file-taxes',        title: 'File Taxes',            icon: '🏦',  color: '#2196F3', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 20, repeatMode: 'everyXDays', intervalDays: 365 },
  { id: 'renew-passport',    title: 'Renew Passport',        icon: '🪪',  color: '#4CAF50', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 20, repeatMode: 'everyXDays', intervalDays: 1825 },
  { id: 'plan-vacation',     title: 'Plan a Vacation',       icon: '🏖️', color: '#FF9800', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 20, repeatMode: 'everyXDays', intervalDays: 90 },
  { id: 'update-passwords',  title: 'Update Passwords',      icon: '🔐',  color: '#795548', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10, repeatMode: 'everyXDays', intervalDays: 30 },
  { id: 'print-documents',   title: 'Print Documents',       icon: '🖨️', color: '#607D8B', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10, repeatMode: 'everyXDays', intervalDays: 90 },
  { id: 'buy-gift',          title: 'Buy a Gift',            icon: '🎁',  color: '#E91E63', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 15, repeatMode: 'everyXDays', intervalDays: 90 },
  { id: 'sign-up-gym',       title: 'Sign Up for a Gym',     icon: '💪',  color: '#F05A7E', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 20, unit: 'times', defaultGoal: 1, repeatMode: 'everyXDays', intervalDays: 90 },
  { id: 'schedule-meeting',  title: 'Schedule a Meeting',    icon: '📅',  color: '#FF9800', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10, repeatMode: 'everyXDays', intervalDays: 90 },
  { id: 'set-up-budget',     title: 'Set Up a Budget',       icon: '💸',  color: '#4CAF50', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 15, repeatMode: 'everyXDays', intervalDays: 90 },
  { id: 'update-resume',     title: 'Update Resume',         icon: '📄',  color: '#2196F3', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 15, repeatMode: 'everyXDays', intervalDays: 90 },
  { id: 'doctor-appt',       title: 'Book Doctor Appt.',     icon: '🏥',  color: '#00BCD4', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10, unit: 'times', defaultGoal: 1, repeatMode: 'everyXDays', intervalDays: 90 },
  { id: 'clean-house',       title: 'Deep Clean House',      icon: '🏠',  color: '#4CAF50', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 20, unit: 'times', defaultGoal: 1, repeatMode: 'everyXDays', intervalDays: 30 },

  // ── To-Do (new) ──────────────────────────────────────────────────────────
  { id: 'renew-license',     title: "Renew Driver's License",       icon: '🪪', color: '#FF9800', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10, repeatMode: 'everyXDays', intervalDays: 1825 },
  { id: 'check-insurance',   title: 'Check Insurance',              icon: '📋', color: '#2196F3', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10, repeatMode: 'everyXDays', intervalDays: 365 },
  { id: 'car-maintenance',   title: 'Car Maintenance',              icon: '🚗', color: '#607D8B', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 15, repeatMode: 'everyXDays', intervalDays: 182 },
  { id: 'automate-finances', title: 'Automate Your Finances',       icon: '🏦', color: '#4CAF50', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 15, unit: 'times', defaultGoal: 1, repeatMode: 'everyXDays', intervalDays: 90 },
  { id: 'health-equipment',  title: 'Buy Health-Supporting Equipment', icon: '🏋️', color: '#FF5722', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10, unit: 'times', defaultGoal: 1, repeatMode: 'everyXDays', intervalDays: 90 },
  { id: 'optimize-bedroom',  title: 'Optimize Bedroom for Sleep',   icon: '🛏️', color: '#3F51B5', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 15, unit: 'times', defaultGoal: 1, repeatMode: 'everyXDays', intervalDays: 90 },
];
