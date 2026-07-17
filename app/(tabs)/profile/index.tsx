import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../../src/i18n/LanguageContext';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useTheme } from '../../../src/theme/ThemeContext';

function SectionHeader({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
      {label}
    </Text>
  );
}

function Row({
  icon,
  label,
  onPress,
  chevron = true,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  chevron?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
      {chevron && (
        <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>›</Text>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Failed', e?.message ?? 'Something went wrong');
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t('profile.signOutConfirmTitle'),
      t('profile.signOutConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.signOut'), style: 'destructive', onPress: () => signOut() },
      ]
    );
  };


  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* ── Brand header ───────────────────────────────────── */}
        <View style={styles.brand}>
          <Text style={styles.brandIcon}>🎯</Text>
          <Text style={[styles.brandName, { color: theme.colors.textPrimary }]}>
            Forge
          </Text>
          <Text style={[styles.brandTagline, { color: theme.colors.textSecondary }]}>
            {t('profile.tagline')}
          </Text>
        </View>

        {/* ── Habits ──────────────────────────────────────────── */}
        <SectionHeader label={t('profile.habitsSection')} />
        <Row
          icon="📋"
          label={t('profile.manageHabits')}
          onPress={() => router.push('/habits')}
        />
        <Row
          icon="🗂️"
          label={t('profile.editTemplates')}
          onPress={() => router.push('/edit-templates')}
        />

        {/* ── Account ─────────────────────────────────────────── */}
        {Platform.OS === 'ios' && (
          <>
            <SectionHeader label={t('profile.account')} />
            {session ? (
              <>
                <View
                  style={[
                    styles.row,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.lg,
                    },
                  ]}
                >
                  <Text style={styles.rowIcon}>👤</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
                      {t('profile.signedInAs')}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }} numberOfLines={1}>
                      {session.user.email ?? session.user.id.slice(0, 8)}
                    </Text>
                  </View>
                </View>
                <Row
                  icon="🚪"
                  label={t('profile.signOut')}
                  onPress={handleSignOut}
                  chevron={false}
                />
              </>
            ) : (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.signInSubtitle, { color: theme.colors.textSecondary }]}>
                  {t('profile.signInSubtitle')}
                </Text>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={
                    theme.colors.background === '#ffffff' || theme.colors.background === '#FFFFFF'
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                      : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  }
                  cornerRadius={theme.radius.lg}
                  style={styles.appleButton}
                  onPress={handleSignIn}
                />
              </View>
            )}
          </>
        )}

        {/* ── About ───────────────────────────────────────────── */}
        <SectionHeader label={t('profile.about')} />
        <Row icon="📱" label={`${t('profile.version')} 1.0.0`} onPress={undefined} chevron={false} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  brand: { alignItems: 'center', paddingVertical: 24 },
  brandIcon: { fontSize: 48, marginBottom: 8 },
  brandName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  brandTagline: { fontSize: 13, marginTop: 4 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  card: {
    borderWidth: 1.5,
    padding: 14,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  rowIcon: { fontSize: 20 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  chevron: { fontSize: 20, fontWeight: '300' },

  signInSubtitle: { fontSize: 13, marginBottom: 12, paddingHorizontal: 4 },
  appleButton: { height: 50, width: '100%' },
});
