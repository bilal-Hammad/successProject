import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import type { HabitTemplate } from '../src/models/types';
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

  const [selectedCategory, setSelectedCategory] = useState(TEMPLATE_CATEGORIES[0].id);
  const [search, setSearch] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const searchInputRef = useRef<TextInput>(null);
  const searchExpandAnim = useRef(new Animated.Value(0)).current;
  const createBtnOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollYRef = useRef(0);

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
    } else if (dy < -8) {
      Animated.timing(createBtnOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }
  };

  // ── Data ──────────────────────────────────────────────────────────────────

  const categoryLabel = (key: string) => {
    const map: Record<string, string> = {
      good: 'Good', health: 'Health', bad: 'Bad', todo: 'To-Do',
    };
    return map[key] ?? key;
  };

  const templateById = useMemo(() => {
    const map: Record<string, HabitTemplate> = {};
    for (const t of HABIT_TEMPLATES) map[t.id] = t;
    return map;
  }, []);

  const flatFiltered = useMemo(() => {
    const cat = HABIT_TEMPLATES.filter((h) => h.categories.includes(selectedCategory));
    if (!search.trim()) return cat;
    const q = search.toLowerCase();
    return cat.filter((h) => h.title.toLowerCase().includes(q));
  }, [selectedCategory, search]);

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

  // ── Grouped sections for Good tab ─────────────────────────────────────────

  const goodSectionsWithData = useMemo(() => {
    return GOOD_TAB_SECTIONS.map((section) => ({
      ...section,
      templates: section.templateIds
        .map((id) => templateById[id])
        .filter(Boolean) as HabitTemplate[],
    })).filter((s) => s.templates.length > 0);
  }, [templateById]);

  const badSectionsWithData = useMemo(() => {
    return BAD_TAB_SECTIONS.map((section) => ({
      ...section,
      templates: section.templateIds
        .map((id) => templateById[id])
        .filter(Boolean) as HabitTemplate[],
    })).filter((s) => s.templates.length > 0);
  }, [templateById]);

  const isGoodGrouped = selectedCategory === 'good' && !search.trim();
  const isBadGrouped  = selectedCategory === 'bad'  && !search.trim();
  const isHealthTab   = selectedCategory === 'health';

  // ── HealthKit select handler (same flow as health-templates.tsx) ──────────

  const handleHealthSelect = async (template: HealthTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      const result = await requestHealthKitPermission(template.healthKitType);
      if (!result.ok) {
        Alert.alert('Health Access', result.reason);
      } else {
        const value = await readTodayValue(template.healthKitType);
        if (value === 0) {
          Alert.alert(
            'Health Access',
            "Permission sheet was shown. If your data doesn't appear, go to Settings > Health > Data Access & Devices > Momentum and enable access.",
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
          {item.title}
        </Text>
        <Text style={[tl.rowChevron, { color: theme.colors.textSecondary }]}>›</Text>
      </Pressable>
      {index < total - 1 && (
        <View style={[tl.sep, { backgroundColor: theme.colors.border }]} />
      )}
    </View>
  );

  const renderGroupedSection = (section: typeof goodSectionsWithData[0]) => (
    <View key={section.id}>
      <Text style={[tl.sectionHeader, { color: theme.colors.textSecondary }]}>
        {section.label}
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
                {item.title}
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

  const renderHealthSection = (section: typeof APPLE_HEALTH_SECTIONS[0]) => (
    <View key={section.id}>
      <Text style={[tl.sectionHeader, { color: theme.colors.textSecondary }]}>
        {section.label}
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
                {tmpl.title}
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

  const createHabitFooter = (
    <Animated.View style={[tl.createHabitWrap, { opacity: createBtnOpacity }]}>
      <Pressable onPress={() => router.push('/habit/new')} hitSlop={12}>
        <Text style={[tl.createHabitText, { color: theme.colors.textSecondary }]}>
          Create Habit
        </Text>
      </Pressable>
    </Animated.View>
  );

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
          <Text style={[tl.hdrTitle, { color: theme.colors.textPrimary }]}>Templates</Text>
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
            placeholder="Search habits…"
            placeholderTextColor={theme.colors.textSecondary}
            style={[tl.searchInput, { color: theme.colors.textPrimary }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <Pressable onPress={closeSearch} hitSlop={8} style={tl.cancelBtn}>
            <Text style={[tl.cancelText, { color: theme.colors.primary }]}>Cancel</Text>
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
                {categoryLabel(cat.id)}
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
          {goodSectionsWithData.map(renderGroupedSection)}
          {createHabitFooter}
        </ScrollView>

      ) : isBadGrouped ? (
        /* ── Bad tab (grouped sections) ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {badSectionsWithData.map(renderGroupedSection)}
          {createHabitFooter}
        </ScrollView>

      ) : isHealthTab ? (
        /* ── Health tab → HealthKit auto-sync templates ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {APPLE_HEALTH_SECTIONS.map(renderHealthSection)}
          {createHabitFooter}
        </ScrollView>

      ) : (
        /* ── To-Do tab + active search (flat list) ── */
        <>
          {flatFiltered.length === 0 && search.trim() ? (
            <View style={tl.emptyState}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={[tl.emptyTitle, { color: theme.colors.textPrimary }]}>No habits found</Text>
              <Text style={[tl.emptySub, { color: theme.colors.textSecondary }]}>Try a different search term</Text>
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
                !search.trim() ? (
                  <View>
                    <Text style={[tl.sectionHeader, { color: theme.colors.textSecondary }]}>
                      {categoryLabel(selectedCategory)}
                    </Text>
                    <View style={[tl.cardTop, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} />
                  </View>
                ) : (
                  <View style={[tl.cardTop, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} />
                )
              }
              renderItem={({ item, index }) => renderFlatRow(item, index, flatFiltered.length)}
              ListFooterComponent={
                <>
                  <View style={[tl.cardBottom, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} />
                  {createHabitFooter}
                </>
              }
            />
          )}
        </>
      )}
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

  // ── Create Habit footer ────────────────────────────────────────────────────
  createHabitWrap: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  createHabitText: {
    fontSize: 16,
    fontWeight: '500',
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
