import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useLanguage } from '../../../src/i18n/LanguageContext';
import { useTheme } from '../../../src/theme/ThemeContext';
import { forgeAnimationHeaderOptions } from '../../../src/theme/forgeAnimationHeaderOptions';

// Nested single-screen Stack so this tab gets a real native-stack header —
// Tabs.Screen (JS-rendered bottom-tabs) has no large-title support at all,
// that's fundamentally a UINavigationBar/native-stack feature. Route path
// stays `/profile` (this directory's index route), so deep links, BottomNav's
// active-tab detection (usePathname), and navigation state are all unaffected.
function ProfileHeaderGearButton() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
      <Text style={{ fontSize: 17, color: theme.colors.textPrimary }}>⚙️</Text>
    </Pressable>
  );
}

export default function ProfileLayout() {
  const theme = useTheme();
  const { t } = useLanguage();

  // Workaround for a real, documented UIKit timing quirk: prefersLargeTitles/
  // largeTitleDisplayMode set on the first screen of a freshly-created
  // UINavigationController can fail to apply on the very first layout pass
  // (Apple Developer Forums' own documented fix is to start with "Never" and
  // flip to "Always" in viewDidAppear). This is that screen — the lone/first
  // screen of this tab's own nested Stack — so mount with large title off,
  // then enable it a frame later.
  const [largeTitleReady, setLargeTitleReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLargeTitleReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t('tabs.profile'),
          headerRight: () => <ProfileHeaderGearButton />,
          ...forgeAnimationHeaderOptions(theme, largeTitleReady),
        }}
      />
    </Stack>
  );
}
