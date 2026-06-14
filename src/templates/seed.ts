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
  {
    id: 'study',
    name: 'Study & Focus',
    description: 'Sharpen your mind daily',
    icon: '📚',
    color: '#4CAF50',
    habits: [
      { title: 'Read for 20 minutes', icon: '📖', color: '#4CAF50', pointsPerCompletion: 15 },
      { title: 'Review notes', icon: '📝', color: '#8BC34A', pointsPerCompletion: 10 },
      { title: 'No-phone hour', icon: '🚫📱', color: '#FF9800', pointsPerCompletion: 20 },
    ],
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    description: 'Take care of your mental health',
    icon: '🧘',
    color: '#9C27B0',
    habits: [
      { title: 'Meditate 10 min', icon: '🧘', color: '#9C27B0', pointsPerCompletion: 15 },
      { title: 'Journal entry', icon: '✍️', color: '#673AB7', pointsPerCompletion: 10 },
      { title: 'Write 3 gratitudes', icon: '🙏', color: '#E91E63', pointsPerCompletion: 10 },
    ],
  },
];

// ─── New category-based template system ──────────────────────────────────────

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'popular',     labelKey: 'category.popular',     icon: '🔥' },
  { id: 'health',      labelKey: 'category.health',      icon: '❤️' },
  { id: 'sports',      labelKey: 'category.sports',      icon: '🏃' },
  { id: 'study',       labelKey: 'category.study',       icon: '📚' },
  { id: 'mindfulness', labelKey: 'category.mindfulness', icon: '🧘' },
];

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // ── Popular ────────────────────────────────────────────────────────────────
  { id: 'walk',          title: 'Walk',               icon: '🚶',  color: '#FF7043', categories: ['popular', 'sports'],      pointsPerCompletion: 20 },
  { id: 'sleep',         title: 'Sleep 8 hours',      icon: '🛏️', color: '#3F51B5', categories: ['popular', 'health'],      pointsPerCompletion: 15 },
  { id: 'drink-water',   title: 'Drink water',        icon: '💧',  color: '#2196F3', categories: ['popular', 'health'],      pointsPerCompletion: 10 },
  { id: 'meditation',    title: 'Meditation',         icon: '🧘',  color: '#9C27B0', categories: ['popular', 'mindfulness'], pointsPerCompletion: 15 },
  { id: 'run',           title: 'Run',                icon: '🏃',  color: '#FF5722', categories: ['popular', 'sports'],      pointsPerCompletion: 25 },
  { id: 'stand',         title: 'Stand',              icon: '🧍',  color: '#607D8B', categories: ['popular', 'health'],      pointsPerCompletion: 5  },
  { id: 'cycling',       title: 'Cycling',            icon: '🚴',  color: '#FF9800', categories: ['popular', 'sports'],      pointsPerCompletion: 25 },
  { id: 'workout',       title: 'Workout',            icon: '💪',  color: '#F44336', categories: ['popular', 'sports'],      pointsPerCompletion: 30 },
  { id: 'active-cal',   title: 'Active Calorie',     icon: '🔥',  color: '#FF5722', categories: ['popular', 'sports'],      pointsPerCompletion: 20 },
  { id: 'burn-cal',     title: 'Burn Calorie',       icon: '🔥',  color: '#E91E63', categories: ['popular', 'sports'],      pointsPerCompletion: 20 },
  { id: 'exercise',      title: 'Exercise',           icon: '🏋️', color: '#E91E63', categories: ['popular', 'sports'],      pointsPerCompletion: 25 },

  // ── Health only ────────────────────────────────────────────────────────────
  { id: 'vitamins',      title: 'Take vitamins',      icon: '💊',  color: '#9C27B0', categories: ['health'],                pointsPerCompletion: 10 },
  { id: 'no-sugar',      title: 'No sugar',           icon: '🚫',  color: '#FF5722', categories: ['health'],                pointsPerCompletion: 15 },
  { id: 'sleep-early',   title: 'Sleep before midnight', icon: '🌙', color: '#3F51B5', categories: ['health'],             pointsPerCompletion: 10 },
  { id: 'floss',         title: 'Floss teeth',        icon: '🦷',  color: '#00BCD4', categories: ['health'],                pointsPerCompletion: 5  },
  { id: 'no-alcohol',    title: 'No alcohol',         icon: '🚱',  color: '#795548', categories: ['health'],                pointsPerCompletion: 20 },
  { id: 'cold-shower',   title: 'Cold shower',        icon: '🚿',  color: '#00BCD4', categories: ['health'],                pointsPerCompletion: 15 },

  // ── Sports only ────────────────────────────────────────────────────────────
  { id: 'yoga',          title: 'Yoga',               icon: '🤸',  color: '#E91E63', categories: ['sports'],                pointsPerCompletion: 20 },
  { id: 'stretch',       title: 'Stretch 10 min',     icon: '🧘',  color: '#FF9800', categories: ['sports'],                pointsPerCompletion: 10 },
  { id: 'steps-10k',     title: '10,000 steps',       icon: '👟',  color: '#FF5722', categories: ['sports'],                pointsPerCompletion: 20 },
  { id: 'swim',          title: 'Swimming',           icon: '🏊',  color: '#2196F3', categories: ['sports'],                pointsPerCompletion: 30 },
  { id: 'basketball',    title: 'Basketball',         icon: '🏀',  color: '#FF9800', categories: ['sports'],                pointsPerCompletion: 25 },
  { id: 'football',      title: 'Football',           icon: '⚽',  color: '#4CAF50', categories: ['sports'],                pointsPerCompletion: 25 },

  // ── Study only ─────────────────────────────────────────────────────────────
  { id: 'read-20',       title: 'Read 20 minutes',    icon: '📖',  color: '#4CAF50', categories: ['study'],                 pointsPerCompletion: 15 },
  { id: 'review-notes',  title: 'Review notes',       icon: '📝',  color: '#8BC34A', categories: ['study'],                 pointsPerCompletion: 10 },
  { id: 'no-phone',      title: 'No-phone hour',      icon: '📵',  color: '#FF9800', categories: ['study'],                 pointsPerCompletion: 20 },
  { id: 'study-session', title: 'Study session',      icon: '📚',  color: '#2196F3', categories: ['study'],                 pointsPerCompletion: 25 },
  { id: 'vocabulary',    title: 'Learn 5 new words',  icon: '🔤',  color: '#9C27B0', categories: ['study'],                 pointsPerCompletion: 10 },
  { id: 'coding',        title: 'Coding practice',    icon: '💻',  color: '#607D8B', categories: ['study'],                 pointsPerCompletion: 20 },

  // ── Mindfulness only ───────────────────────────────────────────────────────
  { id: 'journal',       title: 'Journal entry',      icon: '✍️',  color: '#673AB7', categories: ['mindfulness'],           pointsPerCompletion: 10 },
  { id: 'gratitude',     title: 'Write 3 gratitudes', icon: '🙏',  color: '#E91E63', categories: ['mindfulness'],           pointsPerCompletion: 10 },
  { id: 'breathe',       title: 'Breathing exercise', icon: '💨',  color: '#00BCD4', categories: ['mindfulness'],           pointsPerCompletion: 10 },
  { id: 'digital-detox', title: 'Digital detox hour', icon: '🌿',  color: '#4CAF50', categories: ['mindfulness'],           pointsPerCompletion: 15 },
  { id: 'affirmations',  title: 'Positive affirmations', icon: '💬', color: '#FF9800', categories: ['mindfulness'],         pointsPerCompletion: 10 },
];
