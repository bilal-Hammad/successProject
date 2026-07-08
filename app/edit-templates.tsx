import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../src/i18n/LanguageContext';
import {
  useTemplateSectionStore,
  type CategoryId,
} from '../src/store/useTemplateSectionStore';
import { BAD_TAB_SECTIONS, GOOD_TAB_SECTIONS, TEMPLATE_CATEGORIES } from '../src/templates/seed';
import { APPLE_HEALTH_SECTIONS } from '../src/templates/healthTemplates';

type SectionItem = {
  id: string;
  label: string;
  isCustom: boolean;
  icon?: string;
};

export default function EditTemplatesScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const customSections = useTemplateSectionStore(s => s.customSections);
  const sectionOrder = useTemplateSectionStore(s => s.sectionOrder);
  const hiddenSections = useTemplateSectionStore(s => s.hiddenSections);
  const getActiveSectionIds = useTemplateSectionStore(s => s.getActiveSectionIds);
  const getHiddenBuiltinIds = useTemplateSectionStore(s => s.getHiddenBuiltinIds);
  const setSectionOrder = useTemplateSectionStore(s => s.setSectionOrder);
  const hideSection = useTemplateSectionStore(s => s.hideSection);
  const restoreSection = useTemplateSectionStore(s => s.restoreSection);
  const resetCategory = useTemplateSectionStore(s => s.resetCategory);
  const deleteCustomSection = useTemplateSectionStore(s => s.deleteCustomSection);
  const createCustomSection = useTemplateSectionStore(s => s.createCustomSection);

  const [selectedCat, setSelectedCat] = useState<CategoryId>('good');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState('📌');

  const getSectionInfo = useCallback(
    (id: string, cat: CategoryId): { label: string; isCustom: boolean; icon?: string } => {
      const cs = customSections[id];
      if (cs) return { label: cs.name, isCustom: true, icon: cs.icon };
      if (cat === 'good') {
        const s = GOOD_TAB_SECTIONS.find(x => x.id === id);
        if (s) return { label: t(s.labelKey), isCustom: false };
      } else if (cat === 'health') {
        const s = APPLE_HEALTH_SECTIONS.find(x => x.id === id);
        if (s) return { label: t(s.labelKey), isCustom: false };
      } else if (cat === 'bad') {
        const s = BAD_TAB_SECTIONS.find(x => x.id === id);
        if (s) return { label: t(s.labelKey), isCustom: false };
      }
      if (id === 'todo-all') return { label: t('section.allTasks'), isCustom: false };
      return { label: id, isCustom: false };
    },
    [customSections, t],
  );

  const sections = useMemo<SectionItem[]>(
    () =>
      getActiveSectionIds(selectedCat).map(id => ({
        id,
        ...getSectionInfo(id, selectedCat),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCat, sectionOrder, hiddenSections, customSections, t],
  );

  const hiddenBuiltinIds = useMemo(
    () => getHiddenBuiltinIds(selectedCat),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCat, hiddenSections],
  );

  const moveSection = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const ids = sections.map(s => s.id);
      const idx = ids.indexOf(id);
      const next = [...ids];
      if (direction === 'up' && idx > 0) {
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        setSectionOrder(selectedCat, next);
      } else if (direction === 'down' && idx < ids.length - 1) {
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        setSectionOrder(selectedCat, next);
      }
    },
    [sections, selectedCat, setSectionOrder],
  );

  const handleHide = useCallback(
    (id: string) => hideSection(selectedCat, id),
    [selectedCat, hideSection],
  );

  const handleDeleteCustom = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        t('editTemplates.deleteSection'),
        t('editTemplates.deleteSectionMsg').replace('{name}', name),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.delete'), style: 'destructive', onPress: () => deleteCustomSection(id) },
        ],
      );
    },
    [deleteCustomSection, t],
  );

  const confirmReset = useCallback(() => {
    Alert.alert(
      t('editTemplates.resetConfirmTitle'),
      t('editTemplates.resetConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('editTemplates.reset'), style: 'destructive', onPress: () => resetCategory(selectedCat) },
      ],
    );
  }, [selectedCat, resetCategory, t]);

  const handleMore = useCallback(() => {
    const catLabelKey = TEMPLATE_CATEGORIES.find(c => c.id === selectedCat)?.labelKey ?? '';
    const catLabel = t(catLabelKey);
    const resetTitle = `${t('editTemplates.reset')} "${catLabel}"`;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [resetTitle, t('common.cancel')], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
        idx => { if (idx === 0) confirmReset(); },
      );
    } else {
      Alert.alert(t('editTemplates.options'), undefined, [
        { text: resetTitle, style: 'destructive', onPress: confirmReset },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  }, [selectedCat, t, confirmReset]);

  const closeSheet = useCallback(() => {
    setShowAddSheet(false);
    setShowCreateForm(false);
    setNewSectionName('');
    setNewSectionIcon('📌');
  }, []);

  const handleCreateSection = useCallback(async () => {
    const name = newSectionName.trim();
    if (!name) return;
    const id = await createCustomSection(selectedCat, name, newSectionIcon.trim() || '📌');
    closeSheet();
    router.push(`/edit-section/${id}`);
  }, [newSectionName, newSectionIcon, selectedCat, createCustomSection, closeSheet, router]);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>{t('editTemplates.title')}</Text>
        <Pressable onPress={handleMore} hitSlop={12} style={s.moreBtn}>
          <Text style={s.moreIcon}>•••</Text>
        </Pressable>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabBar}
        contentContainerStyle={s.tabContent}
      >
        {TEMPLATE_CATEGORIES.map(cat => (
          <Pressable
            key={cat.id}
            style={[s.tab, selectedCat === cat.id && s.tabActive]}
            onPress={() => setSelectedCat(cat.id as CategoryId)}
          >
            <Text style={[s.tabText, selectedCat === cat.id && s.tabTextActive]}>
              {cat.icon} {t(cat.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Section list with move-up / move-down buttons */}
      <ScrollView contentContainerStyle={s.listContent}>
        {sections.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>{t('editTemplates.allHidden')}</Text>
          </View>
        ) : (
          sections.map((item, idx) => (
            <View key={item.id} style={s.row}>
              <View style={s.moveButtons}>
                <Pressable
                  onPress={() => moveSection(item.id, 'up')}
                  disabled={idx === 0}
                  hitSlop={8}
                >
                  <Text style={[s.moveIcon, idx === 0 && s.moveIconDisabled]}>↑</Text>
                </Pressable>
                <Pressable
                  onPress={() => moveSection(item.id, 'down')}
                  disabled={idx === sections.length - 1}
                  hitSlop={8}
                >
                  <Text style={[s.moveIcon, idx === sections.length - 1 && s.moveIconDisabled]}>↓</Text>
                </Pressable>
              </View>
              {item.isCustom && item.icon ? <Text style={s.sectionIcon}>{item.icon}</Text> : null}
              <Pressable
                style={s.labelWrap}
                onPress={item.isCustom ? () => router.push(`/edit-section/${item.id}`) : undefined}
              >
                <Text style={s.rowLabel} numberOfLines={1}>{item.label}</Text>
                {item.isCustom && <Text style={s.editHint}>{t('editTemplates.editHint')}</Text>}
              </Pressable>
              {item.isCustom ? (
                <Pressable onPress={() => handleDeleteCustom(item.id, item.label)} style={s.actionBtn} hitSlop={8}>
                  <Text style={s.deleteIcon}>🗑</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => handleHide(item.id)} style={s.actionBtn} hitSlop={8}>
                  <Text style={s.hideIcon}>−</Text>
                </Pressable>
              )}
            </View>
          ))
        )}
        <Pressable style={s.addBtn} onPress={() => setShowAddSheet(true)}>
          <Text style={s.addBtnText}>+ {t('editTemplates.addSection')}</Text>
        </Pressable>
      </ScrollView>

      {/* Add Section bottom sheet */}
      <Modal visible={showAddSheet} animationType="slide" transparent onRequestClose={closeSheet}>
        <Pressable style={s.overlay} onPress={closeSheet} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>
            {showCreateForm ? t('editTemplates.customSection') : t('editTemplates.addSection')}
          </Text>

          {!showCreateForm ? (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {hiddenBuiltinIds.length > 0 && (
                <>
                  <Text style={s.sheetGroupLabel}>{t('editTemplates.hiddenSections')}</Text>
                  {hiddenBuiltinIds.map(id => {
                    const info = getSectionInfo(id, selectedCat);
                    return (
                      <Pressable
                        key={id}
                        style={s.sheetRow}
                        onPress={() => { restoreSection(selectedCat, id); closeSheet(); }}
                      >
                        <Text style={s.sheetRowLabel}>{info.label}</Text>
                        <Text style={s.sheetRowAdd}>{t('editTemplates.restore')} ›</Text>
                      </Pressable>
                    );
                  })}
                  <View style={s.sheetDivider} />
                </>
              )}
              <Text style={s.sheetGroupLabel}>{t('editTemplates.createNew')}</Text>
              <Pressable style={s.sheetRow} onPress={() => setShowCreateForm(true)}>
                <Text style={s.sheetRowLabel}>📌 {t('editTemplates.customSection')}</Text>
                <Text style={s.sheetRowChevron}>›</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <View>
              <View style={s.formRow}>
                <TextInput
                  style={s.iconInput}
                  value={newSectionIcon}
                  onChangeText={setNewSectionIcon}
                  maxLength={2}
                  selectTextOnFocus
                />
                <TextInput
                  style={s.nameInput}
                  value={newSectionName}
                  onChangeText={setNewSectionName}
                  placeholder={t('editTemplates.sectionNamePlaceholder')}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCreateSection}
                />
              </View>
              <Pressable
                style={[s.createBtn, !newSectionName.trim() && s.createBtnDisabled]}
                onPress={handleCreateSection}
                disabled={!newSectionName.trim()}
              >
                <Text style={s.createBtnText}>{t('editTemplates.create')}</Text>
              </Pressable>
            </View>
          )}

          <Pressable style={s.cancelSheetBtn} onPress={closeSheet}>
            <Text style={s.cancelSheetText}>{t('common.cancel')}</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#F2F2F7',
  },
  backBtn: { width: 44 },
  backText: { fontSize: 32, color: '#007AFF', lineHeight: 36 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#000' },
  moreBtn: { width: 44, alignItems: 'flex-end' },
  moreIcon: { fontSize: 13, color: '#007AFF', letterSpacing: 2 },

  tabBar: { backgroundColor: '#F2F2F7', maxHeight: 52 },
  tabContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E5EA' },
  tabActive: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#3C3C43' },
  tabTextActive: { color: '#fff', fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  moveButtons: { flexDirection: 'column', alignItems: 'center', marginRight: 4, gap: 2 },
  moveIcon: { fontSize: 16, color: '#007AFF', fontWeight: '600', lineHeight: 20 },
  moveIconDisabled: { color: '#C7C7CC' },
  sectionIcon: { fontSize: 20, marginRight: 8 },
  labelWrap: { flex: 1 },
  rowLabel: { fontSize: 16, color: '#000', fontWeight: '500' },
  editHint: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  actionBtn: { paddingHorizontal: 8 },
  deleteIcon: { fontSize: 18 },
  hideIcon: { fontSize: 24, color: '#FF3B30', fontWeight: '300', lineHeight: 28 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  addBtnText: { fontSize: 15, color: '#007AFF', fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: '#8E8E93' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7C7CC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#000', marginBottom: 16 },
  sheetGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  sheetRowLabel: { flex: 1, fontSize: 16, color: '#000' },
  sheetRowAdd: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  sheetRowChevron: { fontSize: 18, color: '#C7C7CC' },
  sheetDivider: { height: 8 },

  formRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  iconInput: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    textAlign: 'center',
    fontSize: 24,
    backgroundColor: '#F2F2F7',
  },
  nameInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#F2F2F7',
  },
  createBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  createBtnDisabled: { backgroundColor: '#C7C7CC' },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelSheetBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelSheetText: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
});
