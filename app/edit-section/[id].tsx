import { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
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
import { useLanguage } from '../../src/i18n/LanguageContext';
import {
  useTemplateSectionStore,
  type CustomSectionHabit,
} from '../../src/store/useTemplateSectionStore';
import type { HabitType } from '../../src/models/types';

const PRESET_COLORS = [
  '#9C27B0', '#FF9800', '#4CAF50', '#00BCD4',
  '#2196F3', '#E91E63', '#EF5350', '#795548',
];

function categoryToHabitType(category: string): HabitType {
  if (category === 'bad') return 'bad';
  if (category === 'todo') return 'todo';
  if (category === 'health') return 'track';
  return 'good';
}

export default function EditSectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();

  const customSections = useTemplateSectionStore(s => s.customSections);
  const updateCustomSection = useTemplateSectionStore(s => s.updateCustomSection);
  const deleteCustomSection = useTemplateSectionStore(s => s.deleteCustomSection);
  const addHabitToSection = useTemplateSectionStore(s => s.addHabitToSection);
  const removeHabitFromSection = useTemplateSectionStore(s => s.removeHabitFromSection);

  const section = id ? customSections[id] : undefined;

  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');

  // Add habit form state
  const [habitIcon, setHabitIcon] = useState('🌟');
  const [habitName, setHabitName] = useState('');
  const [habitColor, setHabitColor] = useState(PRESET_COLORS[0]);
  const [habitPoints, setHabitPoints] = useState('10');
  const [habitUnit, setHabitUnit] = useState('');
  const [habitGoal, setHabitGoal] = useState('');

  const resetHabitForm = useCallback(() => {
    setHabitIcon('🌟');
    setHabitName('');
    setHabitColor(PRESET_COLORS[0]);
    setHabitPoints('10');
    setHabitUnit('');
    setHabitGoal('');
  }, []);

  if (!section) {
    return (
      <SafeAreaView style={e.safe}>
        <View style={e.notFound}>
          <Text style={e.notFoundText}>{t('editSection.notFound')}</Text>
          <Pressable onPress={() => router.back()} style={e.backFallback}>
            <Text style={e.backFallbackText}>‹ {t('nav.back')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const openRename = () => {
    setNewName(section.name);
    setNewIcon(section.icon);
    setShowRename(true);
  };

  const handleRename = () => {
    const name = newName.trim();
    if (!name) return;
    updateCustomSection(section.id, { name, icon: newIcon.trim() || '📌' });
    setShowRename(false);
  };

  const handleDeleteSection = () => {
    Alert.alert(
      t('editTemplates.deleteSection'),
      t('editTemplates.deleteSectionMsg').replace('{name}', section.name),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => { deleteCustomSection(section.id); router.back(); },
        },
      ],
    );
  };

  const handleDeleteHabit = (index: number, title: string) => {
    Alert.alert(
      t('editSection.deleteHabit'),
      `"${title}"`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => removeHabitFromSection(section.id, index),
        },
      ],
    );
  };

  const handleAddHabit = async () => {
    const title = habitName.trim();
    if (!title) return;
    const habit: CustomSectionHabit = {
      title,
      icon: habitIcon.trim() || '🌟',
      color: habitColor,
      habitType: categoryToHabitType(section.category),
      pointsPerCompletion: Math.max(1, parseInt(habitPoints, 10) || 10),
      ...(habitUnit.trim() ? { unit: habitUnit.trim() } : {}),
      ...(habitUnit.trim() && habitGoal.trim() ? { defaultGoal: parseFloat(habitGoal) || undefined } : {}),
    };
    await addHabitToSection(section.id, habit);
    setShowAddHabit(false);
    resetHabitForm();
  };

  return (
    <SafeAreaView style={e.safe}>
      {/* Header */}
      <View style={e.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={e.backBtn}>
          <Text style={e.backText}>‹</Text>
        </Pressable>
        <Pressable onPress={openRename} style={e.titleWrap}>
          <Text style={e.headerIcon}>{section.icon}</Text>
          <Text style={e.headerTitle} numberOfLines={1}>{section.name}</Text>
          <Text style={e.editPen}> ✏️</Text>
        </Pressable>
        <Pressable onPress={handleDeleteSection} hitSlop={12} style={e.deleteBtn}>
          <Text style={e.deleteBtnText}>🗑</Text>
        </Pressable>
      </View>

      {/* Habit list */}
      <ScrollView contentContainerStyle={e.scroll}>
        {section.habits.length === 0 ? (
          <View style={e.empty}>
            <Text style={e.emptyTitle}>{t('editSection.noHabits')}</Text>
            <Text style={e.emptyHint}>{t('editSection.noHabitsHint')}</Text>
          </View>
        ) : (
          section.habits.map((habit, index) => (
            <View key={`${habit.title}-${index}`} style={e.habitRow}>
              <View style={[e.habitIconWrap, { backgroundColor: habit.color + '25' }]}>
                <Text style={e.habitEmoji}>{habit.icon}</Text>
              </View>
              <Text style={e.habitName} numberOfLines={1}>{habit.title}</Text>
              <Pressable onPress={() => handleDeleteHabit(index, habit.title)} hitSlop={8} style={e.habitDeleteBtn}>
                <Text style={e.habitDeleteIcon}>✕</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={e.footer}>
        <Pressable style={e.addHabitBtn} onPress={() => setShowAddHabit(true)}>
          <Text style={e.addHabitText}>+ {t('editSection.addHabit')}</Text>
        </Pressable>
      </View>

      {/* Rename modal */}
      <Modal visible={showRename} animationType="fade" transparent onRequestClose={() => setShowRename(false)}>
        <Pressable style={e.overlay} onPress={() => setShowRename(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={e.renameSheet}>
          <Text style={e.sheetTitle}>{t('editSection.rename')}</Text>
          <View style={e.renameRow}>
            <TextInput
              style={e.iconInput}
              value={newIcon}
              onChangeText={setNewIcon}
              maxLength={2}
              selectTextOnFocus
            />
            <TextInput
              style={e.renameNameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder={t('editSection.sectionNamePlaceholder')}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRename}
            />
          </View>
          <Pressable
            style={[e.saveBtn, !newName.trim() && e.saveBtnDisabled]}
            onPress={handleRename}
            disabled={!newName.trim()}
          >
            <Text style={e.saveBtnText}>{t('common.save')}</Text>
          </Pressable>
          <Pressable style={e.cancelBtn} onPress={() => setShowRename(false)}>
            <Text style={e.cancelBtnText}>{t('common.cancel')}</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Habit modal */}
      <Modal
        visible={showAddHabit}
        animationType="slide"
        transparent
        onRequestClose={() => { setShowAddHabit(false); resetHabitForm(); }}
      >
        <Pressable style={e.overlay} onPress={() => { setShowAddHabit(false); resetHabitForm(); }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={e.addSheet}>
          <View style={e.sheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={e.sheetTitle}>{t('editSection.addHabit')}</Text>

            {/* Icon + Name */}
            <View style={e.formRow}>
              <TextInput
                style={e.iconInput}
                value={habitIcon}
                onChangeText={setHabitIcon}
                maxLength={2}
                selectTextOnFocus
              />
              <TextInput
                style={e.nameInput}
                value={habitName}
                onChangeText={setHabitName}
                placeholder={t('editSection.habitName')}
                autoFocus
                returnKeyType="next"
              />
            </View>

            {/* Color */}
            <Text style={e.fieldLabel}>{t('form.color')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={e.colorRow}>
              {PRESET_COLORS.map(c => (
                <Pressable
                  key={c}
                  style={[e.colorSwatch, { backgroundColor: c }, habitColor === c && e.colorSwatchSelected]}
                  onPress={() => setHabitColor(c)}
                />
              ))}
            </ScrollView>

            {/* Points */}
            <Text style={e.fieldLabel}>{t('editSection.points')}</Text>
            <TextInput
              style={e.shortInput}
              value={habitPoints}
              onChangeText={setHabitPoints}
              keyboardType="numeric"
              returnKeyType="next"
            />

            {/* Unit */}
            <Text style={e.fieldLabel}>{t('editSection.unit')}</Text>
            <TextInput
              style={e.wideInput}
              value={habitUnit}
              onChangeText={setHabitUnit}
              placeholder={t('form.unitPlaceholder')}
              returnKeyType="next"
            />

            {/* Goal — only when unit is set */}
            {habitUnit.trim() ? (
              <>
                <Text style={e.fieldLabel}>{t('editSection.goal')}</Text>
                <TextInput
                  style={e.shortInput}
                  value={habitGoal}
                  onChangeText={setHabitGoal}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={handleAddHabit}
                />
              </>
            ) : null}

            <Pressable
              style={[e.saveBtn, !habitName.trim() && e.saveBtnDisabled]}
              onPress={handleAddHabit}
              disabled={!habitName.trim()}
            >
              <Text style={e.saveBtnText}>{t('editSection.addHabit')}</Text>
            </Pressable>
            <Pressable style={e.cancelBtn} onPress={() => { setShowAddHabit(false); resetHabitForm(); }}>
              <Text style={e.cancelBtnText}>{t('common.cancel')}</Text>
            </Pressable>
            <View style={{ height: 20 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const e = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },

  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  notFoundText: { fontSize: 17, color: '#8E8E93' },
  backFallback: { paddingHorizontal: 20, paddingVertical: 10 },
  backFallbackText: { fontSize: 17, color: '#007AFF' },

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
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 20, marginRight: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000', flexShrink: 1 },
  editPen: { fontSize: 14 },
  deleteBtn: { width: 44, alignItems: 'flex-end' },
  deleteBtnText: { fontSize: 20 },

  scroll: { padding: 16, paddingBottom: 32 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
  },
  habitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitEmoji: { fontSize: 20 },
  habitName: { flex: 1, fontSize: 16, color: '#000', fontWeight: '500' },
  habitDeleteBtn: { paddingHorizontal: 8 },
  habitDeleteIcon: { fontSize: 16, color: '#8E8E93' },

  empty: { alignItems: 'center', paddingVertical: 56 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#3C3C43', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32 },

  footer: { padding: 16, paddingBottom: 32 },
  addHabitBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addHabitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },

  renameSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  addSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
    maxHeight: '92%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7C7CC',
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 20 },

  renameRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },

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
  renameNameInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    paddingHorizontal: 14,
    fontSize: 16,
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

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },

  colorRow: { marginBottom: 16 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  colorSwatchSelected: { borderWidth: 3, borderColor: '#000' },

  shortInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#F2F2F7',
    marginBottom: 16,
    width: 120,
  },
  wideInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#F2F2F7',
    marginBottom: 16,
  },

  saveBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  saveBtnDisabled: { backgroundColor: '#C7C7CC' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
});
