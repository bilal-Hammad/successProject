import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  points: number;
  label?: string;
};

export function PointsBadge({ points, label }: Props) {
  const t = useTheme();
  const { t: tr } = useLanguage();
  const displayLabel = label ?? tr('points.pts');
  return (
    <View style={[styles.wrap, { backgroundColor: t.colors.primaryMuted, borderRadius: t.radius.full }]}>
      <Text style={[styles.value, { color: t.colors.primary }]}>{points}</Text>
      <Text style={[styles.label, { color: t.colors.primary }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -2,
  },
});
