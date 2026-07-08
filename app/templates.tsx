import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HabitTemplate } from '../src/models/types';
import { useLanguage } from '../src/i18n/LanguageContext';
import {
  useTemplateSectionStore,
  type CustomSectionHabit,
} from '../src/store/useTemplateSectionStore';
import { readTodayValue, requestHealthKitPermission } from '../src/services/HealthKitService';
import {
  BAD_TAB_SECTIONS,
  GOOD_TAB_SECTIONS,
  HABIT_TEMPLATES,
  TEMPLATE_CATEGORIES,
} from '../src/templates/seed';
import { APPLE_HEALTH_SECTIONS, type HealthTemplate } from '../src/templates/healthTemplates';
import { useTheme } from '../src/theme/ThemeContext';

export default function TemplatesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState(TEMPLATE_CATEGORIES[0].id);
  const [search, setSearch] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const sectionOrder = useTemplateSectionStore(s => s.sectionOrder);
  const hiddenSections = useTemplateSectionStore(s => s.hiddenSections);
  const customSections = useTemplateSectionStore(s => s.customSections);
  const getActiveSectionIds = useTemplateSectionStore(s => s.getActiveSectionIds);

  const searchInputRef = useRef<TextInput>(null);
  const searchExpandAnim = useRef(new Animated.Value(0)).current;
  const createBtnOpacity = useRef(new Animated.Value(1)).current;
  const createBtnSlide = useRef(new Animated.Value(0)).current;
  const lastScrollYRef = useRef(0);

  // Resolve a translated title; fall back to the raw title if key not found
  const resolveTitle = (id: string, fallback: string) => {
    const key = `habit.template.${id}`;
    const val = t(key);
    return val === key ? fallback : val;
  };

  // ── Search header animation ───────────────────────────────────────────────

  const openSearch = () => {
    setIsSearchActive(true);
    Animated.timing(searchExpandAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => searchInputRef.current?.focus());
  };

  const closeSearch = () => {
    setSearch('');
    Keyboard.dismiss();
    Animated.timing(searchExpandAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setIsSearchActive(false));
  };

  const normalHeaderOpacity = searchExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const searchBarOpacity = searchExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const searchBarTranslateX = searchExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  // ── Scroll direction → Create Habit fade ─────────────────────────────────

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastScrollYRef.current;
    lastScrollYRef.current = y;
    if (dy > 8) {
      Animated.timing(createBtnOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      Animated.timing(createBtnSlide, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } else if (dy < -8) {
      Animated.timing(createBtnOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      Animated.timing(createBtnSlide, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  };

  // ── Data ──────────────────────────────────────────────────────────────────

  const templateById = useMemo(() => {
    const map: Record<string, HabitTemplate> = {};
    for (const tmpl of HABIT_TEMPLATES) map[tmpl.id] = tmpl;
    return map;
  }, []);

  const flatFiltered = useMemo(() => {
    const cat = HABIT_TEMPLATES.filter((h) => h.categories.includes(selectedCategory));
    if (!search.trim()) return cat;
    const q = search.toLowerCase();
    return cat.filter((h) => {
      const translated = resolveTitle(h.id, h.title);
      return translated.toLowerCase().includes(q) || h.title.toLowerCase().includes(q);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, search, t]);

  const handleAdd = (template: HabitTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/habit/new',
      params: {
        templateId: template.id,
        title: template.title,
        icon: template.icon,
        color: template.color,
        habitType: template.habitType ?? 'good',
        ...(template.unit ? { unit: template.unit } : {}),
        ...(template.defaultGoal ? { goal: String(template.defaultGoal) } : {}),
      },
    });
  };

  // ── Store-aware section data ───────────────────────────────────────────────

  type BuiltinSection = { kind: 'builtin'; id: string; labelKey: string; templates: HabitTemplate[] };
  type CustomRenderSection = { kind: 'custom'; id: string; label: string; icon: string; habits: CustomSectionHabit[] };
  type RenderSection = BuiltinSection | CustomRenderSection;

  function buildSections(cat: 'good' | 'bad'): RenderSection[] {
    const result: RenderSection[] = [];
    const source = cat === 'good' ? GOOD_TAB_SECTIONS : BAD_TAB_SECTIONS;
    for (const id of getActiveSectionIds(cat)) {
      const cs = customSections[id];
      if (cs) { result.push({ kind: 'custom', id, label: cs.name, icon: cs.icon, habits: cs.habits }); continue; }
      const s = source.find(x => x.id === id);
      if (!s) continue;
      const templates = s.templateIds.map(tid => templateById[tid]).filter((x): x is HabitTemplate => Boolean(x));
      if (templates.length) result.push({ kind: 'builtin', id, labelKey: s.labelKey, templates });
    }
    return result;
  }

  const goodSectionsWithData = useMemo(
    () => buildSections('good'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionOrder, hiddenSections, customSections, templateById],
  );

  const badSectionsWithData = useMemo(
    () => buildSections('bad'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionOrder, hiddenSections, customSections, templateById],
  );

  type HealthRenderSection =
    | { kind: 'builtin'; section: typeof APPLE_HEALTH_SECTIONS[0] }
    | CustomRenderSection;

  const activeHealthSections = useMemo((): HealthRenderSection[] => {
    const result: HealthRenderSection[] = [];
    for (const id of getActiveSectionIds('health')) {
      const cs = customSections[id];
      if (cs) { result.push({ kind: 'custom', id, label: cs.name, icon: cs.icon, habits: cs.habits }); continue; }
      const s = APPLE_HEALTH_SECTIONS.find(x => x.id === id);
      if (s) result.push({ kind: 'builtin', section: s });
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionOrder, hiddenSections, customSections]);

  const todoCustomSections = useMemo((): CustomRenderSection[] => {
    const result: CustomRenderSection[] = [];
    for (const id of getActiveSectionIds('todo')) {
      const cs = customSections[id];
      if (cs) result.push({ kind: 'custom', id, label: cs.name, icon: cs.icon, habits: cs.habits });
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionOrder, hiddenSections, customSections]);

  const isGoodGrouped = selectedCategory === 'good' && !search.trim();
  const isBadGrouped  = selectedCategory === 'bad'  && !search.trim();
  const isHealthTab   = selectedCategory === 'health';
  const isTodoGrouped = selectedCategory === 'todo'  && !search.trim();

  // ── HealthKit select handler (same flow as health-templates.tsx) ──────────

  const handleHealthSelect = async (template: HealthTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      const result = await requestHealthKitPermission(template.healthKitType);
      if (!result.ok) {
        Alert.alert(t('templates.healthAccessTitle'), result.reason);
      } else {
        const value = await readTodayValue(template.healthKitType);
        if (value === 0) {
          Alert.alert(
            t('templates.healthAccessTitle'),
            t('templates.healthPermissionMsg'),
            [{ text: 'OK' }],
          );
        }
      }
    }
    router.push({
      pathname: '/habit/new',
      params: {
        title: template.title,
        icon: template.emoji,
        color: '#34C759',
        habitType: 'track',
        ...(template.unit        ? { unit: template.unit }               : {}),
        ...(template.defaultGoal ? { goal: String(template.defaultGoal) } : {}),
        healthKitType: template.healthKitType,
      },
    });
  };

  // ── Renderers ─────────────────────────────────────────────────────────────

  const renderFlatRow = (item: HabitTemplate, index: number, total: number) => (
    <View key={item.id}>
      <Pressable
        onPress={() => handleAdd(item)}
        style={({ pressed }) => [
          tl.row,
          { backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={tl.rowIcon}>{item.icon}</Text>
        <Text style={[tl.rowLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {resolveTitle(item.id, item.title)}
        </Text>
        <Text style={[tl.rowChevron, { color: theme.colors.textSecondary }]}>›</Text>
      </Pressable>
      {index < total - 1 && (
        <View style={[tl.sep, { backgroundColor: theme.colors.border }]} />
      )}
    </View>
  );

  const handleAddCustomHabit = (habit: CustomSectionHabit) => {
    router.push({
      pathname: '/habit/new',
      params: {
        title: habit.title,
        icon: habit.icon,
        color: habit.color,
        habitType: habit.habitType,
        ...(habit.unit ? { unit: habit.unit } : {}),
        ...(habit.defaultGoal ? { goal: String(habit.defaultGoal) } : {}),
      },
    });
  };

  const renderGroupedSection = (section: BuiltinSection) => (
    <View key={section.id}>
      <Text style={[tl.sectionHeader, { color: theme.colors.textSecondary }]}>
        {t(section.labelKey)}
      </Text>
      <View style={[tl.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {section.templates.map((item, idx) => (
          <View key={item.id}>
            <Pressable
              onPress={() => handleAdd(item)}
              style={({ pressed }) => [tl.row, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={tl.rowIcon}>{item.icon}</Text>
              <Text style={[tl.rowLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {resolveTitle(item.id, item.title)}
              </Text>
              <Text style={[tl.rowChevron, { color: theme.colors.textSecondary }]}>›</Text>
            </Pressable>
            {idx < section.templates.length - 1 && (
              <View style={[tl.sep, { backgroundColor: theme.colors.border, marginLeft: 56 }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderCustomSection = (section: CustomRenderSection) => (
    <View key={section.id}>
      <Text style={[tl.sectionHeader, { color: theme.colors.textSecondary }]}>
        {section.icon} {section.label}
      </Text>
      {section.habits.length > 0 ? (
        <View style={[tl.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {section.habits.map((habit, idx) => (
            <View key={`${habit.title}-${idx}`}>
              <Pressable
                onPress={() => handleAddCustomHabit(habit)}
                style={({ pressed }) => [tl.row, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={tl.rowIcon}>{habit.icon}</Text>
                <Text style={[tl.rowLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {habit.title}
                </Text>
                <Text style={[tl.rowChevron, { color: theme.colors.textSecondary }]}>›</Text>
              </Pressable>
              {idx < section.habits.length - 1 && (
                <View style={[tl.sep, { backgroundColor: theme.colors.border, marginLeft: 56 }]} />
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={[tl.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[tl.row, { color: theme.colors.textSecondary, fontSize: 14 }]}>
            {t('editSection.noHabits')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderHealthSection = (section: typeof APPLE_HEALTH_SECTIONS[0]) => (
    <View key={section.id}>
      <Text style={[tl.sectionHeader, { color: theme.colors.textSecondary }]}>
        {t(section.labelKey)}
      </Text>
      <View style={[tl.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {section.templates.map((tmpl, idx) => (
          <View key={tmpl.id}>
            <Pressable
              onPress={() => handleHealthSelect(tmpl)}
              style={({ pressed }) => [tl.row, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={tl.rowIcon}>{tmpl.emoji}</Text>
              <Text style={[tl.rowLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {resolveTitle(tmpl.id, tmpl.title)}
              </Text>
              <Text style={[tl.rowChevron, { color: theme.colors.textSecondary }]}>›</Text>
            </Pressable>
            {idx < section.templates.length - 1 && (
              <View style={[tl.sep, { backgroundColor: theme.colors.border, marginLeft: 56 }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const createBtnTransformY = createBtnSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[tl.safe, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>

      {/* Custom header */}
      <View style={[tl.headerWrap, { borderBottomColor: theme.colors.border }]}>

        {/* Normal state: back + title + search icon */}
        <Animated.View
          style={[StyleSheet.absoluteFill, tl.headerRow, { opacity: normalHeaderOpacity }]}
          pointerEvents={isSearchActive ? 'none' : 'auto'}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} style={tl.hdrBackBtn}>
            <Text style={[tl.hdrBackText, { color: theme.colors.primary }]}>‹</Text>
          </Pressable>
          <Text style={[tl.hdrTitle, { color: theme.colors.textPrimary }]}>{t('templates.title')}</Text>
          <Pressable onPress={openSearch} hitSlop={12} style={tl.hdrSearchBtn}>
            <Text style={tl.hdrSearchIcon}>🔍</Text>
          </Pressable>
        </Animated.View>

        {/* Search state: icon + input + Cancel */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            tl.headerRow,
            { opacity: searchBarOpacity, transform: [{ translateX: searchBarTranslateX }] },
          ]}
          pointerEvents={isSearchActive ? 'auto' : 'none'}
        >
          <Text style={[tl.hdrSearchIcon, { paddingLeft: 16, paddingRight: 8 }]}>🔍</Text>
          <TextInput
            ref={searchInputRef}
            value={search}
            onChangeText={setSearch}
            placeholder={t('templates.searchPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            style={[tl.searchInput, { color: theme.colors.textPrimary }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <Pressable onPress={closeSearch} hitSlop={8} style={tl.cancelBtn}>
            <Text style={[tl.cancelText, { color: theme.colors.primary }]}>{t('templates.cancel')}</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tl.chipsRow}
        style={tl.chipsScroll}
      >
        {TEMPLATE_CATEGORIES.map((cat) => {
          const active = cat.id === selectedCategory;
          return (
            <Pressable
              key={cat.id}
              onPress={() => {
                setSelectedCategory(cat.id);
                setSearch('');
                if (isSearchActive) closeSearch();
              }}
              style={[
                tl.chip,
                active
                  ? { backgroundColor: theme.colors.surface, borderRadius: 20 }
                  : { backgroundColor: 'transparent' },
              ]}
            >
              <Text style={[
                tl.chipLabel,
                {
                  color: active ? theme.colors.textPrimary : theme.colors.textSecondary,
                  fontWeight: active ? '700' : '500',
                },
              ]}>
                {t(cat.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Good tab (grouped sections) ── */}
      {isGoodGrouped ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {goodSectionsWithData.map(s => s.kind === 'builtin' ? renderGroupedSection(s) : renderCustomSection(s))}
        </ScrollView>

      ) : isBadGrouped ? (
        /* ── Bad tab (grouped sections) ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {badSectionsWithData.map(s => s.kind === 'builtin' ? renderGroupedSection(s) : renderCustomSection(s))}
        </ScrollView>

      ) : isHealthTab ? (
        /* ── Health tab → store-ordered sections + custom ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {activeHealthSections.map(s =>
            s.kind === 'builtin' ? renderHealthSection(s.section) : renderCustomSection(s)
          )}
        </ScrollView>

      ) : isTodoGrouped ? (
        /* ── To-Do tab (grouped: custom sections + builtin flat) ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {todoCustomSections.map(s => renderCustomSection(s))}
          <Text style={[tl.sectionHeader, { color: theme.colors.textSecondary }]}>
            {t('section.allTasks')}
          </Text>
          <View style={[tl.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {flatFiltered.map((item, idx) => (
              <View key={item.id}>
                <Pressable
                  onPress={() => handleAdd(item)}
                  style={({ pressed }) => [tl.row, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={tl.rowIcon}>{item.icon}</Text>
                  <Text style={[tl.rowLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {resolveTitle(item.id, item.title)}
                  </Text>
                  <Text style={[tl.rowChevron, { color: theme.colors.textSecondary }]}>›</Text>
                </Pressable>
                {idx < flatFiltered.length - 1 && (
                  <View style={[tl.sep, { backgroundColor: theme.colors.border, marginLeft: 56 }]} />
                )}
              </View>
            ))}
          </View>
        </ScrollView>

      ) : (
        /* ── Active search (flat list across current category) ── */
        <>
          {flatFiltered.length === 0 && search.trim() ? (
            <View style={tl.emptyState}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={[tl.emptyTitle, { color: theme.colors.textPrimary }]}>{t('templates.noHabitsFound')}</Text>
              <Text style={[tl.emptySub, { color: theme.colors.textSecondary }]}>{t('templates.tryDifferentSearch')}</Text>
            </View>
          ) : (
            <FlatList
              data={flatFiltered}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              ListHeaderComponent={
                <View style={[tl.cardTop, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} />
              }
              renderItem={({ item, index }) => renderFlatRow(item, index, flatFiltered.length)}
              ListFooterComponent={
                <View style={[tl.cardBottom, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} />
              }
            />
          )}
        </>
      )}

      {/* ── Floating "Custom Habit" button ── */}
      <Animated.View
        style={[
          tl.floatingBtn,
          {
            opacity: createBtnOpacity,
            transform: [{ translateY: createBtnTransformY }],
            bottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const habitType =
              selectedCategory === 'bad' ? 'bad' :
              selectedCategory === 'todo' ? 'todo' :
              selectedCategory === 'health' ? 'track' : 'good';
            router.push({ pathname: '/habit/new', params: { habitType } });
          }}
          style={[tl.floatingBtnPress, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={tl.floatingBtnText}>{t('templates.customHabit')}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const tl = StyleSheet.create({
  safe: { flex: 1 },

  // ── Custom header ──────────────────────────────────────────────────────────
  headerWrap: {
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hdrBackBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  hdrBackText: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '300',
  },
  hdrTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  hdrSearchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  hdrSearchIcon: { fontSize: 18 },

  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  cancelBtn: { paddingHorizontal: 16 },
  cancelText: { fontSize: 16, fontWeight: '500' },

  // ── Category chips ─────────────────────────────────────────────────────────
  chipsScroll: { flexGrow: 0, flexShrink: 0 },
  chipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: { paddingHorizontal: 18, paddingVertical: 10 },
  chipLabel: { fontSize: 15 },

  // ── Section headers ────────────────────────────────────────────────────────
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Grouped card ───────────────────────────────────────────────────────────
  groupCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },

  // ── Flat-list card borders ─────────────────────────────────────────────────
  cardTop: {
    marginHorizontal: 16,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    height: 1,
  },
  cardBottom: {
    marginHorizontal: 16,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    height: 1,
  },

  // ── Rows ───────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 16 },
  rowChevron: { fontSize: 20 },
  sep: { height: StyleSheet.hairlineWidth },

  // ── Floating "Custom Habit" button ────────────────────────────────────────
  floatingBtn: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
  },
  floatingBtnPress: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── Empty search state ─────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
  },

});
