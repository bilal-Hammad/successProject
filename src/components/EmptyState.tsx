import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  icon?: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ icon = '✨', title, body, actionLabel, actionHref }: Props) {
  const t = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: t.colors.textPrimary, fontSize: t.fontSize.lg }]}>
        {title}
      </Text>
      <Text style={[styles.body, { color: t.colors.textSecondary, fontSize: t.fontSize.sm }]}>
        {body}
      </Text>
      {actionLabel && actionHref && (
        <Pressable
          onPress={() => router.push(actionHref as any)}
          style={[styles.btn, { backgroundColor: t.colors.primary, borderRadius: t.radius.md }]}
        >
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
