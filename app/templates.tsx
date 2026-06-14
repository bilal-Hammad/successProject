import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../src/i18n/LanguageContext';
import type { HabitTemplate } from '../src/models/types';
import { useHabitStore } from '../src/store/useHabitStore';
import { HABIT_TEMPLATES, TEMPLATE_CATEGORIES } from '../src/templates/seed';
import { useTheme } from '../src/theme/ThemeContext';
import { generateId } from '../src/utils/id';

const CHIP_ACTIVE_COLOR = '#F05A7E';

export default function TemplatesScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { habits, saveHabit } = useHabitStore();

  const [selectedCategory, setSelectedCategory] = useState(TEMPLATE_CATEGORIES[0].id);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  const visibleHabits = HABIT_TEMPLATES.filter((h) =>
    h.categories.includes(selectedCategory)
  );

  const isAdded = (templateId: string) =>
    habits.some((h) => h.templateId === templateId);

  const handleAdd = async (template: HabitTemplate) => {
    if (isAdded(template.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveHabit({
      id: generateId(),
      title: template.title,
      translationKey: `habit.template.${template.id}`,
      icon: template.icon,
      color: template.color,
      pointsPerCompletion: template.pointsPerCompletion,
      scheduleDays: [0, 1, 2, 3, 4, 5, 6],
      templateId: template.id,
      createdAt: Date.now(),
      archived: false,
    });
    setJustAdded((prev) => new Set([...prev, template.id]));
    setTimeout(() => {
      setJustAdded((prev) => {
        const next = new Set(prev);
        next.delete(template.id);
        return next;
      });
    }, 900);
  };

  const toggleFavorite = (templateId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return next;
    });
  };

  const renderHabit = ({ item }: { item: HabitTemplate }) => {
    const added = isAdded(item.id);
    const fresh = justAdded.has(item.id);
    const isFav = favorites.has(item.id);

    return (
      <Pressable
        onPress={() => handleAdd(item)}
        disabled={added}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: fresh
              ? item.color + '22'
              : theme.colors.surface,
            borderColor: fresh ? item.color : theme.colors.border,
            borderRadius: theme.radius.lg,
            opacity: added && !fresh ? 0.5 : pressed ? 0.75 : 1,
          },
        ]}
      >
        {/* Left: icon + name */}
        <Text style={styles.habitIcon}>{item.icon}</Text>
        <Text
          style={[
            styles.habitName,
            { color: fresh ? item.color : theme.colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {t(`habit.template.${item.id}`)}
        </Text>

        {/* Right: checkmark if added, else heart + plus */}
        <View style={styles.rightSection}>
          {added ? (
            <Text style={[styles.checkmark, { color: item.color }]}>✓</Text>
          ) : (
            <>
              {/* Heart — nested Pressable stops propagation so it doesn't trigger handleAdd */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.id);
                }}
                hitSlop={8}
                style={styles.heartBtn}
              >
                <Text style={[styles.heart, { color: isFav ? CHIP_ACTIVE_COLOR : theme.colors.textSecondary }]}>
                  {isFav ? '♥' : '♡'}
                </Text>
              </Pressable>
              <Text style={[styles.plus, { color: theme.colors.textSecondary }]}>+</Text>
            </>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        {TEMPLATE_CATEGORIES.map((cat) => {
          const active = cat.id === selectedCategory;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: CHIP_ACTIVE_COLOR }
                  : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 },
              ]}
            >
              <Text style={styles.chipIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  { color: active ? '#fff' : theme.colors.textPrimary },
                ]}
              >
                {t(cat.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Habit list */}
      <FlatList
        data={visibleHabits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Custom Habit pill */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push('/habit/new')}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: CHIP_ACTIVE_COLOR, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.fabText}>{t('templates.customHabit')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Chips row
  chipsScroll: { flexGrow: 0 },
  chipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 5,
  },
  chipIcon: { fontSize: 14 },
  chipLabel: { fontSize: 14, fontWeight: '600' },

  // Habit cards
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    gap: 12,
  },
  habitIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  habitName: { flex: 1, fontSize: 16, fontWeight: '500' },

  // Right section
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heartBtn: { padding: 2 },
  heart: { fontSize: 18 },
  plus: { fontSize: 18, fontWeight: '300' },
  checkmark: { fontSize: 18, fontWeight: '700' },

  // Floating pill
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#F05A7E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
