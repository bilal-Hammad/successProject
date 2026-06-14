import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: Props) {
  const t = useTheme();
  return (
    <View style={[styles.wrap, { paddingHorizontal: t.spacing.md, paddingTop: t.spacing.lg }]}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: t.colors.textPrimary, fontSize: t.fontSize.xxl }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: t.colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  left: { flex: 1 },
  title: { fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
});
