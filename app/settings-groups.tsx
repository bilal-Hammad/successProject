import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../src/i18n/LanguageContext';
import { useTheme } from '../src/theme/ThemeContext';

export default function GroupsScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.background }]}>
      <View style={s.center}>
        <Text style={s.icon}>📦</Text>
        <Text style={[s.title, { color: theme.colors.textPrimary }]}>{t('settings.comingSoon')}</Text>
        <Text style={[s.body, { color: theme.colors.textSecondary }]}>{t('settings.comingSoonBody')}</Text>
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  icon: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
