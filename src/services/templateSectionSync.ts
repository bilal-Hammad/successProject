import type { CategoryId, CustomSection } from '../store/useTemplateSectionStore';
import { useTemplateSectionStore } from '../store/useTemplateSectionStore';
import { supabase } from './supabaseClient';

const CATEGORIES: CategoryId[] = ['good', 'health', 'bad', 'todo'];

// Pull remote state → merge into local (remote wins per-category).
// If remote is empty this is the first device — push local up instead.
export async function syncOnLogin(userId: string): Promise<void> {
  const [settingsRes, sectionsRes] = await Promise.all([
    supabase.from('user_template_settings').select('*').eq('user_id', userId),
    supabase.from('custom_sections').select('*').eq('user_id', userId),
  ]);

  const remoteSettings = settingsRes.data ?? [];
  const remoteSections = sectionsRes.data ?? [];

  if (remoteSettings.length === 0 && remoteSections.length === 0) {
    await pushToRemote(userId);
    return;
  }

  const store = useTemplateSectionStore.getState();

  const nextOrder = { ...store.sectionOrder };
  const nextHidden = { ...store.hiddenSections };

  for (const row of remoteSettings) {
    const cat = row.category as CategoryId;
    nextOrder[cat] = row.section_order as string[];
    nextHidden[cat] = row.hidden_section_ids as string[];
  }

  // Union local + remote; remote wins on ID collision
  const nextCustom: Record<string, CustomSection> = { ...store.customSections };
  for (const row of remoteSections) {
    nextCustom[row.id] = {
      id: row.id,
      category: row.category as CategoryId,
      name: row.name,
      icon: row.icon,
      habits: row.habits,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  useTemplateSectionStore.setState({
    sectionOrder: nextOrder,
    hiddenSections: nextHidden,
    customSections: nextCustom,
  });

  const s = useTemplateSectionStore.getState();
  await s._persist({
    sectionOrder: s.sectionOrder,
    hiddenSections: s.hiddenSections,
    customSections: s.customSections,
  });
}

// Upload full current store state to Supabase (upsert).
export async function pushToRemote(userId: string): Promise<void> {
  const { sectionOrder, hiddenSections, customSections } = useTemplateSectionStore.getState();

  const settingsRows = CATEGORIES.map(cat => ({
    user_id: userId,
    category: cat,
    section_order: sectionOrder[cat] ?? [],
    hidden_section_ids: hiddenSections[cat] ?? [],
  }));

  await supabase
    .from('user_template_settings')
    .upsert(settingsRows, { onConflict: 'user_id,category' });

  const sectionRows = Object.values(customSections).map(s => ({
    id: s.id,
    user_id: userId,
    category: s.category,
    name: s.name,
    icon: s.icon,
    habits: s.habits,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  }));

  if (sectionRows.length > 0) {
    await supabase
      .from('custom_sections')
      .upsert(sectionRows, { onConflict: 'id' });
  }
}

// Subscribe to store changes; debounce upserts and immediately delete removed sections.
// Returns an unsubscribe function — call it on sign-out.
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function startSyncSubscription(userId: string): () => void {
  const unsubscribe = useTemplateSectionStore.subscribe((state, prevState) => {
    // Detect deleted custom sections and remove them from Supabase immediately
    const prevIds = Object.keys(prevState.customSections);
    const currIds = new Set(Object.keys(state.customSections));
    const deletedIds = prevIds.filter(id => !currIds.has(id));

    if (deletedIds.length > 0) {
      void Promise.resolve(
        supabase.from('custom_sections').delete().in('id', deletedIds)
      );
    }

    // Debounce everything else (order changes, edits, new sections, habit mutations)
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      pushToRemote(userId).catch(() => {});
    }, 2000);
  });

  return () => {
    unsubscribe();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };
}
