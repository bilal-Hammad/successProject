import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../../src/i18n/LanguageContext';
import { useTheme } from '../../../src/theme/ThemeContext';
import { forgeAnimationHeaderOptions } from '../../../src/theme/forgeAnimationHeaderOptions';

// Nested single-screen Stack so this tab gets a real native-stack header —
// see profile/_layout.tsx for the full rationale (identical here). Route path
// stays `/progress`.
export default function ProgressLayout() {
  const theme = useTheme();
  const { t } = useLanguage();

  // Same mount-timing workaround as profile/_layout.tsx — see its comment for
  // the full explanation (documented UIKit quirk on the first screen of a
  // freshly-created navigation controller).
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
          title: t('progress.title'),
          ...forgeAnimationHeaderOptions(theme, largeTitleReady),
        }}
      />
    </Stack>
  );
}
