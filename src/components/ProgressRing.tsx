import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  completed: number;
  total: number;
  size?: number;
};

export function ProgressRing({ completed, total, size = 90 }: Props) {
  const t = useTheme();
  const pct = total === 0 ? 0 : Math.min(completed / total, 1);
  const barWidth = Math.round(pct * (size - 16));

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      {/* Arc approximated as a rounded progress bar inside a circle-like container */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: t.colors.primaryMuted,
            borderColor: pct === 1 ? t.colors.success : t.colors.primary,
          },
        ]}
      >
        <Text style={{ fontSize: t.fontSize.xl, fontWeight: '800', color: t.colors.textPrimary }}>
          {completed}
        </Text>
        <Text style={{ fontSize: t.fontSize.xs, color: t.colors.textSecondary }}>
          of {total}
        </Text>
      </View>
      {/* Progress bar below ring */}
      <View style={[styles.track, { backgroundColor: t.colors.border, borderRadius: 4, marginTop: 6 }]}>
        <View
          style={[
            styles.fill,
            {
              width: barWidth,
              backgroundColor: pct === 1 ? t.colors.success : t.colors.primary,
              borderRadius: 4,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  track: { width: '100%', height: 6, overflow: 'hidden' },
  fill: { height: 6 },
});
