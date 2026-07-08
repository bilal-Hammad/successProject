import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { HabitType } from '../models/types';
import { BAD_TAB_SECTIONS, GOOD_TAB_SECTIONS } from '../templates/seed';
import { APPLE_HEALTH_SECTIONS } from '../templates/healthTemplates';

export type CategoryId = 'good' | 'health' | 'bad' | 'todo';

export type CustomSectionHabit = {
  title: string;
  icon: string;
  color: string;
  habitType: HabitType;
  pointsPerCompletion: number;
  unit?: string;
  defaultGoal?: number;
};

export type CustomSection = {
  id: string;
  category: CategoryId;
  name: string;
  icon: string;
  habits: CustomSectionHabit[];
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_SECTION_IDS: Record<CategoryId, string[]> = {
  good: GOOD_TAB_SECTIONS.map(s => s.id),
  health: APPLE_HEALTH_SECTIONS.map(s => s.id),
  bad: BAD_TAB_SECTIONS.map(s => s.id),
  todo: ['todo-all'],
};

const STORAGE_KEY = '@template_sections_v1';

type PersistedState = {
  sectionOrder: Partial<Record<CategoryId, string[]>>;
  hiddenSections: Partial<Record<CategoryId, string[]>>;
  customSections: Record<string, CustomSection>;
};

type Store = PersistedState & {
  hydrated: boolean;
  hydrate(): Promise<void>;
  _persist(patch: PersistedState): Promise<void>;

  setSectionOrder(cat: CategoryId, visibleOrder: string[]): Promise<void>;
  hideSection(cat: CategoryId, id: string): Promise<void>;
  restoreSection(cat: CategoryId, id: string): Promise<void>;
  resetCategory(cat: CategoryId): Promise<void>;

  createCustomSection(cat: CategoryId, name: string, icon: string): Promise<string>;
  updateCustomSection(id: string, updates: { name?: string; icon?: string }): Promise<void>;
  deleteCustomSection(id: string): Promise<void>;

  addHabitToSection(sectionId: string, habit: CustomSectionHabit): Promise<void>;
  removeHabitFromSection(sectionId: string, index: number): Promise<void>;
  reorderHabitsInSection(sectionId: string, habits: CustomSectionHabit[]): Promise<void>;

  getActiveSectionIds(cat: CategoryId): string[];
  getHiddenBuiltinIds(cat: CategoryId): string[];
};

function uid(): string {
  return `cs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildFullOrder(get: () => Store, cat: CategoryId): string[] {
  const stored = get().sectionOrder[cat];
  if (stored) return stored;
  const defaults = DEFAULT_SECTION_IDS[cat];
  const customIds = Object.values(get().customSections)
    .filter(s => s.category === cat)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(s => s.id);
  return [...defaults, ...customIds];
}

export const useTemplateSectionStore = create<Store>((set, get) => ({
  sectionOrder: {},
  hiddenSections: {},
  customSections: {},
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        set({ ...parsed, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  _persist: async ({ sectionOrder, hiddenSections, customSections }) => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ sectionOrder, hiddenSections, customSections }),
    );
  },

  setSectionOrder: async (cat, visibleOrder) => {
    const hidden = get().hiddenSections[cat] ?? [];
    const fullOrder = [...visibleOrder, ...hidden.filter(id => !visibleOrder.includes(id))];
    const nextOrder = { ...get().sectionOrder, [cat]: fullOrder };
    set({ sectionOrder: nextOrder });
    await get()._persist({ sectionOrder: nextOrder, hiddenSections: get().hiddenSections, customSections: get().customSections });
  },

  hideSection: async (cat, id) => {
    const existing = get().hiddenSections[cat] ?? [];
    if (existing.includes(id)) return;
    const nextHidden = { ...get().hiddenSections, [cat]: [...existing, id] };
    const fullOrder = buildFullOrder(get, cat);
    const nextOrder = { ...get().sectionOrder, [cat]: fullOrder };
    set({ hiddenSections: nextHidden, sectionOrder: nextOrder });
    await get()._persist({ sectionOrder: nextOrder, hiddenSections: nextHidden, customSections: get().customSections });
  },

  restoreSection: async (cat, id) => {
    const existing = get().hiddenSections[cat] ?? [];
    const nextHidden = { ...get().hiddenSections, [cat]: existing.filter(s => s !== id) };
    let fullOrder = buildFullOrder(get, cat);
    if (!fullOrder.includes(id)) fullOrder = [...fullOrder, id];
    const nextOrder = { ...get().sectionOrder, [cat]: fullOrder };
    set({ hiddenSections: nextHidden, sectionOrder: nextOrder });
    await get()._persist({ sectionOrder: nextOrder, hiddenSections: nextHidden, customSections: get().customSections });
  },

  resetCategory: async (cat) => {
    const customIds = Object.values(get().customSections)
      .filter(s => s.category === cat)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(s => s.id);
    const fullOrder = [...DEFAULT_SECTION_IDS[cat], ...customIds];
    const nextOrder = { ...get().sectionOrder, [cat]: fullOrder };
    const nextHidden = { ...get().hiddenSections, [cat]: [] };
    set({ sectionOrder: nextOrder, hiddenSections: nextHidden });
    await get()._persist({ sectionOrder: nextOrder, hiddenSections: nextHidden, customSections: get().customSections });
  },

  createCustomSection: async (cat, name, icon) => {
    const id = uid();
    const now = new Date().toISOString();
    const section: CustomSection = { id, category: cat, name, icon, habits: [], createdAt: now, updatedAt: now };
    const nextCustom = { ...get().customSections, [id]: section };
    const fullOrder = buildFullOrder(get, cat);
    const nextOrder = { ...get().sectionOrder, [cat]: [...fullOrder, id] };
    set({ customSections: nextCustom, sectionOrder: nextOrder });
    await get()._persist({ sectionOrder: nextOrder, hiddenSections: get().hiddenSections, customSections: nextCustom });
    return id;
  },

  updateCustomSection: async (id, updates) => {
    const existing = get().customSections[id];
    if (!existing) return;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const nextCustom = { ...get().customSections, [id]: updated };
    set({ customSections: nextCustom });
    await get()._persist({ sectionOrder: get().sectionOrder, hiddenSections: get().hiddenSections, customSections: nextCustom });
  },

  deleteCustomSection: async (id) => {
    const section = get().customSections[id];
    if (!section) return;
    const cat = section.category;
    const nextCustom = Object.fromEntries(
      Object.entries(get().customSections).filter(([k]) => k !== id),
    ) as Record<string, CustomSection>;
    const fullOrder = buildFullOrder(get, cat).filter(s => s !== id);
    const nextOrder = { ...get().sectionOrder, [cat]: fullOrder };
    const nextHidden = {
      ...get().hiddenSections,
      [cat]: (get().hiddenSections[cat] ?? []).filter(s => s !== id),
    };
    set({ customSections: nextCustom, sectionOrder: nextOrder, hiddenSections: nextHidden });
    await get()._persist({ sectionOrder: nextOrder, hiddenSections: nextHidden, customSections: nextCustom });
  },

  addHabitToSection: async (sectionId, habit) => {
    const section = get().customSections[sectionId];
    if (!section) return;
    const updated = { ...section, habits: [...section.habits, habit], updatedAt: new Date().toISOString() };
    const nextCustom = { ...get().customSections, [sectionId]: updated };
    set({ customSections: nextCustom });
    await get()._persist({ sectionOrder: get().sectionOrder, hiddenSections: get().hiddenSections, customSections: nextCustom });
  },

  removeHabitFromSection: async (sectionId, index) => {
    const section = get().customSections[sectionId];
    if (!section) return;
    const habits = section.habits.filter((_, i) => i !== index);
    const updated = { ...section, habits, updatedAt: new Date().toISOString() };
    const nextCustom = { ...get().customSections, [sectionId]: updated };
    set({ customSections: nextCustom });
    await get()._persist({ sectionOrder: get().sectionOrder, hiddenSections: get().hiddenSections, customSections: nextCustom });
  },

  reorderHabitsInSection: async (sectionId, habits) => {
    const section = get().customSections[sectionId];
    if (!section) return;
    const updated = { ...section, habits, updatedAt: new Date().toISOString() };
    const nextCustom = { ...get().customSections, [sectionId]: updated };
    set({ customSections: nextCustom });
    await get()._persist({ sectionOrder: get().sectionOrder, hiddenSections: get().hiddenSections, customSections: nextCustom });
  },

  getActiveSectionIds: (cat) => {
    const hidden = get().hiddenSections[cat] ?? [];
    return buildFullOrder(get, cat).filter(id => !hidden.includes(id));
  },

  getHiddenBuiltinIds: (cat) => {
    const hidden = get().hiddenSections[cat] ?? [];
    const defaults = DEFAULT_SECTION_IDS[cat];
    return hidden.filter(id => defaults.includes(id));
  },
}));
