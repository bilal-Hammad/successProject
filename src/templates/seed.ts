import type { HabitTemplate, TemplateCategory, TemplatePack } from '../models/types';

// ─── Legacy pack data (kept so existing habits retain their templateId) ───────
export const TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: 'health',
    name: 'Health Basics',
    description: 'Simple daily health habits',
    icon: '💧',
    color: '#2196F3',
    habits: [
      { title: 'Drink 8 glasses of water', icon: '💧', color: '#2196F3', pointsPerCompletion: 10 },
      { title: 'Take vitamins', icon: '💊', color: '#9C27B0', pointsPerCompletion: 10 },
      { title: 'Sleep 8 hours', icon: '😴', color: '#3F51B5', pointsPerCompletion: 15 },
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Move your body every day',
    icon: '🏃',
    color: '#FF5722',
    habits: [
      { title: 'Walk 10,000 steps', icon: '👟', color: '#FF5722', pointsPerCompletion: 20 },
      { title: 'Stretch for 10 min', icon: '🧘', color: '#E91E63', pointsPerCompletion: 10 },
      { title: 'Workout session', icon: '💪', color: '#F44336', pointsPerCompletion: 25 },
    ],
  },
];

// ─── Category tabs ────────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'good',   labelKey: 'category.good',   icon: '✅' },
  { id: 'health', labelKey: 'category.health', icon: '❤️' },
  { id: 'bad',    labelKey: 'category.bad',    icon: '🚫' },
  { id: 'todo',   labelKey: 'category.todo',   icon: '📋' },
];

// ─── Good tab section definitions ────────────────────────────────────────────

