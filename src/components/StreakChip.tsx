import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  streak: number;
};

export function StreakChip({ streak }: Props) {
  const theme = useTheme();
  const { t } = useLanguage();
  return (
    <View style={[styles.chip, { backgroundColor: theme.colors.warningMuted, borderRadius: theme.radius.full }]}>
      <Text style={[styles.text, { color: theme.colors.warning }]}>
        🔥 {streak} {t(streak === 1 ? 'streak.day' : 'streak.days')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
