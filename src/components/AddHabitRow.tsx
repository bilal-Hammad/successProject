import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

// Inline "Add Habit" affordance, rendered as the last item in the habit list
// (or the sole item when the list is empty) — replaces the old tab-bar
// Home-to-Add toggle and the separate EmptyState CTA with one consistent
// entry point. Matches habit-card sizing/rhythm (GoodHabitCard: radius 16,
// minHeight 76, marginBottom 10) but stays visually distinct — dashed
// border, no pastel fill — so it doesn't read as a real habit.
export function AddHabitRow() {
  const theme = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/templates')}
      style={({ pressed }) => [
        ar.card,
        {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[ar.iconWrap, { borderColor: theme.colors.primary }]}>
        <Text style={[ar.plus, { color: theme.colors.primary }]}>+</Text>
      </View>
      <Text style={[ar.label, { color: theme.colors.primary }]}>{t('form.addHabit')}</Text>
    </Pressable>
  );
}

const ar = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    borderRadius: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 26,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