export const GOOD_TAB_SECTIONS: { id: string; label: string; templateIds: string[] }[] = [
  {
    id: 'most-popular',
    label: 'Most Popular',
    templateIds: [
      'make-your-bed', 'drink-water', 'cold-shower', 'vitamins',
      'wake-up-time', 'eat-healthy', 'brush-teeth', 'read-book',
      'take-shower', 'walk',
    ],
  },
  {
    id: 'body',
    label: 'Body',
    templateIds: [
      'eat-healthy', 'cold-shower', 'walk', 'brush-teeth', 'take-shower',
      'drink-tea', 'cook-home', 'vitamins', 'eat-breakfast', 'take-selfie',
      'wash-face', 'take-stairs', 'health-checkup', 'skin-care',
      'dental-checkup', 'face-mask', 'walk-dog',
    ],
  },
  {
    id: 'mind',
    label: 'Mind',
    templateIds: [
      'learn', 'read-book', 'play-instrument', 'learn-language',
      'homework-good', 'podcast', 'audiobook',
    ],
  },
  {
    id: 'mental-wellbeing',
    label: 'Mental Wellbeing',
    templateIds: [
      'meditation', 'smile', 'wake-up-time', 'go-sleep-time',
      'gratitude', 'meet-friend', 'reflect-day', 'pray',
      'listen-music', 'journal-thoughts',
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    templateIds: [
      'clean-email', 'plan-tomorrow', 'set-daily-goals', 'deep-work',
      'make-your-bed', 'take-breaks',
    ],
  },
  {
    id: 'social',
    label: 'Social',
    templateIds: [
      'smile-stranger', 'give-compliment', 'leave-house', 'start-conversation',
      'give-hug', 'help-someone', 'call-parents',
    ],
  },
  {
    id: 'other',
    label: 'Other',
    templateIds: [
      'take-trash', 'laundry', 'track-expenses', 'walk-dog', 'water-plant',
      'clear-fridge', 'wash-dishes', 'vacuum', 'dust', 'mop-floor', 'cleaning',
    ],
  },
  {
    id: 'islamic',
    label: 'Islamic',
    templateIds: [
      'five-prayers', 'read-quran', 'morning-adhkar', 'evening-adhkar',
      'istighfar', 'night-prayer', 'mon-thu-fast', 'daily-sadaqah', 'tasbih',
    ],
  },
];

// ─── Bad tab section definitions ─────────────────────────────────────────────

export const BAD_TAB_SECTIONS: { id: string; label: string; templateIds: string[] }[] = [
  {
    id: 'body',
    label: 'Body',
    templateIds: ['dont-snack', 'dont-bite-nails', 'dont-pick-nose', 'sit-less'],
  },
  {
    id: 'mental-wellbeing',
    label: 'Mental Wellbeing',
    templateIds: ['dont-swear', 'dont-get-angry', 'dont-complain'],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    templateIds: ['dont-procrastinate', 'dont-play-games', 'less-social-media'],
  },
];

// ─── Templates ────────────────────────────────────────────────────────────────

export const HABIT_TEMPLATES: HabitTemplate[] = [

  // ── Good — Most Popular / cross-section ──────────────────────────────────
  { id: 'make-your-bed',    title: 'Make your Bed',         icon: '🛏️', color: '#9C27B0', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'wake-up-time',     title: 'Wake Up on Time',       icon: '☀️',  color: '#FF9800', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'eat-healthy',      title: 'Eat a Healthy Meal',    icon: '🥕',  color: '#4CAF50', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'brush-teeth',      title: 'Brush Your Teeth',      icon: '🪥',  color: '#00BCD4', categories: ['good'], pointsPerCompletion: 5  },
  { id: 'read-book',        title: 'Read a Book',           icon: '📖',  color: '#795548', categories: ['good'], pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 20 },
  { id: 'take-shower',      title: 'Take a Shower',         icon: '🚿',  color: '#2196F3', categories: ['good'], pointsPerCompletion: 5  },

  // ── Good — Body ───────────────────────────────────────────────────────────
  { id: 'drink-tea',        title: 'Drink Tea',             icon: '☕',  color: '#8D6E63', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'cook-home',        title: 'Cook at Home',          icon: '🥘',  color: '#FF7043', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'eat-breakfast',    title: 'Eat Breakfast',         icon: '🍳',  color: '#FFA726', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'take-selfie',      title: 'Take a Selfie',         icon: '📷',  color: '#E91E63', categories: ['good'], pointsPerCompletion: 5  },
  { id: 'wash-face',        title: 'Wash Face',             icon: '🧖',  color: '#26C6DA', categories: ['good'], pointsPerCompletion: 5  },
  { id: 'take-stairs',      title: 'Take the Stairs',       icon: '🏃',  color: '#66BB6A', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'health-checkup',   title: 'Health Checkup',        icon: '💗',  color: '#EF5350', categories: ['good'], pointsPerCompletion: 20 },
  { id: 'skin-care',        title: 'Skin Care',             icon: '🧖',  color: '#F48FB1', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'dental-checkup',   title: 'Dental Check-Up',       icon: '🦷',  color: '#29B6F6', categories: ['good'], pointsPerCompletion: 20 },
  { id: 'face-mask',        title: 'Face Mask',             icon: '🧖',  color: '#AB47BC', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'walk-dog',         title: 'Walk Your Dog',         icon: '🐕',  color: '#A1887F', categories: ['good'], pointsPerCompletion: 15 },

  // ── Good — Mind ───────────────────────────────────────────────────────────
  { id: 'learn',            title: 'Learn',                 icon: '📚',  color: '#5C6BC0', categories: ['good'], pointsPerCompletion: 20 },
  { id: 'play-instrument',  title: 'Play Instrument',       icon: '🎸',  color: '#EF5350', categories: ['good'], pointsPerCompletion: 20, unit: 'minutes', defaultGoal: 30 },
  { id: 'learn-language',   title: 'Learn a Language',      icon: '🅰️', color: '#FF7043', categories: ['good'], pointsPerCompletion: 20 },
  { id: 'homework-good',    title: 'Homework',              icon: '📚',  color: '#42A5F5', categories: ['good'], pointsPerCompletion: 20 },
  { id: 'podcast',          title: 'Listen to a Podcast',   icon: '🎙️', color: '#7E57C2', categories: ['good'], pointsPerCompletion: 10, unit: 'minutes', defaultGoal: 30 },
  { id: 'audiobook',        title: 'Listen to an Audiobook',icon: '🎙️', color: '#26A69A', categories: ['good'], pointsPerCompletion: 10, unit: 'minutes', defaultGoal: 30 },

  // ── Good — Mental Wellbeing ───────────────────────────────────────────────
  { id: 'smile',            title: 'Smile',                 icon: '😊',  color: '#FFCA28', categories: ['good'], pointsPerCompletion: 5  },
  { id: 'go-sleep-time',    title: 'Go to Sleep on Time',   icon: '😴',  color: '#3F51B5', categories: ['good'], pointsPerCompletion: 15, unit: 'hours', defaultGoal: 8 },
  { id: 'meet-friend',      title: 'Meet a Friend',         icon: '👥',  color: '#26A69A', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'reflect-day',      title: 'Reflect on My Day',     icon: '🤔',  color: '#8D6E63', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'pray',             title: 'Pray',                  icon: '🙏',  color: '#7E57C2', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'listen-music',     title: 'Listen to Music',       icon: '🎵',  color: '#FF7043', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'journal-thoughts', title: 'Journal Your Thoughts', icon: '📝',  color: '#5C6BC0', categories: ['good'], pointsPerCompletion: 10 },

  // ── Good — Productivity ───────────────────────────────────────────────────
  { id: 'clean-email',      title: 'Clean up Email',        icon: '✉️',  color: '#607D8B', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'plan-tomorrow',    title: 'Plan Tomorrow',         icon: '📋',  color: '#FF7043', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'set-daily-goals',  title: 'Set Daily Goals',       icon: '📅',  color: '#EF5350', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'deep-work',        title: 'Deep Work',             icon: '👨‍💻', color: '#5C6BC0', categories: ['good'], pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 90 },
  { id: 'take-breaks',      title: 'Take Breaks',           icon: '⏳',  color: '#78909C', categories: ['good'], pointsPerCompletion: 5  },

  // ── Good — Social ─────────────────────────────────────────────────────────
  { id: 'smile-stranger',   title: 'Smile at a Stranger',   icon: '😊',  color: '#FFCA28', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'give-compliment',  title: 'Give a Compliment',     icon: '🤗',  color: '#FF7043', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'leave-house',      title: 'Leave the House',       icon: '🏡',  color: '#4CAF50', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'start-conversation',title: 'Start a Conversation', icon: '🗣️', color: '#42A5F5', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'give-hug',         title: 'Give Someone a Hug',    icon: '🤗',  color: '#FF8A65', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'help-someone',     title: 'Help Someone',          icon: '👥',  color: '#26C6DA', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'call-parents',     title: 'Call Parents',          icon: '👨‍👩‍👧', color: '#66BB6A', categories: ['good'], pointsPerCompletion: 15 },

  // ── Good — Other ──────────────────────────────────────────────────────────
  { id: 'take-trash',       title: 'Take the Trash Out',    icon: '🗑️', color: '#EF5350', categories: ['good'], pointsPerCompletion: 5  },
  { id: 'laundry',          title: 'Laundry',               icon: '👕',  color: '#66BB6A', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'track-expenses',   title: 'Track Expenses',        icon: '💲',  color: '#4CAF50', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'water-plant',      title: 'Water Plant',           icon: '🪴',  color: '#4CAF50', categories: ['good'], pointsPerCompletion: 5  },
  { id: 'clear-fridge',     title: 'Clear the Fridge',      icon: '🧊',  color: '#29B6F6', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'wash-dishes',      title: 'Wash the Dishes',       icon: '🍽️', color: '#26A69A', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'vacuum',           title: 'Vacuum',                icon: '🧹',  color: '#78909C', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'dust',             title: 'Dust',                  icon: '🧹',  color: '#A1887F', categories: ['good'], pointsPerCompletion: 5  },
  { id: 'mop-floor',        title: 'Mop the Floor',         icon: '🧹',  color: '#607D8B', categories: ['good'], pointsPerCompletion: 10 },
  { id: 'cleaning',         title: 'Cleaning',              icon: '🧹',  color: '#26A69A', categories: ['good'], pointsPerCompletion: 15 },

  // ── Good — Islamic ────────────────────────────────────────────────────────
  { id: 'five-prayers',     title: 'الصلوات الخمس',         icon: '🕌',  color: '#2E7D32', categories: ['good'], pointsPerCompletion: 30 },
  { id: 'read-quran',       title: 'قراءة القرآن',           icon: '📖',  color: '#1B5E20', categories: ['good'], pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 20 },
  { id: 'morning-adhkar',   title: 'الأذكار الصباحية',       icon: '🌅',  color: '#F9A825', categories: ['good'], pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 10 },
  { id: 'evening-adhkar',   title: 'الأذكار المسائية',       icon: '🌙',  color: '#283593', categories: ['good'], pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 10 },
  { id: 'istighfar',        title: 'الاستغفار',              icon: '📿',  color: '#00695C', categories: ['good'], pointsPerCompletion: 15 },
  { id: 'night-prayer',     title: 'قيام الليل',             icon: '🌙',  color: '#4527A0', categories: ['good'], pointsPerCompletion: 25 },
  { id: 'mon-thu-fast',     title: 'صيام الإثنين والخميس',   icon: '🌙',  color: '#2E7D32', categories: ['good'], pointsPerCompletion: 30 },
  { id: 'daily-sadaqah',    title: 'الصدقة اليومية',         icon: '💝',  color: '#F9A825', categories: ['good'], pointsPerCompletion: 20 },
  { id: 'tasbih',           title: 'تلاوة الأذكار',          icon: '📿',  color: '#00695C', categories: ['good'], pointsPerCompletion: 15 },

  // ── Good — Legacy (kept for backward compatibility) ───────────────────────
  { id: 'walk',          title: 'Go for a Walk',           icon: '🚶',  color: '#FF7043', categories: ['good'],   pointsPerCompletion: 20, unit: 'minutes', defaultGoal: 30 },
  { id: 'run',           title: 'Run',                     icon: '🏃',  color: '#FF5722', categories: ['good'],   pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 20 },
  { id: 'cycling',       title: 'Cycling',                 icon: '🚴',  color: '#FF9800', categories: ['good'],   pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 30 },
  { id: 'workout',       title: 'Workout',                 icon: '💪',  color: '#F44336', categories: ['good'],   pointsPerCompletion: 30, unit: 'minutes', defaultGoal: 30 },
  { id: 'exercise',      title: 'Exercise',                icon: '🏋️', color: '#E91E63', categories: ['good'],   pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 30 },
  { id: 'yoga',          title: 'Yoga',                    icon: '🤸',  color: '#E91E63', categories: ['good'],   pointsPerCompletion: 20, unit: 'minutes', defaultGoal: 20 },
  { id: 'stretch',       title: 'Stretch 10 min',          icon: '🧘',  color: '#FF9800', categories: ['good'],   pointsPerCompletion: 10, unit: 'minutes', defaultGoal: 10 },
  { id: 'meditation',    title: 'Meditate',                icon: '🧘',  color: '#9C27B0', categories: ['good'],   pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 10 },
  { id: 'read-20',       title: 'Read 20 minutes',         icon: '📖',  color: '#4CAF50', categories: ['good'],   pointsPerCompletion: 15, unit: 'minutes', defaultGoal: 20 },
  { id: 'study-session', title: 'Study session',           icon: '📚',  color: '#2196F3', categories: ['good'],   pointsPerCompletion: 25, unit: 'minutes', defaultGoal: 45 },
  { id: 'coding',        title: 'Coding practice',         icon: '💻',  color: '#607D8B', categories: ['good'],   pointsPerCompletion: 20 },
  { id: 'journal',       title: 'Journal entry',           icon: '✍️',  color: '#673AB7', categories: ['good'],   pointsPerCompletion: 10 },
  { id: 'gratitude',     title: 'Gratitude',               icon: '🙏',  color: '#E91E63', categories: ['good'],   pointsPerCompletion: 10 },
  { id: 'breathe',       title: 'Breathing exercise',      icon: '💨',  color: '#00BCD4', categories: ['good'],   pointsPerCompletion: 10, unit: 'minutes', defaultGoal: 5 },
  { id: 'affirmations',  title: 'Positive affirmations',   icon: '💬',  color: '#FF9800', categories: ['good'],   pointsPerCompletion: 10 },
  { id: 'digital-detox', title: 'Digital detox hour',      icon: '🌿',  color: '#4CAF50', categories: ['good'],   pointsPerCompletion: 15 },
  { id: 'vocabulary',    title: 'Learn 5 new words',       icon: '🔤',  color: '#9C27B0', categories: ['good'],   pointsPerCompletion: 10 },
  { id: 'review-notes',  title: 'Review notes',            icon: '📝',  color: '#8BC34A', categories: ['good'],   pointsPerCompletion: 10 },

  // ── Health ────────────────────────────────────────────────────────────────
  { id: 'drink-water',   title: 'Drink Water',             icon: '💧',  color: '#2196F3', categories: ['health', 'good'], pointsPerCompletion: 10 },
  { id: 'sleep',         title: 'Sleep 8 hours',           icon: '🛏️', color: '#3F51B5', categories: ['health'], pointsPerCompletion: 15, unit: 'hours', defaultGoal: 8 },
  { id: 'vitamins',      title: 'Take Vitamins',           icon: '💊',  color: '#9C27B0', categories: ['health', 'good'], pointsPerCompletion: 10 },
  { id: 'stand',         title: 'Stand',                   icon: '🧍',  color: '#607D8B', categories: ['health'], pointsPerCompletion: 5  },
  { id: 'steps-10k',     title: '10,000 steps',            icon: '👟',  color: '#FF5722', categories: ['health'], pointsPerCompletion: 20 },
  { id: 'swim',          title: 'Swimming',                icon: '🏊',  color: '#2196F3', categories: ['health'], pointsPerCompletion: 30 },
  { id: 'cold-shower',   title: 'Take a Cold Shower',      icon: '❄️',  color: '#00BCD4', categories: ['health', 'good'], pointsPerCompletion: 15 },
  { id: 'floss',         title: 'Floss teeth',             icon: '🦷',  color: '#00BCD4', categories: ['health'], pointsPerCompletion: 5  },
  { id: 'sleep-early',   title: 'Sleep before midnight',   icon: '🌙',  color: '#3F51B5', categories: ['health'], pointsPerCompletion: 10 },
  { id: 'basketball',    title: 'Basketball',              icon: '🏀',  color: '#FF9800', categories: ['health'], pointsPerCompletion: 25 },
  { id: 'football',      title: 'Football',                icon: '⚽',  color: '#4CAF50', categories: ['health'], pointsPerCompletion: 25 },
  { id: 'active-cal',    title: 'Active Calorie',          icon: '🔥',  color: '#FF5722', categories: ['health'], pointsPerCompletion: 20 },

  // ── Bad — Body ───────────────────────────────────────────────────────────
  { id: 'dont-snack',        title: "Don't Snack",         icon: '🍿',  color: '#26A69A', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 15 },
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
  { id: 'less-social-media', title: 'Less Social Media',   icon: '📱',  color: '#455A64', categories: ['bad'], habitType: 'bad', pointsPerCompletion: 20 },

  // ── To-Do ─────────────────────────────────────────────────────────────────
  { id: 'file-taxes',        title: 'File Taxes',            icon: '🏦',  color: '#2196F3', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 20 },
  { id: 'renew-passport',    title: 'Renew Passport',        icon: '🪪',  color: '#4CAF50', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 20 },
  { id: 'plan-vacation',     title: 'Plan a Vacation',       icon: '🏖️', color: '#FF9800', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 20 },
  { id: 'update-passwords',  title: 'Update Passwords',      icon: '🔐',  color: '#795548', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10 },
  { id: 'print-documents',   title: 'Print Documents',       icon: '🖨️', color: '#607D8B', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10 },
  { id: 'buy-gift',          title: 'Buy a Gift',            icon: '🎁',  color: '#E91E63', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 15 },
  { id: 'sign-up-gym',       title: 'Sign Up for a Gym',     icon: '💪',  color: '#F05A7E', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 20 },
  { id: 'schedule-meeting',  title: 'Schedule a Meeting',    icon: '📅',  color: '#FF9800', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10 },
  { id: 'set-up-budget',     title: 'Set Up a Budget',       icon: '💸',  color: '#4CAF50', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 15 },
  { id: 'update-resume',     title: 'Update Resume',         icon: '📄',  color: '#2196F3', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 15 },
  { id: 'doctor-appt',       title: 'Book Doctor Appt.',     icon: '🏥',  color: '#00BCD4', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 10 },
  { id: 'clean-house',       title: 'Deep Clean House',      icon: '🏠',  color: '#4CAF50', categories: ['todo'], habitType: 'todo', pointsPerCompletion: 20 },
];
