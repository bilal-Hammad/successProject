import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';
import { useTheme } from '../theme/ThemeContext';

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
  { code: 'tr', label: 'TR', flag: '🇹🇷' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {LANGS.map(({ code, label, flag }) => {
        const active = language === code;
        return (
          <Pressable
            key={code}
            onPress={() => setLanguage(code)}
            style={[
              styles.btn,
              {
                backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <Text style={styles.flag}>{flag}</Text>
            <Text style={[styles.label, { color: active ? '#fff' : theme.colors.textSecondary }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1.5,
  },
  flag: { fontSize: 13 },
  label: { fontSize: 11, fontWeight: '700' },
});
